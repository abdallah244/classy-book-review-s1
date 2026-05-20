import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialGateway } from './social.gateway';
import { SocialMessage, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(SocialMessage.name)
    private messageModel: Model<MessageDocument>,
    private readonly socialGateway: SocialGateway,
  ) {}

  async sendMessage(senderId: string, dto: any): Promise<MessageDocument> {
    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: dto.receiverId
        ? new Types.ObjectId(dto.receiverId)
        : undefined,
      groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : undefined,
      content: dto.content,
      mediaUrl: dto.mediaUrl,
      messageType: dto.messageType || 'text',
    });

    // Real-time Emit
    if (dto.receiverId) {
      this.socialGateway.sendMessage(dto.receiverId, message);
    } else if (dto.groupId) {
      // In a real app, you'd join users to rooms based on groupId
      this.socialGateway.server
        .to(`group_${dto.groupId}`)
        .emit('new_group_message', message);
    }

    return message;
  }

  async getConversations(userId: string): Promise<any[]> {
    // This is a complex aggregation to find the latest message for each unique conversation
    const uid = new Types.ObjectId(userId);

    return await this.messageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: uid }, { receiverId: uid }],
          isDeleted: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ['$senderId', '$receiverId'] },
              { s: '$senderId', r: '$receiverId' },
              { s: '$receiverId', r: '$senderId' },
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$lastMessage' } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiverId',
          foreignField: '_id',
          as: 'receiver',
        },
      },
      { $unwind: '$sender' },
      { $unwind: '$receiver' },
    ]);
  }

  async getMessageHistory(
    userId: string,
    otherId: string,
    page = 1,
    limit = 50,
  ): Promise<any> {
    const uid = new Types.ObjectId(userId);
    const oid = new Types.ObjectId(otherId);
    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({
        $or: [
          { senderId: uid, receiverId: oid },
          { senderId: oid, receiverId: uid },
        ],
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return messages.reverse(); // Return in chronological order
  }

  async markAsRead(userId: string, senderId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        senderId: new Types.ObjectId(senderId),
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
    );
  }
}
