import { Model, Document, Types, UpdateQuery } from 'mongoose';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  populate?: string | string[];
  select?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Base Repository for all entities
 */
export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  /**
   * Create new document
   */
  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data as any);
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    return this.model.insertMany(data as any) as any;
  }

  /**
   * Fetch by ID
   */
  async findById(
    id: string | Types.ObjectId,
    options?: { populate?: string | string[]; select?: string },
  ): Promise<T | null> {
    let query: any = this.model.findById(id);

    if (options?.populate) {
      const populates = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];
      for (const p of populates) {
        query = query.populate(p);
      }
    }

    if (options?.select) {
      query = query.select(options.select);
    }

    return query.exec();
  }

  /**
   * Fetch single document
   */
  async findOne(
    filter: FilterQuery<T>,
    options?: { populate?: string | string[]; select?: string },
  ): Promise<T | null> {
    let query: any = this.model.findOne(filter);

    if (options?.populate) {
      const populates = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];
      for (const p of populates) {
        query = query.populate(p);
      }
    }

    if (options?.select) {
      query = query.select(options.select);
    }

    return query.exec();
  }

  /**
   * Fetch with Pagination
   */
  async findWithPagination(
    filter: FilterQuery<T> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      populate,
      select,
    } = options;

    const skip = (page - 1) * limit;

    let query: any = this.model.find(filter).skip(skip).limit(limit).sort(sort);

    if (populate) {
      const populates = Array.isArray(populate) ? populate : [populate];
      for (const p of populates) {
        query = query.populate(p);
      }
    }

    if (select) {
      query = query.select(select);
    }

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      pages,
      limit,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }

  /**
   * Fetch all
   */
  async findAll(
    filter: FilterQuery<T> = {},
    options?: { sort?: string; populate?: string | string[] },
  ): Promise<T[]> {
    let query: any = this.model.find(filter);

    if (options?.sort) {
      query = query.sort(options.sort);
    }

    if (options?.populate) {
      const populates = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];
      for (const p of populates) {
        query = query.populate(p);
      }
    }

    return query.exec();
  }

  /**
   * Update by ID
   */
  async updateById(
    id: string | Types.ObjectId,
    data: UpdateQuery<T>,
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Update single document
   */
  async updateOne(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>,
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, data, { new: true });
  }

  /**
   * Update multiple documents
   */
  async updateMany(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>,
  ): Promise<number> {
    const result = await this.model.updateMany(filter, data);
    return result.modifiedCount;
  }

  /**
   * Delete by ID
   */
  async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id } as any);
    return result.deletedCount > 0;
  }

  /**
   * Delete single document
   */
  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter);
    return result.deletedCount > 0;
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  /**
   * Document count
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  /**
   * Check existence
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.findOne(filter).select('_id').lean();
    return !!doc;
  }

  /**
   * Aggregation
   */
  async aggregate<R = any>(pipeline: any[]): Promise<R[]> {
    return this.model.aggregate(pipeline);
  }

  /**
   * Distinct values
   */
  async distinct(field: string, filter: FilterQuery<T> = {}): Promise<any[]> {
    return this.model.distinct(field, filter);
  }
}
