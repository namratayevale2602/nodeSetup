/**
 * Set cookies with tokens
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access Token Cookie (1 hour)
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction && process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
        path: '/'
    });
    
    // Refresh Token Cookie (7 days)
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction && process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/'
    });
};

/**
 * Clear authentication cookies
 */
const clearTokenCookies = (res) => {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
};

/**
 * Get tokens from cookies
 */
const getTokensFromCookies = (req) => {
    return {
        accessToken: req.cookies.access_token,
        refreshToken: req.cookies.refresh_token
    };
};

module.exports = {
    setTokenCookies,
    clearTokenCookies,
    getTokensFromCookies
};