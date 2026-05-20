import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({
  timestamps: true,
  collection: 'refresh_tokens',
})
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  tokenHash: string;

  @Prop({ type: Object, default: {} })
  deviceInfo: {
    userAgent?: string;
    ip?: string;
    deviceId?: string;
    platform?: string;
  };

  @Prop({ required: true })
  expiresAt: Date;

  // وقت انتهاء الجلسة (منفصل عن الـ refresh token)
  // هذا هو الوقت الذي يمكن تمديده من صفحة المراقبة
  @Prop({ required: true })
  sessionExpiresAt: Date;

  @Prop({ default: false, index: true })
  isRevoked: boolean;

  @Prop()
  revokedAt?: Date;

  @Prop()
  revokedReason?: string;

  @Prop()
  lastUsedAt?: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Note: Indexes are managed centrally by IndexManagerService
// to avoid duplicate index warnings
