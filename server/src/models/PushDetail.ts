import { Schema, model, Document } from 'mongoose';

export interface IPushDetail extends Document {
  push_id: Schema.Types.ObjectId;
  sku: string;
  product_name?: string;
  action: 'create' | 'update' | 'delete';
  status: 'pushed' | 'skipped' | 'error';
  changes_json?: string;
  platform_response?: string;
}

const PushDetailSchema = new Schema<IPushDetail>({
  push_id: { type: Schema.Types.ObjectId, ref: 'PushJob', required: true, index: true },
  sku: { type: String, required: true, index: true },
  product_name: { type: String },
  action: { type: String, required: true, enum: ['create', 'update', 'delete'] },
  status: { type: String, required: true, enum: ['pushed', 'skipped', 'error'] },
  changes_json: { type: String },
  platform_response: { type: String },
});

// Performance index for common detail queries
PushDetailSchema.index({ push_id: 1, sku: 1 });

export const PushDetail = model<IPushDetail>('PushDetail', PushDetailSchema);
