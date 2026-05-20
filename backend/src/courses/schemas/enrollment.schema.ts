import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

@Schema({
  timestamps: true,
  collection: 'enrollments',
  toJSON: {
    transform: (_, ret: Record<string, any>) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class Enrollment {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progress: number;

  @Prop({ type: [String], default: [] })
  completedLessons: string[];

  @Prop()
  completedAt?: Date;

  @Prop()
  lastAccessedAt?: Date;

  @Prop({ default: 0 })
  totalTimeSpent: number; // minutes

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId?: Types.ObjectId;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ userId: 1, status: 1 });
