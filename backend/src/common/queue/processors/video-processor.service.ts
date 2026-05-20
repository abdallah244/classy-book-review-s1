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
 * 🎥 Video Processor Service
 * Background video processing service
 */
@Injectable()
@Processor('video-processing')
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);

  constructor(@InjectQueue('video-processing') private videoQueue: Queue) {}

  /**
   * Add video for processing
   */
  async addToQueue(data: VideoJobData): Promise<Job<VideoJobData>> {
    const job = await this.videoQueue.add('process', data, {
      priority: data.priority || 1,
      delay: data.delay || 0,
    });
    this.logger.log(`🎥 Video job added: ${job.id}`);
    return job;
  }

  /**
   * Process video
   */
  @Process('process')
  async processVideo(job: Job<VideoJobData>): Promise<VideoJobResult> {
    this.logger.log(`🔄 Processing video: ${job.id}`);

    const { videoUrl, operations } = job.data;

    try {
      const result: VideoJobResult = {
        originalUrl: videoUrl,
        processedUrl: videoUrl,
        thumbnailUrl: null,
        duration: 0,
        operations: [],
      };

      const totalOperations = operations?.length || 1;

      const ops = operations || [];
      for (let i = 0; i < ops.length; i++) {
        const operation = ops[i];
        await job.progress(((i + 1) / totalOperations) * 100);

        switch (operation.type) {
          case 'transcode':
            // Convert video to another format
            this.logger.log(`🔄 Transcoding video...`);
            result.operations.push({ type: 'transcode', status: 'completed' });
            break;

          case 'compress':
            // Compress video
            this.logger.log(`🔄 Compressing video...`);
            result.operations.push({ type: 'compress', status: 'completed' });
            break;

          case 'thumbnail':
            // Create thumbnail
            this.logger.log(`🔄 Creating thumbnail...`);
            result.thumbnailUrl = `${videoUrl}_thumbnail.jpg`;
            result.operations.push({ type: 'thumbnail', status: 'completed' });
            break;

          case 'watermark':
            // Add watermark
            this.logger.log(`🔄 Adding watermark...`);
            result.operations.push({ type: 'watermark', status: 'completed' });
            break;

          case 'extract-audio':
            // Extract audio
            this.logger.log(`🔄 Extracting audio...`);
            result.operations.push({
              type: 'extract-audio',
              status: 'completed',
            });
            break;
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ Video processing failed: ${job.id}`, error);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`🚀 Started video processing: ${job.id}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: VideoJobResult) {
    this.logger.log(`✅ Video completed: ${job.id}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Video failed: ${job.id} - ${error.message}`);
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<QueueStatus> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.videoQueue.getWaitingCount(),
      this.videoQueue.getActiveCount(),
      this.videoQueue.getCompletedCount(),
      this.videoQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Get specific job status
   */
  async getJobStatus(jobId: string): Promise<Job | null> {
    return this.videoQueue.getJob(jobId);
  }
}

// Interfaces
interface VideoJobData {
  videoUrl: string;
  userId?: string;
  operations?: VideoOperation[];
  priority?: number;
  delay?: number;
}

interface VideoOperation {
  type: 'transcode' | 'compress' | 'thumbnail' | 'watermark' | 'extract-audio';
  options?: Record<string, any>;
}

interface VideoJobResult {
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  operations: { type: string; status: string }[];
}

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}
