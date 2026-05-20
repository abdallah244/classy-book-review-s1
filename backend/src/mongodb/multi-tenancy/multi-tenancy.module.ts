import { Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenantInterceptor } from './tenant.interceptor';

@Module({
  providers: [
    TenantService,
    TenantMiddleware,
    TenantInterceptor,
    {
      provide: 'TENANT_CONTEXT',
      scope: Scope.REQUEST,
      inject: [REQUEST],
      useFactory: (request: any) => {
        return {
          tenantId: request.tenantId,
          tenant: request.tenant,
        };
      },
    },
  ],
  exports: [TenantService, 'TENANT_CONTEXT'],
})
export class MultiTenancyModule {}
