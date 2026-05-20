import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles-permissions/guards/roles.guard';
import { Roles } from '../roles-permissions/decorators/roles.decorator';
import { ThrottleApi } from '../rate-limit';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ThrottleApi()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('search')
  async search(
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('actionType') actionType?: string,
    @Query('status') status?: string,
    @Query('ip') ip?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.search({
      action,
      resource,
      actionType,
      status,
      ip,
      from,
      to,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('stats')
  async getStats() {
    return this.auditLogService.getStats();
  }
}
