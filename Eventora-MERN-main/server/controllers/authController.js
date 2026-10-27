const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, isEmailConfigured } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET || 'fallback_secret_key_eventora_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Simple email regex for validation
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'Full name is required (at least 2 characters)' });
        }
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: 'A valid email address is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let existingUser = await User.findOne({ email: normalizedEmail });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // If user exists and is already verified, reject
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        let user;
        if (existingUser && !existingUser.isVerified) {
            // Update unverified user's credentials
            existingUser.name = name.trim();
            existingUser.password = hashedPassword;
            user = await existingUser.save();
        } else {
            // Create brand new user
            user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: 'user', // Always default to user role
                isVerified: false
            });
        }

        const otp = generateOTP();
        await OTP.deleteMany({ email: normalizedEmail, action: 'account_verification' });
        await OTP.create({ email: normalizedEmail, otp, action: 'account_verification' });
        const emailResult = await sendOTPEmail(normalizedEmail, otp, 'account_verification');

        const responsePayload = {
            message: 'Verification OTP sent to your email. Please verify to activate your account.',
            email: user.email,
            emailConfigured: isEmailConfigured()
        };

        return res.status(201).json(responsePayload);
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if unverified non-admin
        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();
            await OTP.deleteMany({ email: user.email, action: 'account_verification' });
            await OTP.create({ email: user.email, otp, action: 'account_verification' });
            await sendOTPEmail(user.email, otp, 'account_verification');

            const resp = {
                message: 'Account not verified. A new 6-digit OTP has been sent to your email.',
                needsVerification: true,
                email: user.email,
                emailConfigured: isEmailConfigured()
            };

            return res.status(403).json(resp);
        }

        return res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and 6-digit OTP code are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const validOTP = await OTP.findOne({ email: normalizedEmail, otp: String(otp).trim(), action: 'account_verification' });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP code. Please request a new one.' });
        }

        const user = await User.findOneAndUpdate(
            { email: normalizedEmail },
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: validOTP._id });

        return res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ message: 'Server error during OTP verification', error: error.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email, action = 'account_verification' } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: 'A valid email is required to resend OTP' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        if (action === 'account_verification' && user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified. You can log in directly.' });
        }

        const otp = generateOTP();
        await OTP.deleteMany({ email: normalizedEmail, action });
        await OTP.create({ email: normalizedEmail, otp, action });
        await sendOTPEmail(normalizedEmail, otp, action);

        const resp = {
            message: 'A fresh OTP has been sent to your email.',
            email: normalizedEmail,
            emailConfigured: isEmailConfigured()
        };

        return res.json(resp);
    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({ message: 'Server error while resending OTP', error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching user profile' });
    }
};
