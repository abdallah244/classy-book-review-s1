import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (data) {
      return request.tenant?.[data];
    }

    return {
      tenantId: request.tenantId,
      tenant: request.tenant,
    };
  },
);
