import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaUser, FaPhone, FaCreditCard, FaMoneyBillWave,
  FaCheck, FaArrowLeft, FaTruck, FaInfoCircle,
  FaShoppingCart, FaEnvelope, FaSignInAlt, FaLock, FaTimes,
  FaLeaf, FaMapMarkedAlt, FaCity, FaHome, FaQrcode, FaUniversity
} from 'react-icons/fa';
import '../styles/CheckoutComponent.css';

// Banking information
const bankInfo = {
  accountName: 'TRAN QUY TAI',
  accountNumber: '8866997979',
  bankName: 'TECHCOMBANK',
  branch: 'TP. HỒ CHÍ MINH'
};

// QR Code generation function
const generateQRCodeURL = (orderId, amount) => {
  try {
    // Format the amount and order reference
    const formattedAmount = Math.round(amount).toString();
    const addInfo = encodeURIComponent(`Thanh toan don hang ${orderId}`);
    const accountName = encodeURIComponent(bankInfo.accountName);
    const accountNo = bankInfo.accountNumber.replace(/\s+/g, '');
    
    // Bank ID for TECHCOMBANK
    const bankId = '970407';
    const template = 'compact2';
    
    // Construct the VietQR URL with the account information
    const qrCodeURL = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${formattedAmount}&addInfo=${addInfo}&accountName=${accountName}`;
    
    return qrCodeURL;
  } catch (error) {
    console.error('Error generating QR code URL:', error);
    // Fallback to Google Charts API if VietQR is unavailable
    const content = `${bankInfo.bankName}|${bankInfo.accountNumber}|${Math.round(amount)}|Thanh toan don hang ${orderId}`;
    return `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(content)}&choe=UTF-8`;
  }
};

class CheckoutComponent extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);

    this.state = {
      // Form fields
      name: '',
      phone: '',
      email: '',
      address: '',

      // Location dropdowns
      provinces: [],
      districts: [],
      wards: [],
      selectedProvince: '',
      selectedDistrict: '',
      selectedWard: '',
      detailAddress: '',

      paymentMethod: 'cash', // 'cash' hoặc 'transfer'

      // Cart data
      items: [],
      totalQuantity: 0,
      totalAmount: 0,

      // Loading status
      isProcessing: false,
      redirect: false,
      redirectToLogin: false,
      isLoadingLocations: false,

      // Validation
      errors: {
        name: '',
        phone: '',
        email: '',
        address: '',
        selectedProvince: '',
        selectedDistrict: '',
        selectedWard: '',
        detailAddress: ''
      },

      // UI State
      isOrderSummaryVisible: window.innerWidth >= 768,
      showLoginForm: false,
      loginUsername: '',
      loginPassword: '',
      loginProcessing: false,

      // Chỉ giữ delivery option standard
      deliveryOption: 'standard',
    };

    // Bind methods
    this.placeOrder = this.placeOrder.bind(this);
    this.handleDeliveryOptionChange = this.handleDeliveryOptionChange.bind(this);
  }

  componentDidMount() {
    // Kiểm tra nguồn chuyển hướng đến trang checkout
    const fromCart = this.props.location?.state?.fromCart ||
      (new URLSearchParams(window.location.search).get('from') === 'cart') ||
      localStorage.getItem('checkoutFromCart') === 'true';

    // Kiểm tra xem có sản phẩm mua ngay không
    const buyNowItems = localStorage.getItem('buyNowItems');
    
    // Xử lý dựa vào nguồn chuyển hướng
    if (fromCart) {
      // Ưu tiên hiển thị giỏ hàng khi đến từ giỏ hàng
      // Xóa dữ liệu mua ngay khi người dùng chọn thanh toán từ giỏ hàng
      localStorage.removeItem('buyNowItems');
      
      const cart = localStorage.getItem('cart');
      if (cart) {
        const cartItems = JSON.parse(cart);
        this.setState({
          items: cartItems,
          totalQuantity: this.calculateTotalQuantity(cartItems),
          totalAmount: this.calculateTotalAmount(cartItems),
          isBuyNow: false
        });
      }
      // Clear the checkout flag after use
      localStorage.removeItem('checkoutFromCart');
    } else if (buyNowItems) {
      try {
        const items = JSON.parse(buyNowItems);
        
        // Kiểm tra xem items có đúng định dạng không
        if (Array.isArray(items) && items.length > 0 && items[0].product && items[0].quantity) {
          this.setState({
            items: items,
            totalQuantity: this.calculateTotalQuantity(items),
            totalAmount: this.calculateTotalAmount(items),
            isBuyNow: true
          });
        } else {
          throw new Error('Invalid buyNowItems format');
        }
      } catch (error) {
        console.error('Error parsing buyNowItems:', error);
        // Nếu có lỗi khi xử lý dữ liệu mua ngay, xóa nó và sử dụng giỏ hàng
        localStorage.removeItem('buyNowItems');
        
        // Load giỏ hàng thay thế
        const cart = localStorage.getItem('cart');
        if (cart) {
          try {
            const cartItems = JSON.parse(cart);
            this.setState({
              items: cartItems,
              totalQuantity: this.calculateTotalQuantity(cartItems),
              totalAmount: this.calculateTotalAmount(cartItems),
              isBuyNow: false
            });
          } catch (err) {
            console.error('Error parsing cart:', err);
            this.setState({ items: [], totalQuantity: 0, totalAmount: 0 });
          }
        } else {
          this.setState({ items: [], totalQuantity: 0, totalAmount: 0 });
        }
      }
    } else {
      // Nếu không có sản phẩm mua ngay và không đến từ giỏ hàng, load giỏ hàng bình thường
      const cart = localStorage.getItem('cart');
      if (cart) {
        const cartItems = JSON.parse(cart);
        this.setState({
          items: cartItems,
          totalQuantity: this.calculateTotalQuantity(cartItems),
          totalAmount: this.calculateTotalAmount(cartItems),
          isBuyNow: false
        });
      }
    }

    // Fetch provinces when component mounts
    this.fetchProvinces();

    // Add resize listener
    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    // Nếu người dùng đã đăng nhập, tự động điền thông tin
    if (this.context.customer) {
      this.setState({
        name: this.context.customer.name,
        phone: this.context.customer.phone,
        email: this.context.customer.email
      });
    }
  }

  // Add this new helper method to separate user data loading logic
  loadUserData = async (customer) => {
    const { name, phone, email, address } = customer;

    this.setState({
      name: name || '',
      phone: phone || '',
      email: email || '',
    });

    // Nếu có địa chỉ, thử xử lý và phân tích thành các phần
    if (address) {
      try {
        // Giả sử địa chỉ có dạng: "Chi tiết, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
        const parts = address.split(',').map(part => part.trim());

        if (parts.length >= 4) {
          const detailAddress = parts[0];
          const wardName = parts[1];
          const districtName = parts[2];
          const provinceName = parts[3];

          this.setState({ detailAddress });

          // Đợi tỉnh/thành phố được nạp xong
          await new Promise(resolve => {
            const checkProvinces = () => {
              if (this.state.provinces.length > 0) {
                resolve();
              } else {
                setTimeout(checkProvinces, 100);
              }
            };
            checkProvinces();
          });

          // Tìm và chọn tỉnh/thành phố theo tên
          const province = this.state.provinces.find(p =>
            p.name.toLowerCase().includes(provinceName.toLowerCase())
          );

          if (province) {
            this.setState({ selectedProvince: province.code.toString() });

            // Lấy danh sách quận/huyện của tỉnh/thành phố này
            await this.fetchDistricts(province.code);

            // Tìm và chọn quận/huyện theo tên
            const district = this.state.districts.find(d =>
              d.name.toLowerCase().includes(districtName.toLowerCase())
            );

            if (district) {
              this.setState({ selectedDistrict: district.code.toString() });

              // Lấy danh sách phường/xã của quận/huyện này
              await this.fetchWards(district.code);

              // Tìm và chọn phường/xã theo tên
              const ward = this.state.wards.find(w =>
                w.name.toLowerCase().includes(wardName.toLowerCase())
              );

              if (ward) {
                this.setState({ selectedWard: ward.code.toString() });
              }
            }
          }
        } else {
          // Nếu không thể phân tích địa chỉ, chỉ lấy phần chi tiết
          this.setState({ detailAddress: address });
        }
      } catch (error) {
        console.error('Error parsing address:', error);
        this.setState({ detailAddress: address });
      }
    }
  }

  componentWillUnmount() {
    // Remove resize listener
    window.removeEventListener('resize', this.handleResize);
    // Đảm bảo xóa class khi component unmount
    document.body.classList.remove('modal-open');
  }

  fetchProvinces = async () => {
    this.setState({ isLoadingLocations: true });
    try {
      const response = await axios.get(`${this.context.apiUrl}/customer/provinces`);
      this.setState({
        provinces: response.data,
        isLoadingLocations: false
      });
    } catch (error) {
      console.error('Error fetching provinces:', error);
      this.setState({ isLoadingLocations: false });
      toast.error('Không thể tải danh sách tỉnh/thành phố');
    }
  }

  fetchDistricts = async (provinceCode) => {
    this.setState({ isLoadingLocations: true, districts: [], wards: [], selectedDistrict: '', selectedWard: '' });
    try {
      const response = await axios.get(`${this.context.apiUrl}/customer/provinces/${provinceCode}`, {
        params: { depth: 2 }
      });
      this.setState({
        districts: response.data.districts || [],
        isLoadingLocations: false
      });
      return response.data.districts || [];
    } catch (error) {
      console.error('Error fetching districts:', error);
      this.setState({ isLoadingLocations: false });
      toast.error('Không thể tải danh sách quận/huyện');
      return [];
    }
  }

  fetchWards = async (districtCode) => {
    this.setState({ isLoadingLocations: true, wards: [], selectedWard: '' });
    try {
      const response = await axios.get(`${this.context.apiUrl}/customer/districts/${districtCode}`, {
        params: { depth: 2 }
      });
      this.setState({
        wards: response.data.wards || [],
        isLoadingLocations: false
      });
      return response.data.wards || [];
    } catch (error) {
      console.error('Error fetching wards:', error);
      this.setState({ isLoadingLocations: false });
      toast.error('Không thể tải danh sách phường/xã');
      return [];
    }
  }


  // Handle district selection
  handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    console.log('Selected province code:', provinceCode);

    try {
      this.setState({
        selectedProvince: provinceCode,
        selectedDistrict: '',
        selectedWard: '',
        districts: [],
        wards: [],
        errors: {
          ...this.state.errors,
          selectedProvince: ''
        },
        isLoadingLocations: true
      });

      if (provinceCode) {
        // Add error handling and retry logic
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await this.fetchDistricts(provinceCode);
            break; // Success - exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
              console.error('Failed to fetch districts after multiple attempts:', error);
              toast.error('Không thể tải danh sách quận/huyện. Vui lòng thử lại sau.');
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error('Error in handleProvinceChange:', error);
      this.setState({
        errors: {
          ...this.state.errors,
          selectedProvince: 'Có lỗi xảy ra khi tải dữ liệu'
        }
      });
    } finally {
      this.setState({ isLoadingLocations: false });
    }
  };

  handleDistrictChange = async (e) => {
    const districtCode = e.target.value;

    this.setState({
      selectedDistrict: districtCode,
      selectedWard: '',
      wards: [],
      errors: {
        ...this.state.errors,
        selectedDistrict: ''
      }
    });

    if (districtCode) {
      await this.fetchWards(districtCode);
    }
  };

  // Handle ward selection
  handleWardChange = (e) => {
    const wardCode = e.target.value;
    this.setState({
      selectedWard: wardCode,
      errors: {
        ...this.state.errors,
        selectedWard: ''
      }
    });
  }

  // Handle detailed address input
  handleDetailAddressChange = (e) => {
    this.setState({
      detailAddress: e.target.value,
      errors: {
        ...this.state.errors,
        detailAddress: ''
      }
    });
  }

  handleResize = () => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile && !this.state.isOrderSummaryVisible) {
      this.setState({ isOrderSummaryVisible: true });
    }
  }

  toggleOrderSummary = () => {
    this.setState(prevState => ({
      isOrderSummaryVisible: !prevState.isOrderSummaryVisible
    }));
  }

  calculateTotalQuantity(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      if (!item || typeof item.quantity !== 'number') return total;
      return total + item.quantity;
    }, 0);
  }

  calculateTotalAmount(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      if (!item || !item.product || typeof item.product.price !== 'number' || typeof item.quantity !== 'number') {
        return total;
      }
      return total + (item.quantity * item.product.price);
    }, 0);
  }

  calculateShippingFee(subtotal) {
    const { deliveryOption } = this.state;
    // Return appropriate shipping fee based on delivery option
    if (deliveryOption === 'express') {
      return 30000; // 30,000 VND for express delivery
    }
    return 0; // Free for standard delivery
  }

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    this.setState({
      [name]: val,
      errors: {
        ...this.state.errors,
        [name]: '' // Clear error when field changes
      }
    });
  }

  handlePaymentMethodChange = (method) => {
    this.setState({ paymentMethod: method });
  }

  handleDeliveryOptionChange = (option) => {
    this.setState({ deliveryOption: option });
  }

  // Helper method to get location names from their codes
  getLocationName = (code, type) => {
    if (!code) return '';
    
    const { provinces, districts, wards } = this.state;
    let collection;
    
    switch (type) {
      case 'provinces':
        collection = provinces;
        break;
      case 'districts':
        collection = districts;
        break;
      case 'wards':
        collection = wards;
        break;
      default:
        return '';
    }
    
    const item = collection.find(item => item.code === parseInt(code));
    return item ? item.name : '';
  }

  validateForm = () => {
    const {
      name, phone, email,
      selectedProvince, selectedDistrict, selectedWard, detailAddress
    } = this.state;

    let isValid = true;
    const errors = {
      name: '', phone: '', email: '',
      selectedProvince: '', selectedDistrict: '', selectedWard: '', detailAddress: ''
    };

    // Validate name
    if (!name.trim()) {
      errors.name = 'Vui lòng nhập họ tên';
      isValid = false;
    }

    // Validate phone
    if (!phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (!/^0\d{9}$/i.test(phone.trim())) {
      errors.phone = 'Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số';
      isValid = false;
    }

    // Validate email - thêm kiểm tra email bắt buộc
    if (!email || !email.trim()) {
      errors.email = 'Vui lòng nhập Email';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Email không hợp lệ';
      isValid = false;
    }

    // Validate location
    if (!selectedProvince) {
      errors.selectedProvince = 'Vui lòng chọn Tỉnh/Thành phố';
      isValid = false;
    }

    if (!selectedDistrict) {
      errors.selectedDistrict = 'Vui lòng chọn Quận/Huyện';
      isValid = false;
    }

    if (!selectedWard) {
      errors.selectedWard = 'Vui lòng chọn Phường/Xã';
      isValid = false;
    }

    if (!detailAddress.trim()) {
      errors.detailAddress = 'Vui lòng nhập địa chỉ cụ thể';
      isValid = false;
    }

    this.setState({ errors });
    return isValid;
  }

  // Thêm phương thức xử lý đăng nhập ngay trên trang checkout
  handleLoginChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  toggleLoginForm = () => {
    this.setState(prevState => ({
      showLoginForm: !prevState.showLoginForm
    }));

    // Khi hiển thị form, thêm class để ngăn cuộn trang
    if (!this.state.showLoginForm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }

  handleLoginSubmit = async (e) => {
    e.preventDefault();
    const { loginUsername, loginPassword } = this.state;

    if (!loginUsername || !loginPassword) {
      toast.error('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    this.setState({ loginProcessing: true });

    try {
      const response = await axios.post(`${this.context.apiUrl}/customer/login`, {
        username: loginUsername,
        password: loginPassword
      });

      if (response.data.success) {
        const { token, customer } = response.data;

        // Cập nhật context
        this.context.setToken(token);
        this.context.setCustomer(customer);

        // Lưu vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('customer', JSON.stringify(customer));

        // Cập nhật thông tin form với dữ liệu khách hàng
        await this.loadUserData(customer);

        // Xóa class modal-open khi đóng modal
        document.body.classList.remove('modal-open');

        toast.success('Đăng nhập thành công!');
        this.setState({ showLoginForm: false });
      } else {
        toast.error('Đăng nhập thất bại!');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response && error.response.status === 401) {
        toast.error('Sai tên đăng nhập hoặc mật khẩu!');
      } else {
        toast.error('Đã xảy ra lỗi khi đăng nhập!');
      }
    } finally {
      this.setState({ loginProcessing: false });
    }
  }

  handleSignInClick = () => {
    // Hiển thị form đăng nhập trực tiếp trên trang
    this.toggleLoginForm();
  }

  async placeOrder(event) {
    event.preventDefault();
    // Validate the form
    if (!this.validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    this.setState({ isProcessing: true });

    try {
      const {
        name, phone, email, paymentMethod, items, deliveryOption,
        selectedProvince, selectedDistrict, selectedWard, detailAddress
      } = this.state;

      // Create the address string
      const address = `${detailAddress}, ${this.getLocationName(selectedWard, 'wards')}, ${this.getLocationName(selectedDistrict, 'districts')}, ${this.getLocationName(selectedProvince, 'provinces')}`;

      // Calculate shipping fee
      const subtotal = this.calculateTotalAmount(items);
      const shippingFee = this.calculateShippingFee(subtotal);

      // Format the items data properly
      const formattedItems = items.map(item => {
        return {
          product: typeof item.product === 'object' ? item.product._id : item.product,
          quantity: item.quantity,
          price: typeof item.product === 'object' ? item.product.price : item.price
        };
      });

      // Prepare the data for the order
      const orderData = {
        customerInfo: {
          name: name,
          phone: phone,
          email: email,
          address: address
        },
        items: formattedItems,
        paymentMethod: paymentMethod,
        deliveryOption: deliveryOption,
        shippingFee: shippingFee
      };

      // Thêm username cho khách hàng đã đăng nhập
      if (this.context.customer && this.context.customer.username) {
        orderData.customerInfo.username = this.context.customer.username;
        orderData.customerInfo._id = this.context.customer._id;
      }

      console.log('Sending order:', orderData);

      // Thêm header token cho yêu cầu API
      const headers = {};
      if (this.context.token) {
        headers['x-access-token'] = this.context.token;
      }

      // Send order to backend
      const response = await axios.post(`${this.context.apiUrl}/customer/checkout`, orderData, { headers });
      console.log('Checkout response:', response.data);

      if (response.data && response.data.success) {
        const orderItems = items.map(item => ({
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image
          },
          quantity: item.quantity,
          price: item.product.price
        }));

        const orderData = {
          _id: response.data.orderNumber || response.data.order?._id || 'N/A',
          orderNumber: response.data.orderNumber || response.data.order?._id || 'N/A',
          orderDate: new Date().toISOString(),
          status: 'pending',
          totalAmount: subtotal,
          shippingFee: shippingFee,
          finalTotal: subtotal + shippingFee,
          items: orderItems,
          customerInfo: {
            name,
            phone,
            email: email || '',
            address: address,
          },
          paymentMethod,
          deliveryOption
        };

        console.log('Saving order data to localStorage:', orderData);
        localStorage.setItem('lastOrder', JSON.stringify(orderData));

        // Đảm bảo đã lưu thành công
        const savedData = localStorage.getItem('lastOrder');
        console.log('Saved data retrieved:', savedData ? 'Success' : 'Failed');

        // Clean up localStorage based on order source
        if (this.state.isBuyNow) {
          // If "Buy Now" order, only remove the buyNowItems
          console.log('Cleaning up buyNowItems after successful Buy Now order');
          localStorage.removeItem('buyNowItems');
        } else {
          // If cart order, only remove the cart
          console.log('Cleaning up cart after successful cart order');
          localStorage.removeItem('cart');
        }
        
        // Always remove the checkout flag
        localStorage.removeItem('checkoutFromCart');

        // Update context
        if (typeof this.context.setCartItems === 'function') {
          this.context.setCartItems([]);
        }

        const emailMsg = email ?
          `Thông tin đơn hàng đã được gửi đến email ${email}.` :
          '';

        toast.success(`Đặt hàng thành công! ${emailMsg}`, {
          autoClose: 5000 // Give users more time to read this important message
        });

        // Chuyển hướng đến trang thành công
        this.setState({ redirect: true });
      } else {
        toast.error(response.data?.message || 'Có lỗi xảy ra khi đặt hàng');
      }
    } catch (error) {
      console.error('Error during checkout:', error);

      let errorMsg = 'Có lỗi xảy ra khi đặt hàng';

      if (error.response) {
        // Lỗi từ phản hồi của server
        errorMsg = error.response.data?.message || `Lỗi ${error.response.status}: ${error.response.statusText}`;
        console.log('Server error response:', error.response.data);
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        errorMsg = 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng';
      }

      toast.error(errorMsg);
    } finally {
      this.setState({ isProcessing: false });
    }
  }

  formatCurrency(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(price);
  }

  renderProductImage(product) {
    if (!product || !product.image) return '/images/default-product.png';

    if (product.image.startsWith('http') || product.image.startsWith('data:')) {
      return product.image;
    } else {
      return `data:image/jpeg;base64,${product.image}`;
    }
  }

  render() {
    const {
      name, phone, email, paymentMethod, items, totalQuantity,
      totalAmount, isProcessing, redirect, redirectToLogin, errors,
      isOrderSummaryVisible, showLoginForm, loginUsername, loginPassword, loginProcessing,
      deliveryOption, provinces, districts, wards, selectedProvince, selectedDistrict,
      selectedWard, detailAddress, isLoadingLocations
    } = this.state;

    if (redirect) {
      return <Navigate to="/order-success" />;
    }

    if (redirectToLogin) {
      return <Navigate to="/login" state={{ from: 'checkout' }} />;
    }

    // Calculate shipping fee based on order total
    const shippingFee = this.calculateShippingFee(totalAmount);
    const finalTotal = totalAmount + shippingFee;

    const isLoggedIn = !!this.context.customer;

    return (
      <div className="flower-checkout-container">
        <div className="flower-checkout-header">
          <div className="flower-header-decoration">
            <FaLeaf className="left-leaf" />
            <h2>Thanh Toán</h2>
            <FaLeaf className="right-leaf" />
          </div>
          <p>Hoàn tất thông tin để đặt hoa của bạn</p>

          {isLoggedIn ? (
            <div className="flower-checkout-welcome">
              <FaUser className="user-icon" />
              <p>Xin chào, <strong>{this.context.customer.name}</strong>! Thông tin của bạn đã được điền sẵn.</p>
            </div>
          ) : (
            <div className="flower-checkout-login-prompt">
              <FaSignInAlt className="login-icon" />
              <p>Bạn đã có tài khoản? Đăng nhập để đặt hàng nhanh hơn.</p>
              <button
                type="button"
                className="login-button"
                onClick={this.handleSignInClick}
              >
                <FaSignInAlt /> Đăng nhập ngay
              </button>
            </div>
          )}
        </div>

        {/* Modal Đăng nhập */}
        {showLoginForm && (
          <div className="login-modal-overlay" onClick={this.toggleLoginForm}>
            <div className="login-modal-container" onClick={e => e.stopPropagation()}>
              <div className="login-modal-header">
                <div className="login-modal-logo">
                  <div className="logo-circle">
                    <FaUser />
                  </div>
                </div>
                <h3>Đăng nhập</h3>
                <button className="login-modal-close" onClick={this.toggleLoginForm}>
                  <FaTimes />
                </button>
              </div>

              <div className="login-modal-body">
                <form onSubmit={this.handleLoginSubmit}>
                  <div className="login-modal-input-group">
                    <label htmlFor="loginUsername">
                      <FaUser className="input-icon" />
                    </label>
                    <input
                      id="loginUsername"
                      type="text"
                      name="loginUsername"
                      value={loginUsername}
                      onChange={this.handleLoginChange}
                      placeholder="Tên đăng nhập"
                      required
                    />
                  </div>

                  <div className="login-modal-input-group">
                    <label htmlFor="loginPassword">
                      <FaLock className="input-icon" />
                    </label>
                    <input
                      id="loginPassword"
                      type="password"
                      name="loginPassword"
                      value={loginPassword}
                      onChange={this.handleLoginChange}
                      placeholder="Mật khẩu"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="login-modal-button"
                    disabled={loginProcessing}
                  >
                    {loginProcessing ? (
                      <>
                        <span className="login-spinner"></span>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <FaSignInAlt /> Đăng nhập
                      </>
                    )}
                  </button>

                  <div className="login-modal-register">
                    <p>Chưa có tài khoản? <Link to="/register" onClick={this.toggleLoginForm}>Đăng ký ngay</Link></p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flower-checkout-empty">
            <div className="empty-cart-icon-container">
              <FaShoppingCart className="empty-cart-icon" />
            </div>
            <h3>Giỏ hàng của bạn đang trống</h3>
            <p>Vui lòng thêm sản phẩm vào giỏ hàng để thanh toán</p>
            <Link to="/products" className="flower-checkout-btn-continue">
              <FaArrowLeft /> Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="flower-checkout-content">
            {/* Mobile Order Summary Toggle */}
            <div className="flower-checkout-mobile-summary-toggle" onClick={this.toggleOrderSummary}>
              <div className="toggle-content">
                <FaShoppingCart />
                <span>Thông tin đơn hàng ({totalQuantity} sản phẩm)</span>
                <span className="toggle-price">{this.formatCurrency(finalTotal)}</span>
              </div>
              <div className={`toggle-arrow ${isOrderSummaryVisible ? 'up' : 'down'}`}></div>
            </div>

            {/* Thông tin người nhận */}
            <div className="flower-checkout-form-container">
              <form onSubmit={this.placeOrder}>
                <div className="flower-checkout-section">
                  <h3 className="flower-checkout-section-title">
                    {isLoggedIn ? 'Thông Tin Giao Hàng' : 'Thông Tin Người Nhận'}
                  </h3>

                  <div className="flower-checkout-form-grid">
                    <div className="flower-checkout-form-group">
                      <label>
                        <FaUser className="flower-checkout-icon" /> Họ tên
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={this.handleChange}
                        placeholder="Nhập họ tên người nhận"
                        className={errors.name ? 'flower-checkout-input-error' : ''}
                      />
                      {errors.name && <div className="flower-checkout-error">{errors.name}</div>}
                    </div>

                    <div className="flower-checkout-form-group">
                      <label>
                        <FaPhone className="flower-checkout-icon" /> Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={this.handleChange}
                        placeholder="Nhập số điện thoại liên lạc"
                        className={errors.phone ? 'flower-checkout-input-error' : ''}
                      />
                      {errors.phone && <div className="flower-checkout-error">{errors.phone}</div>}
                    </div>
                  </div>



                  <div className="flower-checkout-form-group">
                    <label>
                      <FaEnvelope className="flower-checkout-icon" /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={this.handleChange}
                      placeholder="Nhập email (để nhận xác nhận đơn hàng)"
                      className={errors.email ? 'flower-checkout-input-error' : ''}
                    />
                    {errors.email && <div className="flower-checkout-error">{errors.email}</div>}
                    <small className="flower-checkout-hint">Thông tin đơn hàng sẽ được gửi đến email của bạn</small>
                  </div>

                  {/* Địa chỉ nhận hàng theo khu vực Việt Nam */}
                  <div className="flower-checkout-section">
                    <h3 className="flower-checkout-section-title">
                      <FaMapMarkedAlt className="flower-checkout-icon" /> Địa Chỉ Giao Hàng
                    </h3>

                    <div className="flower-checkout-form-group">
                      <label>
                        <FaCity className="flower-checkout-icon" /> Tỉnh/Thành phố
                      </label>
                      <div className="location-selection-container">
                        <select
                          name="selectedProvince"
                          value={selectedProvince}
                          onChange={this.handleProvinceChange}
                          className={errors.selectedProvince ? 'flower-checkout-input-error' : ''}
                          disabled={isLoadingLocations} // Chỉ disable khi đang loading
                        >

                          <option value="">-- Chọn Tỉnh/Thành phố --</option>
                          {provinces.map(province => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                        {isLoadingLocations && <div className="loading-indicator"></div>}
                      </div>
                      {errors.selectedProvince && <div className="flower-checkout-error">{errors.selectedProvince}</div>}
                    </div>

                    <div className="flower-checkout-form-grid">
                      <div className="flower-checkout-form-group">
                        <label>
                          <FaCity className="flower-checkout-icon" /> Quận/Huyện
                        </label>
                        <div className="location-selection-container">
                          <select
                            name="selectedDistrict"
                            value={selectedDistrict}
                            onChange={this.handleDistrictChange}
                            className={errors.selectedDistrict ? 'flower-checkout-input-error' : ''}
                            disabled={!selectedProvince || isLoadingLocations}
                          >
                            <option value="">-- Chọn Quận/Huyện --</option>
                            {districts.map(district => (
                              <option key={district.code} value={district.code}>
                                {district.name}
                              </option>
                            ))}
                          </select>
                          {isLoadingLocations && selectedProvince && <div className="loading-indicator"></div>}
                        </div>
                        {errors.selectedDistrict && <div className="flower-checkout-error">{errors.selectedDistrict}</div>}
                      </div>

                      <div className="flower-checkout-form-group">
                        <label>
                          <FaCity className="flower-checkout-icon" /> Phường/Xã
                        </label>
                        <div className="location-selection-container">
                          <select
                            name="selectedWard"
                            value={selectedWard}
                            onChange={this.handleWardChange}
                            className={errors.selectedWard ? 'flower-checkout-input-error' : ''}
                            disabled={!selectedDistrict || isLoadingLocations}
                          >
                            <option value="">-- Chọn Phường/Xã --</option>
                            {wards.map(ward => (
                              <option key={ward.code} value={ward.code}>
                                {ward.name}
                              </option>
                            ))}
                          </select>
                          {isLoadingLocations && selectedDistrict && <div className="loading-indicator"></div>}
                        </div>
                        {errors.selectedWard && <div className="flower-checkout-error">{errors.selectedWard}</div>}
                      </div>

                    </div>
                    <div className="flower-checkout-form-group">
                      <label>
                        <FaHome className="flower-checkout-icon" /> Địa chỉ cụ thể
                      </label>
                      <input
                        type="text"
                        name="detailAddress"
                        value={detailAddress}
                        onChange={this.handleDetailAddressChange}
                        placeholder="Số nhà, tên đường..."
                        className={errors.detailAddress ? 'flower-checkout-input-error' : ''}
                      />
                      {errors.detailAddress && <div className="flower-checkout-error">{errors.detailAddress}</div>}
                    </div>
                  </div>
                </div>

                {/* Phương thức vận chuyển */}
                <div className="flower-checkout-section">
                  <h3 className="flower-checkout-section-title">
                    <FaTruck className="flower-checkout-icon" /> Phương Thức Vận Chuyển
                  </h3>
                  <div className="flower-checkout-delivery-options">
                    <div className="flower-delivery-option">
                      <label className="flower-delivery-label">
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="standard"
                          checked={deliveryOption === 'standard'}
                          onChange={() => this.handleDeliveryOptionChange('standard')}
                        />
                        <div className="flower-delivery-info">
                          <div className="flower-delivery-title">Giao hàng tiêu chuẩn</div>
                          <div className="flower-delivery-desc">Nhận hàng trong 2-3 ngày</div>
                        </div>
                        <div className="flower-delivery-price">Miễn phí</div>
                      </label>
                    </div>
                    
                    <div className="flower-delivery-option">
                      <label className="flower-delivery-label">
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="express"
                          checked={deliveryOption === 'express'}
                          onChange={() => this.handleDeliveryOptionChange('express')}
                        />
                        <div className="flower-delivery-info">
                          <div className="flower-delivery-title">Giao hàng nhanh</div>
                          <div className="flower-delivery-desc">Nhận hàng trong ngày (Nội thành)</div>
                        </div>
                        <div className="flower-delivery-price">30,000 ₫</div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="flower-checkout-section">
                  <h3 className="flower-checkout-section-title">
                    <FaCreditCard className="flower-checkout-icon" /> Phương Thức Thanh Toán
                  </h3>
                  <div className="flower-checkout-payment-methods">
                    <div className="flower-payment-method">
                      <label className="flower-payment-label">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === 'cash'}
                          onChange={() => this.handlePaymentMethodChange('cash')}
                        />
                        <div className="flower-payment-icon">
                          <FaMoneyBillWave />
                        </div>
                        <div className="flower-payment-info">
                          <div className="flower-payment-title">Thanh toán khi nhận hàng (COD)</div>
                          <div className="flower-payment-desc">Thanh toán bằng tiền mặt khi nhận hàng</div>
                        </div>
                      </label>
                    </div>

                    <div className="flower-payment-method">
                      <label className="flower-payment-label">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transfer"
                          checked={paymentMethod === 'transfer'}
                          onChange={() => this.handlePaymentMethodChange('transfer')}
                        />
                        <div className="flower-payment-icon">
                          <FaCreditCard />
                        </div>
                        <div className="flower-payment-info">
                          <div className="flower-payment-title">Chuyển khoản ngân hàng</div>
                          <div className="flower-payment-desc">Chuyển khoản trước khi đơn hàng được xử lý</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Hiển thị thông tin chuyển khoản khi phương thức được chọn */}
                  {paymentMethod === 'transfer' && (
                    <div className="flower-checkout-bank-transfer-info">
                      <div className="flower-bank-transfer-container">
                        <h4 className="flower-bank-transfer-title">
                          <FaUniversity className="flower-checkout-icon" /> THÔNG TIN CHUYỂN KHOẢN
                        </h4>
                        <div className="flower-bank-transfer-content">
                          <div className="flower-bank-details">
                            <div className="flower-bank-info-row">
                              <span className="flower-bank-label">Ngân hàng:</span>
                              <span className="flower-bank-value">{bankInfo.bankName}</span>
                            </div>
                            <div className="flower-bank-info-row">
                              <span className="flower-bank-label">Chủ tài khoản:</span>
                              <span className="flower-bank-value">{bankInfo.accountName}</span>
                            </div>
                            <div className="flower-bank-info-row">
                              <span className="flower-bank-label">Số tài khoản:</span>
                              <span className="flower-bank-value highlight">{bankInfo.accountNumber}</span>
                            </div>
                            <div className="flower-bank-info-row">
                              <span className="flower-bank-label">Chi nhánh:</span>
                              <span className="flower-bank-value">{bankInfo.branch}</span>
                            </div>
                            <div className="flower-bank-info-row">
                              <span className="flower-bank-label">Số tiền:</span>
                              <span className="flower-bank-value highlight">{this.formatCurrency(finalTotal)}</span>
                            </div>
                            <div className="flower-bank-info-row">
                              <span className="flower-bank-label">Nội dung CK:</span>
                              <span className="flower-bank-value">Thanh toan don hang</span>
                            </div>
                          </div>
                          <div className="flower-bank-qr-code">
                            <h5><FaQrcode /> QUÉT MÃ QR ĐỂ THANH TOÁN</h5>
                            <div className="flower-qr-image-container">
                              <img 
                                src={generateQRCodeURL(`TMP-${Date.now().toString().slice(-6)}`, finalTotal)} 
                                alt="QR Code Thanh Toán" 
                                className="flower-qr-image" 
                              />
                            </div>
                            <p className="flower-qr-note">Quét mã QR bằng ứng dụng ngân hàng để thanh toán tự động</p>
                          </div>
                        </div>
                        <div className="flower-bank-transfer-note">
                          <p><strong>Lưu ý:</strong> Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán của bạn</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Thông tin đơn hàng */}
            <div className={`flower-checkout-order-summary ${isOrderSummaryVisible ? 'visible' : 'hidden'}`}>
              <div className="flower-checkout-summary-container">
                <h3 className="flower-checkout-summary-title">
                  <FaShoppingCart className="flower-checkout-icon" />
                  Thông Tin Đơn Hàng ({totalQuantity} sản phẩm)
                </h3>

                <div className="flower-checkout-items">
                  {items.map((item, index) => (
                    <div className="flower-checkout-item" key={index}>
                      <div className="flower-checkout-item-image">
                        <img src={this.renderProductImage(item.product)} alt={item.product.name} />
                      </div>
                      <div className="flower-checkout-item-info">
                        <div className="flower-checkout-item-name">{item.product.name}</div>
                        <div className="flower-checkout-item-price">{this.formatCurrency(item.product.price)} × {item.quantity}</div>
                      </div>
                      <div className="flower-checkout-item-total">
                        {this.formatCurrency(item.quantity * item.product.price)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flower-checkout-summary-line">
                  <span>Tạm tính</span>
                  <span>{this.formatCurrency(totalAmount)}</span>
                </div>

                <div className="flower-checkout-summary-line">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee > 0 
                      ? this.formatCurrency(shippingFee) 
                      : 'Miễn phí'}
                  </span>
                </div>

                <div className="flower-checkout-summary-total">
                  <span>Tổng cộng</span>
                  <span>{this.formatCurrency(finalTotal)}</span>
                </div>

                <button
                  type="button"
                  className="flower-checkout-btn-submit"
                  onClick={this.placeOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="checkout-spinner"></span>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck /> Đặt hàng
                    </>
                  )}
                </button>

                <div className="flower-checkout-privacy-policy">
                  <div className="privacy-icon-container">
                    <FaInfoCircle className="privacy-icon" />
                  </div>
                  <p>
                    Bằng việc đặt hàng, bạn đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link> và <Link to="/privacy">Chính sách bảo mật</Link> của chúng tôi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default CheckoutComponent;