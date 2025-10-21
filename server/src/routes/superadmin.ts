import express from 'express';
import { User } from '../models/User';
import { protect, isSuperAdmin } from '../middleware/auth';

const router = express.Router();

// @desc    Get all admins
// @route   GET /api/superadmin/admins
// @access  Private/SuperAdmin
router.get('/admins', protect, isSuperAdmin, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create new admin
// @route   POST /api/superadmin/admins
// @access  Private/SuperAdmin
router.post('/admins', protect, isSuperAdmin, async (req, res) => {
    const { username, email, password, allowedMenuItems, syncsRemaining, maxWebsites } = req.body;
    
    try {
        // Check if admin already exists
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

        // Create admin
        const admin = new User({
            username,
            email,
            password,
            role: 'admin',
            syncsRemaining: syncsRemaining || 100,
            maxWebsites: maxWebsites || 10,
            isEmailVerified: true, // Admins are pre-verified
            createdBy: req.user!.username,
            allowedMenuItems: allowedMenuItems || [
                'orders', 'products', 'categories', 'users', 
                'websites', 'workflow', 'history', 'pushes', 'settings'
            ]
        });

        await admin.save();

        const adminObject = admin.toObject();
        delete adminObject.password;

        res.status(201).json({
            message: 'Admin created successfully',
            admin: adminObject
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Server error during admin creation' });
    }
});

// @desc    Update admin
// @route   PUT /api/superadmin/admins/:id
// @access  Private/SuperAdmin
router.put('/admins/:id', protect, isSuperAdmin, async (req, res) => {
    const { allowedMenuItems, syncsRemaining, maxWebsites, email } = req.body;
    
    try {
        const admin = await User.findById(req.params.id);
        
        if (!admin || admin.role !== 'admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Update fields
        if (allowedMenuItems !== undefined) admin.allowedMenuItems = allowedMenuItems;
        if (syncsRemaining !== undefined) admin.syncsRemaining = syncsRemaining;
        if (maxWebsites !== undefined) admin.maxWebsites = maxWebsites;
        if (email !== undefined) admin.email = email;

        await admin.save();

        const adminObject = admin.toObject();
        delete adminObject.password;

        res.json({
            message: 'Admin updated successfully',
            admin: adminObject
        });

    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ message: 'Server error during admin update' });
    }
});

// @desc    Delete admin
// @route   DELETE /api/superadmin/admins/:id
// @access  Private/SuperAdmin
router.delete('/admins/:id', protect, isSuperAdmin, async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);
        
        if (!admin || admin.role !== 'admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Don't allow deletion if admin has created users
        const createdUsers = await User.countDocuments({ createdBy: admin.username });
        if (createdUsers > 0) {
            return res.status(400).json({ 
                message: `Cannot delete admin. They have created ${createdUsers} users. Please reassign or delete those users first.` 
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'Admin deleted successfully' });

    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ message: 'Server error during admin deletion' });
    }
});

// @desc    Assign users to admin
// @route   POST /api/superadmin/admins/:id/assign-users
// @access  Private/SuperAdmin
router.post('/admins/:id/assign-users', protect, isSuperAdmin, async (req, res) => {
    const { userIds } = req.body;
    
    try {
        const admin = await User.findById(req.params.id);
        
        if (!admin || admin.role !== 'admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Update users to be assigned to this admin
        await User.updateMany(
            { _id: { $in: userIds }, role: 'user' },
            { $addToSet: { assignedAdmins: admin.username } }
        );

        res.json({ message: 'Users assigned to admin successfully' });

    } catch (error) {
        console.error('Assign users error:', error);
        res.status(500).json({ message: 'Server error during user assignment' });
    }
});

// @desc    Get all users for assignment
// @route   GET /api/superadmin/users
// @access  Private/SuperAdmin
router.get('/users', protect, isSuperAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('-password')
            .populate('createdBy', 'username')
            .populate('assignedAdmins');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get available menu items
// @route   GET /api/superadmin/menu-items
// @access  Private/SuperAdmin
router.get('/menu-items', protect, isSuperAdmin, async (req, res) => {
    try {
        const menuItems = [
            { key: 'orders', label: 'View Orders', description: 'Access to view and manage orders' },
            { key: 'products', label: 'Products', description: 'Access to product management' },
            { key: 'categories', label: 'Categories', description: 'Access to category management' },
            { key: 'users', label: 'User Management', description: 'Access to manage users' },
            { key: 'websites', label: 'Website Management', description: 'Access to website configuration' },
            { key: 'workflow', label: 'Workflow', description: 'Access to workflow management' },
            { key: 'history', label: 'Sync History', description: 'Access to sync history' },
            { key: 'pushes', label: 'Push History', description: 'Access to push history' },
            { key: 'database', label: 'Database Explorer', description: 'Access to database explorer' },
            { key: 'settings', label: 'Admin Settings', description: 'Access to admin settings' },
            { key: 'quick_guide', label: 'Quick Guide', description: 'Access to quick guide' }
        ];
        
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
