import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  username: string;
  phone?: string;
  phoneVerified: boolean;
  wechatOpenid?: string;
  wechatUnionid?: string;
  wechatNickname?: string;
  wechatAvatar?: string;
  email?: string;
  password?: string;
  createdAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    minlength: [2, 'Username must be at least 2 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^1[3-9]\d{9}$/, 'Please enter a valid Chinese phone number'],
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  wechatOpenid: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  wechatUnionid: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  wechatNickname: {
    type: String,
    required: false,
  },
  wechatAvatar: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: false,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ phone: 1 });
userSchema.index({ wechatOpenid: 1 });
userSchema.index({ wechatUnionid: 1 });

const User = mongoose.model<IUser>('User', userSchema);
export default User;
