import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from './audit-log.service';

export const AUDIT_LOG_KEY = 'auditLog';
export interface AuditLogOptions {
  action: string;
  resource: string;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private auditLogService: AuditLogService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          void this.auditLogService.log({
            userId: request.user?.sub,
            action: options.action,
            resource: options.resource,
            resourceId: request.params?.id || response?.id || response?._id,
            actionType: this.getActionType(request.method),
            ip: request.ip || request.connection?.remoteAddress,
            userAgent: request.headers['user-agent'],
            method: request.method,
            path: request.path,
            query: request.query,
            status: 'success',
            duration: Date.now() - startTime,
            tenantId: request.user?.tenantId,
          });
        },
        error: (error) => {
          void this.auditLogService.log({
            userId: request.user?.sub,
            action: options.action,
            resource: options.resource,
            actionType: this.getActionType(request.method),
            ip: request.ip || request.connection?.remoteAddress,
            userAgent: request.headers['user-agent'],
            method: request.method,
            path: request.path,
            query: request.query,
            status: 'error',
            errorMessage: error.message,
            duration: Date.now() - startTime,
            tenantId: request.user?.tenantId,
          });
        },
      }),
    );
  }

  private getActionType(
    method: string,
  ): 'create' | 'read' | 'update' | 'delete' | 'other' {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'create';
      case 'GET':
        return 'read';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'other';
    }
  }
}
