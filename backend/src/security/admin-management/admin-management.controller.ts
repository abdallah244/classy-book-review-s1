import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminManagementService } from './admin-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles-permissions/guards/roles.guard';
import { Roles } from '../roles-permissions/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminManagementController {
  constructor(
    private readonly adminManagementService: AdminManagementService,
  ) {}

  /**
   * Get all users with pagination
   * GET /api/v1/admin-management/users
   */
  @Get('users')
  async getAllUsers(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const users = await this.adminManagementService.getAllUsers(
      limit ? parseInt(limit) : 50,
      skip ? parseInt(skip) : 0,
    );

    return {
      success: true,
      data: users,
      count: users.length,
    };
  }

  /**
   * Get locked users
   * GET /api/v1/admin-management/locked-users
   */
  @Get('locked-users')
  async getLockedUsers() {
    const users = await this.adminManagementService.getLockedUsers();

    return {
      success: true,
      data: users,
      count: users.length,
    };
  }

  /**
   * Lock user account
   * POST /api/v1/admin-management/lock-user
   */
  @Post('lock-user')
  async lockUser(
    @Body() body: { userId: string; reason: string; duration?: number },
    @CurrentUser() admin: any,
  ) {
    const user = await this.adminManagementService.lockUserAccount(
      body.userId,
      body.reason,
      admin.sub,
      body.duration,
    );

    return {
      success: true,
      message: `User ${user?.email || 'unknown'} has been locked`,
      data: user,
    };
  }

  /**
   * Unlock user account
   * POST /api/v1/admin-management/unlock-user
   */
  @Post('unlock-user')
  async unlockUser(@Body() body: { userId: string }) {
    const user = await this.adminManagementService.unlockUserAccount(
      body.userId,
    );

    return {
      success: true,
      message: `User ${user?.email || 'unknown'} has been unlocked`,
      data: user,
    };
  }

  /**
   * Get blacklisted IPs
   * GET /api/v1/admin-management/blacklisted-ips
   */
  @Get('blacklisted-ips')
  async getBlacklistedIPs() {
    const ips = await this.adminManagementService.getBlacklistedIPs();

    return {
      success: true,
      data: ips,
      count: ips.length,
    };
  }

  /**
   * Add IP to blacklist
   * POST /api/v1/admin-management/blacklist-ip
   */
  @Post('blacklist-ip')
  async blacklistIP(
    @Body() body: { ipAddress: string; reason: string; duration?: number },
    @CurrentUser() admin: any,
  ) {
    const blacklist = await this.adminManagementService.addIPToBlacklist(
      body.ipAddress,
      body.reason,
      admin.sub,
      body.duration,
    );

    return {
      success: true,
      message: `IP ${body.ipAddress} has been blacklisted`,
      data: blacklist,
    };
  }

  /**
   * Remove IP from blacklist
   * POST /api/v1/admin-management/remove-blacklist
   */
  @Post('remove-blacklist')
  async removeFromBlacklist(@Body() body: { ipAddress: string }) {
    const blacklist = await this.adminManagementService.removeIPFromBlacklist(
      body.ipAddress,
    );

    return {
      success: true,
      message: `IP ${body.ipAddress} has been removed from blacklist`,
      data: blacklist,
    };
  }

  /**
   * Get activity log
   * GET /api/v1/admin-management/activity-log
   */
  @Get('activity-log')
  async getActivityLog() {
    const logs = await this.adminManagementService.getActivityLog();

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }
}
