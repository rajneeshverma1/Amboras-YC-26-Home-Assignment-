import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected');
    });
    this.redis.on('error', () => {
      this.isConnected = false;
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch {
      // Ignore cache errors
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.redis.del(key);
    } catch {
      // Ignore cache errors
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
