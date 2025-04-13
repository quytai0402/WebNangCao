import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import { 
  FaHome, 
  FaLeaf, 
  FaShoppingCart, 
  FaUsers, 
  FaSignOutAlt, 
  FaUserCircle,
  FaChartLine,
  FaComments
} from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Menu = () => {
  const context = React.useContext(MyContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    if (!context.token) {
      navigate('/', { replace: true });
    }
  }, [context.token, navigate]);

  const handleLogout = async (event) => {
    event.preventDefault();
    setIsLoggingOut(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      context.setToken('');
      context.setUsername('');
      toast.success('Đăng xuất thành công!');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { path: '/admin/', icon: <FaHome size={18} />, text: 'Trang Chủ' },
    { path: '/admin/category', icon: <FaLeaf size={18} />, text: 'Loại Hoa' },
    { path: '/admin/product', icon: <GiFlowerPot size={18} />, text: 'Sản Phẩm Hoa' },
    { path: '/admin/order', icon: <FaShoppingCart size={18} />, text: 'Đơn Hàng' },
    { path: '/admin/customer', icon: <FaUsers size={18} />, text: 'Khách Hàng' },
    { path: '/admin/comment', icon: <FaComments size={18} />, text: 'Bình Luận' },
    { path: '/admin/statistic', icon: <FaChartLine size={18} />, text: 'Thống Kê' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar" style={{
      width: '280px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
      color: 'white',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      {/* Logo Section */}
      <div className="sidebar-header mb-4">
        <Link to="/admin/" style={{ textDecoration: 'none', color: 'white' }}>
          <div className="d-flex align-items-center pb-4 border-bottom border-light border-opacity-25">
            <GiFlowerPot size={45} className="me-3 text-white-50" />
            <div>
              <h5 className="mb-0 fw-bold" style={{ fontSize: '1.1rem' }}>Flower Shop</h5>
              <small className="text-white-50">Quản Lý Cửa Hàng Hoa</small>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow-1">
        <ul className="nav flex-column gap-2">
          {menuItems.map((item, index) => (
            <li key={index} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link text-white d-flex align-items-center ${
                  isActive(item.path) ? 'active-menu-item' : ''
                }`}
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive(item.path) 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'transparent'
                }}
                onMouseEnter={e => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span className="me-3">{item.icon}</span>
                <span style={{ fontSize: '0.95rem' }}>{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile & Logout Section */}
      <div className="mt-auto border-top border-light border-opacity-25 pt-4">
        <div className="d-flex align-items-center mb-3">
          <FaUserCircle size={35} className="me-3 text-white-50" />
          <div>
            <h6 className="mb-0">Xin chào</h6>
            <strong>{context.username}</strong>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2"
          style={{
            borderRadius: '8px',
            padding: '0.8rem',
            transition: 'all 0.2s ease',
            fontWeight: '500',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#ff758c',
            border: 'none'
          }}
          disabled={isLoggingOut}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isLoggingOut ? (
            <>
              <Spinner animation="border" size="sm" />
              <span>Đang đăng xuất...</span>
            </>
          ) : (
            <>
              <FaSignOutAlt size={18} />
              <span>Đăng Xuất</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Menu;