import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class ThrottlerStorageRedisService
  implements ThrottlerStorage, OnModuleDestroy
{
  private redis: Redis | null = null;
  private memoryStore = new Map<
    string,
    { totalHits: number; expiresAt: number }
  >();

  constructor() {}

  init(redisUrl?: string): void {
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('error', () => {
          this.redis = null;
        });
      } catch {
        this.redis = null;
      }
    }
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const storageKey = `throttle:${throttlerName}:${key}`;

    if (this.redis) {
      try {
        const pipeline = this.redis.pipeline();
        pipeline.incr(storageKey);
        pipeline.pttl(storageKey);
        const results = await pipeline.exec();

        const totalHits = (results?.[0]?.[1] as number) || 1;
        let timeToExpire = (results?.[1]?.[1] as number) || -1;

        if (timeToExpire === -1) {
          await this.redis.pexpire(storageKey, ttl);
          timeToExpire = ttl;
        }

        const isBlocked = totalHits > limit;

        return {
          totalHits,
          timeToExpire,
          isBlocked,
          timeToBlockExpire: isBlocked ? blockDuration : 0,
        };
      } catch {
        // Fallback to memory
      }
    }

    return this.incrementMemory(storageKey, ttl, limit, blockDuration);
  }

  private incrementMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const existing = this.memoryStore.get(key);

    if (!existing || existing.expiresAt < now) {
      this.memoryStore.set(key, { totalHits: 1, expiresAt: now + ttl });
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    existing.totalHits++;
    const isBlocked = existing.totalHits > limit;

    return {
      totalHits: existing.totalHits,
      timeToExpire: existing.expiresAt - now,
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    };
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.memoryStore.clear();
  }
}
