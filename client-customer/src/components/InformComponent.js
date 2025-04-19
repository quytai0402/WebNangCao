import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUser, FaShoppingCart, FaHeart,
    FaSignOutAlt, FaChevronDown
} from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import MyContext from '../contexts/MyContext';
import '../styles/InformComponent.css';
import withRouter from '../utils/withRouter';
import { toast } from 'react-toastify';
import axios from 'axios';

// Component chính hiển thị thông tin người dùng và menu điều hướng
class Inform extends Component {
    // Sử dụng Context để truy cập dữ liệu toàn cầu (token, thông tin người dùng)
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            isDropdownOpen: false,        // Trạng thái đóng/mở dropdown menu
            scrolled: false,              // Kiểm tra trạng thái cuộn trang
            stickyMenu: false,            // Trạng thái menu cố định
            isLoading: true,              // Trạng thái đang tải
            isLoggingOut: false,          // Trạng thái đang đăng xuất
            cartCount: 0,                 // Số lượng sản phẩm trong giỏ hàng
            wishlistCount: 0              // Số lượng sản phẩm yêu thích
        };
        this.dropdownRef = React.createRef();      // Tham chiếu đến dropdown để xử lý sự kiện click ngoài
        this.menuRef = React.createRef();          // Tham chiếu đến menu để xác định vị trí
        this.menuPosition = 0;                     // Vị trí ban đầu của menu
        this.authCheckInterval = null;             // Biến lưu trữ interval kiểm tra token
    }

    // Hàm chạy sau khi component được render lần đầu
    componentDidMount() {
        // Đăng ký các sự kiện lắng nghe
        document.addEventListener('mousedown', this.handleClickOutside);
        document.addEventListener('keydown', this.handleEscapeKey);
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('storage', this.checkAuthStatus);

        // Kiểm tra trạng thái đăng nhập
        this.checkAuthStatus();

        // Cập nhật số lượng sản phẩm trong giỏ hàng ban đầu
        this.updateCartCount();
        
        // Cập nhật số lượng sản phẩm yêu thích ban đầu
        this.updateWishlistCount();

        // Thêm sự kiện lắng nghe cập nhật giỏ hàng và danh sách yêu thích
        window.addEventListener('cartUpdated', this.updateCartCount);
        window.addEventListener('wishlistUpdated', this.updateWishlistCount);

        // Kiểm tra định kỳ tính hợp lệ của token (mỗi 5 phút)
        this.authCheckInterval = setInterval(this.validateStoredToken, 300000);

        // Lưu vị trí ban đầu của menu
        if (this.menuRef.current) {
            this.menuPosition = this.menuRef.current.offsetTop;
        }

        // Hoàn thành quá trình tải
        this.setState({ isLoading: false });
    }
    
    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartCount = () => {
        try {
            const cart = localStorage.getItem('cart');
            if (cart) {
                const items = JSON.parse(cart);
                const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
                
                // Cập nhật state và context nếu cần
                this.setState({ cartCount: totalQuantity });
                if (this.context.setCartItems) {
                    this.context.setCartItems(items);
                }
            } else {
                this.setState({ cartCount: 0 });
                if (this.context.setCartItems) {
                    this.context.setCartItems([]);
                }
            }
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }
    
    // Cập nhật số lượng sản phẩm yêu thích
    updateWishlistCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found, setting wishlist count to 0');
                this.setState({ wishlistCount: 0 });
                return;
            }
            
            console.log('Fetching wishlist count with token:', token ? 'Token present' : 'No token');
            
            // Gọi API để lấy số lượng sản phẩm yêu thích
            const response = await axios.get(`${this.context.apiUrl}/customer/wishlist/count`, {
                headers: { 'x-access-token': token }
            });
            
            console.log('Wishlist count response:', response.data);
            
            if (response.data.success) {
                console.log('Setting wishlist count to:', response.data.count);
                this.setState({ wishlistCount: response.data.count });
            } else {
                console.error('Failed to get wishlist count:', response.data.message);
                this.setState({ wishlistCount: 0 });
            }
        } catch (error) {
            console.error('Error updating wishlist count:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            } else if (error.request) {
                console.error('Request was made but no response received');
            } else {
                console.error('Error setting up request:', error.message);
            }
            this.setState({ wishlistCount: 0 });
        }
    }
    
    // Hàm chạy trước khi component bị hủy
    componentWillUnmount() {
        // Hủy đăng ký các sự kiện lắng nghe
        document.removeEventListener('mousedown', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleEscapeKey);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('storage', this.checkAuthStatus);
        window.removeEventListener('cartUpdated', this.updateCartCount);
        window.removeEventListener('wishlistUpdated', this.updateWishlistCount);
        
        // Xóa interval kiểm tra token
        clearInterval(this.authCheckInterval);
    }

    // Kiểm tra tính hợp lệ của token lưu trữ
    validateStoredToken = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Gọi API kiểm tra token
            const response = await axios.get(`${this.context.apiUrl}/customer/validate-token`);
            
            if (!response.data.valid) {
                // Thử làm mới token trước khi đăng xuất
                try {
                    const refreshResponse = await axios.post(`${this.context.apiUrl}/customer/refresh-token`, {}, {
                        headers: { 'x-access-token': token }
                    });
                    
                    if (refreshResponse.data.success) {
                        // Cập nhật token mới vào localStorage và context
                        localStorage.setItem('token', refreshResponse.data.token);
                        this.context.setToken(refreshResponse.data.token);
                        return; // Không đăng xuất nếu làm mới token thành công
                    }
                } catch (refreshError) {
                    console.error('Error refreshing token:', refreshError);
                }
                
                console.log('Token không còn hợp lệ, đăng xuất người dùng');
                this.silentLogout();
            }
        } catch (error) {
            console.error('Error validating token:', error);
        }
    };

    // Đăng xuất im lặng (không hiện thông báo)
    silentLogout = () => {
        const { setToken, setCustomer } = this.context;
        
        // Xóa dữ liệu đăng nhập từ localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('customer');
        
        // Cập nhật context
        setToken('');
        setCustomer(null);
        
        // Đóng dropdown nếu đang mở
        this.setState({ isDropdownOpen: false });
    };

    // Xử lý sự kiện cuộn trang
    handleScroll = () => {
        // Xác định trạng thái cuộn để thay đổi hiển thị header
        if (window.scrollY > 50) {
            this.setState({ scrolled: true });
        } else {
            this.setState({ scrolled: false });
        }

        // Xác định trạng thái menu cố định (sticky)
        if (this.menuPosition && window.scrollY >= this.menuPosition) {
            if (!this.state.stickyMenu) {
                this.setState({ stickyMenu: true });
            }
        } else {
            if (this.state.stickyMenu) {
                this.setState({ stickyMenu: false });
            }
        }
    };

    // Kiểm tra trạng thái đăng nhập
    checkAuthStatus = () => {
        try {
            const token = localStorage.getItem('token');
            const customerStr = localStorage.getItem('customer');

            if (token && customerStr) {
                const customer = JSON.parse(customerStr);
                if (!this.context.token) {
                    // Cập nhật context nếu có token nhưng context chưa được cập nhật
                    this.context.setToken(token);
                    this.context.setCustomer(customer);
                }
            } else if (this.context.token) {
                // Đăng xuất nếu không có token trong localStorage nhưng context vẫn có
                this.silentLogout();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.silentLogout();
        }
    };

    // Xử lý sự kiện click bên ngoài dropdown
    handleClickOutside = (event) => {
        if (this.dropdownRef.current && !this.dropdownRef.current.contains(event.target)) {
            this.setState({ isDropdownOpen: false });
        }
    };

    // Xử lý sự kiện nhấn phím Escape
    handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            this.setState({ isDropdownOpen: false });
        }
    };

    // Chuyển đổi trạng thái dropdown
    toggleDropdown = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.setState(prevState => ({
            isDropdownOpen: !prevState.isDropdownOpen
        }));
    };

    // Xử lý sự kiện click vào mục trong dropdown
    handleDropdownItemClick = () => {
        this.setState({ isDropdownOpen: false });
    };

    // Xử lý đăng xuất
    handleLogout = async () => {
        if (this.state.isLoggingOut) return;

        this.setState({ isLoggingOut: true });
        
        try {
            const { setToken, setCustomer } = this.context;

            // Xóa dữ liệu đăng nhập từ localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('customer');

            // Cập nhật context
            setToken('');
            setCustomer(null);

            // Đóng dropdown
            this.setState({ isDropdownOpen: false });

            // Hiển thị thông báo thành công
            toast.success('Đăng xuất thành công!');
            
            // Chuyển hướng về trang chủ
            this.props.router.navigate('/', { replace: true });

            // Cuộn về đầu trang
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Có lỗi xảy ra khi đăng xuất');
        } finally {
            this.setState({ isLoggingOut: false });
        }
    };

    render() {
        const { token, customer } = this.context;
        const { isDropdownOpen, scrolled, stickyMenu, isLoading, isLoggingOut, cartCount, wishlistCount } = this.state;

        // Hiển thị spinner khi đang tải
        if (isLoading) {
            return <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
            </div>;
        }

        return (
            <div className="header-and-menu-wrapper">
                {/* Phần header */}
                <div className={`info-header ${scrolled ? 'scrolled' : ''}`}>
                    <div className="top-info-bar">
                        <div className="container">
                            <div className="info-bar-wrapper">
                                <div className="welcome-message">
                                    <div className="logo-wrapper">
                                        <Link to="/" className="logo-link">
                                            <GiFlowerPot className="logo-icon" />
                                            <span>Florista</span>
                                        </Link>
                                    </div>
                                    <span className="welcome-text">Chào mừng đến với cửa hàng hoa tươi của chúng tôi!</span>
                                </div>

                                <div className="user-actions">
                                    {/* Hiển thị liên kết đăng nhập/đăng ký nếu chưa đăng nhập */}
                                    {!token ? (
                                        <div className="auth-links">
                                            <Link to="/login" className="top-link login-link">
                                                <span>Đăng nhập</span>
                                            </Link>
                                            <span className="separator">|</span>
                                            <Link to="/register" className="top-link register-link">
                                                <span>Đăng ký</span>
                                            </Link>
                                        </div>
                                    ) : (
                                        /* Hiển thị dropdown người dùng nếu đã đăng nhập */
                                        <div className="user-dropdown" ref={this.dropdownRef}>
                                            <button
                                                className="user-dropdown-trigger"
                                                onClick={this.toggleDropdown}
                                                aria-expanded={isDropdownOpen}
                                                aria-haspopup="true"
                                            >
                                                <div className="user-avatar">
                                                    {customer?.name ? customer.name.charAt(0).toUpperCase() : 'K'}
                                                </div>
                                                <span className="user-name">{customer?.name || 'Khách hàng'}</span>
                                                <FaChevronDown className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`} />
                                            </button>
                                            <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                                                <div className="dropdown-header">
                                                    <div className="user-avatar-large">
                                                        {customer?.name ? customer.name.charAt(0).toUpperCase() : 'K'}
                                                    </div>
                                                    <div className="dropdown-user-info">
                                                        <span className="dropdown-user-name">{customer?.name || 'Khách hàng'}</span>
                                                        <span className="dropdown-user-email">{customer?.email || 'Chưa có email'}</span>
                                                    </div>
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <Link
                                                    to="/my-profile"
                                                    className="dropdown-item"
                                                    onClick={this.handleDropdownItemClick}
                                                >
                                                    <FaUser className="icon" />
                                                    <span>Tài khoản của tôi</span>
                                                </Link>
                                                <Link
                                                    to="/myorders"
                                                    className="dropdown-item"
                                                    onClick={this.handleDropdownItemClick}
                                                >
                                                    <FaShoppingCart className="icon" />
                                                    <span>Đơn hàng của tôi</span>
                                                </Link>
                                                <div className="dropdown-divider"></div>
                                                <button
                                                    onClick={this.handleLogout}
                                                    className="dropdown-item logout-item"
                                                    disabled={isLoggingOut}
                                                >
                                                    <FaSignOutAlt className="icon" />
                                                    <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Hiển thị số lượng sản phẩm yêu thích và giỏ hàng */}
                                    <div className="cart-wishlist">
                                        <Link to="/wishlist" className="top-link wishlist-link">
                                            <div className="icon-circle">
                                                <FaHeart className="icon" />
                                                <span className="wish-counter">{wishlistCount || 0}</span>
                                            </div>
                                            <span className="wishlist-text">Yêu thích</span>
                                        </Link>
                                        <Link to="/mycart" className="top-link cart-link">
                                            <div className="icon-circle">
                                                <FaShoppingCart className="icon" />
                                                <span className="cart-counter">{cartCount || 0}</span>
                                            </div>
                                            <span>Giỏ hàng</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần menu */}
                <div className={`menu-container ${stickyMenu ? 'sticky' : ''}`} ref={this.menuRef}>
                    {this.props.children}
                </div>

                {/* Tạo khoảng trống khi menu ở chế độ cố định */}
                {stickyMenu && <div className="menu-spacer"></div>}
            </div>
        );
    }
}

export default withRouter(Inform);