import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({
  timestamps: true,
  collection: 'audit_logs',
})
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ type: Types.ObjectId })
  resourceId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'other'],
    index: true,
  })
  actionType: string;

  @Prop({ type: Object })
  oldData?: Record<string, any>;

  @Prop({ type: Object })
  newData?: Record<string, any>;

  @Prop({ type: Object })
  changes?: Record<string, { from: any; to: any }>;

  @Prop({ required: true })
  ip: string;

  @Prop()
  userAgent?: string;

  @Prop()
  method?: string;

  @Prop()
  path?: string;

  @Prop({ type: Object })
  query?: Record<string, any>;

  @Prop({
    type: String,
    enum: ['success', 'failure', 'error'],
    default: 'success',
  })
  status: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  duration?: number;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for fast search
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

// TTL Index - delete after one year
AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 },
);
