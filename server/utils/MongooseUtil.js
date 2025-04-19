const mongoose = require('mongoose'); 
const { MyConstants } = require('./MyConstants');

const uri = 'mongodb+srv://' + MyConstants.DB_USER + ':' + MyConstants.DB_PASS + '@' + MyConstants.DB_SERVER + '/' + MyConstants.DB_DATABASE;

// Kết nối đến MongoDB sử dụng chuỗi kết nối đã tạo
mongoose.connect(uri)
    .then(() => { 
        console.log('Đã kết nối thành công với MongoDB tại ' + MyConstants.DB_SERVER); 
        console.log('Cơ sở dữ liệu:', MyConstants.DB_DATABASE); 
    })
    .catch((err) => { 
        console.error('Lỗi kết nối MongoDB:', err); 
    });

mongoose.connection.on('error', (err) => {
    console.error('Lỗi kết nối MongoDB:', err);
});

module.exports = mongoose; 