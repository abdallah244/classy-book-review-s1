import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({
  timestamps: true,
  collection: 'api_keys',
})
export class ApiKey {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true, select: false })
  hashedKey: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: [String], default: [] })
  allowedIps: string[];

  @Prop({ type: [String], default: [] })
  allowedDomains: string[];

  @Prop()
  rateLimit?: number; // Requests per minute

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  expiresAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  revokedAt?: Date;

  @Prop()
  revokedReason?: string;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Index for fast search
ApiKeySchema.index({ ownerId: 1, isActive: 1 });
ApiKeySchema.index({ key: 1, isActive: 1 });

// Don't show full key in query
ApiKeySchema.set('toJSON', {
  transform: (_, ret: Record<string, any>) => {
    if (ret.key) {
      ret.keyPrefix = ret.key.substring(0, 8) + '...';
      delete ret.key;
    }
    delete ret.hashedKey;
    return ret;
  },
});
