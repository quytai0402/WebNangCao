const MongooseUtil = require('../utils/MongooseUtil'); // Nhập thư viện MongooseUtil để kết nối MongoDB
const Models = require('./Models'); // Nhập các model dữ liệu từ file Models.js
const bcrypt = require('bcrypt'); // Nhập thư viện bcrypt để mã hóa mật khẩu

const AdminDAO = {
    // Đối tượng AdminDAO chứa các phương thức truy vấn liên quan đến quản trị viên (admin)
    async selectByUsernameAndPassword(username, password) {
        // Phương thức tìm kiếm admin theo tên đăng nhập và mật khẩu
        // Input: username - tên đăng nhập, password - mật khẩu
        // Output: đối tượng admin nếu tìm thấy và mật khẩu đúng, null nếu không tìm thấy
        const admin = await Models.Admin.findOne({ username: username }); // Tìm admin trong database theo username
        
        // Nếu tìm thấy admin, tiến hành xác thực mật khẩu
        if (admin) {
            // Kiểm tra tương thích ngược - xác thực nếu mật khẩu là văn bản thuần (chưa mã hóa)
            if (admin.password === password) {
                // Mã hóa mật khẩu văn bản thuần và cập nhật vào cơ sở dữ liệu
                const salt = await bcrypt.genSalt(10); // Tạo salt để mã hóa
                const hashedPassword = await bcrypt.hash(password, salt); // Mã hóa mật khẩu
                await Models.Admin.updateOne({ _id: admin._id }, { password: hashedPassword }); // Cập nhật mật khẩu đã mã hóa
                return admin; // Trả về thông tin admin
            }
            
            // Kiểm tra mật khẩu đã nhập có khớp với mật khẩu đã mã hóa trong database
            const isMatch = await bcrypt.compare(password, admin.password); // So sánh mật khẩu nhập vào với mật khẩu đã mã hóa
            if (isMatch) {
                return admin; // Trả về thông tin admin nếu mật khẩu đúng
            }
        }
        
        return null; // Trả về null nếu không tìm thấy admin hoặc mật khẩu không đúng
    }
};

module.exports = AdminDAO; // Xuất module AdminDAO để có thể sử dụng trong các file khác
