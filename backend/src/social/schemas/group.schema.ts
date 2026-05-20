import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SocialGroupDocument = SocialGroup & Document;

@Schema({ timestamps: true, _id: true })
export class GroupMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member',
  })
  role: string;

  @Prop({ default: Date.now })
  joinedAt: Date;
}

export const GroupMemberSchema = SchemaFactory.createForClass(GroupMember);

@Schema({
  timestamps: true,
  collection: 'social_groups',
})
export class SocialGroup {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ trim: true, maxlength: 1000 })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'public',
  })
  privacy: string; // public (anyone can see/join), private (anyone can see, approval to join), secret (hidden)

  @Prop()
  coverImage?: string;

  @Prop()
  avatarImage?: string;

  @Prop({ type: [GroupMemberSchema], default: [] })
  members: GroupMember[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  joinRequests: Types.ObjectId[]; // Pending requests for private groups

  @Prop({ default: false })
  requirePostApproval: boolean; // If true, posts need admin approval

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SocialGroupSchema = SchemaFactory.createForClass(SocialGroup);

SocialGroupSchema.index({ name: 'text', description: 'text' });
SocialGroupSchema.index({ 'members.userId': 1 });
