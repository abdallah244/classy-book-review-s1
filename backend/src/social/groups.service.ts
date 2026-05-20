import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialGroup, SocialGroupDocument } from './schemas/group.schema';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(SocialGroup.name)
    private groupModel: Model<SocialGroupDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async createGroup(userId: string, dto: any): Promise<SocialGroupDocument> {
    const group = await this.groupModel.create({
      name: dto.name,
      description: dto.description,
      creatorId: new Types.ObjectId(userId),
      privacy: dto.privacy || 'public',
      coverImage: dto.coverImage,
      avatarImage: dto.avatarImage,
      requirePostApproval: dto.requirePostApproval || false,
      members: [
        {
          userId: new Types.ObjectId(userId),
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
    });
    return group;
  }

  async getAllGroups(page = 1, limit = 20, search = ''): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false, privacy: { $ne: 'secret' } }; // Don't show secret groups in public directory

    if (search) {
      filter.$text = { $search: search };
    }

    const [groups, total] = await Promise.all([
      this.groupModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-joinRequests')
        .lean(),
      this.groupModel.countDocuments(filter),
    ]);

    return {
      groups: groups.map((g) => ({
        ...g,
        membersCount: g.members?.length || 0,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getMyGroups(userId: string): Promise<any> {
    const groups = await this.groupModel
      .find({ 'members.userId': new Types.ObjectId(userId), isDeleted: false })
      .select('-joinRequests')
      .lean();

    return groups.map((g) => ({ ...g, membersCount: g.members?.length || 0 }));
  }

  async getGroupDetails(groupId: string, userId: string): Promise<any> {
    const group = await this.groupModel
      .findOne({ _id: new Types.ObjectId(groupId), isDeleted: false })
      .lean();
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.members.some((m) => m.userId.toString() === userId);
    const isAdmin = group.members.some(
      (m) => m.userId.toString() === userId && m.role === 'admin',
    );
    const hasRequested = group.joinRequests?.some(
      (id) => id.toString() === userId,
    );

    if (group.privacy === 'secret' && !isMember) {
      throw new NotFoundException('Group not found');
    }

    return {
      ...group,
      membersCount: group.members?.length || 0,
      isMember,
      isAdmin,
      hasRequested,
      // Hide members list if private and not a member
      members: group.privacy === 'private' && !isMember ? [] : group.members,
    };
  }

  async joinGroup(groupId: string, userId: string): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group || group.isDeleted)
      throw new NotFoundException('Group not found');

    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (isMember) throw new BadRequestException('You are already a member');

    if (group.privacy === 'public') {
      // Direct join
      group.members.push({
        userId: new Types.ObjectId(userId),
        role: 'member',
        joinedAt: new Date(),
      } as any);
      await group.save();
      return { status: 'joined', message: 'Joined successfully' };
    } else {
      // Request to join
      const hasRequested = group.joinRequests.some(
        (id) => id.toString() === userId,
      );
      if (hasRequested)
        throw new BadRequestException('Join request already sent');

      group.joinRequests.push(new Types.ObjectId(userId));
      await group.save();
      return { status: 'requested', message: 'Join request sent' };
    }
  }

  async leaveGroup(groupId: string, userId: string): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const memberIndex = group.members.findIndex(
      (m) => m.userId.toString() === userId,
    );
    if (memberIndex === -1)
      throw new BadRequestException('You are not a member');

    if (group.creatorId.toString() === userId) {
      throw new BadRequestException(
        'Group creator cannot leave. Reassign creator or delete group.',
      );
    }

    group.members.splice(memberIndex, 1);
    await group.save();
    return { success: true, message: 'Left group successfully' };
  }

  async handleJoinRequest(
    groupId: string,
    requesterId: string,
    adminId: string,
    action: 'approve' | 'reject',
  ): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const isAdmin = group.members.some(
      (m) => m.userId.toString() === adminId && m.role === 'admin',
    );
    if (!isAdmin)
      throw new ForbiddenException('Only group admins can manage requests');

    const reqIndex = group.joinRequests.findIndex(
      (id) => id.toString() === requesterId,
    );
    if (reqIndex === -1) throw new NotFoundException('Request not found');

    group.joinRequests.splice(reqIndex, 1);

    if (action === 'approve') {
      group.members.push({
        userId: new Types.ObjectId(requesterId),
        role: 'member',
        joinedAt: new Date(),
      } as any);
    }

    await group.save();
    return { success: true, message: `Request ${action}ed` };
  }

  // ═══════════════════════ GROUP POSTS ═══════════════════════

  async getGroupPosts(
    groupId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (group.privacy !== 'public' && !isMember) {
      throw new ForbiddenException('You must be a member to view posts');
    }

    const skip = (page - 1) * limit;
    const filter = {
      groupId: new Types.ObjectId(groupId),
      isDeleted: false,
      isApproved: true,
    };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar role')
        .populate('comments.userId', 'name avatar')
        .lean(),
      this.postModel.countDocuments(filter),
    ]);

    return {
      posts: posts.map((p: any) => ({
        ...p,
        id: p._id?.toString(),
        author: p.authorId,
        isLiked: p.likes?.some((l: any) => (l._id || l).toString() === userId),
        likesCount: p.likes?.length || 0,
        commentsCount: p.comments?.length || 0,
        isOwn: p.authorId?._id?.toString() === userId,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
