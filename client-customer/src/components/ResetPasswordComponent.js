import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaKey, FaArrowLeft, FaArrowRight, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import { toast } from 'react-toastify';
import MyContext from '../contexts/MyContext';
import '../styles/ResetPasswordComponent.css';

class ResetPassword extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      token: '',
      newPassword: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      errorMessage: '',
      successMessage: '',
      isProcessing: false,
      mounted: false,
      redirect: false,
      redirectToHome: false,
      step: 1, // 1: request reset, 2: enter new password
      countdown: 0,
    };
  }

  componentDidMount() {
    // Check if user is already logged in
    if (this.context.token) {
      toast.info('Bạn đã đăng nhập rồi');
      this.setState({ redirectToHome: true });
      return;
    }

    // Extract token from URL if available
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    const email = queryParams.get('email');
    
    if (token && email) {
      this.setState({ 
        token,
        email,
        step: 2,
      });
      
      // Verify token validity
      this.verifyResetToken(token, email);
    }
    
    // Trigger animation after component mounts
    setTimeout(() => this.setState({ mounted: true }), 100);
  }
  
  verifyResetToken = async (token, email) => {
    try {
      this.setState({ isProcessing: true });
      
      const response = await axios.post('/api/customer/verify-reset-token', { 
        token, 
        email 
      });
      
      if (!response.data.valid) {
        this.setState({ 
          errorMessage: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
          isProcessing: false
        });
      } else {
        this.setState({ isProcessing: false });
      }
    } catch (error) {
      console.error('Error verifying reset token:', error);
      this.setState({ 
        errorMessage: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 
        isProcessing: false 
      });
    }
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ 
      [name]: value,
      errorMessage: '' // Clear error when user types
    });
  };
  
  togglePasswordVisibility = (field) => {
    this.setState(prevState => ({
      [field]: !prevState[field]
    }));
  };

  handleRequestReset = async (e) => {
    e.preventDefault();
    const { email } = this.state;
    
    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      this.setState({ errorMessage: 'Vui lòng nhập email hợp lệ' });
      return;
    }
    
    this.setState({ isProcessing: true, errorMessage: '', successMessage: '' });
    
    try {
      const response = await axios.post('/api/customer/request-password-reset', { email });
      
      if (response.data.success) {
        this.setState({ 
          successMessage: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn',
          countdown: 60
        });
        
        toast.success('Đã gửi email đặt lại mật khẩu!');
        
        // Start countdown
        this.startCountdown();
      } else {
        throw new Error(response.data.message || 'Không thể yêu cầu đặt lại mật khẩu');
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      
      let errorMessage = 'Đã xảy ra lỗi khi yêu cầu đặt lại mật khẩu';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      this.setState({ errorMessage });
      toast.error(errorMessage);
    } finally {
      this.setState({ isProcessing: false });
    }
  };
  
  startCountdown = () => {
    const timer = setInterval(() => {
      this.setState(prevState => {
        const newCount = prevState.countdown - 1;
        if (newCount <= 0) {
          clearInterval(timer);
          return { countdown: 0 };
        }
        return { countdown: newCount };
      });
    }, 1000);
  };

  handleResetPassword = async (e) => {
    e.preventDefault();
    const { email, token, newPassword, confirmPassword } = this.state;
    
    // Validate passwords
    if (!newPassword) {
      this.setState({ errorMessage: 'Vui lòng nhập mật khẩu mới' });
      return;
    }
    
    if (newPassword.length < 6) {
      this.setState({ errorMessage: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.setState({ errorMessage: 'Xác nhận mật khẩu không khớp' });
      return;
    }
    
    this.setState({ isProcessing: true, errorMessage: '', successMessage: '' });
    
    try {
      const response = await axios.post('/api/customer/reset-password', {
        email,
        token,
        newPassword
      });
      
      if (response.data.success) {
        this.setState({ 
          successMessage: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.',
          newPassword: '',
          confirmPassword: '',
          // Đánh dấu token đã sử dụng để người dùng không thể sử dụng lại
          token: 'used'  
        });
        
        toast.success('Đặt lại mật khẩu thành công!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.setState({ redirect: true });
        }, 3000);
        
        // Xóa các tham số trên URL để tránh sử dụng lại token
        window.history.replaceState({}, document.title, '/reset-password');
      } else {
        throw new Error(response.data.message || 'Không thể đặt lại mật khẩu');
      }
    } catch (error) {
      // Phần xử lý lỗi hiện tại
      console.error('Error resetting password:', error);
      
      let errorMessage = 'Đã xảy ra lỗi khi đặt lại mật khẩu';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      this.setState({ errorMessage });
      toast.error(errorMessage);
    } finally {
      this.setState({ isProcessing: false });
    }
  };

  renderRequestResetForm() {
    const { email, isProcessing, successMessage, countdown } = this.state;
    const isDisabled = isProcessing || countdown > 0;
    
    return (
      <form onSubmit={this.handleRequestReset} className="reset-form">
        <div className="reset-form-group">
          <label htmlFor="email" className="reset-label">
            Email của bạn
          </label>
          <div className="reset-input-group">
            <span className="reset-input-icon">
              <FaKey />
            </span>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Nhập email đã đăng ký"
              className="reset-input"
              value={email}
              onChange={this.handleInputChange}
              required
            />
          </div>
        </div>

        <div className="reset-button-container">
          <button
            type="submit"
            className={`reset-button ${isDisabled ? 'reset-button-disabled' : ''}`}
            disabled={isDisabled}
          >
            {isProcessing ? 'Đang xử lý...' : (
              countdown > 0 ? 
              `Gửi lại sau ${countdown}s` : 
              'Gửi yêu cầu đặt lại mật khẩu'
            )}
          </button>
        </div>

        {successMessage && (
          <div className="reset-success">
            <FaCheck className="success-icon" />
            {successMessage}
          </div>
        )}

        <div className="reset-login-link">
          <p>
            Đã nhớ mật khẩu?{' '}
            <Link to="/login" className="reset-link">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </form>
    );
  }

  renderResetPasswordForm() {
    const { newPassword, confirmPassword, showPassword, showConfirmPassword, isProcessing, successMessage } = this.state;
    
    return (
      <form onSubmit={this.handleResetPassword} className="reset-form">
        <div className="reset-form-group">
          <label htmlFor="newPassword" className="reset-label">
            Mật khẩu mới
          </label>
          <div className="reset-input-group">
            <span className="reset-input-icon">
              <FaLock />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              placeholder="Nhập mật khẩu mới"
              className="reset-input"
              value={newPassword}
              onChange={this.handleInputChange}
              required
              minLength="6"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => this.togglePasswordVisibility('showPassword')}
            >
              {showPassword ? <FaExclamationTriangle /> : <FaCheck />}
            </button>
          </div>
        </div>

        <div className="reset-form-group">
          <label htmlFor="confirmPassword" className="reset-label">
            Xác nhận mật khẩu
          </label>
          <div className="reset-input-group">
            <span className="reset-input-icon">
              <FaLock />
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              className="reset-input"
              value={confirmPassword}
              onChange={this.handleInputChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => this.togglePasswordVisibility('showConfirmPassword')}
            >
              {showConfirmPassword ? <FaExclamationTriangle /> : <FaCheck />}
            </button>
          </div>
        </div>

        <div className="reset-button-container">
          <button
            type="submit"
            className={`reset-button ${isProcessing ? 'reset-button-disabled' : ''}`}
            disabled={isProcessing}
          >
            {isProcessing ? 'Đang xử lý...' : (
              <>
                Đặt lại mật khẩu <FaArrowRight className="reset-button-icon" />
              </>
            )}
          </button>
        </div>

        {successMessage && (
          <div className="reset-success">
            <FaCheck className="success-icon" />
            {successMessage}
          </div>
        )}

        <div className="reset-login-link">
          <p>
            Đã nhớ mật khẩu?{' '}
            <Link to="/login" className="reset-link">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </form>
    );
  }

  render() {
    const { errorMessage, redirect, redirectToHome, step, mounted } = this.state;
    
    if (redirect) {
      return <Navigate to="/login" />;
    }
    
    // Redirect to home if user is logged in
    if (redirectToHome || this.context.token) {
      return <Navigate to="/" />;
    }
    
    const resetCardClass = `reset-card ${mounted ? 'reset-card-mounted' : ''}`;
    const stepTitle = step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu';
    const stepSubtitle = step === 1 
      ? 'Nhập email của bạn để yêu cầu đặt lại mật khẩu' 
      : 'Tạo mật khẩu mới cho tài khoản của bạn';

    return (
      <div className="reset-container">
        <div className={resetCardClass}>
          <div className="reset-card-inner">
            <div className="reset-header">
              <div className="reset-logo">
                <GiFlowerPot size={52} className="reset-logo-icon" />
              </div>
              <h2 className="reset-title">{stepTitle}</h2>
              <p className="reset-subtitle">
                {stepSubtitle}
              </p>
            </div>

            {errorMessage && (
              <div className="reset-error">
                {errorMessage}
              </div>
            )}

            {step === 1 ? this.renderRequestResetForm() : this.renderResetPasswordForm()}
          </div>
        </div>

        <div className="reset-decorations">
          <div className="reset-decoration reset-decoration-1"></div>
          <div className="reset-decoration reset-decoration-2"></div>
          <div className="reset-decoration reset-decoration-3"></div>
          <div className="reset-decoration reset-decoration-4"></div>
        </div>
      </div>
    );
  }
}

export default ResetPassword;