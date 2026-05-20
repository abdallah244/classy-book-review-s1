import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { IPBlacklist } from '../brute-force/schemas/ip-blacklist.schema';

@Injectable()
export class AdminManagementService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(IPBlacklist.name) private ipBlacklistModel: Model<any>,
  ) {}

  /**
   * Lock user account manually
   */
  async lockUserAccount(
    userId: string,
    reason: string,
    lockedBy: string,
    lockDuration?: number, // in minutes, null = permanent
  ) {
    const lockUntil = lockDuration
      ? new Date(Date.now() + lockDuration * 60 * 1000)
      : null;

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        isLocked: true,
        lockUntil,
        lockReason: reason,
        lockedBy,
      },
      { new: true },
    );

    return user;
  }

  /**
   * Unlock user account manually
   */
  async unlockUserAccount(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        isLocked: false,
        lockUntil: null,
        lockReason: null,
        lockedBy: null,
        failedLoginAttempts: 0,
      },
      { new: true },
    );

    return user;
  }

  /**
   * Get locked users
   */
  async getLockedUsers() {
    return this.userModel
      .find({ isLocked: true })
      .select('-password')
      .sort({ lockUntil: -1 });
  }

  /**
   * Get all users (for admin panel)
   */
  async getAllUsers(limit: number = 50, skip: number = 0) {
    return this.userModel
      .find({ isDeleted: false })
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
  }

  /**
   * Get user with lock status
   */
  async getUserWithLockStatus(userId: string) {
    return this.userModel.findById(userId).select('-password');
  }

  /**
   * Add IP to blacklist
   */
  async addIPToBlacklist(
    ipAddress: string,
    reason: string,
    blockedBy: string,
    blockDuration?: number, // in minutes, null = permanent
  ) {
    const blockedUntil = blockDuration
      ? new Date(Date.now() + blockDuration * 60 * 1000)
      : null;

    const blacklist = await this.ipBlacklistModel.findOneAndUpdate(
      { ipAddress },
      {
        ipAddress,
        reason,
        blockedBy,
        blockedUntil,
        isActive: true,
        isPermanent: !blockDuration,
      },
      { upsert: true, new: true },
    );

    return blacklist;
  }

  /**
   * Remove IP from blacklist
   */
  async removeIPFromBlacklist(ipAddress: string) {
    return this.ipBlacklistModel.findOneAndUpdate(
      { ipAddress },
      { isActive: false },
      { new: true },
    );
  }

  /**
   * Get all blacklisted IPs
   */
  async getBlacklistedIPs() {
    return this.ipBlacklistModel
      .find({ isActive: true })
      .sort({ createdAt: -1 });
  }

  /**
   * Check if IP is blacklisted
   */
  async isIPBlacklisted(ipAddress: string): Promise<boolean> {
    const blacklist = await this.ipBlacklistModel.findOne({
      ipAddress,
      isActive: true,
    });

    if (!blacklist) return false;

    // Check if blacklist expired
    if (blacklist.blockedUntil && blacklist.blockedUntil < new Date()) {
      // Blacklist expired, deactivate it
      await this.removeIPFromBlacklist(ipAddress);
      return false;
    }

    return true;
  }

  /**
   * Reset user failed login attempts
   */
  async resetFailedLoginAttempts(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { failedLoginAttempts: 0 },
      { new: true },
    );
  }

  /**
   * Get activity log (users who were locked/unlocked recently)
   */
  async getActivityLog() {
    return this.userModel
      .find({
        $or: [
          { lockReason: { $exists: true } },
          { lockUntil: { $exists: true } },
        ],
      })
      .select('-password')
      .sort({ updatedAt: -1 })
      .limit(50);
  }
}
