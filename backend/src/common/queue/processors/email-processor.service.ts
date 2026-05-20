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
 * 📧 Email Processor Service
 * Background email sending service
 */
@Injectable()
@Processor('email')
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);

  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  /**
   * Add email to send
   */
  async addToQueue(data: EmailJobData): Promise<Job<EmailJobData>> {
    const job = await this.emailQueue.add('send', data, {
      priority: data.priority || 1,
      delay: data.delay || 0,
      attempts: 3,
    });
    this.logger.log(`📧 Email job added: ${job.id}`);
    return job;
  }

  /**
   * Add multiple messages to send
   */
  async addBulkToQueue(items: EmailJobData[]): Promise<Job<EmailJobData>[]> {
    const jobs = await this.emailQueue.addBulk(
      items.map((data) => ({
        name: 'send',
        data,
        opts: { priority: data.priority || 1 },
      })),
    );
    this.logger.log(`📧 ${jobs.length} email jobs added`);
    return jobs;
  }

  /**
   * Send email
   */
  @Process('send')
  async sendEmail(job: Job<EmailJobData>): Promise<EmailJobResult> {
    this.logger.log(`🔄 Sending email: ${job.id}`);

    const { to, subject, template, data } = job.data;

    try {
      // Here integrate with email service
      // Such as: Nodemailer, SendGrid, AWS SES

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.logger.log(`✅ Email sent to: ${to}`);

      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        to,
        subject,
      };
    } catch (error) {
      this.logger.error(`❌ Email failed: ${job.id}`, error);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: EmailJobResult) {
    this.logger.log(`✅ Email sent: ${result.messageId}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Email failed: ${job.id} - ${error.message}`);
  }
}

// Interfaces
interface EmailJobData {
  to: string | string[];
  subject: string;
  template: string;
  data?: Record<string, any>;
  priority?: number;
  delay?: number;
}

interface EmailJobResult {
  success: boolean;
  messageId: string;
  to: string | string[];
  subject: string;
}
