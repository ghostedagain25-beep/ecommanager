import { Schema, model, Document } from 'mongoose';

export interface ISyncDetail extends Document {
    sync_id: Schema.Types.ObjectId;
    sku: string;
    product_name: string;
    status: 'updated' | 'not_found' | 'up_to_date' | 'error';
    changes_json: string;
}

const SyncDetailSchema = new Schema<ISyncDetail>({
    sync_id: { type: Schema.Types.ObjectId, ref: 'SyncHistory', required: true, index: true },
    sku: { type: String, required: true },
    product_name: { type: String },
    status: { type: String, required: true, enum: ['updated', 'not_found', 'up_to_date', 'error'] },
    changes_json: { type: String },
});

export const SyncDetail = model<ISyncDetail>('SyncDetail', SyncDetailSchema);
