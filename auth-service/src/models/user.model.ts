import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';

export enum UserRole { ADMIN = 'admin', TEACHER = 'teacher', STUDENT = 'student' }

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  refreshTokens: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name:     { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role:     { type: String, enum: Object.values(UserRole), default: UserRole.STUDENT },
  isActive: { type: Boolean, default: true },
  refreshTokens: { type: [String], default: [], select: false },
  lastLogin: Date,
}, {
  timestamps: true,
 toJSON: {
  transform: (_doc, ret) => {
    const { password, refreshTokens, __v, ...rest } = ret;
    return rest;
  }
}
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(ENV.BCRYPT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
