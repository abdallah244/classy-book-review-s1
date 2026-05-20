import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookmarkDocument = SocialBookmark & Document;

@Schema({
  timestamps: true,
  collection: 'social_bookmarks',
})
export class SocialBookmark {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId: Types.ObjectId;
}

export const BookmarkSchema = SchemaFactory.createForClass(SocialBookmark);

// Compound index to prevent duplicate bookmarks and speed up lookup
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
