import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { RedisCacheService } from './redis-cache.service';

/**
 * 🗄️ Redis Cache Module
 * Fast caching module
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT');

        // If Redis is available, use it
        if (redisHost && redisPort) {
          return {
            store: redisStore,
            host: redisHost,
            port: redisPort,
            password: configService.get<string>('REDIS_PASSWORD'),
            ttl: 300, // 5 minutes default
            tls: redisHost.includes('redislabs.com') ? {} : undefined, // Enable TLS for Redis Cloud
          };
        }

        // Fallback: use memory
        return {
          ttl: 300,
          max: 1000, // Maximum number of items
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisCacheService],
  exports: [CacheModule, RedisCacheService],
})
export class RedisCacheModule {}
