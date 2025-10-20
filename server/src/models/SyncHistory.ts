import { Schema, model, Document } from 'mongoose';

export interface ISyncHistory extends Document {
    user_username: string;
    sync_timestamp: Date;
    total_processed: number;
    total_updated: number;
    total_not_found: number;
    total_up_to_date: number;
    total_errors: number;
}

const SyncHistorySchema = new Schema<ISyncHistory>({
    user_username: { type: String, required: true, index: true },
    sync_timestamp: { type: Date, required: true, default: Date.now },
    total_processed: { type: Number, required: true },
    total_updated: { type: Number, required: true },
    total_not_found: { type: Number, required: true },
    total_up_to_date: { type: Number, required: true },
    total_errors: { type: Number, required: true },
});

export const SyncHistory = model<ISyncHistory>('SyncHistory', SyncHistorySchema);
