require('dotenv').config();

const MyConstants = {
    DB_SERVER: 'tranquytai.ggro6.mongodb.net', // Địa chỉ máy chủ cơ sở dữ liệu MongoDB
    DB_USER: 'quytai', // Tên người dùng để đăng nhập vào cơ sở dữ liệu
    DB_PASS: 'quytai', // Mật khẩu của người dùng để đăng nhập vào cơ sở dữ liệu
    DB_DATABASE: 'shoppingonline', // Tên cơ sở dữ liệu sẽ sử dụng trong ứng dụng
    EMAIL_USER: 'floristaflowers@outlook.com.vn', // Thông tin người dùng email, được sử dụng cho dịch vụ email của Microsoft (ví dụ: Outlook, Hotmail)
    EMAIL_PASS: 'Quytai0402', // Mật khẩu của người dùng email, dùng để xác thực khi gửi email
    JWT_SECRET: '2087bbf9c34b611288fbab01036efc6b96ca3a7a86c7325c3f1d0dcb2d28ff43', // Chuỗi bí mật dùng để mã hóa và xác thực JSON Web Token (JWT)
    JWT_EXPIRES: '30d' // 
};

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'difebssvx',
  api_key: '955527466741587', 
  api_secret: 'aHxrCOP2szJybEzl2ioeVxpT8R0'
});



module.exports = cloudinary;
module.exports = MyConstants;
