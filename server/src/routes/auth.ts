import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { protect, isAdmin } from '../middleware/auth';
import { sendVerificationEmail } from '../services/emailService';

const router = express.Router();

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username }).select('+password');
        if (user && (await user.comparePassword(password))) {
            // Check if email verification is required and user has email
            if (user.email && !user.isEmailVerified) {
                return res.status(403).json({ 
                    message: 'Please verify your email address before logging in. Check your email for the verification link.',
                    requiresEmailVerification: true 
                });
            }

            const userObject = user.toObject();
            delete userObject.password;

            res.json({
                user: userObject,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    if (req.user) {
        const user = await User.findById(req.user.id);
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Admin login as another user
// @route   POST /api/auth/login-as
// @access  Private/Admin
router.post('/login-as', protect, isAdmin, async (req, res) => {
    const { username } = req.body;
    try {
        const userToLoginAs = await User.findOne({ username });
        if (!userToLoginAs || userToLoginAs.role === 'admin') {
            return res.status(404).json({ message: 'User not found or is an admin' });
        }
        res.json({
            user: userToLoginAs,
            token: generateToken(userToLoginAs._id),
        });
    } catch (error) {
         res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Register new user with email verification
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(409).json({ message: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return res.status(409).json({ message: 'Email already registered' });
            }
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = new User({
            username,
            email,
            password,
            role: 'user',
            syncsRemaining: 10,
            maxWebsites: 1,
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
        });

        await user.save();

        // Try to send verification email
        let emailSent = false;
        try {
            await sendVerificationEmail(email, username, verificationToken);
            emailSent = true;
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail the signup if email fails
        }

        res.status(201).json({
            message: emailSent 
                ? 'Account created successfully! Please check your email to verify your account.'
                : 'Account created successfully! Email verification is temporarily unavailable.',
            emailSent,
            username
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// @desc    Verify email address
// @route   GET /api/auth/verify-email
// @access  Public
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        }).select('+emailVerificationToken +emailVerificationExpires');

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user as verified
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully! You can now log in to your account.',
            username: user.username
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email, isEmailVerified: false });

        if (!user) {
            return res.status(404).json({ message: 'User not found or already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        // Try to send verification email
        try {
            await sendVerificationEmail(email, user.username, verificationToken);
            res.json({ message: 'Verification email sent successfully!' });
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            res.status(500).json({ message: 'Failed to send verification email' });
        }

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
