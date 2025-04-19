const jwt = require('jsonwebtoken'); // Nhập thư viện jsonwebtoken để xử lý JWT
const { MyConstants } = require('./MyConstants'); // Nhập các hằng số từ file MyConstants

// Đối tượng tiện ích để làm việc với JWT (JSON Web Token)
const JwtUtil = {
    // Tạo token JWT từ thông tin khách hàng
    genToken(customer) {
        // Tạo và ký token với thông tin username và _id của khách hàng
        const token = jwt.sign(
            { username: customer.username, _id: customer._id }, // Dữ liệu để mã hóa trong token
            MyConstants.JWT_SECRET, // Khóa bí mật để ký token
            { expiresIn: MyConstants.JWT_EXPIRES } // Thời gian hết hạn của token
        );
        return token; // Trả về token đã tạo
    },

    // Xác minh tính hợp lệ của token
    verifyToken(token) {
        try {
            return jwt.verify(token, MyConstants.JWT_SECRET); // Giải mã và xác minh token
        } catch (err) {
            throw err; // Ném lỗi nếu xác minh thất bại
        }
    },

    // Middleware kiểm tra token trong HTTP request
    checkToken(req, res, next) {
        try {
            // Lấy token từ header của request
            let token = req.headers['x-access-token'] || req.headers['authorization'];
            
            // Kiểm tra xem token có tồn tại không
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có token xác thực'
                });
            }

            // Loại bỏ tiền tố "Bearer " nếu có
            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length);
            }

            // Xác minh token
            jwt.verify(token, MyConstants.JWT_SECRET, (err, decoded) => {
                if (err) {
                    console.error('JWT verification error:', err.message); // Ghi log lỗi xác minh JWT
                    if (err.name === 'TokenExpiredError') {
                        return res.status(401).json({
                            success: false,
                            message: 'Token đã hết hạn, vui lòng đăng nhập lại'
                        });
                    }
                    return res.status(401).json({
                        success: false,
                        message: 'Token không hợp lệ'
                    });
                }
                
                // Lưu thông tin đã giải mã của token vào request và chuyển đến middleware tiếp theo
                req.jwtDecoded = decoded;
                next();
            });
        } catch (error) {
            console.error('Token validation error:', error); // Ghi log lỗi xác thực token
            return res.status(401).json({
                success: false,
                message: 'Lỗi xác thực: ' + error.message
            });
        }
    }
};

module.exports = JwtUtil; // Xuất đối tượng JwtUtil để sử dụng trong ứng dụng