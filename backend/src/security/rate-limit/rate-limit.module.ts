import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from './throttler-redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const storage = new ThrottlerStorageRedisService();
        storage.init(config.get<string>('REDIS_URL'));
        return {
          throttlers: [
            {
              name: 'short',
              ttl: 1000, // 1 second
              limit: 3, // 3 requests
            },
            {
              name: 'medium',
              ttl: 10000, // 10 seconds
              limit: 20, // 20 requests
            },
            {
              name: 'long',
              ttl: 60000, // 1 minute
              limit: 100, // 100 requests
            },
          ],
          storage,
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
