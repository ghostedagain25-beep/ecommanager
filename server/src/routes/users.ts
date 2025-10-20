import express from 'express';
import { User } from '../models/User';
import { Website } from '../models/Website';
import { UserMenuSettings } from '../models/UserMenuSettings';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// GET all users (with website count)
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        const websitesCount = await Website.aggregate([
            { $group: { _id: '$user_username', count: { $sum: 1 } } }
        ]);
        const countMap = new Map(websitesCount.map(item => [item._id, item.count]));
        
        const usersWithCount = users.map(user => ({
            ...user.toObject(),
            websiteCount: countMap.get(user.username) || 0,
        }));

        res.json(usersWithCount);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new user
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { username, password, role, syncsRemaining, maxWebsites } = req.body;
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const user = new User({ username, password, role, syncsRemaining, maxWebsites });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET check if username exists
router.get('/check/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (user) {
            res.status(409).json({ message: 'Username is taken' });
        } else {
            res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// PUT update a user
router.put('/:username', protect, async (req, res) => {
    try {
        const userToUpdate = await User.findOne({ username: req.params.username });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Authorization check: Admin can edit anyone, user can only edit themselves.
        if (req.user?.role !== 'admin' && req.user?.username !== req.params.username) {
            return res.status(403).json({ message: 'Not authorized to update this user' });
        }

        const { password, role, syncsRemaining, maxWebsites } = req.body;
        userToUpdate.syncsRemaining = syncsRemaining ?? userToUpdate.syncsRemaining;
        
        // Only admin can change these fields
        if (req.user?.role === 'admin') {
            userToUpdate.role = role ?? userToUpdate.role;
            userToUpdate.maxWebsites = maxWebsites ?? userToUpdate.maxWebsites;
        }

        if (password) {
            userToUpdate.password = password;
        }

        const updatedUser = await userToUpdate.save();
        res.json(updatedUser);

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// DELETE a user
router.delete('/:username', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete an admin user' });
        }

        // Cascade delete related data
        await Website.deleteMany({ user_username: req.params.username });
        await UserMenuSettings.deleteOne({ user_username: req.params.username });
        // Note: Sync history is kept for auditing, but you could delete it too.
        
        await User.deleteOne({ _id: user._id });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// --- Menu Settings ---

// GET user menu settings
router.get('/:username/menu-settings', protect, async (req, res) => {
    // Allow users to read their own settings OR admins to read any user's settings
    if (req.user?.role !== 'admin' && req.user?.username !== req.params.username) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    try {
        const settings = await UserMenuSettings.findOne({ user_username: req.params.username });
        res.json(settings ? Object.fromEntries(settings.settings) : {});
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT user menu settings
router.put('/:username/menu-settings', protect, isAdmin, async (req, res) => {
    try {
        const { settings } = req.body;
        await UserMenuSettings.findOneAndUpdate(
            { user_username: req.params.username },
            { settings: new Map(Object.entries(settings)) },
            { upsert: true, new: true }
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


export default router;
