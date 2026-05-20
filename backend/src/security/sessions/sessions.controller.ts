import {
  Controller,
  Get,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/auth.interface';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getMySessions(@CurrentUser() user: TokenPayload) {
    const sessions = await this.sessionsService.findUserSessions(user.sub);
    return {
      success: true,
      data: sessions.map((s) => ({
        sessionId: s.sessionId,
        deviceInfo: s.deviceInfo,
        lastActivityAt: s.lastActivityAt,
        createdAt: (s as any).createdAt,
        isCurrent: s.sessionId === user.sessionId,
      })),
    };
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    // Verify session belongs to user
    const session = await this.sessionsService.findBySessionId(sessionId);
    if (session && session.userId.toString() === user.sub) {
      await this.sessionsService.revokeSession(sessionId, 'user_revoked');
    }

    return { success: true, message: 'Session revoked successfully' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async revokeAllOtherSessions(@CurrentUser() user: TokenPayload) {
    const count = await this.sessionsService.revokeOtherSessions(
      user.sub,
      user.sessionId || '',
    );
    return {
      success: true,
      message: `${count} session(s) revoked`,
      revokedCount: count,
    };
  }

  /**
   * 🔹 NEW: Get current session info for timer
   */
  @Get('info')
  async getSessionInfo(@CurrentUser() user: TokenPayload) {
    const session = await this.sessionsService.findBySessionId(
      user.sessionId || '',
    );

    if (!session) {
      return {
        success: false,
        message: 'Session not found',
      };
    }

    return {
      success: true,
      data: {
        sessionId: session.sessionId,
        email: user.email,
        expiresAt: session.expiresAt,
        createdAt: (session as any).createdAt,
        lastActivityAt: session.lastActivityAt,
        remainingMinutes: Math.floor(
          (session.expiresAt.getTime() - Date.now()) / 1000 / 60,
        ),
      },
    };
  }

  /**
   * 🔹 NEW: Extend current session duration
   */
  @Post('extend')
  @HttpCode(HttpStatus.OK)
  async extendSession(
    @CurrentUser() user: TokenPayload,
    @Body() body: { additionalMinutes: number },
  ) {
    const { additionalMinutes = 30 } = body;

    const result = await this.sessionsService.extendSession(
      user.sessionId || '',
      additionalMinutes,
    );

    if (!result.success) {
      return {
        success: false,
        message: 'Failed to extend session',
      };
    }

    return {
      success: true,
      message: `Session extended by ${additionalMinutes} minutes`,
      data: {
        newExpiresAt: result.newExpiresAt,
        remainingMinutes: Math.floor(
          (result.newExpiresAt!.getTime() - Date.now()) / 1000 / 60,
        ),
      },
    };
  }
}
