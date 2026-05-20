import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (_, ret: Record<string, any>) => {
      delete ret.password;
      delete ret.failedLoginAttempts;
      delete ret.lockUntil;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop()
  avatar?: string;

  @Prop({
    type: String,
    enum: ['student', 'teacher', 'admin', 'super_admin'],
    default: 'student',
    index: true,
  })
  role: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isSocialBanned: boolean; // Prevent from posting/commenting

  @Prop({ default: false })
  isLocked: boolean;

  @Prop()
  lockUntil?: Date;

  @Prop()
  lockReason?: string; // Reason for locking

  @Prop()
  lockedBy?: Types.ObjectId; // Admin who locked

  @Prop({ default: 0, select: false })
  failedLoginAttempts: number;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastActivityAt?: Date;

  @Prop()
  passwordChangedAt?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop({ type: Object, default: {} })
  profile: {
    bio?: string;
    coverPhoto?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female';
    country?: string;
    city?: string;
    education?: string;
    occupation?: string;
  };

  @Prop({ type: Object, default: {} })
  preferences: {
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };

  @Prop({ type: Object })
  subscription?: {
    plan?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'active' | 'expired' | 'cancelled';
  };

  // Soft Delete
  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  deletedBy?: Types.ObjectId;

  // Primary Admin flag - cannot be deleted
  @Prop({ default: false })
  isPrimaryAdmin: boolean;

  // Multi-tenancy support
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1, isDeleted: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ tenantId: 1, isDeleted: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'userId',
});
