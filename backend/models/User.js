const mongoose = require('mongoose');
const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Encryption helper functions
const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
};

const decrypt = (encrypted, iv, authTag) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        set: function(value) {
            const encrypted = encrypt(value);
            this._email = value; // Store original for validation
            return JSON.stringify(encrypted);
        },
        get: function(value) {
            if (!value) return;
            const { encrypted, iv, authTag } = JSON.parse(value);
            return decrypt(encrypted, iv, authTag);
        }
    },
    password: {
        type: String,
        required: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Email validation with getter/setter support
userSchema.path('email').validate(function(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this._email || value);
}, 'Invalid email format');

module.exports = mongoose.model('User', userSchema);