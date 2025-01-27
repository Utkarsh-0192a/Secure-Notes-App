const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// CSRF protection middleware configuration
const csrfProtection = csrf({
    cookie: {
        key: 'XSRF-TOKEN',
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 900000 // 15 minutes in milliseconds
    }
});

// Middleware to add CSRF token to response locals
const addCsrfToken = (req, res, next) => {
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
    next();
};

module.exports = {
    cookieParser,
    csrfProtection,
    addCsrfToken
};
