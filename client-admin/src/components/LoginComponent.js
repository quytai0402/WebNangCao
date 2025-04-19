import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import { Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
// Thêm những import cho biểu tượng
import { FaUser, FaLock } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';


class Login extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      txtUsername: '',
      txtPassword: '',
      redirect: false,
      errorMessage: ''
    };
  }

  componentDidMount() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      this.context.setToken(token);
      this.context.setUsername(username);
    }
  }

  render() {
    if (this.state.redirect || this.context.token !== '') {
      return <Navigate to="/admin" />;
    }

    return (
      <div className="d-flex align-items-center justify-content-center vh-100"
        style={{
          background: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
          fontFamily: "'Poppins', sans-serif"
        }}>
        <div className="card shadow-lg" style={{
          width: '28rem',
          borderRadius: '20px',
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(255, 117, 140, 0.2)'
        }}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="mb-4">
                <GiFlowerPot size={80} style={{ color: '#ff758c' }} />
              </div>
              <h2 className="card-title" style={{
                fontWeight: '800',
                color: '#ff758c',
                fontSize: '2rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Flower Shop Admin</h2>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Chào mừng đến với trang quản lý cửa hàng hoa
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="alert" style={{
                borderRadius: '12px',
                fontSize: '0.9rem',
                border: 'none',
                backgroundColor: 'rgba(255, 117, 140, 0.1)',
                color: '#ff758c',
                padding: '1rem'
              }}>
                {this.state.errorMessage}
              </div>
            )}

            <form onSubmit={(e) => this.btnLoginClick(e)}>
              <div className="mb-4">
                <label htmlFor="username" className="form-label" style={{
                  color: '#ff758c',
                  fontWeight: '600'
                }}>Tên Đăng Nhập</label>
                <div className="input-group">
                  <span className="input-group-text" style={{
                    background: 'transparent',
                    borderRight: 'none',
                    color: '#ff758c'
                  }}>
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    placeholder="Nhập tên đăng nhập"
                    style={{
                      borderRadius: '12px',
                      padding: '12px',
                      borderLeft: 'none',
                      boxShadow: 'none',
                      fontSize: '0.9rem'
                    }}
                    value={this.state.txtUsername}
                    onChange={(e) => this.setState({ txtUsername: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label" style={{
                  color: '#ff758c',
                  fontWeight: '600'
                }}>Mật Khẩu</label>
                <div className="input-group">
                  <span className="input-group-text" style={{
                    background: 'transparent',
                    borderRight: 'none',
                    color: '#ff758c'
                  }}>
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Nhập mật khẩu"
                    style={{
                      borderRadius: '12px',
                      padding: '12px',
                      borderLeft: 'none',
                      boxShadow: 'none',
                      fontSize: '0.9rem'
                    }}
                    value={this.state.txtPassword}
                    onChange={(e) => this.setState({ txtPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-grid gap-2 mt-5">
                <button
                  type="submit"
                  className="btn btn-lg"
                  style={{
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(255, 117, 140, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(255, 117, 140, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(255, 117, 140, 0.2)';
                  }}
                >
                  Đăng Nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  btnLoginClick(e) {
    e.preventDefault();
    const { txtUsername, txtPassword } = this.state;
    if (txtUsername && txtPassword) {
      const account = { username: txtUsername, password: txtPassword };
      this.apiLogin(account);
    } else {
      this.setState({ errorMessage: 'Vui lòng nhập tên người dùng và mật khẩu' });
    }
  }

  async apiLogin(account) {
    try {
      console.log('Logging in with account:', account.username);
      console.log('API URL from context:', this.context.apiUrl);
      const apiUrl = `${this.context.apiUrl}/admin/login`;
      console.log('Using API URL:', apiUrl);
      
      // Add CORS headers for debugging
      const res = await axios.post(apiUrl, account, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = res.data;
      
      console.log('Login response:', result);
      
      if (result.success === true) {
        console.log('Login successful, token:', result.token);
        this.context.setToken(result.token);
        this.context.setUsername(account.username);
        this.setState({ redirect: true });
      } else {
        console.log('Login failed:', result.message);
        this.setState({ errorMessage: result.message });
      }
    } catch (error) {
      console.error('Lỗi Đăng Nhập:', error);
      this.setState({ errorMessage: `Lỗi Mạng: ${error.message}. Kiểm tra kết nối với máy chủ.` });
    }
  }
}

export default Login;
