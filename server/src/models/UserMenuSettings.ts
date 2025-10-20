import { Schema, model, Document } from 'mongoose';

export interface IUserMenuSettings extends Document {
    user_username: string;
    settings: Map<string, boolean>;
}

const UserMenuSettingsSchema = new Schema<IUserMenuSettings>({
    user_username: { type: String, required: true, unique: true, index: true },
    settings: {
        type: Map,
        of: Boolean,
        required: true,
    },
});

export const UserMenuSettings = model<IUserMenuSettings>('UserMenuSetting', UserMenuSettingsSchema);
