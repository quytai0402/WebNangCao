// Nhập thư viện axios để thực hiện các yêu cầu HTTP
import axios from 'axios';

// Tạo một instance mới của axios với cấu hình tùy chỉnh
const api = axios.create({
    baseURL: 'http://localhost:3000', // URL cơ sở cho tất cả các yêu cầu
    headers: {
        'Content-Type': 'application/json' // Thiết lập header Content-Type mặc định là JSON
    }
});

export default api; // Xuất instance axios đã được cấu hình để sử dụng trong ứng dụng