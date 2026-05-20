import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({
  timestamps: true,
  collection: 'courses',
  toJSON: {
    transform: (_, ret: Record<string, any>) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class Course {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  titleAr?: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  descriptionAr?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructor: Types.ObjectId;

  @Prop({ type: String, index: true })
  category?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  })
  level: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ type: String, default: 'EGP' })
  currency: string;

  @Prop({ default: 0 })
  duration: number; // minutes

  @Prop({
    type: [
      {
        title: String,
        titleAr: String,
        order: Number,
        lessons: [
          {
            title: String,
            titleAr: String,
            type: { type: String, enum: ['video', 'text', 'quiz'] },
            content: String,
            duration: Number,
            order: Number,
          },
        ],
      },
    ],
    default: [],
  })
  sections: {
    title: string;
    titleAr?: string;
    order: number;
    lessons: {
      title: string;
      titleAr?: string;
      type: 'video' | 'text' | 'quiz';
      content?: string;
      duration?: number;
      order: number;
    }[];
  }[];

  @Prop({ default: 0 })
  enrollmentCount: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.index({ title: 'text', description: 'text' });
CourseSchema.index({ instructor: 1, status: 1 });
CourseSchema.index({ category: 1, status: 1 });
CourseSchema.index({ createdAt: -1 });
