import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrchestratorService } from './orchestrator.service';
import { ScrapingRequestDto } from '../common/dto/scraping-request.dto';
import { CpfScrapingRequestDto } from '../common/dto/cpf-scraping-request.dto';
import { JobStatusDto, ScrapingResponseDto } from '../common/dto/scraping-response.dto';
import { ApiKeyAuth } from '../common/decorators/api-key.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('orchestrator')
@Controller('api/scraping')
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post('start')
  @ApiKeyAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Iniciar un nuevo job de scraping' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Job creado exitosamente',
    type: JobStatusDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'API Key inválida o faltante',
  })
  async startScraping(@Body() request: ScrapingRequestDto) {
    this.logger.log('Received scraping request', request);

    const job = await this.orchestratorService.startScrapingJob(
      {
        url: request.url,
        username: request.username,
        password: request.password,
        maxProducts: request.maxProducts,
        timeout: request.timeout,
        headless: request.headless,
      },
      request.useCache,
    );

    return job;
  }

  @Post('recommendations/cpf')
  @ApiKeyAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Obtener recomendaciones de productos por CPF usando Emarsys Scarab' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Job de recomendaciones creado exitosamente',
    type: JobStatusDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'API Key inválida o faltante',
  })
  async getRecommendationsByCpf(@Body() request: CpfScrapingRequestDto) {
    this.logger.log('Received CPF recommendations request', {
      cpf: this.maskCpf(request.cpf),
      logic: request.recommendLogic,
    });

    const job = await this.orchestratorService.startCpfRecommendationsJob(
      {
        cpf: request.cpf,
        url: request.url,
        scarabId: request.scarabId,
        recommendLogic: request.recommendLogic,
        limit: request.limit,
        includeCategories: request.includeCategories,
        excludeItems: request.excludeItems,
        username: request.username,
        password: request.password,
        timeout: request.timeout,
        headless: request.headless,
      },
      request.useCache,
    );

    return job;
  }

  private maskCpf(cpf: string): string {
    const cleaned = cpf.replace(/[.-]/g, '');
    return `***.***.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }

  @Get('jobs/:id')
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Obtener el estado de un job' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado del job',
    type: JobStatusDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'API Key inválida o faltante',
  })
  async getJobStatus(@Param('id') id: string) {
    const job = await this.orchestratorService.getJobStatus(id);

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return job;
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Obtener todos los jobs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de todos los jobs',
    type: [JobStatusDto],
  })
  async getAllJobs() {
    return this.orchestratorService.getAllJobs();
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Cancelar un job' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job cancelado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job no encontrado',
  })
  async cancelJob(@Param('id') id: string) {
    const cancelled = await this.orchestratorService.cancelJob(id);

    if (!cancelled) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return { message: `Job ${id} cancelled successfully` };
  }

  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'Reintentar un job fallido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job reintentado exitosamente',
    type: JobStatusDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job no encontrado',
  })
  async retryJob(@Param('id') id: string) {
    const job = await this.orchestratorService.retryJob(id);

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return job;
  }

  @Delete('jobs/completed/clear')
  @ApiOperation({ summary: 'Limpiar jobs completados y fallidos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jobs limpiados exitosamente',
  })
  async clearCompletedJobs() {
    const count = await this.orchestratorService.clearCompletedJobs();
    return { message: `Cleared ${count} jobs` };
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Obtener estadísticas de la cola (público)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de la cola',
  })
  async getStats() {
    return this.orchestratorService.getQueueStats();
  }
}
