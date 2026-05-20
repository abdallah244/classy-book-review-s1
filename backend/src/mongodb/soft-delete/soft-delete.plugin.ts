import { Schema, Query } from 'mongoose';

/**
 * Plugin to add Soft Delete to any Schema
 */
export function softDeletePlugin(schema: Schema): void {
  // Add fields
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  });

  // Middleware to hide deleted in find
  schema.pre(/^find/, function (this: Query<any, any>) {
    const options = this.getOptions();

    // Allow showing deleted if specified
    if (!options.includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  });

  // Middleware to hide deleted in findOne
  schema.pre('findOne', function (this: Query<any, any>) {
    const options = this.getOptions();

    if (!options.includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  });

  // Middleware to hide deleted in countDocuments
  schema.pre('countDocuments', function (this: Query<any, any>) {
    const options = this.getOptions();

    if (!options.includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  });

  // Method for soft delete
  schema.methods.softDelete = async function (deletedBy?: string) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (deletedBy) {
      this.deletedBy = deletedBy;
    }
    return this.save();
  };

  // Method for restore
  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };

  // Static method for soft delete
  schema.statics.softDelete = async function (
    filter: Record<string, any>,
    deletedBy?: string,
  ) {
    return this.updateMany(filter, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
    });
  };

  // Static method for restore
  schema.statics.restore = async function (filter: Record<string, any>) {
    return this.updateMany(filter, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });
  };

  // Static method to fetch only deleted
  schema.statics.findDeleted = function (filter: Record<string, any> = {}) {
    return this.find({ ...filter, isDeleted: true }).setOptions({
      includeDeleted: true,
    });
  };

  // Static method to fetch all (including deleted)
  schema.statics.findWithDeleted = function (filter: Record<string, any> = {}) {
    return this.find(filter).setOptions({ includeDeleted: true });
  };
}

// Export as injectable service too
import { Injectable } from '@nestjs/common';

@Injectable()
export class SoftDeletePlugin {
  apply(schema: Schema): void {
    softDeletePlugin(schema);
  }
}
