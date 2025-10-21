import { User } from './models/User';
import { Website } from './models/Website';
import { WorkflowStep } from './models/WorkflowStep';
import { PushJob } from './models/PushJob';
import { PushDetail } from './models/PushDetail';

export const seedDatabase = async () => {
    try {
        const userCount = await User.countDocuments();
        const workflowStepCount = await WorkflowStep.countDocuments();
        
        // Always ensure push collections and indexes are initialized
        await PushJob.init();
        await PushDetail.init();

        if (userCount > 0 && workflowStepCount > 0) {
            console.log('Database already seeded. Skipping.');
            return;
        }

        console.log('Seeding database with initial data...');

        // Seed Users (only if no users exist)
        if (userCount === 0) {
            console.log('Creating initial users...');
            const users = await User.create([
            { 
                username: 'admin', 
                password: process.env.DEFAULT_ADMIN_PASSWORD || 'change_me_admin', 
                role: 'admin', 
                syncsRemaining: 999, 
                maxWebsites: 999,
                isEmailVerified: true // Admin doesn't need email verification
            },
            { 
                username: 'garg', 
                password: process.env.DEFAULT_USER_PASSWORD || 'change_me_user', 
                role: 'user', 
                syncsRemaining: 30, 
                maxWebsites: 1,
                isEmailVerified: true // Existing seed users don't need email verification
            },
            { 
                username: 'test', 
                password: process.env.DEFAULT_USER_PASSWORD || 'change_me_user', 
                role: 'user', 
                syncsRemaining: 30, 
                maxWebsites: 2,
                isEmailVerified: true // Existing seed users don't need email verification
            }
            ]);
        }

        // Seed Websites (only if no users exist)
        if (userCount === 0) {
            console.log('Creating initial websites...');
            await Website.create([
             {
                user_username: 'garg',
                platform: 'wordpress',
                name: 'Garg Dastak',
                url: "https://gargdastak.com",
                consumerKey: "",
                consumerSecret: "",
                currency_symbol: '₹',
                is_primary: true,
            },
            {
                user_username: 'test',
                platform: 'wordpress',
                name: 'iTechServe',
                url: "https://itechserve.co.in",
                consumerKey: "",
                consumerSecret: "",
                currency_symbol: '₹',
                is_primary: true,
            },
            {
                user_username: 'test',
                platform: 'shopify',
                name: 'Test Shopify Store',
                url: "zp6rvb-2k",
                shopify_access_token: "",
                currency_symbol: '$',
                is_primary: false,
            }
            ]);
        }

        // Seed Workflow Steps (only if no workflow steps exist)
        if (workflowStepCount === 0) {
            console.log('Creating initial workflow steps...');
            await WorkflowStep.create([
            { step_key: 'cleanClosingStock', step_name: 'Clean Closing Stock', description: 'Filters invalid rows and sanitizes numeric values from the closing stock report.', step_order: 1, is_enabled: true, is_mandatory: true },
            { step_key: 'deduplicateClosingStock', step_name: 'Deduplicate Stock Items', description: 'Removes duplicate stock items, keeping the one with the highest MRP and stock quantity.', step_order: 2, is_enabled: true, is_mandatory: false },
            { step_key: 'cleanItemDirectory', step_name: 'Clean Item Directory', description: 'Sanitizes discount percentages and MRP values from the item directory.', step_order: 3, is_enabled: true, is_mandatory: true },
            { step_key: 'renameColumns', step_name: 'Rename Columns', description: 'Renames source columns (e.g., "ITEM CODE") to their final format (e.g., "SKU").', step_order: 4, is_enabled: true, is_mandatory: true },
            { step_key: 'applyDiscounts', step_name: 'Apply Discounts', description: 'Looks up and applies discounts from the item directory to the stock data.', step_order: 5, is_enabled: true, is_mandatory: true },
            { step_key: 'calculateNewSalePrice', step_name: 'Calculate Final Sale Price', description: 'Calculates the new sale price based on the old sale price and the applied discount.', step_order: 6, is_enabled: true, is_mandatory: true },
            { step_key: 'finalizeData', step_name: 'Finalize Data Structure', description: 'Removes temporary columns (like "DISCOUNT") to prepare the final output.', step_order: 7, is_enabled: true, is_mandatory: true },
            ]);
        }

        // Push collections already initialized above

        console.log('Database seeding complete.');
    } catch (error) {
        console.error('Error seeding database:', error);
        // FIX: Cast process to any to resolve TypeScript type error.
        (process as any).exit(1);
    }
};
