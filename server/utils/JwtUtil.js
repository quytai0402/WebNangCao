const jwt = require('jsonwebtoken');
const MyConstants = require('./MyConstants');

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
        const token = req.headers['x-access-token'] || req.headers['authorization'];
        if (token) {
            jwt.verify(token, MyConstants.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Token không hợp lệ'
                    });
                } else {
                    // Store the entire decoded token
                    req.jwtDecoded = decoded;
                    next();
                }
            });
        } else {
            return res.json({
                success: false,
                message: 'Không có token xác thực'
            });
        }
    }
};

module.exports = JwtUtil;