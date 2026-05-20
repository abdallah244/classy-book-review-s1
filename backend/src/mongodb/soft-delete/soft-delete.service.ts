import { Injectable } from '@nestjs/common';
import { Model, Document, Types } from 'mongoose';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;

interface SoftDeleteDocument extends Document {
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;
}

@Injectable()
export class SoftDeleteService {
  /**
   * Soft delete single document
   */
  async softDeleteOne<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string,
    deletedBy?: string,
  ): Promise<T | null> {
    return model.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : null,
      },
      { new: true },
    );
  }

  /**
   * Soft delete multiple documents
   */
  async softDeleteMany<T extends SoftDeleteDocument>(
    model: Model<T>,
    filter: FilterQuery<T>,
    deletedBy?: string,
  ): Promise<number> {
    const result = await model.updateMany(filter, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : null,
    });

    return result.modifiedCount;
  }

  /**
   * Restore single document
   */
  async restoreOne<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string,
  ): Promise<T | null> {
    return model.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      { new: true },
    );
  }

  /**
   * Restore multiple documents
   */
  async restoreMany<T extends SoftDeleteDocument>(
    model: Model<T>,
    filter: FilterQuery<T>,
  ): Promise<number> {
    const result = await model.updateMany(
      { ...filter, isDeleted: true },
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    );

    return result.modifiedCount;
  }

  /**
   * Fetch only deleted
   */
  findDeleted<T extends SoftDeleteDocument>(
    model: Model<T>,
    filter: FilterQuery<T> = {},
  ) {
    return model.find({ ...filter, isDeleted: true } as any);
  }

  /**
   * Fetch all including deleted
   */
  findWithDeleted<T extends SoftDeleteDocument>(
    model: Model<T>,
    filter: FilterQuery<T> = {},
  ) {
    // Remove isDeleted filter to allow all
    return model.find(filter).setOptions({ includeDeleted: true } as any);
  }

  /**
   * Permanent delete for old deleted documents (cleanup)
   */
  async permanentlyDeleteOld<T extends SoftDeleteDocument>(
    model: Model<T>,
    olderThanDays: number,
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await model.deleteMany({
      isDeleted: true,
      deletedAt: { $lt: cutoffDate },
    } as any);

    return result.deletedCount;
  }

  /**
   * Delete statistics
   */
  async getDeleteStats<T extends SoftDeleteDocument>(
    model: Model<T>,
  ): Promise<{
    total: number;
    active: number;
    deleted: number;
  }> {
    const [total, deleted] = await Promise.all([
      model.countDocuments({}).setOptions({ includeDeleted: true } as any),
      model
        .countDocuments({ isDeleted: true } as any)
        .setOptions({ includeDeleted: true } as any),
    ]);

    return {
      total,
      active: total - deleted,
      deleted,
    };
  }
}
