import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email?: string;
  password?: string;
  role: 'superadmin' | 'admin' | 'user';
  syncsRemaining: number;
  maxWebsites: number;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdBy?: string; // Username of the admin/superadmin who created this user
  assignedAdmins?: string[]; // Array of admin usernames assigned to manage this user
  allowedMenuItems?: string[]; // Array of menu item keys that admin can access
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, sparse: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['superadmin', 'admin', 'user'] },
  syncsRemaining: { type: Number, required: true, default: 10 },
  maxWebsites: { type: Number, required: true, default: 1 },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  createdBy: { type: String, index: true },
  assignedAdmins: [{ type: String }],
  allowedMenuItems: [{ type: String }],
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', UserSchema);
