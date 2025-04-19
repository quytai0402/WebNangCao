import React, { Component } from 'react';
import Menu from './MenuComponent'; // Nhập component Menu
import Inform from './InformComponent'; // Nhập component Inform
import { Home, CategoryProducts } from './HomeComponent'; // Nhập các component Home và CategoryProducts từ HomeComponent
import ProductSearch from './ProductSearchComponent'; // Nhập component ProductSearch
import ProductDetail from './ProductDetailComponent'; // Nhập component ProductDetail
import { Routes, Route, Navigate } from 'react-router-dom'; // Nhập các thành phần để quản lý router
import axios from 'axios'; // Nhập thư viện axios để thực hiện gọi API
import Register from './RegisterComponent'; // Nhập component Register
import Login from './LoginComponent'; // Nhập component Login
import AllProducts from './AllProductsComponent'; // Nhập component AllProducts
import MyProfile from './MyProfileComponent'; // Nhập component MyProfile
import MyOrders from './MyOrdersComponent'; // Nhập component MyOrders
import MyContext from '../contexts/MyContext'; // Nhập context MyContext
import { toast } from 'react-toastify'; // Nhập thư viện để thông báo
import LoadingSpinner from './LoadingSpinner'; // Nhập component LoadingSpinner
import Active from './ActiveComponent'; // Nhập component Active
import MyCart from './MyCartComponent'; // Nhập component MyCart
import Checkout from './CheckoutComponent'; // Nhập component Checkout
import OrderSuccessComponent from './OrderSuccessComponent'; // Nhập component OrderSuccess
import ResetPassword from './ResetPasswordComponent'; 
import WishlistComponent from './WishlistComponent'; // Nhập component WishlistComponent
import ChatbotComponent from './ChatbotComponent'; // Nhập component ChatbotComponent
import { FaChevronUp } from 'react-icons/fa'; // Import icon cho nút back-to-top

// Lấy URL API từ biến môi trường
const API_URL = process.env.REACT_APP_API_URL || 'https://webnangcao-api.onrender.com/api';

// CSS cho nút back-to-top
const backToTopStyles = {
    button: {
        position: 'fixed',
        bottom: '130px', // Tăng khoảng cách so với đáy trang lên cao hơn
        right: '40px',   // Căn phải đều với nút chat để trông gọn gàng hơn
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ff7eb3, #e75480)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: 0,
        visibility: 'hidden',
        transform: 'translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 4px 15px rgba(231, 84, 128, 0.3)',
        zIndex: 999,     // Tăng z-index nhưng vẫn nhỏ hơn chat button
        border: 'none',
        fontSize: '16px'
    },
    visible: {
        opacity: 1,
        visibility: 'visible',
        transform: 'translateY(0)'
    },
    hover: {
        background: 'linear-gradient(135deg, #ff8fbd, #ec5f8a)',
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 20px rgba(231, 84, 128, 0.4)'
    }
};

class Main extends Component {
    static contextType = MyContext; // Thiết lập kiểu context cho class Main

    constructor(props) {
        super(props);
        this.state = {
            categories: [], // Khởi tạo mảng danh mục sản phẩm
            isLoading: true, // Biến trạng thái tải dữ liệu
            error: null, // Biến chứa thông tin lỗi nếu có
            showBackToTop: false, // Trạng thái hiển thị nút back-to-top
            isHovering: false // Trạng thái hover cho nút back-to-top
        };

        // Thiết lập interceptor cho axios
        this.setupAxiosInterceptors();
    }

    setupAxiosInterceptors = () => {
        // Interceptor cho yêu cầu
        axios.interceptors.request.use(
          (config) => {
            const token = localStorage.getItem('token'); // Lấy token từ localStorage
            if (token) {
              config.headers['x-access-token'] = token; // Thêm token vào header của yêu cầu
            }
            return config; // Trả về config đã được thay đổi
          },
          (error) => {
            return Promise.reject(error); // Trả về lỗi nếu có
          }
        );
      
        // Interceptor cho phản hồi
        axios.interceptors.response.use(
          (response) => response, // Trả về phản hồi nguyên bản
          (error) => {
            if (error.response?.status === 401) { // Kiểm tra mã lỗi 401
              this.handleSessionExpired(); // Gọi hàm xử lý khi phiên làm việc hết hạn
            }
            return Promise.reject(error); // Trả về lỗi nếu có
          }
        );
    };

    componentDidMount() {
        this.fetchCategories(); // Gọi hàm fetchCategories khi component được gắn vào DOM
        
        // Thêm event listener cho scroll
        window.addEventListener('scroll', this.handleScroll);
    }
    
    componentWillUnmount() {
        // Gỡ bỏ event listener khi component unmount
        window.removeEventListener('scroll', this.handleScroll);
    }

    // Hàm xử lý sự kiện scroll
    handleScroll = () => {
        if (window.pageYOffset > 300) {
            this.setState({ showBackToTop: true });
        } else {
            this.setState({ showBackToTop: false });
        }
    };
    
