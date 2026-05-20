import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialBookmark, BookmarkDocument } from './schemas/bookmark.schema';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectModel(SocialBookmark.name)
    private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async toggleBookmark(userId: string, postId: string): Promise<any> {
    const uid = new Types.ObjectId(userId);
    const pid = new Types.ObjectId(postId);

    const existing = await this.bookmarkModel.findOne({
      userId: uid,
      postId: pid,
    });

    if (existing) {
      await this.bookmarkModel.findByIdAndDelete(existing._id);
      return { saved: false, message: 'Post removed from bookmarks' };
    } else {
      await this.bookmarkModel.create({ userId: uid, postId: pid });
      return { saved: true, message: 'Post saved to bookmarks' };
    }
  }

  async getMyBookmarks(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;

    // 1. Get bookmark records
    const bookmarks = await this.bookmarkModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postIds = bookmarks.map((b) => b.postId);

    // 2. Fetch the actual posts
    const posts = await this.postModel
      .find({ _id: { $in: postIds }, isDeleted: false })
      .populate('authorId', 'name avatar')
      .lean();

    // Map back to maintain order and add helper fields
    const orderedPosts = postIds
      .map((id) => {
        const post: any = posts.find((p) => p._id.toString() === id.toString());
        if (!post) return null;
        return {
          ...post,
          id: post._id.toString(),
          author: post.authorId,
          isLiked: post.likes?.some((l: any) => l.toString() === userId),
          isBookmarked: true,
        };
      })
      .filter((p) => p !== null);

    const total = await this.bookmarkModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return {
      posts: orderedPosts,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async checkIsBookmarked(userId: string, postId: string): Promise<boolean> {
    const count = await this.bookmarkModel.countDocuments({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });
    return count > 0;
  }
}
