import { Schema, model, Document } from 'mongoose';

export interface IWebsite extends Document {
    user_username: string;
    platform: 'wordpress' | 'shopify';
    name: string;
    url: string;
    consumerKey: string | null;
    consumerSecret: string | null;
    shopify_access_token: string | null;
    currency_symbol: string;
    is_primary: boolean;
}

const WebsiteSchema = new Schema<IWebsite>({
    user_username: { type: String, required: true, index: true },
    platform: { type: String, required: true, enum: ['wordpress', 'shopify'] },
    name: { type: String, required: true },
    url: { type: String, required: true },
    consumerKey: { type: String, select: false },
    consumerSecret: { type: String, select: false },
    shopify_access_token: { type: String, select: false },
    currency_symbol: { type: String, required: true, default: '₹' },
    is_primary: { type: Boolean, required: true, default: false },
});

export const Website = model<IWebsite>('Website', WebsiteSchema);
