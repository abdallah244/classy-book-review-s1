import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  TokenPayload,
  AuthTokens,
  TokenResponse,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(
    registerDto: RegisterDto,
    deviceInfo?: DeviceInfo,
  ): Promise<TokenResponse> {
    const { email, password, name, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.userModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      isEmailVerified: false,
      role: 'student',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Login
   */
  async login(
    loginDto: LoginDto,
    deviceInfo: DeviceInfo,
  ): Promise<TokenResponse> {
    const { email, password } = loginDto;

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    // Check if account is not locked
    if (user.isLocked) {
      throw new UnauthorizedException(
        'Account is temporarily locked. Try again later',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.incrementFailedAttempts(user);
      throw new UnauthorizedException('Invalid login credentials');
    }

    // Reset failed login attempts
    await this.resetFailedAttempts(user);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens with device info
    const tokens = await this.generateTokens(user, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Admin Login - only for admin and super_admin roles
   */
  async adminLogin(
    loginDto: LoginDto,
    deviceInfo: DeviceInfo,
  ): Promise<TokenResponse> {
    const { email, password } = loginDto;

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new UnauthorizedException(
        'Access denied. Admin privileges required',
      );
    }

    // Check if account is not locked
    if (user.isLocked) {
      throw new UnauthorizedException(
        'Account is temporarily locked. Try again later',
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.incrementFailedAttempts(user);
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Reset failed login attempts
    await this.resetFailedAttempts(user);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens with device info
    const tokens = await this.generateTokens(user, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Refresh tokens using Refresh Token
   * Token Rotation: every time access token is refreshed, a new refresh token is created
   */
  async refreshTokens(
    refreshToken: string,
    deviceInfo: DeviceInfo,
  ): Promise<AuthTokens> {
    // Verify refresh token
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokenModel.findOne({
      tokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Token is invalid or expired');
    }

    // Verify user
    const user = await this.userModel.findById(storedToken.userId);
    if (!user || user.isLocked) {
      throw new UnauthorizedException('User not found or blocked');
    }

    // Token Rotation: revoke old token
    storedToken.isRevoked = true;
    storedToken.revokedAt = new Date();
    storedToken.revokedReason = 'token_rotation';
    await storedToken.save();

    // Generate new tokens
    return this.generateTokens(user, deviceInfo);
  }

  /**
   * Logout
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenModel.updateOne(
      { tokenHash },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout' },
    );
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout_all' },
    );
  }

  /**
   * Generate Access Token and Refresh Token
   */
  private async generateTokens(
    user: UserDocument,
    deviceInfo?: DeviceInfo,
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    };

    // Access Token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
    });

    // Refresh Token (long-lived)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    // وقت الـ session (يمكن تمديده من صفحة المراقبة)
    const sessionDuration = this.parseDuration(
      this.configService.get('JWT_EXPIRATION', '15m'),
    );

    // Save refresh token in database
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      deviceInfo: deviceInfo || {},
      expiresAt: new Date(
        Date.now() +
          this.parseDuration(
            this.configService.get('JWT_REFRESH_EXPIRATION', '30d'),
          ),
      ),
      // وقت انتهاء الجلسة = نفس وقت الـ access token
      sessionExpiresAt: new Date(Date.now() + sessionDuration),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn:
        this.parseDuration(this.configService.get('JWT_EXPIRATION', '15m')) /
        1000,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      avatar?: string;
      profile?: any;
      preferences?: any;
    },
  ): Promise<Partial<User>> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (data.name) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    if (data.profile) user.profile = { ...user.profile, ...data.profile };
    if (data.preferences)
      user.preferences = { ...user.preferences, ...data.preferences };

    await user.save();
    return this.sanitizeUser(user);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid)
      throw new BadRequestException('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();
  }

  /**
   * Validate Access Token
   */
  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Increment failed login attempts
   */
  private async incrementFailedAttempts(user: UserDocument): Promise<void> {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await user.save();
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedAttempts(user: UserDocument): Promise<void> {
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    await user.save();
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Convert duration string to milliseconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  /**
   * Get user by ID (for /auth/me)
   */
  async getUserById(userId: string): Promise<Partial<User>> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  /**
   * Remove sensitive data from user
   */
  private sanitizeUser(user: UserDocument): Partial<User> {
    const { password, failedLoginAttempts, lockUntil, ...sanitized } =
      user.toObject();
    return sanitized;
  }
}

interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  deviceId?: string;
  platform?: string;
}
