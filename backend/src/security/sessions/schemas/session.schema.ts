import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({
  timestamps: true,
  collection: 'sessions',
})
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({
    type: {
      browser: String,
      os: String,
      device: String,
      ip: String,
      userAgent: String,
    },
    required: true,
  })
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    ip: string;
    userAgent: string;
  };

  @Prop({ type: String })
  fingerprint?: string;

  @Prop({ required: true })
  lastActivityAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String })
  revokedReason?: string;

  @Prop()
  revokedAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Note: Indexes are managed centrally by IndexManagerService
// to avoid duplicate index warnings
