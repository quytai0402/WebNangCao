const jwt = require('jsonwebtoken');
const { MyConstants } = require('./MyConstants');

const JwtUtil = {
    genToken(customer) {
        const token = jwt.sign(
            { username: customer.username, _id: customer._id },
            MyConstants.JWT_SECRET,
            { expiresIn: MyConstants.JWT_EXPIRES }
        );
        return token;
    },

    verifyToken(token) {
        try {
            return jwt.verify(token, MyConstants.JWT_SECRET);
        } catch (err) {
            throw err;
        }
    },

    checkToken(req, res, next) {
        try {
            // Get token from headers
            let token = req.headers['x-access-token'] || req.headers['authorization'];
            
            // Check if token exists
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có token xác thực'
                });
            }

            // Remove Bearer prefix if it exists
            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length);
            }

            // Verify token
            jwt.verify(token, MyConstants.JWT_SECRET, (err, decoded) => {
                if (err) {
                    console.error('JWT verification error:', err.message);
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
                
                // Store the decoded token and proceed
                req.jwtDecoded = decoded;
                next();
            });
        } catch (error) {
            console.error('Token validation error:', error);
            return res.status(401).json({
                success: false,
                message: 'Lỗi xác thực: ' + error.message
            });
        }
    }
};

module.exports = JwtUtil;