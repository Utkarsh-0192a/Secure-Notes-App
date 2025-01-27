const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per window
    skipSuccessfulRequests: true, // Don't count successful logins
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    handler: (req, res) => {
        res.status(429).json({
            status: 429,
            message: "Too many login attempts. Please try again after 15 minutes."
        });
    }
});

module.exports = loginLimiter;

