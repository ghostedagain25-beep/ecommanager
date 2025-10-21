import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

/**
 * Migration script to update existing users with new email verification fields
 * Run this once after deploying the new User model
 */
async function migrateExistingUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('Connected to MongoDB');

        // Update all existing users without email to have isEmailVerified: true
        // This ensures they can still log in without email verification
        const result = await User.updateMany(
            { 
                $or: [
                    { email: { $exists: false } },
                    { email: null },
                    { email: '' }
                ]
            },
            { 
                $set: { 
                    isEmailVerified: true 
                },
                $unset: {
                    emailVerificationToken: 1,
                    emailVerificationExpires: 1
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} existing users`);
        console.log('   - Set isEmailVerified: true for users without email');
        console.log('   - Removed verification tokens for existing users');

        // Ensure indexes are created
        await User.collection.createIndex({ email: 1 }, { sparse: true, unique: true });
        await User.collection.createIndex({ username: 1 }, { unique: true });
        
        console.log('✅ Database indexes updated');
        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateExistingUsers();
}

export { migrateExistingUsers };
