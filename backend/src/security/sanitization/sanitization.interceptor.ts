import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SanitizationService } from './sanitization.service';

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  constructor(private sanitizationService: SanitizationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitize Body
    if (request.body && typeof request.body === 'object') {
      request.body = this.sanitizationService.sanitizeMongoQuery(request.body);
    }

    // Sanitize Query params - query is read-only, so we sanitize each property
    if (request.query && typeof request.query === 'object') {
      const sanitizedQuery = this.sanitizationService.sanitizeMongoQuery(
        request.query,
      );
      Object.keys(request.query).forEach((key) => {
        request.query[key] = sanitizedQuery[key];
      });
    }

    // Sanitize Params - params may also be read-only in some cases
    if (request.params && typeof request.params === 'object') {
      try {
        const sanitizedParams = this.sanitizationService.sanitizeMongoQuery(
          request.params,
        );
        Object.keys(request.params).forEach((key) => {
          request.params[key] = sanitizedParams[key];
        });
      } catch {
        // params might be read-only, skip sanitization
      }
    }

    return next.handle();
  }
}
