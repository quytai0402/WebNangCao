const crypto = require('crypto'); // Nhập thư viện crypto của Node.js để sử dụng các chức năng mã hóa

// Đối tượng chứa các phương thức tiện ích mã hóa
const CryptoUtil = {
    // Phương thức tạo mã hash MD5 từ dữ liệu đầu vào
    md5(input) {
        const hash = crypto.createHash('md5').update(input).digest('hex'); // Tạo hash MD5 và chuyển thành chuỗi hex
        return hash; // Trả về chuỗi hash MD5
    }
};

module.exports = CryptoUtil; // Xuất đối tượng CryptoUtil để sử dụng trong ứng dụng