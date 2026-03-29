import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const Redis = require('ioredis');
        return new Redis(configService.get<string>('REDIS_URL') || 'redis://localhost:6379', {
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
