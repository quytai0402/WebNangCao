import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUser, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import MyContext from '../contexts/MyContext';
import '../styles/LoginComponent.css';
import { toast } from 'react-toastify';
import withRouter from '../utils/withRouter';

class Login extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      txtUsername: '',
      txtPassword: '',
      redirect: false,
      errorMessage: '',
      isProcessing: false,
      mounted: false,
      showPassword: false,
      isLoading: false,
      redirectToHome: false
    };
  }

  componentDidMount() {
    const token = localStorage.getItem('token');
    const customerStr = localStorage.getItem('customer');

    // Set mounted state to trigger animation
    setTimeout(() => this.setState({ mounted: true }), 100);

    if (token && customerStr) {
      try {
        const customer = JSON.parse(customerStr);
        // Validate token with server
        this.validateToken(token).then(isValid => {
          if (isValid) {
            this.context.setToken(token);
            this.context.setCustomer(customer);
            this.setState({ redirect: true });
          } else {
            this.clearStorageAndContext();
          }
        });
      } catch (error) {
        console.error('Error parsing customer data:', error);
        this.clearStorageAndContext();
      }
    }
  }

  clearStorageAndContext = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    this.context.setToken(null);
    this.context.setCustomer(null);
  }

  // Validate token function
  validateToken = async (token) => {
    try {
      const response = await axios.get('/api/customer/validate-token', {
        headers: { 'x-access-token': token }
      });
      return response.data.valid === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ 
      [name]: value,
      errorMessage: '' // Clear error when user types
    });
  }

  btnLoginClick = async (e) => {
    e.preventDefault();
    const { txtUsername, txtPassword } = this.state;

    if (!txtUsername || !txtPassword) {
      this.setState({ errorMessage: 'Vui lòng nhập tên người dùng và mật khẩu' });
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const account = { 
      username: txtUsername.trim(), 
      password: txtPassword 
    };
    await this.apiLogin(account);
  }

  apiLogin = async (account) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.setState({ isProcessing: true, errorMessage: '' });

    try {
        const res = await axios.post('/api/customer/login', account);
        const result = res.data;

        if (result.success === true) {
            // Kiểm tra trạng thái tài khoản
            if (result.customer.status === 'inactive') {
                this.setState({ 
                    errorMessage: 'Tài khoản đã bị vô hiệu hóa',
                    isProcessing: false 
                });
                return;
            }

            // Kiểm tra xác thực email
            if (!result.customer.active) {
                this.setState({ 
                    errorMessage: 'Vui lòng xác thực email trước khi đăng nhập',
                    isProcessing: false 
                });
                return;
            }

            // Lưu thông tin đăng nhập
            localStorage.setItem('token', result.token);
            localStorage.setItem('customer', JSON.stringify(result.customer));

            // Cập nhật context
            this.context.setToken(result.token);
            this.context.setCustomer(result.customer);

            toast.success('Đăng nhập thành công!');
            this.setState({ redirect: true });
        } else {
            this.setState({ 
                errorMessage: result.message || 'Đăng nhập thất bại',
                isProcessing: false 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Lỗi đăng nhập';
        
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (!navigator.onLine) {
            errorMessage = 'Vui lòng kiểm tra kết nối mạng';
        }

        this.setState({
            errorMessage: errorMessage,
            isProcessing: false
        });
    }
};

  render() {
    if (this.state.redirect || this.context.token) {
      return <Navigate to="/" />;
    }

    if (this.state.redirectToHome) {
      return <Navigate replace to="/" />;
    }

    const loginCardClass = `login-card ${this.state.mounted ? 'login-card-mounted' : ''}`;

    return (
      <div className="login-container">
        <div className={loginCardClass}>
          <div className="login-card-inner">
            <div className="login-header">
              <div className="login-logo">
                <GiFlowerPot size={52} className="login-logo-icon" />
              </div>
              <h2 className="login-title">Đăng Nhập</h2>
              <p className="login-subtitle">
                Chào mừng quý khách đến với cửa hàng hoa của chúng tôi
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="login-error">
                {this.state.errorMessage}
              </div>
            )}

            <form onSubmit={this.handleSubmit} className="login-form">
              <div className="login-form-group">
                <label htmlFor="username" className="login-label">
                  Tên Đăng Nhập
                </label>
                <div className="login-input-group">
                  <span className="login-input-icon">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    id="username"
                    name="txtUsername"
                    placeholder="Nhập tên đăng nhập"
                    className="login-input"
                    value={this.state.txtUsername}
                    onChange={this.handleInputChange}
                    autoComplete="username"
                    disabled={this.state.isLoading}
                  />
                </div>
              </div>

              <div className="login-form-group">
                <label htmlFor="password" className="login-label">
                  Mật Khẩu
                </label>
                <div className="login-input-group">
                  <span className="login-input-icon">
                    <FaLock />
                  </span>
                  <div className="password-input-container">
                    <input
                      type={this.state.showPassword ? "text" : "password"}
                      id="password"
                      name="txtPassword"
                      placeholder="Nhập mật khẩu"
                      className="login-input"
                      value={this.state.txtPassword}
                      onChange={this.handleInputChange}
                      autoComplete="current-password"
                      disabled={this.state.isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={this.togglePasswordVisibility}
                      tabIndex="-1"
                    >
                      {this.state.showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quên mật khẩu link */}
              <div className="forgot-password-container">
                <Link to="/reset-password" className="forgot-password-link">
                  Quên mật khẩu?
                </Link>
              </div>

              <div className="login-button-container">
                <button
                  type="submit"
                  className={`reset-button ${this.state.isProcessing ? 'login-button-disabled' : ''}`}
                  disabled={this.state.isProcessing}
                >
                  {this.state.isProcessing ? 'Đang xử lý...' : (
                    <>
                      Đăng Nhập <FaArrowRight className="login-button-icon" />
                    </>
                  )}
                </button>
              </div>

              <div className="login-register-link">
                <p>
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="login-link">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="login-decorations">
          <div className="login-decoration login-decoration-1"></div>
          <div className="login-decoration login-decoration-2"></div>
          <div className="login-decoration login-decoration-3"></div>
          <div className="login-decoration login-decoration-4"></div>
        </div>
      </div>
    );
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ 
      [name]: value,
      errorMessage: '' // Clear error when user types
    });
  }

  togglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    
    // Set loading state
    this.setState({ isLoading: true, errorMessage: '' });

    const username = this.state.txtUsername.trim();
    const password = this.state.txtPassword;

    if (!username || !password) {
      this.setState({ 
        errorMessage: 'Vui lòng nhập đầy đủ thông tin đăng nhập',
        isLoading: false
      });
      return;
    }

    try {
      const response = await axios.post(`${this.context.apiUrl}/customer/login`, {
        username: username,
        password: password
      });
      
      const result = response.data;
      
      if (result.success) {
        // Store token in context
        this.context.setToken(result.token);
        this.context.setCustomer(result.customer);
        
        // Save to localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('customer', JSON.stringify(result.customer));
        
        // Show success message
        toast.success('Đăng nhập thành công!', {
          position: "top-center",
          autoClose: 1500,
        });
        
        // Redirect to home page
        setTimeout(() => {
          this.setState({ redirectToHome: true });
        }, 1500);
      } else {
        this.setState({ 
          errorMessage: result.message || 'Đăng nhập thất bại',
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMsg = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Tên đăng nhập hoặc mật khẩu không chính xác';
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.request) {
        errorMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn.';
      }
      
      this.setState({ 
        errorMessage: errorMsg,
        isLoading: false
      });
    }
  }
}

export default withRouter(Login);