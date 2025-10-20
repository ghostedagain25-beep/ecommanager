import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { protect, isAdmin } from '../middleware/auth';

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


export default router;
