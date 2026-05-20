import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../security/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../security/roles-permissions/guards/roles.guard';
import { Roles } from '../security/roles-permissions/decorators/roles.decorator';
import { RealtimeGateway } from '../performance/realtime/realtime.gateway';
import { ThrottleApi } from '../security/rate-limit';

@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ThrottleApi()
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Parse and validate a positive integer query param
   */
  private safeParseInt(
    value: string | undefined,
    defaultValue: number,
    max: number = 1000,
  ): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) return defaultValue;
    return Math.min(parsed, max);
  }

  /**
   * Validate IP address format
   */
  private validateIPAddress(ip: string): void {
    if (!ip || typeof ip !== 'string') {
      throw new BadRequestException('IP address is required');
    }
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^([a-fA-F\d]{0,4}:){2,7}[a-fA-F\d]{0,4}$/;
    if (!ipv4.test(ip) && !ipv6.test(ip) && ip !== '::1') {
      throw new BadRequestException('Invalid IP address format');
    }
  }

  /**
   * Get all login attempts
   * GET /api/v1/monitoring/login-attempts
   */
  @Get('login-attempts')
  async getLoginAttempts(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const attempts = await this.monitoringService.getLoginAttempts(
      this.safeParseInt(limit, 100),
      this.safeParseInt(skip, 0),
    );

    return {
      success: true,
      data: attempts,
      count: attempts.length,
    };
  }

  /**
   * Get login attempts by email
   * GET /api/v1/monitoring/login-attempts/email/:email
   */
  @Get('login-attempts/email')
  async getLoginAttemptsByEmail(
    @Query('email') email: string,
    @Query('limit') limit?: string,
  ) {
    const attempts = await this.monitoringService.getLoginAttemptsByEmail(
      email,
      this.safeParseInt(limit, 50),
    );

    return {
      success: true,
      data: attempts,
      count: attempts.length,
    };
  }

  /**
   * Get login attempts by IP
   * GET /api/v1/monitoring/login-attempts/ip
   */
  @Get('login-attempts/ip')
  async getLoginAttemptsByIP(
    @Query('ip') ip: string,
    @Query('limit') limit?: string,
  ) {
    const attempts = await this.monitoringService.getLoginAttemptsByIP(
      ip,
      this.safeParseInt(limit, 50),
    );

    return {
      success: true,
      data: attempts,
      count: attempts.length,
    };
  }

  /**
   * Get all blocked IPs
   * GET /api/v1/monitoring/blocked-ips
   */
  @Get('blocked-ips')
  async getBlockedIPs() {
    const blockedIPs = await this.monitoringService.getBlockedIPs();

    return {
      success: true,
      data: blockedIPs,
      count: blockedIPs.length,
    };
  }

  /**
   * Unblock a specific IP
   * POST /api/v1/monitoring/unblock-ip
   */
  @Post('unblock-ip')
  async unblockIP(@Body('ipAddress') ipAddress: string) {
    this.validateIPAddress(ipAddress);
    await this.monitoringService.unblockIP(ipAddress);

    return {
      success: true,
      message: `IP ${ipAddress} has been unblocked successfully`,
    };
  }

  /**
   * Get security metrics
   * GET /api/v1/monitoring/security-metrics
   */
  @Get('security-metrics')
  async getSecurityMetrics() {
    const metrics = await this.monitoringService.getSecurityMetrics();

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get login attempts timeline for charts
   * GET /api/v1/monitoring/timeline
   */
  @Get('timeline')
  async getTimeline(@Query('hours') hours?: string) {
    const timeline = await this.monitoringService.getLoginAttemptsTimeline(
      this.safeParseInt(hours, 24, 168),
    );

    return {
      success: true,
      data: timeline,
    };
  }

  /**
   * Get IP statistics
   * GET /api/v1/monitoring/ip-statistics
   */
  @Get('ip-statistics')
  async getIPStatistics(@Query('limit') limit?: string) {
    const stats = await this.monitoringService.getIPStatistics(
      this.safeParseInt(limit, 10, 100),
    );

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Clean up old login attempts
   * POST /api/v1/monitoring/cleanup
   */
  @Post('cleanup')
  @Roles('super_admin')
  async cleanupOldAttempts(
    @Body('daysOld') daysOld?: number,
    @Req() req?: any,
  ) {
    const safeDays = Math.min(Math.max(Number(daysOld) || 90, 1), 365);
    const adminEmail = req?.user?.email || 'unknown';
    console.log(
      `[AUDIT] Admin ${adminEmail} triggered cleanup of attempts older than ${safeDays} days`,
    );
    const deletedCount =
      await this.monitoringService.cleanupOldAttempts(safeDays);

    return {
      success: true,
      message: `Cleaned up ${deletedCount} old login attempts`,
      deletedCount,
    };
  }

  // ================== 🔹 NEW ENDPOINTS FOR GENERAL MONITORING ==================

  /**
   * 🟢 جلب تسجيلات الدخول الناجحة للشهر الحالي
   * GET /api/v1/monitoring/successful-logins-monthly
   */
  @Get('successful-logins-monthly')
  async getSuccessfulLoginsMonthly() {
    const logins = await this.monitoringService.getSuccessfulLoginsThisMonth();
    return {
      success: true,
      data: logins,
      count: logins.length,
    };
  }

  /**
   * 🔴 جلب محاولات تسجيل الدخول الفاشلة للشهر الحالي
   * GET /api/v1/monitoring/failed-logins-monthly
   */
  @Get('failed-logins-monthly')
  async getFailedLoginsMonthly() {
    const logins = await this.monitoringService.getFailedLoginsThisMonth();
    return {
      success: true,
      data: logins,
      count: logins.length,
    };
  }

  /**
   * ⚡ جلب الجلسات النشطة حالياً (real-time)
   * GET /api/v1/monitoring/active-sessions-realtime
   */
  @Get('active-sessions-realtime')
  async getActiveSessionsRealtime() {
    const result = await this.monitoringService.getActiveSessionsRealtime();
    return {
      success: true,
      data: result.sessions,
      count: result.count,
    };
  }

  /**
   * 🔍 كشف الجلسات المكررة
   * GET /api/v1/monitoring/duplicate-sessions
   */
  @Get('duplicate-sessions')
  async detectDuplicateSessions() {
    const result = await this.monitoringService.detectDuplicateSessions();
    return {
      success: true,
      found: result.found,
      duplicates: result.duplicates,
    };
  }

  /**
   * 🚪 تسجيل خروج تلقائي للجلسات المكررة
   * POST /api/v1/monitoring/auto-logout-duplicates
   */
  @Post('auto-logout-duplicates')
  async autoLogoutDuplicates() {
    const result = await this.monitoringService.autoLogoutDuplicateSessions();
    return {
      success: true,
      message: `Logged out ${result.loggedOutCount} duplicate sessions`,
      loggedOutCount: result.loggedOutCount,
      affectedEmails: result.affectedEmails,
    };
  }

  // ================== 🔹 ADMIN SESSION MANAGEMENT ==================

  /**
   * � جلب جلسة المستخدم الحالي
   * GET /api/v1/monitoring/my-session
   */
  @Get('my-session')
  async getMySession(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?._id;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const result = await this.monitoringService.getUserSession(userId);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * �👥 جلب الجلسات النشطة للأدمن
   * GET /api/v1/monitoring/admin-sessions
   */
  @Get('admin-sessions')
  async getActiveAdminSessions() {
    const result = await this.monitoringService.getActiveAdminSessions();
    return {
      success: true,
      data: result.sessions,
      count: result.count,
    };
  }

  /**
   * ⏱️ تمديد جلسة أدمن محددة
   * POST /api/v1/monitoring/extend-session
   */
  @Post('extend-session')
  async extendAdminSession(
    @Body() body: { sessionId: string; additionalMinutes?: number },
  ) {
    const { sessionId, additionalMinutes = 30 } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new BadRequestException('Valid session ID is required');
    }

    const cappedMinutes = Math.min(
      Math.max(Number(additionalMinutes) || 30, 1),
      120,
    );

    const result = await this.monitoringService.extendAdminSession(
      sessionId,
      cappedMinutes,
    );

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to extend session',
      };
    }

    // إرسال response فوراً ثم WebSocket events بشكل غير متزامن
    const response = {
      success: true,
      message: `Session extended by ${cappedMinutes} minutes`,
      data: {
        sessionId,
        email: result.email,
        newExpiresAt: result.newExpiresAt,
        remainingMinutes: result.remainingMinutes,
      },
    };

    // إرسال WebSocket events بشكل غير متزامن (لا ننتظر)
    this.emitSessionExtensionEvents(sessionId, result, cappedMinutes).catch(
      (error) => console.error('WebSocket emit error:', error),
    );

    return response;
  }

  /**
   * Emit WebSocket events for session extension
   */
  private async emitSessionExtensionEvents(
    sessionId: string,
    result: { email?: string; newExpiresAt?: Date; remainingMinutes?: number },
    additionalMinutes: number,
  ): Promise<void> {
    this.realtimeGateway.emitAdminSessionExtended({
      sessionId,
      email: result.email!,
      additionalMinutes,
      newExpiresAt: result.newExpiresAt!,
      remainingMinutes: result.remainingMinutes!,
    });

    const updatedSessions =
      await this.monitoringService.getActiveAdminSessions();
    this.realtimeGateway.emitAdminSessionsUpdate(updatedSessions);
  }

  /**
   * Clear ALL login attempts from database
   * POST /api/v1/monitoring/clear-login-attempts
   */
  @Post('clear-login-attempts')
  @Roles('super_admin', 'admin')
  async clearAllLoginAttempts(@Req() req?: any) {
    const adminEmail = req?.user?.email || 'unknown';
    console.log(`[AUDIT] Admin ${adminEmail} cleared ALL login attempts`);
    const deletedCount = await this.monitoringService.clearAllLoginAttempts();

    return {
      success: true,
      message: `Cleared ${deletedCount} login attempts`,
      deletedCount,
    };
  }

  /**
   * Terminate all admin sessions except current user
   * POST /api/v1/monitoring/terminate-sessions
   */
  @Post('terminate-sessions')
  @Roles('super_admin', 'admin')
  async terminateAllSessions(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?._id;
    const adminEmail = req?.user?.email || 'unknown';
    console.log(
      `[AUDIT] Admin ${adminEmail} terminated all other admin sessions`,
    );
    const terminatedCount =
      await this.monitoringService.terminateAllAdminSessions(userId);

    return {
      success: true,
      message: `Terminated ${terminatedCount} admin sessions`,
      terminatedCount,
    };
  }

  /**
   * Unblock ALL blocked IPs
   * POST /api/v1/monitoring/unblock-all
   */
  @Post('unblock-all')
  @Roles('super_admin', 'admin')
  async unblockAllIPs(@Req() req?: any) {
    const adminEmail = req?.user?.email || 'unknown';
    console.log(`[AUDIT] Admin ${adminEmail} unblocked ALL IPs`);
    const deletedCount = await this.monitoringService.unblockAllIPs();

    return {
      success: true,
      message: `Unblocked all IPs (${deletedCount} records cleared)`,
      deletedCount,
    };
  }
}
