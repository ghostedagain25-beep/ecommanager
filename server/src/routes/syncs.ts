import express from 'express';
import { SyncHistory } from '../models/SyncHistory';
import { SyncDetail } from '../models/SyncDetail';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// POST a new sync event
router.post('/', protect, async (req, res) => {
    const { username, summary, details } = req.body;
    
    if (req.user?.role !== 'admin' && req.user?.username !== username) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    
    try {
        // Log payload size for debugging
        const payloadSize = JSON.stringify(req.body).length;
        console.log(`Sync payload size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);
        
        const newSyncHistory = new SyncHistory({ user_username: username, ...summary });
        const savedHistory = await newSyncHistory.save();

        if (details && details.length > 0) {
            console.log(`Processing ${details.length} sync details`);
            const detailDocs = details.map((d: any) => ({ ...d, sync_id: savedHistory._id }));
            await SyncDetail.insertMany(detailDocs);
        }

        res.status(201).json(savedHistory);
    } catch (error: any) {
        console.error('Sync error:', error);
        
        // Provide more specific error messages
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid sync data format' });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Duplicate sync entry' });
        }
        if (error.message && error.message.includes('payload')) {
            return res.status(413).json({ message: 'Sync data too large. Please reduce the number of products in a single sync.' });
        }
        
        res.status(500).json({ message: 'Server Error during sync processing' });
    }
});

// GET latest sync summary for a user
router.get('/summary/latest/:username', protect, async (req, res) => {
    if (req.user?.role !== 'admin' && req.user?.username !== req.params.username) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    try {
        const summary = await SyncHistory.findOne({ user_username: req.params.username }).sort({ sync_timestamp: -1 });
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET all sync summaries (admin)
router.get('/summary/all', protect, isAdmin, async (req, res) => {
    try {
        const summaries = await SyncHistory.find({}).sort({ sync_timestamp: -1 });
        res.json(summaries);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET sync details by history ID
router.get('/details/:historyId', protect, async (req, res) => {
    try {
        const history = await SyncHistory.findById(req.params.historyId);
        if (!history) return res.status(404).json({ message: 'Sync history not found' });

        if (req.user?.role !== 'admin' && req.user?.username !== history.user_username) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const details = await SyncDetail.find({ sync_id: req.params.historyId });
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


export default router;
