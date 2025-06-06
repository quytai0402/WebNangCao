import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit,
  FaKey, FaEye, FaEyeSlash, FaArrowLeft, FaCheck,
  FaTimes, FaExclamationTriangle, FaShoppingBag, FaMoneyBillWave,
  FaListAlt, FaLock, FaSignOutAlt, FaInfoCircle
} from 'react-icons/fa';
import MyContext from '../contexts/MyContext';
import '../styles/MyProfileComponent.css';
import { toast } from 'react-toastify';

class MyProfile extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'info',
      editMode: false,
      updateLoading: false,
      passwordLoading: false,
      name: '',
      phone: '',
      email: '',
      address: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      passwordError: '',
      infoError: '',
      infoSuccess: '',
      passwordSuccess: '',
      mounted: false,
      orderStats: {
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null
      },
      loadingStats: false,
      display: 'profile', // 'profile' hoặc 'password'
      txtUsername: '',
      txtPassword: '',
      txtName: '',
      txtPhone: '',
      txtEmail: '',
      txtAddress: '',
      txtCurrentPassword: '',
      txtNewPassword: '',
      txtConfirmPassword: '',
      loading: true,
      isLoggedIn: false,
      errors: {}
    };
    this.formRef = React.createRef();
  }

  loadOrderStats = async () => {
    try {
      this.setState({ loadingStats: true });
      
      // Kiểm tra token và customerId
      if (!this.context.token || !this.context.customer?._id) {
        throw new Error('Unauthorized access');
      }
  
      const response = await axios.get(`${this.context.apiUrl}/customer/orders/${this.context.customer._id}`, {
        headers: { 'x-access-token': this.context.token }
      });
  
      console.log('API Response:', response.data);
  
      if (response.data.success && Array.isArray(response.data.orders)) {
        const orders = response.data.orders;
        
        // Tính toán thống kê
        const totalOrders = orders.length;
        
        // Tính tổng chi tiêu từ đơn hàng đã giao
        const totalSpent = orders.reduce((sum, order) => {
          if (order.status === 'delivered') {
            return sum + (order.total || 0);
          }
          return sum;
        }, 0);
  
        // Lấy đơn hàng gần nhất (không tính đơn đã hủy)
        const activeOrders = orders.filter(order => order.status !== 'cancelled');
        const lastOrder = activeOrders.length > 0 
          ? activeOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
          : null;
  
        this.setState({
          orderStats: {
            totalOrders,
            totalSpent,
            lastOrder
          },
          loadingStats: false
        });
      }
    } catch (error) {
      console.error('Error loading order stats:', error);
      this.setState({ 
        loadingStats: false,
        infoError: 'Không thể tải thông tin đơn hàng'
      });
    }
  };

  componentDidMount() {
    if (this.context.customer) {
      const { name, phone, email, address } = this.context.customer;
      this.setState({
        name: name || '',
        phone: phone || '',
        email: email || '',
        address: address || ''
      });
    }

    // Trigger animation after component mounts
    setTimeout(() => this.setState({ mounted: true }), 100);

    // Sửa lại từ fetchOrderStats thành loadOrderStats
    this.loadOrderStats();

    if (this.context && this.context.token) {
      this.fetchProfile();
    } else {
      this.setState({ loading: false, isLoggedIn: false });
    }
  }

  componentWillUnmount() {
    // Clean up any pending tasks or listeners here if necessary
  }

  setActiveTab = (tab) => {
    this.setState({
      activeTab: tab,
      passwordError: '',
      infoError: '',
      passwordSuccess: '',
      infoSuccess: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false
    });
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
      infoError: ''
    });
  };

  handlePasswordChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
      passwordError: ''
    });
  };

  toggleEditMode = () => {
    const { editMode } = this.state;
    if (!editMode) {
      const { name, phone, email, address } = this.context.customer;
      this.setState({
        editMode: true,
        name: name || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        infoError: '',
        infoSuccess: ''
      });
    } else {
      this.cancelEdit();
    }
  };

  cancelEdit = () => {
    const { name, phone, email, address } = this.context.customer;
    this.setState({
      editMode: false,
      name: name || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      infoError: '',
      infoSuccess: ''
    });
  };

  togglePasswordVisibility = (field) => {
    this.setState(prevState => ({
      [field]: !prevState[field]
    }));
  };

  validateInfoForm = () => {
    const { name, phone, email } = this.state;

    if (!name.trim()) {
      this.setState({ infoError: 'Họ tên không được để trống' });
      return false;
    }

    if (!phone.trim()) {
      this.setState({ infoError: 'Số điện thoại không được để trống' });
      return false;
    }

    if (!email.trim()) {
      this.setState({ infoError: 'Email không được để trống' });
      return false;
    }

    // Simple email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      this.setState({ infoError: 'Email không hợp lệ' });
      return false;
    }

    // Simple phone validation
    const phonePattern = /^\d{10,11}$/;
    if (!phonePattern.test(phone)) {
      this.setState({ infoError: 'Số điện thoại phải có 10-11 chữ số' });
      return false;
    }

    return true;
  };

  validatePasswordForm = () => {
    const { currentPassword, newPassword, confirmPassword } = this.state;

    if (!currentPassword) {
      this.setState({ passwordError: 'Vui lòng nhập mật khẩu hiện tại' });
      return false;
    }

    if (!newPassword) {
      this.setState({ passwordError: 'Vui lòng nhập mật khẩu mới' });
      return false;
    }

    if (newPassword.length < 6) {
      this.setState({ passwordError: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return false;
    }

    if (newPassword === currentPassword) {
      this.setState({ passwordError: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
      return false;
    }

    if (newPassword !== confirmPassword) {
      this.setState({ passwordError: 'Xác nhận mật khẩu không khớp' });
      return false;
    }

    return true;
  };

  saveProfile = async (e) => {
    e.preventDefault();
  
    if (!this.validateInfoForm()) return;
  
    const { name, phone, email, address } = this.state;
  
    this.setState({ updateLoading: true });
  
    try {
      const response = await axios.put(
        `${this.context.apiUrl}/customer/update-profile`,
        { name, phone, email, address },
        { headers: { 'x-access-token': this.context.token } }
      );
  
      if (response.data.success) {
        // Lấy dữ liệu đầy đủ từ response để đảm bảo có tất cả thông tin khách hàng
        const updatedCustomer = response.data.customer || {};
        
        // Nếu API không trả về thông tin đầy đủ, tạo đối tượng cập nhật từ dữ liệu hiện tại
        const fullUpdatedCustomer = {
          ...this.context.customer,
          name,
          phone,
          email,
          address
        };
        
        // Log để debug
        console.log('Updated customer data:', fullUpdatedCustomer);
        
        // Cập nhật context và localStorage
        this.context.setCustomer(fullUpdatedCustomer);
        
        this.setState({
          editMode: false,
          infoSuccess: 'Thông tin cá nhân đã được cập nhật thành công.',
          infoError: ''
        });
  
        toast.success('Cập nhật thông tin thành công!');
      } else {
        this.setState({ infoError: response.data.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      this.setState({ infoError: errorMsg });
      toast.error(errorMsg);
    } finally {
      this.setState({ updateLoading: false });
    }
  };

  changePassword = async (e) => {
    e.preventDefault();

    if (!this.validatePasswordForm()) return;

    const { currentPassword, newPassword } = this.state;

    this.setState({ passwordLoading: true });

    try {
      const response = await axios.put(
        `${this.context.apiUrl}/customer/change-password`,
        { currentPassword, newPassword },
        { headers: { 'x-access-token': this.context.token } }
      );

      if (response.data.success) {
        this.setState({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          passwordSuccess: 'Mật khẩu đã được thay đổi thành công.',
          passwordError: ''
        });

        toast.success('Đổi mật khẩu thành công!');
      } else {
        this.setState({
          passwordError: response.data.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMsg = error.response?.data?.message || 'Mật khẩu hiện tại không chính xác.';
      this.setState({ passwordError: errorMsg });
      toast.error(errorMsg);
    } finally {
      this.setState({ passwordLoading: false });
    }
  };

  fetchProfile = async () => {
    try {
      const response = await axios.get(`${this.context.apiUrl}/customer/profile`, {
        headers: { 'x-access-token': this.context.token }
      });
      const customer = response.data;
      if (customer) {
        this.setState({
          txtUsername: customer.username || '',
          txtName: customer.name || '',
          txtPhone: customer.phone || '',
          txtEmail: customer.email || '',
          txtAddress: customer.address || '',
          loading: false,
          isLoggedIn: true
        });
      }
    } catch (error) {
      toast.error('Không thể tải thông tin hồ sơ');
      console.error(error);
      this.setState({ loading: false, isLoggedIn: false });
    }
  };

  updateProfile = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = this.validateProfileForm();
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    const { txtName, txtPhone, txtEmail, txtAddress } = this.state;
    const customer = {
      name: txtName,
      phone: txtPhone,
      email: txtEmail,
      address: txtAddress
    };

    try {
      const response = await axios.put(`${this.context.apiUrl}/customer/profile`, customer, {
        headers: { 'x-access-token': this.context.token }
      });
      if (response.data) {
        toast.success('Cập nhật hồ sơ thành công', {
          position: "top-center",
          autoClose: 2000
        });
        this.setState({ errors: {} });
      } else {
        toast.error('Cập nhật hồ sơ thất bại');
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || 'Cập nhật hồ sơ thất bại');
      } else {
        toast.error('Cập nhật hồ sơ thất bại');
      }
    }
  };

  validateProfileForm = () => {
    const errors = {};
    const { txtName, txtPhone, txtEmail } = this.state;

    if (!txtName.trim()) {
      errors.name = 'Họ và tên không được để trống';
    }

    if (!txtPhone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{10,11}$/.test(txtPhone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!txtEmail.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(txtEmail.trim())) {
      errors.email = 'Email không hợp lệ';
    }

    return errors;
  };

  handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      this.context.setToken('');
      window.location.href = '/login';
    }
  };

  renderStatCards() {
    const { orderStats, loadingStats } = this.state;
    const { totalOrders, totalSpent, lastOrder } = orderStats;

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    return (
      <div className="profile-stats-container">
        <div className="profile-stats-card">
          <div className="stats-icon-container">
            <FaShoppingBag className="stats-icon" />
          </div>
          <div className="stats-content">
            <h4 className="stats-value">
              {loadingStats ? <div className="stats-loading"></div> : totalOrders}
            </h4>
            <p className="stats-label">Tổng số đơn hàng</p>
          </div>
        </div>

        <div className="profile-stats-card">
          <div className="stats-icon-container spent">
            <FaMoneyBillWave className="stats-icon" />
          </div>
          <div className="stats-content">
            <h4 className="stats-value">
              {loadingStats ? <div className="stats-loading"></div> : formatCurrency(totalSpent)}
            </h4>
            <p className="stats-label">Tổng chi tiêu</p>
          </div>
        </div>

        <div className="profile-stats-card">
          <div className="stats-icon-container recent">
            <FaListAlt className="stats-icon" />
          </div>
          <div className="stats-content">
            <h4 className="stats-value small-text">
              {loadingStats ? (
                <div className="stats-loading"></div>
              ) : lastOrder ? (
                new Date(lastOrder.date).toLocaleDateString('vi-VN')
              ) : (
                'Chưa có'
              )}
            </h4>
            <p className="stats-label">Đơn hàng gần nhất</p>
          </div>
        </div>
      </div>
    );
  }

  renderInfoTab() {
    const { name, phone, email, address, editMode, infoError, infoSuccess, updateLoading } = this.state;
    const { customer } = this.context;

    if (!customer) return null;

    // Format the date with proper error handling
    const formatJoinDate = (dateString) => {
      try {
        if (!dateString) return 'Không xác định';
        
        const joinDate = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(joinDate.getTime())) {
          return 'Không xác định';
        }
        
        return joinDate.toLocaleDateString('vi-VN');
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Không xác định';
      }
    };

    const joinDateDisplay = formatJoinDate(customer.cdate || customer.createdAt || customer.joinDate);

    return (
      <div className="profile-tab-content">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {name ? name.charAt(0).toUpperCase() : 'K'}
            </div>
          </div>
          <div className="profile-title">
            <h3>{name || 'Khách hàng'}</h3>
            <p>Thành viên từ {joinDateDisplay}</p>
          </div>
          <div className="profile-actions">
            <button
              className={`btn-edit ${editMode ? 'active' : ''}`}
              onClick={this.toggleEditMode}
              type="button"
            >
              {editMode ? (
                <>
                  <FaTimes /> Hủy
                </>
              ) : (
                <>
                  <FaEdit /> Chỉnh sửa
                </>
              )}
            </button>
          </div>
        </div>

        {/* Display order statistics when not in edit mode */}
        {!editMode && this.renderStatCards()}

        {infoSuccess && (
          <div className="profile-success">
            <FaCheck className="success-icon" />
            {infoSuccess}
          </div>
        )}

        {infoError && (
          <div className="profile-error">
            <FaExclamationTriangle className="error-icon" />
            {infoError}
          </div>
        )}

        <form onSubmit={this.updateProfile} ref={this.formRef}>
          <div className="profile-info">
            <div className="info-group">
              <div className="info-label">
                <FaUser className="info-icon" />
                <span>Họ và tên</span>
              </div>
              <div className="info-value">
                {editMode ? (
                  <input
                    type="text"
                    name="txtName"
                    value={this.state.txtName}
                    onChange={this.handleInputChange}
                    className="profile-input"
                    placeholder="Nhập họ và tên"
                  />
                ) : (
                  <span>{this.state.txtName || 'Chưa cập nhật'}</span>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaPhone className="info-icon" />
                <span>Số điện thoại</span>
              </div>
              <div className="info-value">
                {editMode ? (
                  <input
                    type="tel"
                    name="txtPhone"
                    value={this.state.txtPhone}
                    onChange={this.handleInputChange}
                    className="profile-input"
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <span>{this.state.txtPhone || 'Chưa cập nhật'}</span>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaEnvelope className="info-icon" />
                <span>Email</span>
              </div>
              <div className="info-value">
                {editMode ? (
                  <input
                    type="email"
                    name="txtEmail"
                    value={this.state.txtEmail}
                    onChange={this.handleInputChange}
                    className="profile-input"
                    placeholder="Nhập email"
                  />
                ) : (
                  <span>{this.state.txtEmail || 'Chưa cập nhật'}</span>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaMapMarkerAlt className="info-icon" />
                <span>Địa chỉ</span>
              </div>
              <div className="info-value">
                {editMode ? (
                  <textarea
                    name="txtAddress"
                    value={this.state.txtAddress}
                    onChange={this.handleInputChange}
                    className="profile-textarea"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  ></textarea>
                ) : (
                  <span>{this.state.txtAddress || 'Chưa cập nhật'}</span>
                )}
              </div>
            </div>

            {editMode && (
              <div className="profile-submit">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={this.cancelEdit}
                  disabled={updateLoading}
                >
                  <FaArrowLeft /> Quay lại
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Đang cập nhật...' : (
                    <>
                      <FaCheck /> Lưu thông tin
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }

  renderPasswordTab() {
    const {
      currentPassword, newPassword, confirmPassword,
      showCurrentPassword, showNewPassword, showConfirmPassword,
      passwordError, passwordSuccess, passwordLoading
    } = this.state;

    return (
      <div className="profile-tab-content">
        <div className="password-header">
          <div className="password-icon">
            <FaKey />
          </div>
          <div className="password-title">
            <h3>Đổi mật khẩu</h3>
            <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="profile-success">
            <FaCheck className="success-icon" />
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="profile-error">
            <FaExclamationTriangle className="error-icon" />
            {passwordError}
          </div>
        )}

        <form onSubmit={this.changePassword}>
          <div className="password-form">
            <div className="password-group">
              <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="txtCurrentPassword"
                  value={this.state.txtCurrentPassword}
                  onChange={this.handlePasswordChange}
                  className="password-input"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => this.togglePasswordVisibility('showCurrentPassword')}
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="password-group">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="txtNewPassword"
                  value={this.state.txtNewPassword}
                  onChange={this.handlePasswordChange}
                  className="password-input"
                  placeholder="Nhập mật khẩu mới"
                  minLength="6"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => this.togglePasswordVisibility('showNewPassword')}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="password-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="txtConfirmPassword"
                  value={this.state.txtConfirmPassword}
                  onChange={this.handlePasswordChange}
                  className="password-input"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => this.togglePasswordVisibility('showConfirmPassword')}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="password-submit">
              <button
                type="submit"
                className="btn-change-password"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  render() {
    const { display, loading, isLoggedIn } = this.state;

    if (loading) {
      return (
        <div className="spinner-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return <Navigate to="/login" />;
    }

    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h2>Quản lý tài khoản</h2>
          </div>
          
          <div className="profile-tabs">
            <button 
              className={`tab-button ${display === 'profile' ? 'active' : ''}`}
              onClick={() => this.setState({ display: 'profile', errors: {} })}
            >
              <FaUser className="tab-icon" />
              Thông tin cá nhân
            </button>
            <button 
              className={`tab-button ${display === 'password' ? 'active' : ''}`}
              onClick={() => this.setState({ display: 'password', errors: {} })}
            >
              <FaLock className="tab-icon" />
              Đổi mật khẩu
            </button>
            <button 
              className="tab-button logout"
              onClick={this.handleLogout}
            >
              <FaSignOutAlt className="tab-icon" />
              Đăng xuất
            </button>
          </div>
          
          <div className="profile-content">
            {display === 'profile' && this.renderInfoTab()}
            
            {display === 'password' && this.renderPasswordTab()}
          </div>
        </div>
      </div>
    );
  }
}

export default MyProfile;


