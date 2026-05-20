import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PartnerPageDocument = PartnerPage & Document;

@Schema({
  timestamps: true,
  collection: 'social_partner_pages',
})
export class PartnerPage {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username: string; // e.g. @microsoft

  @Prop({ trim: true, maxlength: 2000 })
  bio: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  admins: Types.ObjectId[]; // Other users who can manage the page

  @Prop()
  category: string; // e.g. Education, Technology, Public Figure

  @Prop()
  websiteUrl?: string;

  @Prop()
  logoImage?: string;

  @Prop()
  coverImage?: string;

  @Prop({ default: false })
  isVerified: boolean; // Blue checkmark

  @Prop({ default: true })
  isActive: boolean;

  // Social Stats stored directly for fast access
  @Prop({ default: 0 })
  followersCount: number;
}

export const PartnerPageSchema = SchemaFactory.createForClass(PartnerPage);

PartnerPageSchema.index({ name: 'text', username: 'text' });
