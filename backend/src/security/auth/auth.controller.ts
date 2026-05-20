import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  Inject,
  forwardRef,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { AdminManagementService } from '../admin-management/admin-management.service';
import { RealtimeGateway } from '../../performance/realtime/realtime.gateway';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => MonitoringService))
    private readonly monitoringService: MonitoringService,
    @Inject(forwardRef(() => AdminManagementService))
    private readonly adminManagementService: AdminManagementService,
    @Optional()
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway?: RealtimeGateway,
  ) {}

  /**
   * POST /auth/register
   * Register a new account
   */
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const deviceInfo = this.extractDeviceInfo(req);
    return this.authService.register(registerDto, deviceInfo);
  }

  /**
   * POST /auth/login
   * User login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const deviceInfo = this.extractDeviceInfo(req);

    try {
      // Check if IP is blacklisted
      const isBlacklisted = await this.adminManagementService.isIPBlacklisted(
        deviceInfo.ip || 'unknown',
      );
      if (isBlacklisted) {
        // Log failed login attempt
        await this.monitoringService.logLoginAttempt({
          email: loginDto.email,
          ipAddress: deviceInfo.ip || 'unknown',
          userAgent: deviceInfo.userAgent || 'unknown',
          success: false,
          failureReason: 'IP address is blacklisted',
          deviceFingerprint: deviceInfo.platform,
        });

        throw new ForbiddenException('Your IP address has been blacklisted');
      }

      const result = await this.authService.login(loginDto, deviceInfo);

      // Log successful login attempt
      await this.monitoringService.logLoginAttempt({
        email: loginDto.email,
        ipAddress: deviceInfo.ip || 'unknown',
        userAgent: deviceInfo.userAgent || 'unknown',
        success: true,
        sessionId: result.accessToken?.substring(0, 16), // First 16 chars as session identifier
        deviceFingerprint: deviceInfo.platform,
        userId: result.user?._id || result.user?.id,
      });

      return result;
    } catch (error) {
      // Log failed login attempt
      await this.monitoringService.logLoginAttempt({
        email: loginDto.email,
        ipAddress: deviceInfo.ip || 'unknown',
        userAgent: deviceInfo.userAgent || 'unknown',
        success: false,
        failureReason: error.message || 'Authentication failed',
        deviceFingerprint: deviceInfo.platform,
      });

      throw error;
    }
  }

  /**
   * POST /auth/admin/login
   * Admin-only login - requires admin or super_admin role
   */
  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for admin
  async adminLogin(@Body() loginDto: LoginDto, @Req() req: Request) {
    const deviceInfo = this.extractDeviceInfo(req);

    try {
      // Check if IP is blacklisted
      const isBlacklisted = await this.adminManagementService.isIPBlacklisted(
        deviceInfo.ip || 'unknown',
      );
      if (isBlacklisted) {
        await this.monitoringService.logLoginAttempt({
          email: loginDto.email,
          ipAddress: deviceInfo.ip || 'unknown',
          userAgent: deviceInfo.userAgent || 'unknown',
          success: false,
          failureReason: 'IP address is blacklisted',
          deviceFingerprint: deviceInfo.platform,
        });

        throw new ForbiddenException('Your IP address has been blacklisted');
      }

      // Login with admin validation
      const result = await this.authService.adminLogin(loginDto, deviceInfo);

      // Log successful admin login
      await this.monitoringService.logLoginAttempt({
        email: loginDto.email,
        ipAddress: deviceInfo.ip || 'unknown',
        userAgent: deviceInfo.userAgent || 'unknown',
        success: true,
        sessionId: result.accessToken?.substring(0, 16),
        deviceFingerprint: deviceInfo.platform,
        userId: result.user?._id || result.user?.id,
      });

      // Emit realtime event for monitoring
      this.realtimeGateway?.emitLoginAttempt({
        email: loginDto.email,
        ipAddress: deviceInfo.ip || 'unknown',
        success: true,
        timestamp: new Date(),
        sessionId: result.accessToken?.substring(0, 16),
        deviceInfo: deviceInfo.userAgent,
      });

      return result;
    } catch (error) {
      // Log failed admin login attempt
      await this.monitoringService.logLoginAttempt({
        email: loginDto.email,
        ipAddress: deviceInfo.ip || 'unknown',
        userAgent: deviceInfo.userAgent || 'unknown',
        success: false,
        failureReason: error.message || 'Admin authentication failed',
        deviceFingerprint: deviceInfo.platform,
      });

      // Emit realtime event for monitoring
      this.realtimeGateway?.emitLoginAttempt({
        email: loginDto.email,
        ipAddress: deviceInfo.ip || 'unknown',
        success: false,
        timestamp: new Date(),
        failureReason: error.message || 'Admin authentication failed',
        deviceInfo: deviceInfo.userAgent,
      });

      throw error;
    }
  }

  /**
   * POST /auth/refresh
   * Refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    return this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
      deviceInfo,
    );
  }

  /**
   * POST /auth/logout
   * Logout
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  /**
   * POST /auth/logout-all
   * Logout from all devices
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: any) {
    await this.authService.logoutAll(user.sub);
    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * GET /auth/me
   * Get current user data
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    // جلب بيانات المستخدم الكاملة من قاعدة البيانات بدلاً من الـ JWT payload
    const fullUser = await this.authService.getUserById(user.sub);
    return fullUser;
  }

  /**
   * PATCH /auth/profile
   * Update own profile
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body()
    body: {
      name?: string;
      phone?: string;
      avatar?: string;
      profile?: any;
      preferences?: any;
    },
  ) {
    return this.authService.updateProfile(user.sub, body);
  }

  /**
   * POST /auth/change-password
   * Change own password
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(
      user.sub,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  /**
   * Extract device info from request
   */
  private extractDeviceInfo(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for']?.toString(),
      platform: req.headers['sec-ch-ua-platform']?.toString(),
    };
  }
}
