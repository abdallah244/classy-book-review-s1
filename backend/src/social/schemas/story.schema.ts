import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoryDocument = SocialStory & Document;

@Schema({
  timestamps: true,
  collection: 'social_stories',
})
export class SocialStory {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  mediaUrl: string;

  @Prop({ type: String, enum: ['image', 'video'], default: 'image' })
  mediaType: string;

  @Prop({ required: true, index: true })
  expiresAt: Date; // Should be set to 24 hours after creation

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  viewers: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const StorySchema = SchemaFactory.createForClass(SocialStory);

// Note: expiresAt index is already defined in the @Prop decorator above
