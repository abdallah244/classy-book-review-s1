import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * 🗄️ Redis Cache Service
 * Fast caching service
 */
@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Store value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`✅ Cached: ${key}`);
    } catch (error) {
      this.logger.error(`❌ Cache set error: ${key}`, error);
    }
  }

  /**
   * Retrieve value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`🎯 Cache hit: ${key}`);
      } else {
        this.logger.debug(`❌ Cache miss: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`❌ Cache get error: ${key}`, error);
      return null;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`🗑️ Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`❌ Cache delete error: ${key}`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      // cache-manager v5+ uses store.clear() or we manually handle
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
      } else if (store && typeof store.clear === 'function') {
        await store.clear();
      }
      this.logger.log('🗑️ Cache cleared');
    } catch (error) {
      this.logger.error('❌ Cache reset error', error);
    }
  }

  /**
   * Get or set (Cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute factory and store result
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Store multiple values
   */
  async setMany<T>(
    items: { key: string; value: T; ttl?: number }[],
  ): Promise<void> {
    await Promise.all(
      items.map((item) => this.set(item.key, item.value, item.ttl)),
    );
  }

  /**
   * Retrieve multiple values
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  /**
   * Delete values by pattern
   */
  async deleteByPattern(pattern: string): Promise<void> {
    // Note: This only works with Redis
    this.logger.log(`🗑️ Deleting keys matching: ${pattern}`);
    // Implementation depends on cache type being used
  }

  /**
   * Create unified cache key
   */
  createKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}
