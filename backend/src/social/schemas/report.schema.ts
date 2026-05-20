import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = SocialReport & Document;

@Schema({
  timestamps: true,
  collection: 'social_reports',
})
export class SocialReport {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['spam', 'inappropriate', 'harassment', 'hate_speech', 'other'],
    required: true,
  })
  reason: string;

  @Prop({ trim: true, maxlength: 500 })
  details?: string;

  @Prop({
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;
}

export const SocialReportSchema = SchemaFactory.createForClass(SocialReport);

SocialReportSchema.index({ postId: 1, status: 1 });
SocialReportSchema.index({ reporterId: 1, postId: 1 }, { unique: true }); // User can report a post only once
