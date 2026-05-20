import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PartnerPage,
  PartnerPageDocument,
} from './schemas/partner-page.schema';
import { Follow, FollowDocument } from './schemas/follow.schema';

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(PartnerPage.name)
    private pageModel: Model<PartnerPageDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
  ) {}

  async createPage(userId: string, dto: any): Promise<PartnerPageDocument> {
    const existingUsername = await this.pageModel.findOne({
      username: dto.username.toLowerCase(),
    });
    if (existingUsername) {
      throw new BadRequestException(
        'Username is already taken by another page.',
      );
    }

    const page = await this.pageModel.create({
      name: dto.name,
      username: dto.username.toLowerCase(),
      bio: dto.bio,
      ownerId: new Types.ObjectId(userId),
      admins: [new Types.ObjectId(userId)],
      category: dto.category,
      websiteUrl: dto.websiteUrl,
      logoImage: dto.logoImage,
      coverImage: dto.coverImage,
    });
    return page;
  }

  async getAllPages(
    page = 1,
    limit = 20,
    search = '',
    category = '',
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = { isActive: true };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;

    const [pages, total] = await Promise.all([
      this.pageModel
        .find(filter)
        .sort({ isVerified: -1, followersCount: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.pageModel.countDocuments(filter),
    ]);

    return {
      pages,
      total,
      page,
    };
  }

  async getMyPages(userId: string): Promise<any> {
    return await this.pageModel
      .find({ admins: new Types.ObjectId(userId), isActive: true })
      .lean();
  }

  async getPageDetails(usernameOrId: string, userId: string): Promise<any> {
    const isObjectId = Types.ObjectId.isValid(usernameOrId);
    const filter = isObjectId
      ? { _id: usernameOrId }
      : { username: usernameOrId.toLowerCase() };

    const page = await this.pageModel
      .findOne({ ...filter, isActive: true })
      .lean();
    if (!page) throw new NotFoundException('Page not found');

    const isAdmin = page.admins.some((id) => id.toString() === userId);

    // Check if current user is following the page
    const followRecord = await this.followModel.findOne({
      followerId: new Types.ObjectId(userId),
      followingId: page._id,
      type: 'page',
    });

    return {
      ...page,
      isAdmin,
      isFollowing: !!followRecord,
    };
  }

  async followPage(pageId: string, userId: string): Promise<any> {
    const page = await this.pageModel.findById(pageId);
    if (!page) throw new NotFoundException('Page not found');

    const existingFollow = await this.followModel.findOne({
      followerId: new Types.ObjectId(userId),
      followingId: new Types.ObjectId(pageId),
      type: 'page',
    });

    if (existingFollow) {
      // Unfollow
      await this.followModel.findByIdAndDelete(existingFollow._id);
      await this.pageModel.findByIdAndUpdate(pageId, {
        $inc: { followersCount: -1 },
      });
      return {
        success: true,
        isFollowing: false,
        message: 'Unfollowed successfully',
      };
    } else {
      // Follow
      await this.followModel.create({
        followerId: new Types.ObjectId(userId),
        followingId: new Types.ObjectId(pageId),
        type: 'page',
      });
      await this.pageModel.findByIdAndUpdate(pageId, {
        $inc: { followersCount: 1 },
      });
      return {
        success: true,
        isFollowing: true,
        message: 'Followed successfully',
      };
    }
  }
}
