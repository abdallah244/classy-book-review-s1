import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../api-key.service';

export const API_KEY_GUARD = 'apiKeyGuard';
export const RequireApiKey = () => Reflect.metadata(API_KEY_GUARD, true);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresApiKey = this.reflector.getAllAndOverride<boolean>(
      API_KEY_GUARD,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const ip = request.ip || request.connection?.remoteAddress;
    const domain = request.headers.origin || request.headers.referer;

    try {
      const validatedKey = await this.apiKeyService.validate(
        apiKey,
        ip,
        domain,
      );
      request.apiKey = validatedKey;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid API key');
    }
  }

  private extractApiKey(request: any): string | null {
    // From Header
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('cb_')) {
        return token;
      }
    }

    // From X-API-Key header
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }

    // From Query parameter
    if (request.query.api_key) {
      return request.query.api_key;
    }

    return null;
  }
}
