import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { SocialGroup, SocialGroupDocument } from './schemas/group.schema';
import {
  PartnerPage,
  PartnerPageDocument,
} from './schemas/partner-page.schema';
import { User, UserDocument } from '../security/users/schemas/user.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(SocialGroup.name)
    private groupModel: Model<SocialGroupDocument>,
    @InjectModel(PartnerPage.name)
    private pageModel: Model<PartnerPageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async globalSearch(query: string, limit = 5) {
    if (!query || query.length < 2)
      return { users: [], groups: [], pages: [], posts: [] };

    const regex = new RegExp(query, 'i');

    const [users, groups, pages, posts] = await Promise.all([
      // 1. Search Users
      this.userModel
        .find({
          $or: [{ name: regex }, { email: regex }],
          isDeleted: false,
        })
        .limit(limit)
        .select('name avatar role')
        .lean(),

      // 2. Search Groups
      this.groupModel
        .find({
          name: regex,
          isDeleted: false,
        })
        .limit(limit)
        .select('name coverImage description membersCount')
        .lean(),

      // 3. Search Partner Pages
      this.pageModel
        .find({
          name: regex,
          isDeleted: false,
        })
        .limit(limit)
        .select('name avatar category')
        .lean(),

      // 4. Search Posts
      this.postModel
        .find({
          content: regex,
          isDeleted: false,
          visibility: 'public',
        })
        .limit(limit)
        .populate('authorId', 'name avatar')
        .select('content authorId createdAt')
        .lean(),
    ]);

    return {
      users,
      groups,
      pages,
      posts: posts.map((p) => ({ ...p, author: p.authorId })),
    };
  }
}
