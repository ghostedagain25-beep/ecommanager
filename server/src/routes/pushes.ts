import express, { Request, Response } from 'express';
import { protect, isAdmin } from '../middleware/auth';
import { PushJob } from '../models/PushJob';
import { PushDetail } from '../models/PushDetail';

const router = express.Router();

// POST a new push job
router.post('/', protect, async (req: Request, res: Response) => {
  try {
    const { username, websiteId, type, summary, details } = req.body;

    // Input validation
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'username is required' });
    }
    if (!websiteId || typeof websiteId !== 'string') {
      return res.status(400).json({ message: 'websiteId is required' });
    }
    if (!['inventory', 'price', 'product'].includes(type)) {
      return res.status(400).json({ message: 'type must be one of inventory|price|product' });
    }
    if (!summary || typeof summary !== 'object') {
      return res.status(400).json({ message: 'summary is required' });
    }
    if (!Array.isArray(details)) {
      return res.status(400).json({ message: 'details must be an array' });
    }

    if (req.user?.role !== 'admin' && req.user?.username !== username) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const safeSummary = {
      status: ['queued', 'running', 'completed', 'failed', 'partial'].includes(summary.status) ? summary.status : 'queued',
      total_processed: Number(summary.total_processed ?? 0),
      total_pushed: Number(summary.total_pushed ?? 0),
      total_skipped: Number(summary.total_skipped ?? 0),
      total_errors: Number(summary.total_errors ?? 0),
      error_message: typeof summary.error_message === 'string' ? summary.error_message : undefined,
      metadata: typeof summary.metadata === 'object' ? summary.metadata : undefined,
    };

    const job = new PushJob({
      user_username: username,
      website_id: websiteId,
      type,
      ...safeSummary,
    });

    const saved = await job.save();

    if (details.length > 0) {
      const docs = details.map((d: any) => ({
        push_id: saved._id,
        sku: String(d.sku || ''),
        product_name: d.product_name ? String(d.product_name) : undefined,
        action: ['create', 'update', 'delete'].includes(d.action) ? d.action : 'update',
        status: ['pushed', 'skipped', 'error'].includes(d.status) ? d.status : 'pushed',
        changes_json: d.changes_json ? String(d.changes_json) : undefined,
        platform_response: d.platform_response ? String(d.platform_response) : undefined,
      }));
      await PushDetail.insertMany(docs);
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET latest push summary for a user
router.get('/summary/latest/:username', protect, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.username !== req.params.username) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const summary = await PushJob.findOne({ user_username: req.params.username })
      .sort({ push_timestamp: -1 });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET all push summaries (admin)
router.get('/summary/all', protect, isAdmin, async (_req: Request, res: Response) => {
  try {
    const summaries = await PushJob.find({}).sort({ push_timestamp: -1 });
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET push details by job ID
router.get('/details/:pushId', protect, async (req: Request, res: Response) => {
  try {
    const job = await PushJob.findById(req.params.pushId);
    if (!job) return res.status(404).json({ message: 'Push job not found' });

    if (req.user?.role !== 'admin' && req.user?.username !== job.user_username) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const details = await PushDetail.find({ push_id: req.params.pushId });
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
