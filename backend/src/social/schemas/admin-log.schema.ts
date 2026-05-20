import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminLogDocument = AdminSocialLog & Document;

@Schema({ timestamps: true, collection: 'admin_social_logs' })
export class AdminSocialLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  adminId: Types.ObjectId;

  @Prop({ required: true })
  action: string; // 'delete_post', 'ban_user', 'resolve_report', etc.

  @Prop({ required: true })
  targetId: string; // ID of the post, user, or report

  @Prop({ type: Object })
  details: any;

  @Prop()
  reason?: string;
}

export const AdminLogSchema = SchemaFactory.createForClass(AdminSocialLog);
