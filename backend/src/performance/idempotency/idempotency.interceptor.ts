import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { IdempotencyService } from './idempotency.service';

export const IDEMPOTENT_KEY = 'idempotent';
export const Idempotent = () => Reflect.metadata(IDEMPOTENT_KEY, true);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private idempotencyService: IdempotencyService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isIdempotent) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      return next.handle();
    }

    const userId = request.user?.sub || 'anonymous';
    const fullKey = `${userId}:${idempotencyKey}`;

    // Check for existing previous request
    const existing = await this.idempotencyService.get(fullKey);

    if (existing) {
      if (existing.status === 'processing') {
        throw new ConflictException('Request is already being processed');
      }

      if (existing.status === 'completed') {
        return of(existing.response);
      }
    }

    // Register request as processing
    await this.idempotencyService.setProcessing(fullKey);

    return next.handle().pipe(
      tap(async (response) => {
        await this.idempotencyService.setCompleted(fullKey, response);
      }),
      catchError(async (error) => {
        await this.idempotencyService.delete(fullKey);
        return throwError(() => error);
      }),
    );
  }
}
