import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ModerationService } from './moderation.service';
import { Post, PostDocument } from './schemas/post.schema';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { SocialReport, ReportDocument } from './schemas/report.schema';
import { User, UserDocument } from '../security/users/schemas/user.schema';
import {
  SocialNotification,
  SocialNotificationDocument,
} from './schemas/notification.schema';
import { CreatePostDto, UpdatePostDto, CreateCommentDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(SocialReport.name) private reportModel: Model<ReportDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SocialNotification.name)
    private notificationModel: Model<SocialNotificationDocument>,
    private readonly moderationService: ModerationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ═══════════════════════ POSTS ═══════════════════════

  private async checkUserSocialStatus(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.isSocialBanned) {
      throw new ForbiddenException(
        'You are temporarily banned from posting and commenting due to policy violations.',
      );
    }
  }

  async createPost(userId: string, dto: CreatePostDto): Promise<PostDocument> {
    await this.checkUserSocialStatus(userId);
    const cleanedContent = this.moderationService.cleanText(dto.content);

    const hashtagRegex = /#(\w+)/g;
    const extractedHashtags: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = hashtagRegex.exec(cleanedContent)) !== null) {
      extractedHashtags.push(match[1].toLowerCase());
    }

    const post = new this.postModel({
      authorId: new Types.ObjectId(userId),
      content: cleanedContent,
      media: dto.media || [],
      type: dto.type || 'text',
      hashtags: [...new Set([...(dto.hashtags || []), ...extractedHashtags])],
      mentions: (dto.mentions || []).map((id) => new Types.ObjectId(id)),
      visibility: dto.visibility || 'public',
    });

    const saved = await post.save();
    return this.getPostById(saved._id.toString(), userId);
  }

  async getFeed(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ posts: any[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;

    const following = await this.followModel
      .find({ followerId: new Types.ObjectId(userId) })
      .select('followingId');
    const followingIds = following.map((f) => f.followingId);

    const filter = {
      isDeleted: false,
      $or: [
        { authorId: new Types.ObjectId(userId) },
        { authorId: { $in: followingIds } },
        { visibility: 'public' },
      ],
    };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar role profile')
        .populate({
          path: 'originalPostId',
          populate: { path: 'authorId', select: 'name avatar role' },
        })
        .populate('comments.userId', 'name avatar')
        .lean(),
      this.postModel.countDocuments(filter),
    ]);

    return {
      posts: posts.map((p) => this.formatPost(p, userId)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getPostById(postId: string, userId?: string): Promise<any> {
    const post = await this.postModel
      .findOne({
        _id: new Types.ObjectId(postId),
        isDeleted: false,
      })
      .populate('authorId', 'name email avatar role profile')
      .populate({
        path: 'originalPostId',
        populate: { path: 'authorId', select: 'name avatar role' },
      })
      .populate('comments.userId', 'name avatar')
      .lean();

    if (!post) throw new NotFoundException('Post not found');

    await this.postModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { viewCount: 1 } },
    );

    return this.formatPost(post, userId);
  }

  async updatePost(
    postId: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<any> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    Object.assign(post, dto);
    await post.save();

    return this.getPostById(postId, userId);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();
  }

  async repost(
    userId: string,
    originalPostId: string,
    content?: string,
  ): Promise<any> {
    const originalPost = await this.postModel.findById(originalPostId);
    if (!originalPost) throw new NotFoundException('Original post not found');

    const repost = new this.postModel({
      authorId: new Types.ObjectId(userId),
      content: content || '',
      type: 'repost',
      isRepost: true,
      originalPostId: new Types.ObjectId(originalPostId),
      visibility: 'public',
    });

    const saved = await repost.save();

    await this.postModel.updateOne(
      { _id: originalPost._id },
      { $inc: { repostCount: 1 } },
    );

    if (originalPost.authorId.toString() !== userId) {
      await this.createNotification({
        recipientId: originalPost.authorId.toString(),
        senderId: userId,
        type: 'repost',
        postId: saved._id.toString(),
        message: 'reposted your post',
      });
    }

    return this.getPostById(saved._id.toString(), userId);
  }

  // ═══════════════════════ REACTIONS ═══════════════════════

  async toggleReaction(userId: string, postId: string, type: string = 'like') {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const uid = new Types.ObjectId(userId);
    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    if (!validTypes.includes(type)) type = 'like';

    if (!post.reactions) {
      post.reactions = {
        like: [],
        love: [],
        haha: [],
        wow: [],
        sad: [],
        angry: [],
      };
    }

    // Check if user already has THIS specific reaction
    const alreadyHasThis = post.reactions[type].some(
      (id) => id.toString() === userId,
    );

    // Remove user from ALL reaction types
    validTypes.forEach((t) => {
      post.reactions[t] = post.reactions[t].filter(
        (id) => id.toString() !== userId,
      );
    });

    // If it was NOT this specific type, add it (Switch or Add)
    if (!alreadyHasThis) {
      post.reactions[type].push(uid);

      // Send notification (if not own post)
      if (post.authorId.toString() !== userId) {
        await this.createNotification({
          recipientId: post.authorId.toString(),
          senderId: userId,
          type: 'reaction',
          postId,
          message: `reacted with ${type} to your post`,
        });
      }
    }

    post.markModified('reactions');
    await post.save();

    return { success: true, reactions: post.reactions };
  }

  // ═══════════════════════ COMMENTS ═══════════════════════

  async addComment(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<any> {
    await this.checkUserSocialStatus(userId);
    const cleanedContent = this.moderationService.cleanText(dto.content);

    const post = await this.postModel.findOne({
      _id: new Types.ObjectId(postId),
      isDeleted: false,
    });
    if (!post) throw new NotFoundException('Post not found');

    post.comments.push({
      userId: new Types.ObjectId(userId),
      content: cleanedContent,
      likes: [],
      createdAt: new Date(),
    } as any);
    await post.save();

    if (post.authorId.toString() !== userId) {
      await this.createNotification({
        recipientId: post.authorId.toString(),
        senderId: userId,
        type: 'comment',
        postId,
        message: 'commented on your post',
      });
    }

    return this.getPostById(postId, userId);
  }

  async deleteComment(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<any> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const commentIndex = post.comments.findIndex(
      (c: any) =>
        c._id.toString() === commentId && c.userId.toString() === userId,
    );
    if (commentIndex === -1) {
      throw new ForbiddenException('Comment not found or not yours');
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    return this.getPostById(postId, userId);
  }

  // ═══════════════════════ FOLLOWS ═══════════════════════

  async toggleFollow(
    userId: string,
    targetUserId: string,
  ): Promise<{ following: boolean }> {
    if (userId === targetUserId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const existing = await this.followModel.findOne({
      followerId: new Types.ObjectId(userId),
      followingId: new Types.ObjectId(targetUserId),
    });

    if (existing) {
      await this.followModel.deleteOne({ _id: existing._id });
      return { following: false };
    }

    await this.followModel.create({
      followerId: new Types.ObjectId(userId),
      followingId: new Types.ObjectId(targetUserId),
    });

    await this.createNotification({
      recipientId: targetUserId,
      senderId: userId,
      type: 'follow',
      message: 'started following you',
    });

    return { following: true };
  }

  async getFollowers(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [followers, total] = await Promise.all([
      this.followModel
        .find({ followingId: new Types.ObjectId(userId) })
        .skip(skip)
        .limit(limit)
        .populate('followerId', 'name email avatar profile')
        .lean(),
      this.followModel.countDocuments({
        followingId: new Types.ObjectId(userId),
      }),
    ]);

    return {
      users: followers.map((f) => f.followerId),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [following, total] = await Promise.all([
      this.followModel
        .find({ followerId: new Types.ObjectId(userId) })
        .skip(skip)
        .limit(limit)
        .populate('followingId', 'name email avatar profile')
        .lean(),
      this.followModel.countDocuments({
        followerId: new Types.ObjectId(userId),
      }),
    ]);

    return {
      users: following.map((f) => f.followingId),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getFollowStats(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      this.followModel.countDocuments({
        followingId: new Types.ObjectId(userId),
      }),
      this.followModel.countDocuments({
        followerId: new Types.ObjectId(userId),
      }),
    ]);
    return { followersCount, followingCount };
  }

  async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    const doc = await this.followModel.findOne({
      followerId: new Types.ObjectId(userId),
      followingId: new Types.ObjectId(targetUserId),
    });
    return !!doc;
  }

  async getSuggestedUsers(userId: string, limit = 5): Promise<any[]> {
    const following = await this.followModel
      .find({ followerId: new Types.ObjectId(userId) })
      .select('followingId');
    const followingIds = following.map((f) => f.followingId);

    return this.userModel.aggregate([
      {
        $match: {
          _id: { $nin: [new Types.ObjectId(userId), ...followingIds] },
          isDeleted: false,
        },
      },
      { $sample: { size: limit } },
      {
        $project: {
          name: 1,
          avatar: 1,
          role: 1,
          'profile.bio': 1,
        },
      },
    ]);
  }

  // ═══════════════════════ USER PROFILE / POSTS ═══════════════════════

  async getUserPosts(
    targetUserId: string,
    viewerId?: string,
    page = 1,
    limit = 20,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {
      authorId: new Types.ObjectId(targetUserId),
      isDeleted: false,
    };

    if (viewerId !== targetUserId) {
      filter.visibility = 'public';
    }

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar role profile')
        .populate('comments.userId', 'name avatar')
        .lean(),
      this.postModel.countDocuments(filter),
    ]);

    return {
      posts: posts.map((p) => this.formatPost(p, viewerId)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserProfile(targetUserId: string, viewerId?: string): Promise<any> {
    const user = await this.userModel
      .findById(targetUserId)
      .select('name email avatar role profile createdAt')
      .lean();
    if (!user) throw new NotFoundException('User not found');

    const [stats, postsCount, isFollowingUser] = await Promise.all([
      this.getFollowStats(targetUserId),
      this.postModel.countDocuments({
        authorId: new Types.ObjectId(targetUserId),
        isDeleted: false,
      }),
      viewerId ? this.isFollowing(viewerId, targetUserId) : false,
    ]);

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      followersCount: stats.followersCount,
      followingCount: stats.followingCount,
      postsCount,
      isFollowing: isFollowingUser,
    };
  }

  // ═══════════════════════ SEARCH & TRENDING ═══════════════════════

  async searchPosts(
    query: string,
    page = 1,
    limit = 20,
    userId?: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {
      isDeleted: false,
      visibility: 'public',
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { hashtags: { $regex: query, $options: 'i' } },
      ],
    };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar role profile')
        .lean(),
      this.postModel.countDocuments(filter),
    ]);

    return {
      posts: posts.map((p) => this.formatPost(p, userId)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getTrendingHashtags(limit = 10): Promise<any[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.postModel.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: oneWeekAgo } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 as const } },
      { $limit: limit },
      { $project: { hashtag: '$_id', count: 1, _id: 0 } },
    ]);
  }

  // ═══════════════════════ NOTIFICATIONS ═══════════════════════

  async getNotifications(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const filter = { recipientId: new Types.ObjectId(userId) };

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'name avatar')
        .populate('postId', 'content')
        .lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ ...filter, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async markNotificationsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { recipientId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async markNotificationRead(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.notificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
      },
      { isRead: true, readAt: new Date() },
    );
  }

  // ═══════════════════════ HELPERS ═══════════════════════

  private formatPost(post: any, viewerId?: string): any {
    const r = post.reactions || {
      like: [],
      love: [],
      haha: [],
      wow: [],
      sad: [],
      angry: [],
    };
    const likesCount =
      (r.like?.length || 0) +
      (r.love?.length || 0) +
      (r.haha?.length || 0) +
      (r.wow?.length || 0) +
      (r.sad?.length || 0) +
      (r.angry?.length || 0);

    let isLiked = false;
    if (viewerId) {
      isLiked = Object.values(r).some((list: any) =>
        list.some((id: any) => (id._id || id).toString() === viewerId),
      );
    }

    const formatted = {
      ...post,
      id: post._id?.toString(),
      author: post.authorId,
      isLiked,
      likesCount,
      commentsCount: post.comments?.length || 0,
      repostCount: post.repostCount || 0,
      isOwn: viewerId
        ? (post.authorId?._id || post.authorId)?.toString() === viewerId
        : false,
      originalPost: post.originalPostId
        ? {
            ...post.originalPostId,
            id: post.originalPostId._id?.toString(),
            author: post.originalPostId.authorId,
          }
        : null,
    };
    delete formatted.authorId;
    return formatted;
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.cloudinaryService.uploadImage(file, 'social_media'),
    );
    const results = await Promise.all(uploadPromises);
    return results.map((res) => res.secure_url);
  }

  private async createNotification(data: {
    recipientId: string;
    senderId: string;
    type: string;
    postId?: string;
    message: string;
  }): Promise<void> {
    try {
      await this.notificationModel.create({
        recipientId: new Types.ObjectId(data.recipientId),
        senderId: new Types.ObjectId(data.senderId),
        type: data.type,
        relatedId: data.postId ? new Types.ObjectId(data.postId) : undefined,
        content: data.message,
      });
    } catch (err) {
      this.logger.error('Failed to create notification', err);
    }
  }

  async reportPost(
    userId: string,
    postId: string,
    reason: string,
    details?: string,
  ): Promise<void> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    await this.reportModel.create({
      reporterId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
      reason,
      details,
    });
  }
}
