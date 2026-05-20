import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Session, SessionDocument } from './schemas/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Create a new session
   */
  async create(
    userId: string,
    createSessionDto: CreateSessionDto,
  ): Promise<SessionDocument> {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      sessionId,
      deviceInfo: createSessionDto.deviceInfo,
      fingerprint: createSessionDto.fingerprint,
      lastActivityAt: new Date(),
      expiresAt,
    });
  }

  /**
   * Get all active user sessions
   */
  async findUserSessions(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
      .sort({ lastActivityAt: -1 });
  }

  /**
   * Get session by sessionId
   */
  async findBySessionId(sessionId: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({
      sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Update last activity
   */
  async updateActivity(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      { lastActivityAt: new Date() },
    );
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    const result = await this.sessionModel.updateOne(
      { sessionId },
      {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason || 'user_logout',
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Session not found');
    }
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const filter: any = {
      userId: new Types.ObjectId(userId),
      isActive: true,
    };

    if (exceptSessionId) {
      filter.sessionId = { $ne: exceptSessionId };
    }

    const result = await this.sessionModel.updateMany(filter, {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: 'logout_all_devices',
    });

    return result.modifiedCount;
  }

  /**
   * Revoke user sessions except current
   */
  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<number> {
    return this.revokeAllUserSessions(userId, currentSessionId);
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.findBySessionId(sessionId);
    return !!session;
  }

  /**
   * Count active user sessions
   */
  async countActiveSessions(userId: string): Promise<number> {
    return this.sessionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Cleanup expired sessions (for Cron Job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        {
          isActive: false,
          revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      ],
    });

    return result.deletedCount;
  }

  /**
   * 🔹 NEW: Extend session duration
   */
  async extendSession(
    sessionId: string,
    additionalMinutes: number = 30,
  ): Promise<{ success: boolean; newExpiresAt?: Date }> {
    try {
      const session = await this.sessionModel.findOne({
        sessionId,
        isActive: true,
      });

      if (!session) {
        return { success: false };
      }

      const newExpiresAt = new Date(
        session.expiresAt.getTime() + additionalMinutes * 60 * 1000,
      );

      await this.sessionModel.updateOne(
        { sessionId },
        { $set: { expiresAt: newExpiresAt } },
      );

      return { success: true, newExpiresAt };
    } catch (error) {
      return { success: false };
    }
  }
}
