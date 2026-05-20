import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialGateway } from './social.gateway';
import {
  SocialNotification,
  SocialNotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(SocialNotification.name)
    private notificationModel: Model<SocialNotificationDocument>,
    private readonly socialGateway: SocialGateway,
  ) {}

  async createNotification(data: {
    recipientId: string;
    senderId: string;
    type: string;
    relatedId?: string;
    content?: string;
  }): Promise<void> {
    // Avoid notifying yourself
    if (data.recipientId === data.senderId) return;

    const notification = await this.notificationModel.create({
      recipientId: new Types.ObjectId(data.recipientId),
      senderId: new Types.ObjectId(data.senderId),
      type: data.type,
      relatedId: data.relatedId
        ? new Types.ObjectId(data.relatedId)
        : undefined,
      content: data.content,
    });

    // Real-time Emit
    this.socialGateway.sendNotification(data.recipientId, notification);
  }

  async getNotifications(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find({ recipientId: new Types.ObjectId(userId), isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'name avatar')
        .lean(),
      this.notificationModel.countDocuments({
        recipientId: new Types.ObjectId(userId),
        isDeleted: false,
      }),
      this.notificationModel.countDocuments({
        recipientId: new Types.ObjectId(userId),
        isRead: false,
        isDeleted: false,
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async markAsRead(userId: string, notificationId?: string): Promise<void> {
    const filter: any = { recipientId: new Types.ObjectId(userId) };
    if (notificationId) {
      filter._id = new Types.ObjectId(notificationId);
    }

    await this.notificationModel.updateMany(filter, { $set: { isRead: true } });
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    await this.notificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
      },
      { $set: { isDeleted: true } },
    );
  }
}
