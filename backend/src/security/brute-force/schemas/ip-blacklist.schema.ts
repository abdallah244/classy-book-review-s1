import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class IPBlacklist extends Document {
  @Prop({ required: true, unique: true })
  ipAddress: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: false })
  isPermanent: boolean;

  @Prop()
  blockedUntil?: Date;

  @Prop()
  blockedBy?: string; // Admin ID who blocked this IP

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const IPBlacklistSchema = SchemaFactory.createForClass(IPBlacklist);

// Indexes
IPBlacklistSchema.index({ isActive: 1 });
IPBlacklistSchema.index({ blockedUntil: 1 });
