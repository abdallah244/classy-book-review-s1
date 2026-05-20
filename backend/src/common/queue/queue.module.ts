import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageProcessorService } from './processors/image-processor.service';
import { VideoProcessorService } from './processors/video-processor.service';
import { EmailProcessorService } from './processors/email-processor.service';
import { NotificationProcessorService } from './processors/notification-processor.service';

/**
 * 📋 Queue Module
 * Background task processing module
 */
@Module({
  imports: [
    // Register Bull with Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Register queues
    BullModule.registerQueue(
      { name: 'image-processing' },
      { name: 'video-processing' },
      { name: 'email' },
      { name: 'notifications' },
    ),
  ],
  providers: [
    ImageProcessorService,
    VideoProcessorService,
    EmailProcessorService,
    NotificationProcessorService,
  ],
  exports: [
    BullModule,
    ImageProcessorService,
    VideoProcessorService,
    EmailProcessorService,
    NotificationProcessorService,
  ],
})
export class QueueModule {}
