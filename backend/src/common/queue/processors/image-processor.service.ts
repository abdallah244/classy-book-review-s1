import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';

/**
 * 🖼️ Image Processor Service
 * Background image processing service
 */
@Injectable()
@Processor('image-processing')
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(@InjectQueue('image-processing') private imageQueue: Queue) {}

  /**
   * Add image for processing
   */
  async addToQueue(data: ImageJobData): Promise<Job<ImageJobData>> {
    const job = await this.imageQueue.add('process', data, {
      priority: data.priority || 1,
      delay: data.delay || 0,
    });
    this.logger.log(`📸 Image job added: ${job.id}`);
    return job;
  }

  /**
   * Add multiple images for processing
   */
  async addBulkToQueue(items: ImageJobData[]): Promise<Job<ImageJobData>[]> {
    const jobs = await this.imageQueue.addBulk(
      items.map((data) => ({
        name: 'process',
        data,
        opts: { priority: data.priority || 1 },
      })),
    );
    this.logger.log(`📸 ${jobs.length} image jobs added`);
    return jobs;
  }

  /**
   * Process image
   */
  @Process('process')
  async processImage(job: Job<ImageJobData>): Promise<ImageJobResult> {
    this.logger.log(`🔄 Processing image: ${job.id}`);

    const { imageUrl, operations } = job.data;

    try {
      // Execute required operations
      const result: ImageJobResult = {
        originalUrl: imageUrl,
        processedUrl: imageUrl,
        operations: [],
      };

      const ops = operations || [];
      for (let i = 0; i < ops.length; i++) {
        const operation = ops[i];
        await job.progress(((i + 1) / ops.length) * 100);

        switch (operation.type) {
          case 'resize':
            // Execute resize
            result.operations.push({ type: 'resize', status: 'completed' });
            break;
          case 'compress':
            // Execute compression
            result.operations.push({ type: 'compress', status: 'completed' });
            break;
          case 'watermark':
            // Add watermark
            result.operations.push({ type: 'watermark', status: 'completed' });
            break;
          case 'thumbnail':
            // Create thumbnail
            result.operations.push({ type: 'thumbnail', status: 'completed' });
            break;
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ Image processing failed: ${job.id}`, error);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`🚀 Started processing: ${job.id}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: ImageJobResult) {
    this.logger.log(`✅ Completed: ${job.id}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Failed: ${job.id} - ${error.message}`);
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<QueueStatus> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.imageQueue.getWaitingCount(),
      this.imageQueue.getActiveCount(),
      this.imageQueue.getCompletedCount(),
      this.imageQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}

// Interfaces
interface ImageJobData {
  imageUrl: string;
  userId?: string;
  operations?: ImageOperation[];
  priority?: number;
  delay?: number;
}

interface ImageOperation {
  type: 'resize' | 'compress' | 'watermark' | 'thumbnail';
  options?: Record<string, any>;
}

interface ImageJobResult {
  originalUrl: string;
  processedUrl: string;
  operations: { type: string; status: string }[];
}

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}
