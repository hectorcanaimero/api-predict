import { ApiProperty } from '@nestjs/swagger';
import { RecommendedProduct, ScrapingResult } from '../interfaces/product.interface';

export class RecommendedProductDto implements RecommendedProduct {
  @ApiProperty({ description: 'ID del producto' })
  id: string;

  @ApiProperty({ description: 'Nombre del producto' })
  name: string;

  @ApiProperty({ description: 'Descripción del producto', required: false })
  description?: string;

  @ApiProperty({ description: 'Precio del producto', required: false })
  price?: number;

  @ApiProperty({ description: 'Moneda del precio', required: false })
  currency?: string;

  @ApiProperty({ description: 'URL de la imagen', required: false })
  imageUrl?: string;

  @ApiProperty({ description: 'URL del producto', required: false })
  url?: string;

  @ApiProperty({ description: 'Categoría del producto', required: false })
  category?: string;

  @ApiProperty({ description: 'Marca del producto', required: false })
  brand?: string;

  @ApiProperty({ description: 'SKU del producto', required: false })
  sku?: string;

  @ApiProperty({ description: 'Si está en stock', required: false })
  inStock?: boolean;

  @ApiProperty({ description: 'Calificación del producto', required: false })
  rating?: number;

  @ApiProperty({ description: 'Número de reseñas', required: false })
  reviewCount?: number;

  @ApiProperty({ description: 'Metadata adicional', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Fecha de scraping' })
  scrapedAt: Date;
}

export class ScrapingResponseDto implements ScrapingResult {
  @ApiProperty({ description: 'Si el scraping fue exitoso' })
  success: boolean;

  @ApiProperty({
    description: 'Lista de productos recomendados',
    type: [RecommendedProductDto]
  })
  products: RecommendedProduct[];

  @ApiProperty({ description: 'Total de productos encontrados' })
  totalProducts: number;

  @ApiProperty({ description: 'Fecha del scraping' })
  scrapedAt: Date;

  @ApiProperty({ description: 'Duración del scraping en milisegundos' })
  duration: number;

  @ApiProperty({ description: 'Mensaje de error si falló', required: false })
  error?: string;
}

export class JobStatusDto {
  @ApiProperty({ description: 'ID del job' })
  id: string;

  @ApiProperty({
    description: 'Estado del job',
    enum: ['pending', 'processing', 'completed', 'failed']
  })
  status: string;

  @ApiProperty({ description: 'Fecha de inicio', required: false })
  startedAt?: Date;

  @ApiProperty({ description: 'Fecha de finalización', required: false })
  completedAt?: Date;

  @ApiProperty({
    description: 'Resultado del scraping',
    type: ScrapingResponseDto,
    required: false
  })
  result?: ScrapingResult;

  @ApiProperty({ description: 'Error si falló', required: false })
  error?: string;
}
