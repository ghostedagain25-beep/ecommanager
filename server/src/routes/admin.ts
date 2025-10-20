import express from 'express';
import mongoose from 'mongoose';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// Middleware to ensure all routes in this file are protected and for admins only
router.use(protect, isAdmin);

// GET all table/collection names
router.get('/tables', async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.json(collections.map(c => c.name));
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET data from a specific table/collection
router.get('/tables/:name', async (req, res) => {
    const { name } = req.params;
    // Sanitize to prevent any potential misuse, although mongoose is generally safe here
    if (!/^[a-zA-Z0-9_-]+$/i.test(name)) {
        return res.status(400).json({ message: 'Invalid collection name' });
    }
    try {
        const collection = mongoose.connection.collection(name);
        const data = await collection.find({}).limit(100).toArray();

        if (data.length === 0) {
            return res.json({ columns: [], rows: [] });
        }

        // Exclude sensitive fields
        if (name === 'users') {
            data.forEach(doc => delete doc.password);
        }
        
        const columns = Object.keys(data[0]);
        const rows = data.map(doc => columns.map(col => doc[col]));
        
        res.json({ columns, rows });
    } catch (error) {
        res.status(500).json({ message: `Error fetching data for ${name}` });
    }
});

// GET search across all tables
router.get('/search', async (req, res) => {
    const { term } = req.query;
    if (!term || typeof term !== 'string') {
        return res.status(400).json({ message: 'Search term is required' });
    }
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const searchResults: Record<string, { columns: string[], rows: any[][] }> = {};
        const regex = new RegExp(term, 'i');

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            const collection = mongoose.connection.collection(collectionName);
            
            // Find one document to get fields
            const sampleDoc = await collection.findOne({});
            if (!sampleDoc) continue;

            let fieldsToSearch = Object.keys(sampleDoc).filter(key => typeof sampleDoc[key] === 'string');
             // Exclude sensitive fields from search query
            if (collectionName === 'users') {
                fieldsToSearch = fieldsToSearch.filter(f => f !== 'password');
            }

            const query = { $or: fieldsToSearch.map(field => ({ [field]: regex })) };
            const results = await collection.find(query).limit(50).toArray();

            if (results.length > 0) {
                 if (collectionName === 'users') {
                    results.forEach(doc => delete doc.password);
                }
                const columns = Object.keys(results[0]);
                const rows = results.map(doc => columns.map(col => doc[col]));
                searchResults[collectionName] = { columns, rows };
            }
        }
        res.json(searchResults);

    } catch (error) {
        res.status(500).json({ message: 'Global search failed' });
    }
});

export default router;
