import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ScraperService, ScraperOptions } from '../scraper/scraper.service';
import { ScarabScraperService, ScarabScraperOptions } from '../scraper/scarab-scraper.service';
import { ScrapingJob, ScrapingResult } from '../common/interfaces/product.interface';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private jobs: Map<string, ScrapingJob> = new Map();

  constructor(
    @InjectQueue('scraping') private readonly scrapingQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly scraperService: ScraperService,
    private readonly scarabScraperService: ScarabScraperService,
  ) {}

  async startScrapingJob(options: ScraperOptions, useCache = true): Promise<ScrapingJob> {
    const cacheKey = this.generateCacheKey(options);

    if (useCache) {
      const cachedResult = await this.cacheManager.get<ScrapingResult>(cacheKey);
      if (cachedResult) {
        this.logger.log(`Returning cached result for key: ${cacheKey}`);
        const job: ScrapingJob = {
          id: `cached-${Date.now()}`,
          status: 'completed',
          startedAt: new Date(cachedResult.scrapedAt),
          completedAt: new Date(cachedResult.scrapedAt),
          result: cachedResult,
        };
        return job;
      }
    }

    const bullJob = await this.scrapingQueue.add('scrape', options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });

    const job: ScrapingJob = {
      id: bullJob.id.toString(),
      status: 'pending',
      startedAt: new Date(),
    };

    this.jobs.set(job.id, job);
    this.logger.log(`Created scraping job: ${job.id}`);

    return job;
  }

  async startCpfRecommendationsJob(
    options: ScarabScraperOptions,
    useCache = true,
  ): Promise<ScrapingJob> {
    const cacheKey = this.generateCpfCacheKey(options);

    if (useCache) {
      const cachedResult = await this.cacheManager.get<ScrapingResult>(cacheKey);
      if (cachedResult) {
        this.logger.log(`Returning cached CPF result for key: ${cacheKey}`);
        const job: ScrapingJob = {
          id: `cached-cpf-${Date.now()}`,
          status: 'completed',
          startedAt: new Date(cachedResult.scrapedAt),
          completedAt: new Date(cachedResult.scrapedAt),
          result: cachedResult,
        };
        return job;
      }
    }

    const bullJob = await this.scrapingQueue.add('scrape-cpf', options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });

    const job: ScrapingJob = {
      id: bullJob.id.toString(),
      status: 'pending',
      startedAt: new Date(),
    };

    this.jobs.set(job.id, job);
    this.logger.log(`Created CPF recommendations job: ${job.id}`);

    return job;
  }

  async getJobStatus(jobId: string): Promise<ScrapingJob | null> {
    const cachedJob = this.jobs.get(jobId);
    if (cachedJob) {
      return cachedJob;
    }

    try {
      const bullJob = await this.scrapingQueue.getJob(jobId);
      if (!bullJob) {
        return null;
      }

      const state = await bullJob.getState();
      const job: ScrapingJob = {
        id: jobId,
        status: this.mapBullStateToJobStatus(state),
        startedAt: new Date(bullJob.timestamp),
        completedAt: bullJob.finishedOn ? new Date(bullJob.finishedOn) : undefined,
        result: bullJob.returnvalue,
        error: bullJob.failedReason,
      };

      this.jobs.set(jobId, job);
      return job;
    } catch (error) {
      this.logger.error(`Error getting job status: ${error.message}`);
      return null;
    }
  }

  async getAllJobs(): Promise<ScrapingJob[]> {
    const bullJobs = await this.scrapingQueue.getJobs([
      'active',
      'waiting',
      'completed',
      'failed',
      'delayed',
    ]);

    const jobs: ScrapingJob[] = [];

    for (const bullJob of bullJobs) {
      const state = await bullJob.getState();
      jobs.push({
        id: bullJob.id.toString(),
        status: this.mapBullStateToJobStatus(state),
        startedAt: new Date(bullJob.timestamp),
        completedAt: bullJob.finishedOn ? new Date(bullJob.finishedOn) : undefined,
        result: bullJob.returnvalue,
        error: bullJob.failedReason,
      });
    }

    return jobs;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const bullJob = await this.scrapingQueue.getJob(jobId);
      if (!bullJob) {
        return false;
      }

      await bullJob.remove();
      this.jobs.delete(jobId);
      this.logger.log(`Cancelled job: ${jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error cancelling job: ${error.message}`);
      return false;
    }
  }

  async retryJob(jobId: string): Promise<ScrapingJob | null> {
    try {
      const bullJob = await this.scrapingQueue.getJob(jobId);
      if (!bullJob) {
        return null;
      }

      await bullJob.retry();
      this.logger.log(`Retrying job: ${jobId}`);

      const updatedJob: ScrapingJob = {
        id: jobId,
        status: 'pending',
        startedAt: new Date(),
      };

      this.jobs.set(jobId, updatedJob);
      return updatedJob;
    } catch (error) {
      this.logger.error(`Error retrying job: ${error.message}`);
      return null;
    }
  }

  async clearCompletedJobs(): Promise<number> {
    const completed = await this.scrapingQueue.getCompleted();
    const failed = await this.scrapingQueue.getFailed();

    let count = 0;
    for (const job of [...completed, ...failed]) {
      await job.remove();
      this.jobs.delete(job.id.toString());
      count++;
    }

    this.logger.log(`Cleared ${count} completed/failed jobs`);
    return count;
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.scrapingQueue.getWaitingCount(),
      this.scrapingQueue.getActiveCount(),
      this.scrapingQueue.getCompletedCount(),
      this.scrapingQueue.getFailedCount(),
      this.scrapingQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  private mapBullStateToJobStatus(state: string): ScrapingJob['status'] {
    switch (state) {
      case 'active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private generateCacheKey(options: ScraperOptions): string {
    const { url, username, maxProducts } = options;
    return `scraping:${url}:${username}:${maxProducts}`;
  }

  private generateCpfCacheKey(options: ScarabScraperOptions): string {
    const { cpf, recommendLogic, limit } = options;
    const cleanCpf = cpf.replace(/[.-]/g, '');
    return `cpf-recommendations:${cleanCpf}:${recommendLogic}:${limit}`;
  }

  async processScraping(job: Job<ScraperOptions>): Promise<ScrapingResult> {
    this.logger.log(`Processing job ${job.id} with options:`, job.data);

    const scrapingJob = this.jobs.get(job.id.toString());
    if (scrapingJob) {
      scrapingJob.status = 'processing';
    }

    const result = await this.scraperService.scrapeRecommendedProducts(job.data);

    if (scrapingJob) {
      scrapingJob.status = result.success ? 'completed' : 'failed';
      scrapingJob.completedAt = new Date();
      scrapingJob.result = result;
    }

    if (result.success && job.data.useCache !== false) {
      const cacheKey = this.generateCacheKey(job.data);
      await this.cacheManager.set(cacheKey, result, 3600000);
      this.logger.log(`Cached result for key: ${cacheKey}`);
    }

    return result;
  }

  async processCpfRecommendations(job: Job<ScarabScraperOptions>): Promise<ScrapingResult> {
    this.logger.log(`Processing CPF recommendations job ${job.id}`);

    const scrapingJob = this.jobs.get(job.id.toString());
    if (scrapingJob) {
      scrapingJob.status = 'processing';
    }

    const result = await this.scarabScraperService.scrapeRecommendationsByCpf(job.data);

    if (scrapingJob) {
      scrapingJob.status = result.success ? 'completed' : 'failed';
      scrapingJob.completedAt = new Date();
      scrapingJob.result = result;
    }

    if (result.success && job.data.useCache !== false) {
      const cacheKey = this.generateCpfCacheKey(job.data);
      await this.cacheManager.set(cacheKey, result, 3600000);
      this.logger.log(`Cached CPF result for key: ${cacheKey}`);
    }

    return result;
  }
}
