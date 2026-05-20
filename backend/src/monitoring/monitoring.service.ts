import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginAttempt } from './schemas/login-attempt.schema';
import { Session } from '../security/sessions/schemas/session.schema';
import { RefreshToken } from '../security/auth/schemas/refresh-token.schema';
import { BruteForceService } from '../security/brute-force/brute-force.service';
import { SecurityMetrics } from './interfaces/security-metrics.interface';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectModel(LoginAttempt.name)
    private loginAttemptModel: Model<LoginAttempt>,
    @InjectModel(Session.name)
    private sessionModel: Model<Session>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private bruteForceService: BruteForceService,
  ) {}

  /**
   * Log a login attempt
   */
  async logLoginAttempt(data: {
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
    sessionId?: string;
    deviceFingerprint?: string;
    userId?: string;
  }): Promise<LoginAttempt> {
    const attempt = new this.loginAttemptModel(data);
    return attempt.save();
  }

  /**
   * Get all login attempts with pagination
   */
  async getLoginAttempts(
    limit: number = 100,
    skip: number = 0,
  ): Promise<LoginAttempt[]> {
    return this.loginAttemptModel
      .find()
      .select('email ipAddress success timestamp failureReason sessionId')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();
  }

  /**
   * Get login attempts for a specific user
   */
  async getLoginAttemptsByEmail(
    email: string,
    limit: number = 50,
  ): Promise<LoginAttempt[]> {
    return this.loginAttemptModel
      .find({ email })
      .select('email ipAddress success timestamp failureReason sessionId')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /**
   * Get login attempts from a specific IP
   */
  async getLoginAttemptsByIP(
    ipAddress: string,
    limit: number = 50,
  ): Promise<LoginAttempt[]> {
    return this.loginAttemptModel
      .find({ ipAddress })
      .select('email ipAddress success timestamp failureReason sessionId')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /**
   * Get all blocked IPs from brute-force service
   */
  async getBlockedIPs() {
    return this.bruteForceService.getAllBlockedIPs();
  }

  /**
   * Unblock a specific IP
   */
  async unblockIP(ipAddress: string): Promise<void> {
    await this.bruteForceService.unblockIP(ipAddress);
  }

  /**
   * Get comprehensive security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run all queries in parallel for speed
    const [attemptStats, blockedIPs, activeSessions] = await Promise.all([
      // Aggregate login stats in DB instead of loading all docs
      this.loginAttemptModel.aggregate([
        { $match: { timestamp: { $gte: oneDayAgo } } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            successfulLogins: { $sum: { $cond: ['$success', 1, 0] } },
            failedLogins: { $sum: { $cond: ['$success', 0, 1] } },
          },
        },
      ]),
      this.bruteForceService.getBlockedIPsCount(),
      this.sessionModel.countDocuments({ isActive: true }).exec(),
    ]);

    const stats = attemptStats[0] || {
      totalAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
    };
    const totalAttempts = stats.totalAttempts;
    const successfulLogins = stats.successfulLogins;
    const failedLogins = stats.failedLogins;

    // Calculate rates
    const successRate =
      totalAttempts > 0
        ? Math.round((successfulLogins / totalAttempts) * 100)
        : 0;
    const failureRate =
      totalAttempts > 0 ? Math.round((failedLogins / totalAttempts) * 100) : 0;
    const blockRate =
      totalAttempts > 0 ? Math.round((blockedIPs / totalAttempts) * 100) : 0;

    return {
      totalAttempts,
      successfulLogins,
      failedLogins,
      blockedIPs,
      activeSessions,
      successRate,
      failureRate,
      blockRate,
    };
  }

  /**
   * Get login attempts grouped by hour (for charts)
   */
  async getLoginAttemptsTimeline(hours: number = 24) {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const timeline = await this.loginAttemptModel.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            success: '$success',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.hour': 1 },
      },
    ]);

    return timeline;
  }

  /**
   * Get statistics by IP address
   */
  async getIPStatistics(limit: number = 10) {
    return this.loginAttemptModel.aggregate([
      {
        $group: {
          _id: '$ipAddress',
          totalAttempts: { $sum: 1 },
          successfulLogins: {
            $sum: { $cond: ['$success', 1, 0] },
          },
          failedLogins: {
            $sum: { $cond: ['$success', 0, 1] },
          },
          lastAttempt: { $max: '$timestamp' },
        },
      },
      {
        $sort: { totalAttempts: -1 },
      },
      {
        $limit: limit,
      },
    ]);
  }

  /**
   * Clean up old login attempts (manual cleanup if needed)
   */
  async cleanupOldAttempts(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await this.loginAttemptModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    });
    return result.deletedCount;
  }

  /**
   * Delete ALL login attempts from database
   */
  async clearAllLoginAttempts(): Promise<number> {
    const result = await this.loginAttemptModel.deleteMany({});
    return result.deletedCount;
  }

  /**
   * Terminate all admin sessions except the current user's
   */
  async terminateAllAdminSessions(currentUserId: string): Promise<number> {
    const result = await this.refreshTokenModel.updateMany(
      {
        userId: { $ne: currentUserId },
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Terminated by admin from monitoring panel',
        },
      },
    );
    return result.modifiedCount;
  }

  /**
   * Unblock ALL blocked IPs
   */
  async unblockAllIPs(): Promise<number> {
    return this.bruteForceService.unblockAllIPs();
  }

  // ================== 🔹 NEW METHODS FOR GENERAL MONITORING ==================

  /**
   * جلب تسجيلات الدخول الناجحة للشهر الحالي
   */
  async getSuccessfulLoginsThisMonth() {
    const { startDate, endDate } = this.getCurrentMonthRange();

    const attempts = await this.loginAttemptModel
      .find({
        timestamp: { $gte: startDate, $lte: endDate },
        success: true,
      })
      .sort({ timestamp: -1 })
      .lean();

    return attempts.map((attempt) => ({
      email: attempt.email,
      ipAddress: attempt.ipAddress,
      timestamp: attempt.timestamp,
      deviceInfo: attempt.userAgent,
    }));
  }

  /**
   * جلب محاولات تسجيل الدخول الفاشلة للشهر الحالي
   */
  async getFailedLoginsThisMonth() {
    const { startDate, endDate } = this.getCurrentMonthRange();

    const attempts = await this.loginAttemptModel
      .find({
        timestamp: { $gte: startDate, $lte: endDate },
        success: false,
      })
      .sort({ timestamp: -1 })
      .lean();

    return attempts.map((attempt) => ({
      email: attempt.email,
      ipAddress: attempt.ipAddress,
      timestamp: attempt.timestamp,
      failureReason: attempt.failureReason || 'Unknown',
      deviceInfo: attempt.userAgent,
    }));
  }

  /**
   * جلب الجلسات النشطة حالياً (real-time)
   */
  async getActiveSessionsRealtime() {
    const now = new Date();

    const sessions = await this.sessionModel
      .find({
        expiresAt: { $gt: now },
        isActive: true,
      })
      .populate('userId', 'email name')
      .sort({ createdAt: -1 })
      .lean();

    return {
      count: sessions.length,
      sessions: sessions.map((session: any) => ({
        email: session.userId?.email || 'Unknown',
        ipAddress: session.ipAddress || 'Unknown',
        loginAt: session.createdAt,
        sessionId: session.sessionId,
        deviceInfo: session.deviceInfo || session.userAgent || 'Unknown Device',
      })),
    };
  }

  /**
   * كشف الجلسات المكررة (نفس البريد من أكثر من جهاز)
   */
  async detectDuplicateSessions() {
    const now = new Date();

    const sessions = await this.sessionModel
      .find({
        expiresAt: { $gt: now },
        isActive: true,
      })
      .populate('userId', 'email')
      .lean();

    // تجميع حسب البريد الإلكتروني
    const sessionsByEmail = new Map<string, any[]>();

    sessions.forEach((session: any) => {
      const email = session.userId?.email || 'Unknown';
      if (!sessionsByEmail.has(email)) {
        sessionsByEmail.set(email, []);
      }
      sessionsByEmail.get(email)!.push(session);
    });

    // إيجاد المكررات
    const duplicates = Array.from(sessionsByEmail.entries())
      .filter(([email, sessions]) => sessions.length > 1)
      .map(([email, sessions]) => ({
        email,
        count: sessions.length,
        sessions: sessions.map((s: any) => ({
          sessionId: s.sessionId,
          ipAddress: s.ipAddress || 'Unknown',
          deviceInfo: s.deviceInfo || s.userAgent || 'Unknown',
          loginAt: s.createdAt,
        })),
      }));

    return {
      found: duplicates.length > 0,
      duplicates,
    };
  }

  /**
   * تسجيل خروج تلقائي للجلسات المكررة
   */
  async autoLogoutDuplicateSessions() {
    const { found, duplicates } = await this.detectDuplicateSessions();

    if (!found) {
      return { loggedOutCount: 0, affectedEmails: [] };
    }

    let loggedOutCount = 0;
    const affectedEmails: string[] = [];

    const bulkOps: any[] = [];

    for (const duplicate of duplicates) {
      // Keep most recent session, logout others
      const sortedSessions = duplicate.sessions.sort(
        (a: any, b: any) =>
          new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime(),
      );

      const sessionsToLogout = sortedSessions.slice(1);

      for (const session of sessionsToLogout) {
        bulkOps.push({
          updateOne: {
            filter: { sessionId: session.sessionId },
            update: {
              $set: {
                isActive: false,
                revokedAt: new Date(),
                revokedReason: 'Duplicate session detected - Auto logout',
              },
            },
          },
        });
        loggedOutCount++;
      }

      affectedEmails.push(duplicate.email);
    }

    if (bulkOps.length > 0) {
      await this.sessionModel.bulkWrite(bulkOps);
    }

    return { loggedOutCount, affectedEmails };
  }

  /**
   * Helper: Get current month range
   */
  private getCurrentMonthRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { startDate, endDate };
  }

  // ================== 🔹 ADMIN SESSION MANAGEMENT ==================

  /**
   * جلب جلسة المستخدم الحالي
   */
  async getUserSession(userId: string) {
    const now = new Date();

    try {
      // جلب آخر token نشط للمستخدم
      const token = await this.refreshTokenModel
        .findOne({
          userId: userId,
          isRevoked: false,
          $or: [
            { sessionExpiresAt: { $gt: now } },
            { sessionExpiresAt: { $exists: false }, expiresAt: { $gt: now } },
          ],
        })
        .select('_id sessionExpiresAt expiresAt')
        .sort({ createdAt: -1 })
        .lean();

      if (!token) {
        return {
          sessionId: null,
          expiresAt: null,
          remainingMinutes: 0,
          remainingSeconds: 0,
        };
      }

      // استخدام sessionExpiresAt إذا موجود
      const sessionExpiry =
        (token as any).sessionExpiresAt || (token as any).expiresAt;
      const diff = new Date(sessionExpiry).getTime() - now.getTime();

      return {
        sessionId: (token as any)._id?.toString(),
        expiresAt: sessionExpiry,
        remainingMinutes: Math.max(0, Math.floor(diff / 60000)),
        remainingSeconds: Math.max(0, Math.floor((diff % 60000) / 1000)),
      };
    } catch (error) {
      console.error('Error getting user session:', error);
      return {
        sessionId: null,
        expiresAt: null,
        remainingMinutes: 0,
        remainingSeconds: 0,
      };
    }
  }

  /**
   * جلب الجلسات النشطة للأدمن فقط - آخر جلسة لكل مستخدم فقط
   * نستخدم RefreshToken لأنه هو الذي يتم إنشاؤه عند تسجيل الدخول
   */
  async getActiveAdminSessions() {
    const now = new Date();

    console.log('🔍 Fetching active admin sessions...');

    try {
      // استخدام aggregation للحصول على آخر token فقط لكل مستخدم
      const latestTokens = await this.refreshTokenModel
        .aggregate([
          // 1. فلترة الـ tokens النشطة فقط (الجلسة لم تنتهِ)
          {
            $match: {
              isRevoked: false,
              // نتحقق من sessionExpiresAt إذا موجود، وإلا نستخدم expiresAt
              $or: [
                { sessionExpiresAt: { $gt: now } },
                {
                  sessionExpiresAt: { $exists: false },
                  expiresAt: { $gt: now },
                },
              ],
            },
          },
          // 2. ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
          {
            $sort: { createdAt: -1 },
          },
          // 3. تجميع حسب userId وأخذ أول (أحدث) token فقط
          {
            $group: {
              _id: '$userId',
              tokenId: { $first: '$_id' },
              deviceInfo: { $first: '$deviceInfo' },
              expiresAt: { $first: '$expiresAt' },
              sessionExpiresAt: { $first: '$sessionExpiresAt' },
              lastUsedAt: { $first: '$lastUsedAt' },
              createdAt: { $first: '$createdAt' },
            },
          },
          // 4. ربط مع جدول المستخدمين مع فلترة الأدمن في الـ pipeline مباشرة
          {
            $lookup: {
              from: 'users',
              let: { uid: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$uid'] },
                    role: { $in: ['admin', 'super_admin'] },
                  },
                },
                { $project: { email: 1, name: 1, role: 1 } },
              ],
              as: 'user',
            },
          },
          // 5. فك الـ array (وإزالة الـ non-admin تلقائياً)
          {
            $unwind: '$user',
          },
        ])
        .option({ maxTimeMS: 10000 });

      console.log(`✅ Found ${latestTokens.length} active admin sessions`);

      const sessions = latestTokens.map((token: any) => {
        const user = token.user || {};
        const name = user.name || '';
        const nameParts = name.split(' ');

        // استخدام sessionExpiresAt إذا موجود، وإلا expiresAt
        const sessionExpiry = token.sessionExpiresAt || token.expiresAt;

        return {
          sessionId: token.tokenId?.toString(),
          email: user.email || 'Unknown',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          role: user.role || 'admin',
          userId: token._id?.toString() || '',
          loginAt: token.createdAt,
          expiresAt: sessionExpiry,
          lastActivityAt: token.lastUsedAt || token.createdAt,
          remainingMinutes: Math.max(
            0,
            Math.floor(
              (new Date(sessionExpiry).getTime() - now.getTime()) / 1000 / 60,
            ),
          ),
          deviceInfo: token.deviceInfo || {},
          ipAddress: token.deviceInfo?.ip || 'Unknown',
        };
      });

      return {
        count: sessions.length,
        sessions,
      };
    } catch (error) {
      console.error('❌ Error fetching admin sessions:', error);
      return { count: 0, sessions: [] };
    }
  }

  /**
   * تمديد جلسة أدمن محددة
   */
  async extendAdminSession(
    sessionId: string,
    additionalMinutes: number = 30,
  ): Promise<{
    success: boolean;
    newExpiresAt?: Date;
    remainingMinutes?: number;
    email?: string;
    message?: string;
  }> {
    try {
      // البحث في refresh_tokens باستخدام الـ _id
      const token = await this.refreshTokenModel
        .findOne({
          _id: sessionId,
          isRevoked: false,
        })
        .select('userId sessionExpiresAt expiresAt')
        .populate('userId', 'email role');

      if (!token) {
        console.log(`❌ Token not found for sessionId: ${sessionId}`);
        return { success: false, message: 'Session not found' };
      }

      // التحقق من أنها جلسة أدمن
      const role = (token as any).userId?.role;
      if (role !== 'admin' && role !== 'super_admin') {
        return { success: false, message: 'Not an admin session' };
      }

      // استخدام sessionExpiresAt إذا موجود، وإلا إنشاؤه من الآن
      const currentSessionExpiry =
        (token as any).sessionExpiresAt || new Date();
      const safeMins = Math.min(Math.max(additionalMinutes, 1), 120);
      const newSessionExpiresAt = new Date(
        Math.max(currentSessionExpiry.getTime(), Date.now()) +
          safeMins * 60 * 1000,
      );

      await this.refreshTokenModel.updateOne(
        { _id: sessionId },
        {
          $set: {
            sessionExpiresAt: newSessionExpiresAt,
            lastUsedAt: new Date(),
          },
        },
      );

      console.log(
        `✅ Extended session for ${(token as any).userId?.email} by ${safeMins} minutes`,
      );

      return {
        success: true,
        newExpiresAt: newSessionExpiresAt,
        remainingMinutes: Math.floor(
          (newSessionExpiresAt.getTime() - Date.now()) / 1000 / 60,
        ),
        email: (token as any).userId?.email,
      };
    } catch (error) {
      console.error('❌ Failed to extend session:', error);
      return { success: false, message: 'Failed to extend session' };
    }
  }
}
