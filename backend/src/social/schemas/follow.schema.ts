import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FollowDocument = Follow & Document;

@Schema({
  timestamps: true,
  collection: 'follows',
})
export class Follow {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  followerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  followingId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['user', 'page', 'group'],
    default: 'user',
    index: true,
  })
  type: string;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// Compound unique index to prevent duplicate follows
FollowSchema.index(
  { followerId: 1, followingId: 1, type: 1 },
  { unique: true },
);
