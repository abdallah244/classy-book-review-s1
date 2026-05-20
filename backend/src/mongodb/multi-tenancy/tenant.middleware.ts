import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract Tenant from multiple sources

    // 1. From Header
    let tenantId = req.headers['x-tenant-id'] as string;

    // 2. From Subdomain
    if (!tenantId) {
      const host = req.headers.host || '';
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await this.tenantService.findBySlug(subdomain);
        if (tenant) {
          tenantId = tenant._id.toString();
        }
      }
    }

    // 3. From Query Parameter (for development)
    if (!tenantId && process.env.NODE_ENV !== 'production') {
      tenantId = req.query.tenantId as string;
    }

    // 4. From JWT Token (if exists)
    if (!tenantId && (req as any).user?.tenantId) {
      tenantId = (req as any).user.tenantId;
    }

    // Set the Tenant
    if (tenantId) {
      const tenant = await this.tenantService.findById(tenantId);
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      if (!tenant.isActive) {
        throw new NotFoundException('Tenant is not active');
      }

      (req as any).tenantId = tenantId;
      (req as any).tenant = tenant;
      this.tenantService.setCurrentTenant(tenantId);
    }

    next();
  }
}
