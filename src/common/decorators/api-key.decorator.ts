import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

/**
 * Decorator para aplicar autenticación con API Key
 * Aplica el guard y actualiza la documentación Swagger
 *
 * @example
 * @ApiKeyAuth()
 * @Post('recommendations/cpf')
 * getRecommendations() {
 *   // ...
 * }
 */
export function ApiKeyAuth() {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiSecurity('api_key'),
    ApiBearerAuth(),
  );
}
