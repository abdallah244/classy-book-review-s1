import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialStory, StoryDocument } from './schemas/story.schema';
import { Follow, FollowDocument } from './schemas/follow.schema';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(SocialStory.name) private storyModel: Model<StoryDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
  ) {}

  async createStory(userId: string, dto: any): Promise<StoryDocument> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expiry in 24 hours

    const story = await this.storyModel.create({
      userId: new Types.ObjectId(userId),
      mediaUrl: dto.mediaUrl,
      mediaType: dto.mediaType || 'image',
      expiresAt,
    });
    return story;
  }

  async getFeedStories(userId: string): Promise<any[]> {
    const uid = new Types.ObjectId(userId);

    // 1. Get users the current user follows
    const following = await this.followModel
      .find({ followerId: uid, type: 'user' })
      .lean();
    const followedIds = following.map((f) => f.followingId);

    // 2. Include self
    const userIds = [...followedIds, uid];

    // 3. Find active stories (not expired and not deleted)
    const now = new Date();
    const stories = await this.storyModel
      .find({
        userId: { $in: userIds },
        expiresAt: { $gt: now },
        isDeleted: false,
      })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // 4. Group stories by user (like Instagram)
    const grouped = stories.reduce((acc: any, story: any) => {
      const authorId = story.userId._id.toString();
      if (!acc[authorId]) {
        acc[authorId] = {
          user: story.userId,
          stories: [],
          hasUnseen: false,
        };
      }
      acc[authorId].stories.push(story);
      if (!story.viewers.some((v: any) => v.toString() === userId)) {
        acc[authorId].hasUnseen = true;
      }
      return acc;
    }, {});

    return Object.values(grouped);
  }

  async viewStory(userId: string, storyId: string): Promise<void> {
    await this.storyModel.findByIdAndUpdate(storyId, {
      $addToSet: { viewers: new Types.ObjectId(userId) },
    });
  }

  async deleteStory(userId: string, storyId: string): Promise<void> {
    const story = await this.storyModel.findOne({
      _id: storyId,
      userId: new Types.ObjectId(userId),
    });
    if (!story) throw new NotFoundException('Story not found or unauthorized');

    story.isDeleted = true;
    await story.save();
  }
}
