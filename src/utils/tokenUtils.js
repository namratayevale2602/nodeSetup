const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived)
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE }
    );
};

/**
 * Generate Refresh Token (long-lived)
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            tokenType: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Calculate token expiry date
 */
const calculateExpiryDate = (expiresIn) => {
    const now = new Date();
    const timeMap = {
        '1h': 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    let milliseconds = 0;
    if (timeMap[expiresIn]) {
        milliseconds = timeMap[expiresIn];
    } else {
        // Parse custom format like '2h', '30m'
        const match = expiresIn.match(/^(\d+)([hmd])$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            switch(unit) {
                case 'h': milliseconds = value * 60 * 60 * 1000; break;
                case 'm': milliseconds = value * 60 * 1000; break;
                case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
            }
        }
    }
    
    return new Date(now.getTime() + milliseconds);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    calculateExpiryDate
};