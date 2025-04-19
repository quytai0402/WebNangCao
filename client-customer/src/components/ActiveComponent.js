import React, { Component } from 'react'; // Nhập thư viện React và Component từ React
import axios from 'axios'; // Nhập thư viện axios để thực hiện các yêu cầu HTTP
import { Navigate } from 'react-router-dom'; // Nhập component Navigate từ react-router-dom để điều hướng
import { toast } from 'react-toastify'; // Nhập thư viện toastify để hiển thị thông báo
import '../styles/ActiveComponent.css'; // Nhập file CSS cho component này
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; // Nhập biểu tượng từ react-icons

class Active extends Component {
  constructor(props) {
    super(props); // Gọi hàm khởi tạo của lớp cha
    this.state = {
      message: 'Đang kích hoạt tài khoản...', // Khởi tạo thông điệp mặc định
      isLoading: true, // Trạng thái loading ban đầu là true
      isSuccess: false, // Trạng thái thành công ban đầu là false
      redirect: false // Cờ để xác định có cần điều hướng hay không
    };
  }

  componentDidMount() {
    // Hàm này sẽ được gọi ngay sau khi component được gắn vào DOM

    // Lấy token và id từ URL
    const urlParams = new URLSearchParams(window.location.search); // Tạo đối tượng URLSearchParams từ query string
    const token = urlParams.get('token'); // Lấy giá trị tham số 'token'
    const id = urlParams.get('id'); // Lấy giá trị tham số 'id'
    
    // Kiểm tra nếu token hoặc id không hợp lệ
    if (!token || !id) {
      this.setState({
        message: 'Link kích hoạt không hợp lệ.', // Cập nhật thông điệp lỗi
        isLoading: false // Cập nhật trạng thái loading thành false
      });
      return; // Ngừng thực thi
    }

    // Gửi yêu cầu API để kích hoạt tài khoản
    axios.post(`${this.context.apiUrl}/customer/activate`, { token, id })
      .then(response => {
        // Xử lý phản hồi từ server
        if (response.data.success) {
          this.setState({
            message: 'Kích hoạt tài khoản thành công!', // Cập nhật thông điệp thành công
            isLoading: false, // Cập nhật trạng thái loading thành false
            isSuccess: true // Cập nhật trạng thái thành công thành true
          });
          
          toast.success('Tài khoản đã được kích hoạt thành công!'); // Hiển thị thông báo thành công
          
          // Điều hướng đến trang đăng nhập sau 3 giây
          setTimeout(() => {
            this.setState({ redirect: true }); // Cập nhật cờ redirect để thực hiện điều hướng
          }, 3000);
        } else {
          // Nếu kích hoạt thất bại
          this.setState({
            message: response.data.message || 'Kích hoạt tài khoản thất bại.', // Cập nhật thông điệp lỗi
            isLoading: false // Cập nhật trạng thái loading thành false
          });
          toast.error(response.data.message || 'Kích hoạt tài khoản thất bại.'); // Hiển thị thông báo lỗi
        }
      })
      .catch(error => {
        // Bắt lỗi nếu có sự cố xảy ra trong quá trình gửi yêu cầu
        console.error('Error activating account:', error); // In lỗi ra console
        this.setState({
          message: 'Đã xảy ra lỗi khi kích hoạt tài khoản.', // Cập nhật thông điệp lỗi
          isLoading: false // Cập nhật trạng thái loading thành false
        });
        toast.error('Đã xảy ra lỗi khi kích hoạt tài khoản.'); // Hiển thị thông báo lỗi
      });
  }

  render() {
    // Hàm render để hiển thị giao diện
    if (this.state.redirect) {
      return <Navigate to="/login" />; // Nếu cần điều hướng, trả về component Navigate
    }
    
    return (
      <div className="activate-container"> {/* Khung chứa component */}
        <div className="activate-card"> {/* Thẻ card chứa nội dung */}
          <h2>Kích Hoạt Tài Khoản</h2>
          
          {this.state.isLoading ? ( // Nếu đang loading
            <div className="loading">
              <div className="spinner"></div> {/* Hiển thị spinner */}
              <p>{this.state.message}</p> {/* Hiển thị thông điệp */}
            </div>
          ) : (
            <div className="result">{/* Kết quả của việc kích hoạt */}
              {this.state.isSuccess ? ( // Nếu kích hoạt thành công
                <div className="success-message">
                  <FaCheckCircle size={60} className="success-icon" /> {/* Biểu tượng thành công */}
                  <p>{this.state.message}</p> {/* Hiển thị thông điệp thành công */}
                  <p>Bạn sẽ được chuyển đến trang đăng nhập trong vài giây...</p> {/* Thông báo chuyển hướng */}
                </div>
              ) : (
                <div className="error-message">{/* Nếu có lỗi xảy ra */}
                  <FaTimesCircle size={60} className="error-icon" /> {/* Biểu tượng lỗi */}
                  <p>{this.state.message}</p> {/* Hiển thị thông điệp lỗi */}
                  <button 
                    onClick={() => this.setState({ redirect: true })} // Khi nút được nhấn, thiết lập cờ redirect
                    className="redirect-button"
                  >
                    Quay lại đăng nhập {/* Nút quay lại đăng nhập */}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Active; // Xuất class Active để sử dụng
