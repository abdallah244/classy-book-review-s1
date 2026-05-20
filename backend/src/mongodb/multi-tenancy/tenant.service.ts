import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Document, Types } from 'mongoose';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;

interface Tenant {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  domain?: string;
  settings: Record<string, any>;
  isActive: boolean;
  plan: string;
  createdAt: Date;
}

@Injectable()
export class TenantService {
  private currentTenantId: string | null = null;

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Set current Tenant
   */
  setCurrentTenant(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  /**
   * Get current Tenant
   */
  getCurrentTenantId(): string | null {
    return this.currentTenantId;
  }

  /**
   * Fetch Tenant by ID
   */
  async findById(tenantId: string): Promise<Tenant | null> {
    const collection = this.connection.collection('tenants');
    const tenant = await collection.findOne({
      _id: new Types.ObjectId(tenantId),
    });
    return tenant as Tenant | null;
  }

  /**
   * Fetch Tenant by Domain
   */
  async findByDomain(domain: string): Promise<Tenant | null> {
    const collection = this.connection.collection('tenants');
    const tenant = await collection.findOne({ domain, isActive: true });
    return tenant as Tenant | null;
  }

  /**
   * Fetch Tenant by Slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    const collection = this.connection.collection('tenants');
    const tenant = await collection.findOne({ slug, isActive: true });
    return tenant as Tenant | null;
  }

  /**
   * Add Tenant filter to Query
   */
  applyTenantFilter<T extends Document>(
    filter: FilterQuery<T>,
    tenantId?: string,
  ): FilterQuery<T> {
    const tid = tenantId || this.currentTenantId;
    if (tid) {
      return {
        ...filter,
        tenantId: new Types.ObjectId(tid),
      } as FilterQuery<T>;
    }
    return filter;
  }

  /**
   * Add tenantId to new data
   */
  addTenantId<T extends Record<string, any>>(data: T, tenantId?: string): T {
    const tid = tenantId || this.currentTenantId;
    if (tid) {
      return {
        ...data,
        tenantId: new Types.ObjectId(tid),
      };
    }
    return data;
  }

  /**
   * Verify user belongs to Tenant
   */
  async validateUserTenant(userId: string, tenantId: string): Promise<boolean> {
    const collection = this.connection.collection('users');
    const user = await collection.findOne({
      _id: new Types.ObjectId(userId),
      tenantId: new Types.ObjectId(tenantId),
    });
    return !!user;
  }

  /**
   * Create new Tenant
   */
  async create(data: Partial<Tenant>): Promise<Tenant> {
    const collection = this.connection.collection('tenants');
    const result = await collection.insertOne({
      ...data,
      isActive: true,
      createdAt: new Date(),
    });
    return { ...data, _id: result.insertedId } as Tenant;
  }

  /**
   * List all Tenants
   */
  async findAll(): Promise<Tenant[]> {
    const collection = this.connection.collection('tenants');
    return collection.find({}).toArray() as unknown as Tenant[];
  }

  /**
   * Update Tenant settings
   */
  async updateSettings(
    tenantId: string,
    settings: Record<string, any>,
  ): Promise<void> {
    const collection = this.connection.collection('tenants');
    await collection.updateOne(
      { _id: new Types.ObjectId(tenantId) },
      { $set: { settings } },
    );
  }
}