    // Hàm xử lý cuộn lên đầu trang
    scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    // Xử lý hover cho nút back-to-top
    handleMouseEnter = () => {
        this.setState({ isHovering: true });
    };
    
    handleMouseLeave = () => {
        this.setState({ isHovering: false });
    };

    handleSessionExpired = () => {
        this.context.handleLogout(); // Đăng xuất người dùng từ context
        toast.warning('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'); // Hiện thị thông báo
    };

    fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/customer/categories`); // Gọi API để lấy danh mục sản phẩm
            this.setState({
                categories: response.data, // Cập nhật danh mục sản phẩm vào state
                isLoading: false // Đặt trạng thái loading thành false
            });
        } catch (error) {
            console.error('Error fetching categories:', error); // In ra lỗi nếu có
            this.setState({
                error: 'Không thể tải danh mục sản phẩm', // Cập nhật lỗi vào state
                isLoading: false, // Đặt trạng thái loading thành false
                categories: [] // Đặt danh mục thành rỗng
            });
            toast.error('Không thể tải danh mục sản phẩm'); // Hiện thị thông báo lỗi
        }
    };

    ProtectedRoute = ({ children }) => {
        const { token } = this.context; // Lấy token từ context
        if (!token) { // Nếu không có token
            toast.warning('Vui lòng đăng nhập để tiếp tục'); // Hiện thị thông báo
            return <Navigate to="/login" replace />; // Điều hướng đến trang đăng nhập
        }
        return children; // Trả về các children nếu có token
    };

    render() {
        const { categories, isLoading, error, showBackToTop, isHovering } = this.state; // Lấy các biến từ state

        // Các style cho nút back-to-top
        const buttonStyle = {
            ...backToTopStyles.button,
            ...(showBackToTop ? backToTopStyles.visible : {}),
            ...(isHovering ? backToTopStyles.hover : {})
        };

        if (isLoading) return <LoadingSpinner />; // Nếu đang loading thì hiển thị LoadingSpinner

        if (error) { // Nếu có lỗi
            return (
                <div className="error-container">
                    <h3>Đã xảy ra lỗi</h3>
                    <p>{error}</p>
                    <button onClick={this.fetchCategories}>Thử lại</button> {/* Nút để thử lại tải danh mục */}
                </div>
            );
        }

        return (
            <div className="body-customer">
                <Inform /> {/* Hiển thị component Inform */}
                <Menu categories={categories} /> {/* Hiển thị component Menu và truyền danh mục */}
                <Routes>
                    <Route path='/' element={<Navigate replace to='/home' />} /> {/* Điều hướng về home */}
                    <Route path='/home' element={<Home categories={categories} />} /> {/* Hiển thị home với danh mục */}
                    <Route path="/product/category/:id" element={<CategoryProducts categories={categories} />} /> {/* Hiển thị các sản phẩm theo danh mục */}
                    <Route path="/product/search/:keyword" element={<ProductSearch />} /> {/* Hiển thị tìm kiếm sản phẩm */}
                    <Route path="/product/:id" element={<ProductDetail />} /> {/* Hiển thị chi tiết sản phẩm */}
                    <Route path="/product/category/:id/price" element={<CategoryProducts categories={categories} />} />
                    <Route path="/product/category/:id/price/:price" element={<CategoryProducts categories={categories} />} />
                    <Route path="/register" element={<Register />} /> {/* Hiển thị trang đăng ký */}
                    <Route path="/login" element={<Login />} /> {/* Hiển thị trang đăng nhập */}
                    <Route path="/products" element={<AllProducts />} /> {/* Hiển thị tất cả sản phẩm */}
                    <Route path="/my-profile" element={
                        <this.ProtectedRoute>
                            <MyProfile />
                        </this.ProtectedRoute>
                    } /> {/* Hiển thị thông tin người dùng */}
                    <Route path="/myorders" element={
                        <this.ProtectedRoute>
                            <MyOrders />
                        </this.ProtectedRoute>
                    } /> {/* Hiển thị đơn hàng của người dùng */}
                    <Route path="/MyCart" element={<MyCart />} /> {/* Hiển thị giỏ hàng */}
                    <Route path="/checkout" element={<Checkout />} /> {/* Hiển thị quá trình thanh toán */}
                    <Route path="/activate" element={<Active />} /> {/* Hiển thị trang kích hoạt tài khoản */}
                    <Route path='/order-success' element={<OrderSuccessComponent />} /> {/* Hiển thị trang thành công đơn hàng */}
                    <Route path='/reset-password' element={<ResetPassword />} /> {/* Hiển thị trang reset mật khẩu */}
                    <Route path="/wishlist" element={
                        <this.ProtectedRoute>
                            <WishlistComponent />
                        </this.ProtectedRoute>
                    } /> {/* Hiển thị trang yêu thích */}
                </Routes>
                
                {/* Nút back-to-top */}
                <button 
                    style={buttonStyle}
                    onClick={this.scrollToTop}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                    aria-label="Quay về đầu trang"
                >
                    <FaChevronUp />
                </button>

                {/* Thêm ChatbotComponent */}
                <ChatbotComponent />
            </div>
        );
    }
}

export default Main; // Xuất component Main