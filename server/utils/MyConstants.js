require('dotenv').config(); // Tải các biến môi trường từ file .env

// Đối tượng chứa các hằng số cấu hình quan trọng của ứng dụng
const MyConstants = {
    DB_SERVER: process.env.DB_SERVER || 'tranquytai.ggro6.mongodb.net',
    DB_USER: process.env.DB_USER || 'quytai', 
    DB_PASS: process.env.DB_PASS || 'quytai', 
    DB_DATABASE: process.env.DB_DATABASE || 'shoppingonline', 
    // EMAIL_USER: process.env.EMAIL_USER || 'floristaflowers@outlook.com.vn', // Thông tin người dùng email, được sử dụng cho dịch vụ email của Microsoft
    // EMAIL_PASS: process.env.EMAIL_PASS || 'Quytai0402', // Mật khẩu của người dùng email, dùng để xác thực khi gửi email
    JWT_SECRET: process.env.JWT_SECRET || '2087bbf9c34b611288fbab01036efc6b96ca3a7a86c7325c3f1d0dcb2d28ff43', // Chuỗi bí mật dùng để mã hóa và xác thực JSON Web Token (JWT)
    JWT_EXPIRES: process.env.JWT_EXPIRES || '30d' // Thời gian hiệu lực của JWT, mặc định là 30 ngày
};

// Nhập thư viện Cloudinary để quản lý lưu trữ và xử lý hình ảnh trên đám mây
const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary với thông tin đăng nhập
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'difebssvx', // Tên cloud của Cloudinary
  api_key: process.env.CLOUDINARY_API_KEY || '955527466741587', // Khóa API để xác thực với Cloudinary
  api_secret: process.env.CLOUDINARY_API_SECRET || 'aHxrCOP2szJybEzl2ioeVxpT8R0' // Mã bí mật API để xác thực với Cloudinary
});

// Xuất cả hai đối tượng để sử dụng trong ứng dụng
module.exports = { MyConstants, cloudinary };
