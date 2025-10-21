import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommanager');
        console.log('Connected to MongoDB');

        // Check if superadmin already exists
        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            console.log('SuperAdmin already exists:', existingSuperAdmin.username);
            process.exit(0);
        }

        // Create default superadmin
        const superAdmin = new User({
            username: 'superadmin',
            password: 'admin', // Default password
            role: 'superadmin',
            syncsRemaining: 999999,
            maxWebsites: 999999,
            isEmailVerified: true,
            allowedMenuItems: [
                'orders', 'products', 'categories', 'users', 'websites', 
                'workflow', 'history', 'pushes', 'database', 'settings', 'quick_guide'
            ]
        });

        await superAdmin.save();
        console.log('SuperAdmin created successfully!');
        console.log('Username: superadmin');
        console.log('Password: admin');
        console.log('⚠️  IMPORTANT: Please change the default password after first login!');

    } catch (error) {
        console.error('Error creating SuperAdmin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the script
createSuperAdmin();
