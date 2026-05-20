import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SocialNotificationDocument = SocialNotification & Document;

@Schema({
  timestamps: true,
  collection: 'social_notifications',
})
export class SocialNotification {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId; // User who triggered the notification

  @Prop({
    type: String,
    enum: [
      'like',
      'comment',
      'follow',
      'group_invite',
      'group_request',
      'message',
      'admin_alert',
      'reaction',
      'repost',
      'page',
    ],
    required: true,
  })
  type: string;

  @Prop({ type: Types.ObjectId })
  relatedId?: Types.ObjectId; // ID of Post, Group, or Message

  @Prop({ trim: true })
  content?: string; // Optional custom message

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SocialNotificationSchema =
  SchemaFactory.createForClass(SocialNotification);

// Index to quickly fetch unread notifications for a user
SocialNotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
