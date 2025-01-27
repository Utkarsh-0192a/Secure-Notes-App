const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
const authenticate = require('../middleware/authentication');
const loginLimiter = require('../middleware/rateLimiter');
const { csrfProtection, addCsrfToken } = require('../middleware/csrfProtection');
const cookieParser = require('cookie-parser');

const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your actual secret key

const tokenBlacklist = new Map();

// const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const passwordValidationMessage = 'Password must be at least 8 characters long and contain: at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&#)';

// signup endpoint
router.post('/signup', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // Enhanced validation
        if (!name?.trim() || !username?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({ message: 'All fields are required and cannot be empty' });
        }

        // Enhanced password validation
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: passwordValidationMessage });
        }

        // Check for existing user with more specific error messages
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create user with validated data
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({
            name: name.trim(),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            lastActive: new Date()
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get CSRF token - simplified
router.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// login endpoint - simplified middleware chain
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const user = await User.findOne({ username });
        
        // Always use the same error message for security
        const invalidCredentialsMsg = 'Invalid username or password';
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            // Increment failed attempts counter
            req.rateLimit.counter++;
            return res.status(400).json({ message: invalidCredentialsMsg });
        }

        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Set secure cookie with session token
        res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 900000
        });

        await User.findByIdAndUpdate(user._id, { lastActive: new Date() });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// logout endpoint - complete cleanup
router.post('/logout', authenticate, csrfProtection, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(400).json({ message: 'Authorization header is missing' });
        }
        const token = authHeader.split(' ')[1];
        
        // Invalidate the token
        tokenBlacklist.set(token, Date.now());
        
        // Clear all cookies
        res.clearCookie('session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.clearCookie('XSRF-TOKEN', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        // Update user's last active time
        if (req.user && req.user.id) {
            await User.findByIdAndUpdate(req.user.id, { lastActive: new Date() });
        }

        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Middleware to check if token is blacklisted
function checkBlacklist(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(400).json({ message: 'Authorization header is missing' });
    }
    const token = authHeader.split(' ')[1];
    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: 'Token is invalidated' });
    }
    next();
}

// Periodically remove expired tokens from the blacklist
setInterval(() => {
    const now = Date.now();
    for (const [token, exp] of tokenBlacklist.entries()) {
        if (exp < now) {
            tokenBlacklist.delete(token);
        }
    }
}, 60000 * 10); // Run every 10 minutes

// Apply the checkBlacklist middleware to protected routes
router.use('/protected', checkBlacklist);

// Add session check middleware
const checkSessionExpiry = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const inactiveTime = Date.now() - user.lastActive;
        if (inactiveTime > 900000) { // 15 minutes in milliseconds
            return res.status(401).json({ message: 'Session expired' });
        }

        await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Apply session check to protected routes
router.use('/protected', checkSessionExpiry);

// Example of a protected route
router.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ message: 'This is a protected route', user: req.user });
});

// Add this route
router.get('/verify', csrfProtection, authenticate, async (req, res) => {
    try {
        // If auth middleware passes, token is valid
        res.json({ valid: true });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Ensure all routes have valid callback functions
router.get('/some-route', (req, res) => {
    // Handle GET request
    res.send('Some response');
});

module.exports = router;

