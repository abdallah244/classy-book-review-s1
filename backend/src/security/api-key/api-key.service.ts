import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';

interface CreateApiKeyDto {
  name: string;
  description?: string;
  ownerId: string;
  tenantId?: string;
  permissions?: string[];
  allowedIps?: string[];
  allowedDomains?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  /**
   * Generate new API key
   */
  async create(
    data: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKeyDocument; rawKey: string }> {
    // Generate random key
    const prefix = 'cb_'; // classy book
    const rawKey = prefix + crypto.randomBytes(32).toString('hex');
    const hashedKey = this.hashKey(rawKey);

    // Save first 8 characters for identification
    const keyIdentifier = rawKey.substring(0, 11);

    const apiKey = await this.apiKeyModel.create({
      key: keyIdentifier,
      hashedKey,
      name: data.name,
      description: data.description,
      ownerId: new Types.ObjectId(data.ownerId),
      tenantId: data.tenantId ? new Types.ObjectId(data.tenantId) : undefined,
      permissions: data.permissions || [],
      allowedIps: data.allowedIps || [],
      allowedDomains: data.allowedDomains || [],
      rateLimit: data.rateLimit,
      expiresAt: data.expiresAt,
    });

    // Return full key only once
    return { apiKey, rawKey };
  }

  /**
   * Validate API key
   */
  async validate(
    rawKey: string,
    ip?: string,
    domain?: string,
  ): Promise<ApiKeyDocument> {
    if (!rawKey.startsWith('cb_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const keyIdentifier = rawKey.substring(0, 11);
    const hashedKey = this.hashKey(rawKey);

    const apiKey = await this.apiKeyModel
      .findOne({
        key: keyIdentifier,
        isActive: true,
      })
      .select('+hashedKey');

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Verify hash
    if (
      !crypto.timingSafeEqual(
        Buffer.from(apiKey.hashedKey),
        Buffer.from(hashedKey),
      )
    ) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check IP
    if (apiKey.allowedIps.length > 0 && ip && !apiKey.allowedIps.includes(ip)) {
      throw new UnauthorizedException('IP not allowed');
    }

    // Check Domain
    if (
      apiKey.allowedDomains.length > 0 &&
      domain &&
      !apiKey.allowedDomains.includes(domain)
    ) {
      throw new UnauthorizedException('Domain not allowed');
    }

    // Update last usage
    await this.apiKeyModel.updateOne(
      { _id: apiKey._id },
      {
        lastUsedAt: new Date(),
        $inc: { usageCount: 1 },
      },
    );

    return apiKey;
  }

  /**
   * Get user's API keys
   */
  async findByOwner(ownerId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel
      .find({
        ownerId: new Types.ObjectId(ownerId),
        revokedAt: null,
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Revoke API key
   */
  async revoke(id: string, reason?: string): Promise<void> {
    const result = await this.apiKeyModel.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason || 'user_revoked',
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('API key not found');
    }
  }

  /**
   * Regenerate API key
   */
  async regenerate(
    id: string,
  ): Promise<{ apiKey: ApiKeyDocument; rawKey: string }> {
    const existing = await this.apiKeyModel.findById(id);
    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    // Revoke old key
    await this.revoke(id, 'regenerated');

    // Create new key with same settings
    return this.create({
      name: existing.name,
      description: existing.description,
      ownerId: existing.ownerId.toString(),
      tenantId: existing.tenantId?.toString(),
      permissions: existing.permissions,
      allowedIps: existing.allowedIps,
      allowedDomains: existing.allowedDomains,
      rateLimit: existing.rateLimit,
      expiresAt: existing.expiresAt,
    });
  }

  /**
   * Update key settings
   */
  async update(
    id: string,
    data: Partial<
      Pick<
        ApiKey,
        | 'name'
        | 'description'
        | 'permissions'
        | 'allowedIps'
        | 'allowedDomains'
        | 'rateLimit'
      >
    >,
  ): Promise<ApiKeyDocument> {
    const apiKey = await this.apiKeyModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }
    return apiKey;
  }

  /**
   * Encrypt key
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Key statistics
   */
  async getStats(ownerId?: string): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
  }> {
    const filter = ownerId ? { ownerId: new Types.ObjectId(ownerId) } : {};

    const [total, active, expired, revoked] = await Promise.all([
      this.apiKeyModel.countDocuments(filter),
      this.apiKeyModel.countDocuments({
        ...filter,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }),
      this.apiKeyModel.countDocuments({
        ...filter,
        expiresAt: { $lte: new Date() },
      }),
      this.apiKeyModel.countDocuments({ ...filter, revokedAt: { $ne: null } }),
    ]);

    return { total, active, expired, revoked };
  }
}
