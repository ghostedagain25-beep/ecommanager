import express from 'express';
import { WorkflowStep } from '../models/WorkflowStep';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// GET all workflow steps
router.get('/steps', protect, async (req, res) => {
    try {
        const steps = await WorkflowStep.find({}).sort({ step_order: 1 });
        res.json(steps);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT update workflow steps enabled status
router.put('/steps', protect, isAdmin, async (req, res) => {
    const { updates } = req.body as { updates: { step_key: string, is_enabled: boolean }[]};
    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: 'Invalid update format' });
    }

    try {
        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { step_key: update.step_key, is_mandatory: false },
                update: { $set: { is_enabled: update.is_enabled } },
            }
        }));
        
        if (bulkOps.length > 0) {
            await WorkflowStep.bulkWrite(bulkOps);
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
