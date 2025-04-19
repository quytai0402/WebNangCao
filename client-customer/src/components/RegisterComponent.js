import React, { Component } from 'react';
import axios from 'axios';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaArrowLeft, FaArrowRight, FaEye, FaEyeSlash, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/RegisterComponent.css';
import MyContext from '../contexts/MyContext';

// Lấy URL API từ biến môi trường
const API_URL = process.env.REACT_APP_API_URL || 'https://webnangcao-api.onrender.com/api';

// Hàm debounce để giới hạn số lần gọi API
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

class Register extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            txtFullname: '',
            txtPhone: '',
            txtUsername: '',
            txtPassword: '',
            txtConfirmPassword: '',
            txtEmail: '',
            errorMessage: '',
            successMessage: '',
            isProcessing: false,
            mounted: false,
            showPassword: false,
            showConfirmPassword: false,
            isCheckingPhone: false,
            phoneValid: false,
            validationErrors: {
                txtFullname: '',
                txtPhone: '',
                txtUsername: '',
                txtPassword: '',
                txtConfirmPassword: '',
                txtEmail: ''
            },
            isRegistered: false,
            isLoading: false
        };
        
        // Tạo debounced version của các hàm kiểm tra
        this.debouncedCheckPhone = debounce(this.checkPhoneExists, 500);
    }

    componentDidMount() {
        // Trigger animation after component mounts
        setTimeout(() => this.setState({ mounted: true }), 100);
        
        // Thêm interceptor để xử lý lỗi mạng
        this.axiosInterceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.code === 'ECONNABORTED') {
                    console.error('Request timeout:', error);
                } else if (!error.response) {
                    console.error('Network error:', error);
                }
                return Promise.reject(error);
            }
        );
    }
    
    componentDidUpdate(prevProps, prevState) {
        // Nếu có thông báo lỗi mới và khác với thông báo lỗi trước đó
        if (this.state.errorMessage && this.state.errorMessage !== prevState.errorMessage) {
            // Tìm phần tử chứa thông báo lỗi
            const errorElement = document.querySelector('.register-error');
            if (errorElement) {
                // Cuộn để hiển thị thông báo lỗi trong tầm nhìn (với một khoảng cách đệm)
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    componentWillUnmount() {
        // Xóa interceptor khi component unmount
        axios.interceptors.response.eject(this.axiosInterceptor);
    }

    validateField = (name, value) => {
        let error = '';
        
        switch (name) {
            case 'txtFullname':
                if (value.trim().length < 2) {
                    error = 'Họ tên phải có ít nhất 2 ký tự';
                } else if (!/^[A-Za-zÀ-ỹ\s]+$/.test(value)) {
                    error = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
                }
                break;
                
            case 'txtPhone':
                if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(value)) {
                    error = 'Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 03, 05, 07, 08, 09)';
                }
                break;
                
            case 'txtEmail':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Email không hợp lệ';
                }
                break;
                
            case 'txtUsername':
                if (value.length < 4) {
                    error = 'Tên đăng nhập phải có ít nhất 4 ký tự';
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    error = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
                }
                break;
                
            case 'txtPassword':
                if (value.length < 6) {
                    error = 'Mật khẩu phải có ít nhất 6 ký tự';
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                    error = 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
                }
                break;
                
            case 'txtConfirmPassword':
                if (value !== this.state.txtPassword) {
                    error = 'Mật khẩu xác nhận không khớp';
                }
                break;
                
            default:
                break;
        }
        
        return error;
    }

    handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Cập nhật giá trị vào state
        this.setState({ [name]: value }, () => {
            // Xử lý đặc biệt cho trường số điện thoại
            if (name === 'txtPhone') {
                const phoneError = this.validateField('txtPhone', value);
                
                // Reset trạng thái nếu số điện thoại thay đổi hoặc không hợp lệ
                if (value.length !== 10 || phoneError) {
                    this.setState({ 
                        phoneValid: false, 
                        isCheckingPhone: false,
                        validationErrors: {
                            ...this.state.validationErrors,
                            txtPhone: phoneError
                        }
                    });
                } 
                // Kiểm tra khi nhập đủ 10 số và không có lỗi định dạng
                else if (value.length === 10 && !phoneError) {
                    this.debouncedCheckPhone(value);
                }
            } 
            // Xử lý đặc biệt cho trường email
            else if (name === 'txtEmail') {
                const emailError = this.validateField('txtEmail', value);
                
                // Reset trạng thái nếu email thay đổi hoặc không hợp lệ
                if (emailError) {
                    this.setState({ 
                        validationErrors: {
                            ...this.state.validationErrors,
                            txtEmail: emailError
                        }
                    });
                } 
                // Kiểm tra khi email hợp lệ và có đủ định dạng
                else if (!emailError && value.includes('@') && value.includes('.')) {
                    // Kiểm tra email tồn tại
                    this.checkEmailExists(value);
                }
            }
            else {
                // Xử lý cho các trường khác
                const error = this.validateField(name, value);
                
                this.setState(prevState => ({
                    validationErrors: {
                        ...prevState.validationErrors,
                        [name]: error
                    }
                }));
                
                // Xử lý đặc biệt khi password thay đổi
                if (name === 'txtPassword') {
                    const confirmError = this.validateField('txtConfirmPassword', this.state.txtConfirmPassword);
                    this.setState(prevState => ({
                        validationErrors: {
                            ...prevState.validationErrors,
                            txtConfirmPassword: confirmError
                        }
                    }));
                }
            }
        });
    }
    
    // Hàm kiểm tra số điện thoại đã tồn tại hay chưa
    checkPhoneExists = async (phone) => {
        try {
            console.log('Đang kiểm tra số điện thoại:', phone);
            
            // Cập nhật trạng thái đang kiểm tra
            this.setState({ 
                isCheckingPhone: true,
                phoneValid: false,
                validationErrors: {
                    ...this.state.validationErrors,
                    txtPhone: 'Đang kiểm tra số điện thoại...'
                }
            });
            
            // Gọi API kiểm tra số điện thoại với timeout
            const res = await axios.post(`${API_URL}/customer/check-phone`, { phone }, { timeout: 5000 });
            console.log('Kết quả kiểm tra số điện thoại:', res.data);
            
            // Nếu API không trả về success, coi như có lỗi
            if (!res.data || res.data.success !== true) {
                throw new Error('API không trả về dữ liệu hợp lệ');
            }
            
            // Cập nhật state dựa trên kết quả từ server
            if (res.data.exists) {
                // Nếu số điện thoại đã tồn tại và đã đăng ký
                console.log('Số điện thoại đã đăng ký');
                this.setState({ 
                    isCheckingPhone: false,
                    phoneValid: false,
                    validationErrors: {
                        ...this.state.validationErrors,
                        txtPhone: 'Số điện thoại này đã được đăng ký'
                    }
                });
            } else {
                // Nếu số điện thoại chưa đăng ký (có thể là khách vãng lai hoặc mới hoàn toàn)
                console.log('Số điện thoại hợp lệ, có thể sử dụng');
                this.setState({ 
                    isCheckingPhone: false,
                    phoneValid: true,
                    validationErrors: {
                        ...this.state.validationErrors,
                        txtPhone: ''
                    }
                });
            }
        } catch (error) {
            // Xử lý lỗi - đặt thông báo lỗi chung
            console.error('Lỗi kiểm tra số điện thoại:', error);
            this.setState({ 
                isCheckingPhone: false,
                phoneValid: false,
                validationErrors: {
                    ...this.state.validationErrors,
                    txtPhone: 'Không thể kiểm tra số điện thoại, vui lòng thử lại sau'
                }
            });
            
            // Hiển thị toast thông báo
            toast.error('Không thể kiểm tra số điện thoại, vui lòng thử lại sau');
        }
    }

    // Hàm kiểm tra email đã tồn tại hay chưa
    checkEmailExists = (email) => {
        // Chỉ kiểm tra định dạng email
        const emailError = this.validateField('txtEmail', email);
        this.setState({
            validationErrors: {
                ...this.state.validationErrors,
                txtEmail: emailError
            }
        });
    }
    
    // Hàm thử lại kiểm tra số điện thoại
    retryCheckPhone = () => {
        const phone = this.state.txtPhone;
        if (phone && phone.length === 10) {
            this.checkPhoneExists(phone);
        }
    }

    validateForm = () => {
        let isValid = true;
        const newValidationErrors = {};
        
        // Validate each field
        Object.keys(this.state).forEach(key => {
            if (['txtFullname', 'txtPhone', 'txtUsername', 'txtPassword', 'txtConfirmPassword', 'txtEmail'].includes(key)) {
                const error = this.validateField(key, this.state[key]);
                newValidationErrors[key] = error;
                
                if (error) {
                    isValid = false;
                }
            }
        });
        
        // Kiểm tra nếu số điện thoại đang kiểm tra hoặc đã có lỗi
        if (this.state.isCheckingPhone) {
            newValidationErrors.txtPhone = 'Vui lòng đợi kiểm tra số điện thoại hoàn tất';
            isValid = false;
        } else if (this.state.validationErrors.txtPhone && this.state.validationErrors.txtPhone.includes('đã được đăng ký')) {
            newValidationErrors.txtPhone = this.state.validationErrors.txtPhone;
            isValid = false;
        }
        
        // Update all validation errors
        this.setState({ validationErrors: newValidationErrors });
        
        return isValid;
    }

    btnRegisterClick = (e) => {
        e.preventDefault();

        // Validate all fields
        if (!this.validateForm()) {
            this.setState({ errorMessage: 'Vui lòng điền đúng thông tin vào tất cả các trường' });
            // Scroll to error message
            setTimeout(() => {
                const errorElement = document.querySelector('.register-error');
                if (errorElement) {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
    
        const { txtUsername, txtPassword, txtFullname, txtPhone, txtEmail } = this.state;
        
        if (txtUsername && txtPassword && txtFullname && txtPhone && txtEmail) {
            const account = {
                username: txtUsername,
                password: txtPassword,
                name: txtFullname,
                phone: txtPhone,
                email: txtEmail
            };
            this.apiRegister(account);
        } else {
            this.setState({ errorMessage: 'Vui lòng nhập đầy đủ thông tin' });
        }
    }

    async apiRegister(account) {
        // Xóa dòng scroll ở đây để giữ vị trí cuộn
        this.setState({ isProcessing: true, errorMessage: '' });
        
        try {
            const res = await axios.post(`${API_URL}/customer/register`, account);
            const result = res.data;
            if (result.success === true) {
                // Chỉ cuộn lên đầu khi đăng ký thành công
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                toast.success('Đăng ký thành công!');
                
                this.setState({
                    successMessage: result.message,
                    errorMessage: '',
                    // Clear form after successful registration
                    txtFullname: '',
                    txtPhone: '',
                    txtUsername: '',
                    txtPassword: '',
                    txtConfirmPassword: '',
                    txtEmail: '',
                    validationErrors: {
                        txtFullname: '',
                        txtPhone: '',
                        txtUsername: '',
                        txtPassword: '',
                        txtConfirmPassword: '',
                        txtEmail: ''
                    },
                    isRegistered: true
                });
            } else {
                this.setState({
                    errorMessage: result.message || 'Đăng ký thất bại, vui lòng thử lại',
                    successMessage: ''
                });
                
                // Hiển thị toastr cho các lỗi cụ thể
                if (result.message.includes('số điện thoại')) {
                    toast.error('Số điện thoại đã được đăng ký!');
                } else if (result.message.includes('tên đăng nhập')) {
                    toast.error('Tên đăng nhập đã tồn tại!');
                } else if (result.message.includes('email')) {
                    toast.error('Email đã được sử dụng!');
                } else {
                    toast.error(result.message || 'Đăng ký thất bại, vui lòng thử lại');
                }
            }
        } catch (error) {
            let errorMessage = 'Lỗi Mạng: Kiểm tra kết nối với máy chủ.';
    
            if (error.response) {
                errorMessage = error.response.data.message || 'Lỗi từ máy chủ, vui lòng thử lại sau.';
            } else if (error.request) {
                errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
            }
    
            this.setState({
                errorMessage: errorMessage,
                successMessage: ''
            });
            toast.error(errorMessage);
            console.error('Registration Error:', error);
        } finally {
            this.setState({ isProcessing: false });
        }
    }

    // Hàm bật/tắt hiển thị mật khẩu
    togglePasswordVisibility = (field) => {
        if (field === 'password') {
            this.setState(prevState => ({ showPassword: !prevState.showPassword }));
        } else if (field === 'confirmPassword') {
            this.setState(prevState => ({ showConfirmPassword: !prevState.showConfirmPassword }));
        }
    }

    render() {
        // Nếu người dùng đã đăng nhập, điều hướng về trang chủ
        if (this.context.token) {
            return <Navigate replace to='/home' />;
        }

        // Nếu đã đăng ký thành công, điều hướng về trang đăng nhập
        if (this.state.isRegistered) {
            return <Navigate replace to='/login' />;
        }

        const registerCardClass = `register-card ${this.state.mounted ? 'register-card-mounted' : ''}`;
        const { validationErrors } = this.state;
        
        return (
            <div className="register-container">
                <div className={registerCardClass}>
                    <div className="register-card-body">
                        <div className="register-header">
                            <div className="header-content">
                                <div className="logo-container">
                                    <div className="logo-circle">
                                        <FaUser />
                                    </div>
                                </div>
                                <h2 className="register-title">Đăng Ký Tài Khoản</h2>
                                <p className="register-subtitle">Tạo tài khoản để trải nghiệm dịch vụ của chúng tôi</p>
                            </div>
                        </div>

                        {(this.state.errorMessage || this.state.successMessage) && (
                            <div className={`register-message ${this.state.errorMessage ? 'register-error' : 'register-success'}`}>
                                <div className="message-content">
                                    {this.state.errorMessage || this.state.successMessage}
                                </div>
                            </div>
                        )}

                        <form onSubmit={this.btnRegisterClick} className="register-form">
                            <div className="form-grid">
                                <div className="form-section">
                                    <h3 className="section-title">Thông tin cá nhân</h3>
                                    <div className="register-form-group">
                                        <label htmlFor="fullname" className="register-label">Họ và Tên</label>
                                        <div className="register-input-group">
                                            <span className="register-input-icon">
                                                <FaUser />
                                            </span>
                                            <input
                                                type="text"
                                                id="fullname"
                                                name="txtFullname"
                                                placeholder="Nhập họ và tên"
                                                className={`register-input ${validationErrors.txtFullname ? 'input-error' : ''}`}
                                                value={this.state.txtFullname}
                                                onChange={this.handleInputChange}
                                                required
                                            />
                                        </div>
                                        {validationErrors.txtFullname && (
                                            <div className="validation-error">{validationErrors.txtFullname}</div>
                                        )}
                                    </div>

                                    <div className="register-form-group">
                                        <label htmlFor="phone" className="register-label">Số Điện Thoại</label>
                                        <div className="register-input-group">
                                            <span className="register-input-icon">
                                                <FaPhone />
                                            </span>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="txtPhone"
                                                placeholder="Nhập số điện thoại"
                                                className={`register-input ${validationErrors.txtPhone ? 'input-error' : ''}`}
                                                value={this.state.txtPhone}
                                                onChange={this.handleInputChange}
                                                required
                                            />
                                        </div>
                                        {validationErrors.txtPhone && !this.state.isCheckingPhone && (
                                            <div className="validation-error">
                                                {validationErrors.txtPhone}
                                            </div>
                                        )}
                                        {this.state.phoneValid && !validationErrors.txtPhone && this.state.txtPhone && this.state.txtPhone.length === 10 && (
                                            <div className="validation-success">Số điện thoại hợp lệ và có thể sử dụng</div>
                                        )}
                                        {this.state.isCheckingPhone && (
                                            <div className="validation-checking">
                                                <span className="checking-spinner"></span> Đang kiểm tra...
                                            </div>
                                        )}
                                    </div>

                                    <div className="register-form-group">
                                        <label htmlFor="email" className="register-label">Email</label>
                                        <div className="register-input-group">
                                            <span className="register-input-icon">
                                                <FaEnvelope />
                                            </span>
                                            <input
                                                type="email"
                                                id="email"
                                                name="txtEmail"
                                                placeholder="Nhập email"
                                                className={`register-input ${validationErrors.txtEmail ? 'input-error' : ''}`}
                                                value={this.state.txtEmail}
                                                onChange={this.handleInputChange}
                                                required
                                            />
                                        </div>
                                        {validationErrors.txtEmail && (
                                            <div className="validation-error">
                                                {validationErrors.txtEmail}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 className="section-title">Thông tin tài khoản</h3>
                                    <div className="register-form-group">
                                        <label htmlFor="username" className="register-label">Tên Đăng Nhập</label>
                                        <div className="register-input-group">
                                            <span className="register-input-icon">
                                                <FaUser />
                                            </span>
                                            <input
                                                type="text"
                                                id="username"
                                                name="txtUsername"
                                                placeholder="Nhập tên đăng nhập"
                                                className={`register-input ${validationErrors.txtUsername ? 'input-error' : ''}`}
                                                value={this.state.txtUsername}
                                                onChange={this.handleInputChange}
                                                required
                                            />
                                        </div>
                                        {validationErrors.txtUsername && (
                                            <div className="validation-error">{validationErrors.txtUsername}</div>
                                        )}
                                    </div>

                                    <div className="register-form-group">
                                        <label htmlFor="password" className="register-label">Mật Khẩu</label>
                                        <div className="register-input-group">
                                            <span className="register-input-icon">
                                                <FaLock />
                                            </span>
                                            <input
                                                type={this.state.showPassword ? "text" : "password"}
                                                id="password"
                                                name="txtPassword"
                                                placeholder="Nhập mật khẩu"
                                                className={`register-input ${validationErrors.txtPassword ? 'input-error' : ''}`}
                                                value={this.state.txtPassword}
                                                onChange={this.handleInputChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password-button"
                                                onClick={() => this.togglePasswordVisibility('password')}
                                            >
                                                {this.state.showPassword ? <FaEye /> : <FaEyeSlash />}
                                            </button>
                                        </div>
                                        {validationErrors.txtPassword && (
                                            <div className="validation-error">{validationErrors.txtPassword}</div>
                                        )}
                                    </div>

                                    <div className="register-form-group">
                                        <label htmlFor="confirmPassword" className="register-label">Xác Nhận Mật Khẩu</label>
                                        <div className="register-input-group">
                                            <span className="register-input-icon">
                                                <FaLock />
                                            </span>
                                            <input
                                                type={this.state.showConfirmPassword ? "text" : "password"}
                                                id="confirmPassword"
                                                name="txtConfirmPassword"
                                                placeholder="Nhập lại mật khẩu"
                                                className={`register-input ${validationErrors.txtConfirmPassword ? 'input-error' : ''}`}
                                                value={this.state.txtConfirmPassword}
                                                onChange={this.handleInputChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password-button"
                                                onClick={() => this.togglePasswordVisibility('confirmPassword')}
                                            >
                                                {this.state.showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                                            </button>
                                        </div>
                                        {validationErrors.txtConfirmPassword && (
                                            <div className="validation-error">{validationErrors.txtConfirmPassword}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="register-actions">
                                <Link to="/login" className="back-to-login">
                                    <FaArrowLeft className="back-icon" /> Quay về đăng nhập
                                </Link>
                                
                                <button
                                    type="submit"
                                    className={`register-button ${this.state.isProcessing ? 'register-button-disabled' : ''}`}
                                    disabled={this.state.isProcessing}
                                >
                                    {this.state.isProcessing ? 'Đang xử lý...' : (
                                        <>
                                            Đăng Ký Ngay <FaArrowRight className="register-button-icon" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="register-decorations">
                    <div className="register-decoration register-decoration-1"></div>
                    <div className="register-decoration register-decoration-2"></div>
                    <div className="register-decoration register-decoration-3"></div>
                    <div className="register-decoration register-decoration-4"></div>
                </div>
            </div>
        );
    }
}

export default Register;






