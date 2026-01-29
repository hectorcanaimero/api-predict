import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { ScraperModule } from './scraper/scraper.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Bull Queue for job management
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '15021'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),

    // Cache
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TTL || '3600'),
      max: parseInt(process.env.CACHE_MAX_ITEMS || '100'),
    }),

    // Feature modules
    ScraperModule,
    OrchestratorModule,
  ],
})
export class AppModule {}
