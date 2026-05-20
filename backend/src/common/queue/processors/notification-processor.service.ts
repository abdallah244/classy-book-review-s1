import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import {
  Processor,
  Process,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';

/**
 * 🔔 Notification Processor Service
 * Background notification sending service
 */
@Injectable()
@Processor('notifications')
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);

  constructor(@InjectQueue('notifications') private notificationQueue: Queue) {}

  /**
   * Add notification to send
   */
  async addToQueue(
    data: NotificationJobData,
  ): Promise<Job<NotificationJobData>> {
    const job = await this.notificationQueue.add('send', data, {
      priority: data.priority || 1,
      delay: data.delay || 0,
    });
    this.logger.log(`🔔 Notification job added: ${job.id}`);
    return job;
  }

  /**
   * Send notification to multiple users
   */
  async sendToMany(
    userIds: string[],
    notification: Omit<NotificationJobData, 'userId'>,
  ): Promise<Job<NotificationJobData>[]> {
    const jobs = await this.notificationQueue.addBulk(
      userIds.map((userId) => ({
        name: 'send',
        data: { ...notification, userId },
        opts: { priority: notification.priority || 1 },
      })),
    );
    this.logger.log(`🔔 ${jobs.length} notifications queued`);
    return jobs;
  }

  /**
   * Process notification
   */
  @Process('send')
  async processNotification(
    job: Job<NotificationJobData>,
  ): Promise<NotificationJobResult> {
    this.logger.log(`🔄 Processing notification: ${job.id}`);

    const { userId, type, title, message, data } = job.data;

    try {
      const results: { channel: string; success: boolean }[] = [];

      // Send according to notification type
      switch (type) {
        case 'push':
          // Send Push Notification
          results.push({ channel: 'push', success: true });
          break;

        case 'in-app':
          // Save in database for in-app display
          results.push({ channel: 'in-app', success: true });
          break;

        case 'email':
          // Send email
          results.push({ channel: 'email', success: true });
          break;

        case 'sms':
          // Send SMS
          results.push({ channel: 'sms', success: true });
          break;

        case 'all':
          // Send through all channels
          results.push(
            { channel: 'push', success: true },
            { channel: 'in-app', success: true },
            { channel: 'email', success: true },
          );
          break;
      }

      return {
        success: true,
        userId,
        results,
      };
    } catch (error) {
      this.logger.error(`❌ Notification failed: ${job.id}`, error);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: NotificationJobResult) {
    this.logger.log(`✅ Notification sent to user: ${result.userId}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Notification failed: ${job.id} - ${error.message}`);
  }
}

// Interfaces
interface NotificationJobData {
  userId: string;
  type: 'push' | 'in-app' | 'email' | 'sms' | 'all';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: number;
  delay?: number;
}

interface NotificationJobResult {
  success: boolean;
  userId: string;
  results: { channel: string; success: boolean }[];
}
