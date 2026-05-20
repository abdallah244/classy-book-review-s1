import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { SocialReport, ReportDocument } from './schemas/report.schema';
import { AdminSocialLog, AdminLogDocument } from './schemas/admin-log.schema';
import { User, UserDocument } from '../security/users/schemas/user.schema';

@Injectable()
export class AdminSocialService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(SocialReport.name) private reportModel: Model<ReportDocument>,
    @InjectModel(AdminSocialLog.name) private logModel: Model<AdminLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getAllPosts(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { hashtags: { $regex: search, $options: 'i' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar role')
        .lean(),
      this.postModel.countDocuments(filter),
    ]);

    return {
      posts: posts.map((p) => this.formatAdminPost(p)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async deletePostAdmin(postId: string, adminId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    // Hard delete or soft delete depending on admin needs. We'll do soft delete.
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    // Log action
    await this.logModel.create({
      adminId: new Types.ObjectId(adminId),
      action: 'delete_post',
      targetId: postId,
      details: { postAuthor: post.authorId },
    });

    return { success: true, message: 'Post removed by admin' };
  }

  async togglePinPostAdmin(postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    post.isPinned = !post.isPinned;
    await post.save();
    return { success: true, isPinned: post.isPinned };
  }

  async deleteCommentAdmin(postId: string, commentId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const initialLength = post.comments.length;
    post.comments = post.comments.filter(
      (c: any) => c._id.toString() !== commentId,
    );

    if (post.comments.length === initialLength) {
      throw new NotFoundException('Comment not found');
    }

    await post.save();
    return { success: true, message: 'Comment removed by admin' };
  }

  // ═══════════════════════ REPORTS ═══════════════════════

  async getReports(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporterId', 'name email avatar')
        .populate({
          path: 'postId',
          select: 'content authorId isDeleted',
          populate: {
            path: 'authorId',
            select: 'name email avatar isSocialBanned',
          },
        })
        .lean(),
      this.reportModel.countDocuments(filter),
    ]);

    return {
      reports,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async resolveReport(
    reportId: string,
    action: 'dismissed' | 'reviewed',
    adminId: string,
  ) {
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');

    report.status = action;
    report.reviewedBy = new Types.ObjectId(adminId);
    report.reviewedAt = new Date();
    await report.save();

    // Log action
    await this.logModel.create({
      adminId: new Types.ObjectId(adminId),
      action: 'resolve_report',
      targetId: reportId,
      details: { action, reporter: report.reporterId },
    });

    return { success: true, message: `Report marked as ${action}` };
  }

  // ═══════════════════════ USER PUNISHMENTS ═══════════════════════

  async toggleSocialBan(userId: string, adminId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.isSocialBanned = !user.isSocialBanned;
    await user.save();

    // Log action
    await this.logModel.create({
      adminId: new Types.ObjectId(adminId),
      action: user.isSocialBanned ? 'ban_user' : 'unban_user',
      targetId: userId,
    });

    return {
      success: true,
      isSocialBanned: user.isSocialBanned,
      message: user.isSocialBanned
        ? 'User banned from social features'
        : 'User ban lifted',
    };
  }

  async getSocialStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalPosts, todayPosts, totalComments, totalLikes] =
      await Promise.all([
        this.postModel.countDocuments({ isDeleted: false }),
        this.postModel.countDocuments({
          isDeleted: false,
          createdAt: { $gte: today },
        }),
        // aggregate total comments
        this.postModel
          .aggregate([
            { $match: { isDeleted: false } },
            { $project: { commentsCount: { $size: '$comments' } } },
            { $group: { _id: null, total: { $sum: '$commentsCount' } } },
          ])
          .then((res) => res[0]?.total || 0),
        // aggregate total likes/reactions
        this.postModel
          .aggregate([
            { $match: { isDeleted: false } },
            {
              $project: {
                totalReactions: {
                  $add: [
                    { $size: { $ifNull: ['$reactions.like', []] } },
                    { $size: { $ifNull: ['$reactions.love', []] } },
                    { $size: { $ifNull: ['$reactions.haha', []] } },
                    { $size: { $ifNull: ['$reactions.wow', []] } },
                    { $size: { $ifNull: ['$reactions.sad', []] } },
                    { $size: { $ifNull: ['$reactions.angry', []] } },
                  ],
                },
              },
            },
            { $group: { _id: null, total: { $sum: '$totalReactions' } } },
          ])
          .then((res) => res[0]?.total || 0),
      ]);

    return { totalPosts, todayPosts, totalComments, totalLikes };
  }

  private formatAdminPost(post: any) {
    return {
      id: post._id,
      content: post.content,
      media: post.media,
      author: post.authorId,
      createdAt: post.createdAt,
      likesCount:
        (post.reactions?.like?.length || 0) +
        (post.reactions?.love?.length || 0) +
        (post.reactions?.haha?.length || 0) +
        (post.reactions?.wow?.length || 0) +
        (post.reactions?.sad?.length || 0) +
        (post.reactions?.angry?.length || 0),
      commentsCount: post.comments?.length || 0,
      isDeleted: post.isDeleted,
      isPinned: post.isPinned,
      visibility: post.visibility,
    };
  }
}
