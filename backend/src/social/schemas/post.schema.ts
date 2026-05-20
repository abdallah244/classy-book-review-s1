import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true, _id: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  content: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop()
  createdAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({
  timestamps: true,
  collection: 'posts',
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: Record<string, any>) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class Post {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SocialGroup', index: true })
  groupId?: Types.ObjectId;

  @Prop({ default: true })
  isApproved: boolean;

  @Prop({ type: Types.ObjectId, ref: 'PartnerPage', index: true })
  partnerId?: Types.ObjectId;

  @Prop({ trim: true, maxlength: 5000 })
  content: string;

  @Prop({ type: [String], default: [] })
  media: string[];

  @Prop({
    type: String,
    enum: ['text', 'image', 'video', 'link', 'poll', 'repost'],
    default: 'text',
  })
  type: string;

  @Prop({ default: false })
  isRepost: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Post' })
  originalPostId: Types.ObjectId;

  @Prop({ default: 0 })
  repostCount: number;

  @Prop({
    type: {
      like: [{ type: Types.ObjectId, ref: 'User' }],
      love: [{ type: Types.ObjectId, ref: 'User' }],
      haha: [{ type: Types.ObjectId, ref: 'User' }],
      wow: [{ type: Types.ObjectId, ref: 'User' }],
      sad: [{ type: Types.ObjectId, ref: 'User' }],
      angry: [{ type: Types.ObjectId, ref: 'User' }],
    },
    default: { like: [], love: [], haha: [], wow: [], sad: [], angry: [] },
  })
  reactions: {
    like: Types.ObjectId[];
    love: Types.ObjectId[];
    haha: Types.ObjectId[];
    wow: Types.ObjectId[];
    sad: Types.ObjectId[];
    angry: Types.ObjectId[];
  };

  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];

  @Prop({ type: [String], default: [] })
  hashtags: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  mentions: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public',
  })
  visibility: string;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: 0 })
  shareCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ isDeleted: 1, createdAt: -1 });

PostSchema.virtual('likesCount').get(function (this: PostDocument) {
  const r = this.reactions;
  if (!r) return 0;
  return (
    (r.like?.length || 0) +
    (r.love?.length || 0) +
    (r.haha?.length || 0) +
    (r.wow?.length || 0) +
    (r.sad?.length || 0) +
    (r.angry?.length || 0)
  );
});

PostSchema.virtual('commentsCount').get(function (this: PostDocument) {
  return this.comments?.length || 0;
});
