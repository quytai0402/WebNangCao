//// filepath: server/models/Counter.js
const mongoose = require('mongoose'); // Nhập thư viện mongoose để tương tác với MongoDB

// Định nghĩa schema cho bộ đếm
// Được sử dụng để tạo ID tự động tăng trong MongoDB
const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Định danh của bộ đếm, là một chuỗi bắt buộc
    seq: { type: Number, default: 0 } // Giá trị hiện tại của bộ đếm, mặc định là 0
});

module.exports = mongoose.model('Counter', CounterSchema); // Xuất model Counter để sử dụng trong các file khác