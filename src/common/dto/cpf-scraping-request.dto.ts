import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max, IsArray, Matches } from 'class-validator';

export class CpfScrapingRequestDto {
  @ApiProperty({
    description: 'CPF del cliente para obtener recomendaciones',
    example: '123.456.789-00',
    required: true,
  })
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, {
    message: 'CPF debe estar en formato 123.456.789-00 o 12345678900',
  })
  cpf: string;

  @ApiProperty({
    description: 'URL de Emarsys Scarab',
    example: 'https://extend.emarsys.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: 'ID de Scarab (merchant ID)',
    example: '1916F613C8B45191',
    required: false,
  })
  @IsOptional()
  @IsString()
  scarabId?: string;

  @ApiProperty({
    description: 'Lógica de recomendación a usar (ej: RELATED, PERSONAL, CART, etc.)',
    example: 'PERSONAL',
    required: false,
    default: 'PERSONAL',
  })
  @IsOptional()
  @IsString()
  recommendLogic?: string;

  @ApiProperty({
    description: 'Número máximo de productos a recomendar',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Categorías a incluir en las recomendaciones',
    example: ['WOMEN>Coats & Jackets', 'MEN>Shoes'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeCategories?: string[];

  @ApiProperty({
    description: 'IDs de productos a excluir de las recomendaciones',
    example: ['2540', '2538'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeItems?: string[];

  @ApiProperty({
    description: 'Credenciales de autenticación (username)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'Credenciales de autenticación (password)',
    example: 'password123',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Timeout en milisegundos',
    example: 30000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(300000)
  timeout?: number;

  @ApiProperty({
    description: 'Si se debe usar modo headless',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  headless?: boolean;

  @ApiProperty({
    description: 'Si se debe usar caché',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  useCache?: boolean;
}
