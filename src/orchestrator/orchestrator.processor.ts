import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrchestratorService } from './orchestrator.service';
import { ScraperOptions } from '../scraper/scraper.service';
import { ScarabScraperOptions } from '../scraper/scarab-scraper.service';
import { ScrapingResult } from '../common/interfaces/product.interface';

@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Process('scrape')
  async handleScraping(job: Job<ScraperOptions>): Promise<ScrapingResult> {
    this.logger.log(`Starting scraping job ${job.id}`);

    try {
      const result = await this.orchestratorService.processScraping(job);

      if (result.success) {
        this.logger.log(`Job ${job.id} completed successfully with ${result.totalProducts} products`);
      } else {
        this.logger.error(`Job ${job.id} failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} threw exception: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('scrape-cpf')
  async handleCpfRecommendations(job: Job<ScarabScraperOptions>): Promise<ScrapingResult> {
    this.logger.log(`Starting CPF recommendations job ${job.id}`);

    try {
      const result = await this.orchestratorService.processCpfRecommendations(job);

      if (result.success) {
        this.logger.log(
          `CPF job ${job.id} completed successfully with ${result.totalProducts} products`,
        );
      } else {
        this.logger.error(`CPF job ${job.id} failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`CPF job ${job.id} threw exception: ${error.message}`, error.stack);
      throw error;
    }
  }
}
