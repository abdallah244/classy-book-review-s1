import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LoginAttempt,
  LoginAttemptDocument,
} from './schemas/login-attempt.schema';

interface BruteForceConfig {
  maxAttempts: number;
  lockoutDuration: number; // in minutes
  windowDuration: number; // in minutes
}

@Injectable()
export class BruteForceService {
  private readonly config: BruteForceConfig = {
    maxAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    windowDuration: 60, // 1 hour
  };

  constructor(
    @InjectModel(LoginAttempt.name)
    private loginAttemptModel: Model<LoginAttemptDocument>,
  ) {}

  /**
   * Record login attempt
   */
  async recordAttempt(data: {
    identifier: string;
    ip: string;
    email?: string;
    success: boolean;
    userAgent?: string;
    reason?: string;
  }): Promise<void> {
    await this.loginAttemptModel.create(data);

    // If attempt succeeded, delete previous failed attempts
    if (data.success) {
      await this.clearFailedAttempts(data.identifier);
    }
  }

  /**
   * Check lockout status
   */
  async checkLockout(identifier: string, ip: string): Promise<void> {
    const [identifierBlocked, ipBlocked] = await Promise.all([
      this.isBlocked(identifier),
      this.isBlocked(ip),
    ]);

    if (identifierBlocked) {
      const remainingTime = await this.getRemainingLockoutTime(identifier);
      throw new ForbiddenException(
        `Account is temporarily locked. Please try again in ${remainingTime} minutes`,
      );
    }

    if (ipBlocked) {
      const remainingTime = await this.getRemainingLockoutTime(ip);
      throw new ForbiddenException(
        `IP address is temporarily blocked. Please try again in ${remainingTime} minutes`,
      );
    }
  }

  /**
   * Check if identifier is blocked
   */
  private async isBlocked(identifier: string): Promise<boolean> {
    const windowStart = new Date(
      Date.now() - this.config.windowDuration * 60 * 1000,
    );

    const failedAttempts = await this.loginAttemptModel.countDocuments({
      identifier,
      success: false,
      createdAt: { $gte: windowStart },
    });

    return failedAttempts >= this.config.maxAttempts;
  }

  /**
   * Remaining lockout time
   */
  private async getRemainingLockoutTime(identifier: string): Promise<number> {
    const lastAttempt = await this.loginAttemptModel
      .findOne({ identifier, success: false })
      .sort({ createdAt: -1 });

    if (!lastAttempt) return 0;

    const lockoutEnd = new Date(
      lastAttempt.createdAt.getTime() + this.config.lockoutDuration * 60 * 1000,
    );
    const remaining = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);

    return Math.max(0, remaining);
  }

  /**
   * Clear failed attempts
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    await this.loginAttemptModel.deleteMany({
      identifier,
      success: false,
    });
  }

  /**
   * Remaining attempts count
   */
  async getRemainingAttempts(identifier: string): Promise<number> {
    const windowStart = new Date(
      Date.now() - this.config.windowDuration * 60 * 1000,
    );

    const failedAttempts = await this.loginAttemptModel.countDocuments({
      identifier,
      success: false,
      createdAt: { $gte: windowStart },
    });

    return Math.max(0, this.config.maxAttempts - failedAttempts);
  }

  /**
   * Attempt statistics
   */
  async getAttemptStats(identifier: string): Promise<{
    totalAttempts: number;
    failedAttempts: number;
    lastAttempt: Date | null;
    isBlocked: boolean;
    remainingAttempts: number;
  }> {
    const windowStart = new Date(
      Date.now() - this.config.windowDuration * 60 * 1000,
    );

    const [total, failed, lastAttempt] = await Promise.all([
      this.loginAttemptModel.countDocuments({
        identifier,
        createdAt: { $gte: windowStart },
      }),
      this.loginAttemptModel.countDocuments({
        identifier,
        success: false,
        createdAt: { $gte: windowStart },
      }),
      this.loginAttemptModel.findOne({ identifier }).sort({ createdAt: -1 }),
    ]);

    return {
      totalAttempts: total,
      failedAttempts: failed,
      lastAttempt: lastAttempt?.createdAt || null,
      isBlocked: failed >= this.config.maxAttempts,
      remainingAttempts: Math.max(0, this.config.maxAttempts - failed),
    };
  }

  /**
   * Get all blocked IPs with details
   */
  async getAllBlockedIPs(): Promise<
    Array<{
      _id: string;
      ipAddress: string;
      attempts: number;
      blockedUntil: Date;
      reason: string;
    }>
  > {
    const windowStart = new Date(
      Date.now() - this.config.windowDuration * 60 * 1000,
    );

    const blockedIPs = await this.loginAttemptModel.aggregate([
      {
        $match: {
          success: false,
          createdAt: { $gte: windowStart },
        },
      },
      {
        $group: {
          _id: '$ip',
          attempts: { $sum: 1 },
          lastAttempt: { $max: '$createdAt' },
        },
      },
      {
        $match: {
          attempts: { $gte: this.config.maxAttempts },
        },
      },
    ]);

    return blockedIPs.map((item) => ({
      _id: item._id,
      ipAddress: item._id,
      attempts: item.attempts,
      blockedUntil: new Date(
        item.lastAttempt.getTime() + this.config.lockoutDuration * 60 * 1000,
      ),
      reason: `Too many failed login attempts (${item.attempts})`,
    }));
  }

  /**
   * Get count of blocked IPs
   */
  async getBlockedIPsCount(): Promise<number> {
    const windowStart = new Date(
      Date.now() - this.config.windowDuration * 60 * 1000,
    );

    const result = await this.loginAttemptModel.aggregate([
      {
        $match: {
          success: false,
          createdAt: { $gte: windowStart },
        },
      },
      {
        $group: {
          _id: '$ip',
          attempts: { $sum: 1 },
        },
      },
      {
        $match: {
          attempts: { $gte: this.config.maxAttempts },
        },
      },
      {
        $count: 'total',
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Unblock a specific IP address
   */
  async unblockIP(ipAddress: string): Promise<void> {
    await this.loginAttemptModel.deleteMany({
      ip: ipAddress,
      success: false,
    });
  }

  /**
   * Unblock ALL blocked IPs
   */
  async unblockAllIPs(): Promise<number> {
    const result = await this.loginAttemptModel.deleteMany({
      success: false,
    });
    return result.deletedCount;
  }
}
