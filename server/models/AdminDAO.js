const MongooseUtil = require('../utils/MongooseUtil'); // Nhập thư viện MongooseUtil từ thư mục utils
const Models = require('./Models'); // Nhập các model từ file Models
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

const AdminDAO = {
    // Đối tượng AdminDAO để quản lý các truy vấn liên quan đến quản trị viên
    async selectByUsernameAndPassword(username, password) {
        // Hàm bất đồng bộ để chọn quản trị viên theo tên người dùng
        const admin = await Models.Admin.findOne({ username: username }); // Tìm một quản trị viên trong cơ sở dữ liệu theo username
        
        // If admin is found, verify password
        if (admin) {
            // For backwards compatibility - check if it's a plain text password
            if (admin.password === password) {
                // Hash the plain text password and update it in the database
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                await Models.Admin.updateOne({ _id: admin._id }, { password: hashedPassword });
                return admin;
            }
            
            // Check if the password matches the hashed password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                return admin;
            }
        }
        
        return null; // Return null if no match found
    }
};

module.exports = AdminDAO; // Xuất đối tượng AdminDAO để sử dụng ở nơi khác
