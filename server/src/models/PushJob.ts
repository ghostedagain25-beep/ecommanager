import { Schema, model, Document } from 'mongoose';

export interface IPushJob extends Document {
  user_username: string;
  website_id: Schema.Types.ObjectId;
  push_timestamp: Date;
  type: 'inventory' | 'price' | 'product';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'partial';
  total_processed: number;
  total_pushed: number;
  total_skipped: number;
  total_errors: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

const PushJobSchema = new Schema<IPushJob>({
  user_username: { type: String, required: true, index: true },
  website_id: { type: Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
  push_timestamp: { type: Date, required: true, default: Date.now },
  type: { type: String, required: true, enum: ['inventory', 'price', 'product'] },
  status: { type: String, required: true, enum: ['queued', 'running', 'completed', 'failed', 'partial'], default: 'queued' },
  total_processed: { type: Number, required: true, default: 0 },
  total_pushed: { type: Number, required: true, default: 0 },
  total_skipped: { type: Number, required: true, default: 0 },
  total_errors: { type: Number, required: true, default: 0 },
  error_message: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { minimize: false });

// Performance index for common lookups
PushJobSchema.index({ user_username: 1, push_timestamp: -1 });

export const PushJob = model<IPushJob>('PushJob', PushJobSchema);
