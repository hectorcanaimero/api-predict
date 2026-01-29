import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import { ScrapingProcessor } from './orchestrator.processor';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraping',
    }),
    ScraperModule,
  ],
  controllers: [OrchestratorController],
  providers: [OrchestratorService, ScrapingProcessor],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
