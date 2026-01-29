import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    if (!this.validateApiKey(apiKey)) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Buscar en header X-API-Key
    const headerKey = request.headers['x-api-key'];
    if (headerKey) {
      return headerKey;
    }

    // Buscar en header Authorization con formato "Bearer <key>"
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Buscar en query parameter
    const queryKey = request.query['api_key'];
    if (queryKey) {
      return queryKey;
    }

    return null;
  }

  private validateApiKey(apiKey: string): boolean {
    // Obtener las API keys válidas del .env
    const validKeys = this.configService.get<string>('API_KEYS', '');

    if (!validKeys) {
      // Si no hay keys configuradas, rechazar
      return false;
    }

    // Soportar múltiples keys separadas por coma
    const keys = validKeys.split(',').map(key => key.trim());

    return keys.includes(apiKey);
  }
}
