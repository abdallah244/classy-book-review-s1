import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LoginAttempt extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true, default: false })
  success: boolean;

  @Prop()
  failureReason?: string;

  @Prop()
  sessionId?: string;

  @Prop()
  deviceFingerprint?: string;

  @Prop()
  userId?: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

// Indexes for better query performance
LoginAttemptSchema.index({ email: 1, timestamp: -1 });
LoginAttemptSchema.index({ ipAddress: 1, timestamp: -1 });
LoginAttemptSchema.index({ success: 1, timestamp: -1 });
LoginAttemptSchema.index({ timestamp: -1 });

// TTL index to auto-delete old attempts after 90 days
LoginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
