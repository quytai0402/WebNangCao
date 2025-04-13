const crypto = require('crypto');

const CryptoUtil = {
    md5(input) {
        const hash = crypto.createHash('md5').update(input).digest('hex');
        return hash;
    }
};

module.exports = CryptoUtil;