import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../../common/cache';

interface IdempotencyRecord {
  status: 'processing' | 'completed';
  response?: any;
  createdAt: number;
}

@Injectable()
export class IdempotencyService {
  private readonly prefix = 'idempotency:';
  private readonly defaultTtl = 24 * 60 * 60; // 24 hours

  constructor(private cacheService: RedisCacheService) {}

  /**
   * Check for existing request
   */
  async get(key: string): Promise<IdempotencyRecord | null> {
    return this.cacheService.get<IdempotencyRecord>(`${this.prefix}${key}`);
  }

  /**
   * Register request as processing
   */
  async setProcessing(key: string, ttl = this.defaultTtl): Promise<void> {
    await this.cacheService.set(
      `${this.prefix}${key}`,
      { status: 'processing', createdAt: Date.now() },
      ttl,
    );
  }

  /**
   * Register request completion with result
   */
  async setCompleted(
    key: string,
    response: any,
    ttl = this.defaultTtl,
  ): Promise<void> {
    await this.cacheService.set(
      `${this.prefix}${key}`,
      { status: 'completed', response, createdAt: Date.now() },
      ttl,
    );
  }

  /**
   * Delete record
   */
  async delete(key: string): Promise<void> {
    await this.cacheService.delete(`${this.prefix}${key}`);
  }

  /**
   * Generate idempotency key
   */
  generateKey(userId: string, endpoint: string, body?: any): string {
    const bodyHash = body ? this.hashObject(body) : '';
    return `${userId}:${endpoint}:${bodyHash}`;
  }

  /**
   * Hash object
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
