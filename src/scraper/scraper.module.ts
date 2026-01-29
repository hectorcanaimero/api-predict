import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScarabScraperService } from './scarab-scraper.service';

@Module({
  providers: [ScraperService, ScarabScraperService],
  exports: [ScraperService, ScarabScraperService],
})
export class ScraperModule {}
