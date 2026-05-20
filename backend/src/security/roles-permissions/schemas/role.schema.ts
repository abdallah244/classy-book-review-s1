import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({
  timestamps: true,
  collection: 'roles',
})
export class Role {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop()
  displayName: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Boolean, default: false })
  isSystem: boolean;

  @Prop({ type: Number, default: 0 })
  level: number;

  @Prop({ type: Types.ObjectId, ref: 'Tenant' })
  tenantId?: Types.ObjectId;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ name: 1, tenantId: 1 }, { unique: true });
