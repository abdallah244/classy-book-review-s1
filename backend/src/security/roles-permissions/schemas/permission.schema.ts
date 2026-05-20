import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({
  timestamps: true,
  collection: 'permissions',
})
export class Permission {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  module: string;

  @Prop({
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'manage', 'execute'],
    required: true,
  })
  action: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ module: 1, action: 1 });
