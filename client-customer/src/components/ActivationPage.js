import React, { useEffect, useState } from 'react'; // Nhập các thư viện cần thiết từ React
import { useLocation, useNavigate } from 'react-router-dom'; // Nhập các hook để xử lý địa chỉ URL và điều hướng
import axios from 'axios'; // Nhập thư viện axios để thực hiện các yêu cầu HTTP
import { Container, Alert, Spinner } from 'react-bootstrap'; // Nhập các thành phần từ react-bootstrap

function ActivationPage() {
    const [status, setStatus] = useState('loading'); // Khởi tạo trạng thái với giá trị ban đầu là 'loading'
    const [message, setMessage] = useState(''); // Khởi tạo thông điệp rỗng
    const location = useLocation(); // Lấy đối tượng location của React Router
    const navigate = useNavigate(); // Lấy hàm điều hướng từ React Router

    useEffect(() => {
        const params = new URLSearchParams(location.search); // Tạo đối tượng URLSearchParams từ query string
        const token = params.get('token'); // Lấy giá trị của tham số 'token'
        const id = params.get('id'); // Lấy giá trị của tham số 'id'

        // Kiểm tra xem token và id có hợp lệ không
        if (!token || !id) {
            setStatus('error'); // Cập nhật trạng thái thành lỗi
            setMessage('Link kích hoạt không hợp lệ'); // Cập nhật thông điệp lỗi
            return; // Ngừng thực hiện nếu token hoặc id không hợp lệ
        }

        // Hàm kích hoạt tài khoản
        const activateAccount = async () => {
            try {
                const response = await axios.post('/api/customer/activate', { token, id }); // Gửi yêu cầu để kích hoạt tài khoản
                
                // Kiểm tra kết quả trả về từ server
                if (response.data.success) {
                    setStatus('success'); // Cập nhật trạng thái thành công
                    setMessage(response.data.message); // Cập nhật thông điệp thành công
                    setTimeout(() => navigate('/login'), 3000); // Chuyển hướng đến trang đăng nhập sau 3 giây
                } else {
                    setStatus('error'); // Cập nhật trạng thái thành lỗi
                    setMessage(response.data.message); // Cập nhật thông điệp lỗi
                }
            } catch (error) {
                // Bắt lỗi nếu có vấn đề xảy ra khi gửi yêu cầu
                setStatus('error'); // Cập nhật trạng thái thành lỗi
                setMessage('Có lỗi xảy ra khi kích hoạt tài khoản'); // Cập nhật thông điệp lỗi
            }
        };

        activateAccount(); // Gọi hàm kích hoạt tài khoản
    }, [location, navigate]); // Thực thi effect khi location hoặc navigate thay đổi

    return (
        <Container className="py-5"> {/* Khung chứa nội dung của trang */}
            {status === 'loading' && ( // Nếu trạng thái đang loading
                <div className="text-center">
                    <Spinner animation="border" /> {/* Hiển thị spinner khi đang chờ */}
                    <p className="mt-3">Đang kích hoạt tài khoản...</p> {/* Thông báo người dùng */}
                </div>
            )}
            
            {status === 'success' && ( // Nếu trạng thái thành công
                <Alert variant="success"> {/* Hiện thông báo thành công */}
                    <Alert.Heading>Thành công!</Alert.Heading>
                    <p>{message}</p> {/* Hiển thị thông điệp thành công */}
                    <p>Đang chuyển hướng đến trang đăng nhập...</p> {/* Thông báo về việc chuyển hướng */}
                </Alert>
            )}
            
            {status === 'error' && ( // Nếu trạng thái lỗi
                <Alert variant="danger"> {/* Hiện thông báo lỗi */}
                    <Alert.Heading>Có lỗi!</Alert.Heading>
                    <p>{message}</p> {/* Hiển thị thông điệp lỗi */}
                </Alert>
            )}
        </Container>
    );
}

export default ActivationPage; // Xuất component ActivationPage
