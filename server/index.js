require('dotenv').config(); // Nhập và cấu hình biến môi trường từ file .env
const express = require('express'); // Nhập thư viện express để xây dựng ứng dụng web
const bodyParser = require('body-parser'); // Nhập thư viện body-parser để phân tích dữ liệu trong request
const cors = require('cors'); // Nhập thư viện cors để quản lý Cross-Origin Resource Sharing
const app = express(); // Khởi tạo ứng dụng express
const PORT = process.env.PORT || 3000; // Lấy cổng từ biến môi trường hoặc mặc định là 3000

// Cấu hình CORS
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002', 
             'https://webnangcao-admin.onrender.com', 'https://webnangcao-customer.onrender.com'],
    credentials: true // Cho phép gửi cookie và thông tin xác thực
}));

// Sử dụng parser JSON với giới hạn tăng lên và loại bỏ các parser trùng lặp.
app.use(express.json({ limit: '100mb' })); // Thiết lập giới hạn kích thước cho dữ liệu JSON
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Thiết lập giới hạn kích thước cho dữ liệu URL-encoded

app.use(express.static('public')); // Phục vụ các tệp tĩnh từ thư mục 'public'

// Route mặc định cho health check
app.get('/', (req, res) => {
  res.json({ message: 'API is running successfully' });
});

// Định nghĩa các route API
const adminApi = require('./api/admin'); // Nhập các route quản trị viên từ file admin
app.use('/api/admin', adminApi); // Kết nối route '/api/admin' với adminApi
app.use('/api/customer', require('./api/customer')); // Kết nối route '/api/customer' với các route khách hàng
app.use('/api/chatgpt', require('./api/chatgpt')); // Kết nối route '/api/chatgpt' với các route chatgpt

// Route trực tiếp không qua /api
app.use('/admin', adminApi); // Kết nối route '/admin' với adminApi
app.use('/customer', require('./api/customer')); // Kết nối route '/customer' với các route khách hàng
app.use('/chatgpt', require('./api/chatgpt')); // Kết nối route '/chatgpt' với các route chatgpt

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
    console.error(err.stack); // In ra stack trace của lỗi
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' }); // Trả về phản hồi lỗi 500
});

// Xử lý lỗi 404 khi không tìm thấy route
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Không tìm thấy route' }); // Trả về phản hồi lỗi 404
});

// Bắt đầu lắng nghe yêu cầu trên cổng đã chỉ định
app.listen(PORT, () => {
    console.log(`Máy chủ đang chạy trên cổng ${PORT}`); // In ra thông báo máy chủ đang chạy
});
