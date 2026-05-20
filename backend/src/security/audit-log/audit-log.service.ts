import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

interface CreateAuditLogDto {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  actionType:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'other';
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ip: string;
  userAgent?: string;
  method?: string;
  path?: string;
  query?: Record<string, any>;
  status?: 'success' | 'failure' | 'error';
  errorMessage?: string;
  duration?: number;
  metadata?: Record<string, any>;
  tenantId?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Create audit log
   */
  async log(data: CreateAuditLogDto): Promise<AuditLogDocument> {
    const changes =
      data.oldData && data.newData
        ? this.calculateChanges(data.oldData, data.newData)
        : undefined;

    return this.auditLogModel.create({
      ...data,
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
      resourceId: data.resourceId
        ? new Types.ObjectId(data.resourceId)
        : undefined,
      tenantId: data.tenantId ? new Types.ObjectId(data.tenantId) : undefined,
      changes,
    });
  }

  /**
   * Calculate changes between objects
   */
  private calculateChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>,
  ): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          from: oldData[key],
          to: newData[key],
        };
      }
    }

    return changes;
  }

  /**
   * Fetch user logs
   */
  async findByUser(
    userId: string,
    query: any = {},
  ): Promise<{
    data: AuditLogDocument[];
    total: number;
  }> {
    const filter: FilterQuery<AuditLogDocument> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.action) filter.action = query.action;
    if (query.resource) filter.resource = query.resource;
    if (query.from) filter.createdAt = { $gte: new Date(query.from) };
    if (query.to)
      filter.createdAt = { ...filter.createdAt, $lte: new Date(query.to) };

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit || 0)
        .limit(query.limit || 50),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  /**
   * Fetch specific resource logs
   */
  async findByResource(
    resource: string,
    resourceId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({
        resource,
        resourceId: new Types.ObjectId(resourceId),
      })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .limit(100);
  }

  /**
   * Search in logs
   */
  async search(query: {
    userId?: string;
    action?: string;
    resource?: string;
    actionType?: string;
    status?: string;
    from?: string;
    to?: string;
    ip?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: AuditLogDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const filter: FilterQuery<AuditLogDocument> = {};

    if (query.userId) filter.userId = new Types.ObjectId(query.userId);
    if (query.action) filter.action = { $regex: query.action, $options: 'i' };
    if (query.resource) filter.resource = query.resource;
    if (query.actionType) filter.actionType = query.actionType;
    if (query.status) filter.status = query.status;
    if (query.ip) filter.ip = query.ip;

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const page = query.page || 1;
    const limit = query.limit || 50;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email'),
      this.auditLogModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Statistics
   */
  async getStats(tenantId?: string): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byStatus: Record<string, number>;
    recentActivity: AuditLogDocument[];
  }> {
    const filter: FilterQuery<AuditLogDocument> = tenantId
      ? { tenantId: new Types.ObjectId(tenantId) }
      : {};

    const [totalLogs, byAction, byStatus, recentActivity] = await Promise.all([
      this.auditLogModel.countDocuments(filter),
      this.auditLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$actionType', count: { $sum: 1 } } },
      ]),
      this.auditLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.auditLogModel.find(filter).sort({ createdAt: -1 }).limit(10),
    ]);

    return {
      totalLogs,
      byAction: Object.fromEntries(byAction.map((a) => [a._id, a.count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      recentActivity,
    };
  }
}
