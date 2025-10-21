import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import websiteRoutes from './routes/websites';
import workflowRoutes from './routes/workflow';
import syncsRoutes from './routes/syncs';
import adminRoutes from './routes/admin';
import superadminRoutes from './routes/superadmin';
import { seedDatabase } from './seed';
import pushesRoutes from './routes/pushes';
import shopifyAuthRoutes from './routes/shopify-auth';

// Ensure we load env from project root even when running from server/
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ 
  limit: '100mb'  // Increased to 100mb for very large sync operations
}));
app.use(express.urlencoded({ 
  limit: '100mb', 
  extended: true,
  parameterLimit: 50000  // Increase parameter limit for complex form data
}));

// Set timeout for large requests
app.use((req, res, next) => {
  // Increase timeout for sync endpoints
  if (req.path.includes('/syncs') || req.path.includes('/pushes')) {
    req.setTimeout(300000); // 5 minutes for sync operations
    res.setTimeout(300000);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/syncs', syncsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/pushes', pushesRoutes);
app.use('/api/shopify-auth', shopifyAuthRoutes);

// Health check endpoint for deployment
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ecommanager-api',
        version: '1.0.0'
    });
});

app.get('/', (req: Request, res: Response) => {
    res.send('EcomManager Server is running.');
});

// Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
    // FIX: Cast process to any to resolve TypeScript type error.
    (process as any).exit(1);
}

mongoose.connect(MONGO_URI as string)
    .then(() => {
        console.log('MongoDB connected successfully.');
        // Seed the database if it's empty
        seedDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // FIX: Cast process to any to resolve TypeScript type error.
        (process as any).exit(1);
    });
