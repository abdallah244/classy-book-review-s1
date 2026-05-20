import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = SocialMessage & Document;

@Schema({ timestamps: true, _id: true })
export class MessageReaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  emoji: string;
}
export const MessageReactionSchema =
  SchemaFactory.createForClass(MessageReaction);

@Schema({
  timestamps: true,
  collection: 'social_messages',
})
export class SocialMessage {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  receiverId?: Types.ObjectId; // For 1-on-1 chat

  @Prop({ type: Types.ObjectId, ref: 'SocialGroup', index: true })
  groupId?: Types.ObjectId; // For group chats

  @Prop({ trim: true, maxlength: 2000 })
  content: string;

  @Prop()
  mediaUrl?: string; // Image, Video, or Audio

  @Prop({
    type: String,
    enum: ['text', 'image', 'audio', 'video'],
    default: 'text',
  })
  messageType: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ type: [MessageReactionSchema], default: [] })
  reactions: MessageReaction[];

  @Prop({ default: false })
  isDeleted: boolean; // Soft delete
}

export const SocialMessageSchema = SchemaFactory.createForClass(SocialMessage);

// Index to quickly fetch conversations between two users
SocialMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
SocialMessageSchema.index({ groupId: 1, createdAt: -1 });
