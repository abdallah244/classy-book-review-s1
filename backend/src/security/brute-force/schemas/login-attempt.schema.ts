import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoginAttemptDocument = LoginAttempt & Document;

@Schema({
  timestamps: true,
  collection: 'login_attempts',
})
export class LoginAttempt {
  @Prop({ required: true, index: true })
  identifier: string; // email or IP

  @Prop({ required: true })
  ip: string;

  @Prop()
  email?: string;

  @Prop({ default: false })
  success: boolean;

  @Prop()
  userAgent?: string;

  @Prop()
  reason?: string;

  @Prop({ default: Date.now, expires: 86400 }) // Expires after 24 hours
  createdAt: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

LoginAttemptSchema.index({ identifier: 1, createdAt: -1 });
LoginAttemptSchema.index({ ip: 1, createdAt: -1 });
