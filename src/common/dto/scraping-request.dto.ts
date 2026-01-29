import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class ScrapingRequestDto {
  @ApiProperty({
    description: 'URL de Emarsys a scrapear',
    example: 'https://extend.emarsys.com/products/recommended',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;

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
    description: 'Número máximo de productos a scrapear',
    example: 50,
    required: false,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxProducts?: number;

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
