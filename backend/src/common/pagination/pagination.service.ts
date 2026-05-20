import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;

/**
 * 📄 Pagination Service
 * Service for paginating large datasets
 */
@Injectable()
export class PaginationService {
  /**
   * Calculate pagination values
   */
  calculatePagination(
    page: number = 1,
    limit: number = 10,
    total: number,
  ): PaginationMeta {
    const currentPage = Math.max(1, page);
    const itemsPerPage = Math.min(100, Math.max(1, limit)); // Max 100
    const totalPages = Math.ceil(total / itemsPerPage);
    const skip = (currentPage - 1) * itemsPerPage;

    return {
      currentPage,
      itemsPerPage,
      totalItems: total,
      totalPages,
      skip,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      previousPage: currentPage > 1 ? currentPage - 1 : null,
    };
  }

  /**
   * Create paginated response
   */
  paginate<T>(
    data: T[],
    page: number = 1,
    limit: number = 10,
    total: number,
  ): PaginatedResponse<T> {
    const meta = this.calculatePagination(page, limit, total);

    return {
      data,
      meta,
      links: this.generateLinks(meta),
    };
  }

  /**
   * Pagination with Mongoose Model
   */
  async paginateModel<T>(
    model: Model<T>,
    filter: FilterQuery<T>,
    options: {
      page?: number;
      limit?: number;
      sort?: string;
      populate?: string | string[];
      select?: string;
    } = {},
  ): Promise<PaginatedResponse<T>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model
        .find(filter)
        .sort(options.sort || '-createdAt')
        .skip(skip)
        .limit(limit)
        .populate(options.populate || [])
        .select(options.select || '')
        .lean()
        .exec(),
      model.countDocuments(filter).exec(),
    ]);

    return this.paginate(data as T[], page, limit, total);
  }

  /**
   * Generate navigation links
   */
  private generateLinks(meta: PaginationMeta): PaginationLinks {
    return {
      first: `?page=1&limit=${meta.itemsPerPage}`,
      last: `?page=${meta.totalPages}&limit=${meta.itemsPerPage}`,
      next: meta.nextPage
        ? `?page=${meta.nextPage}&limit=${meta.itemsPerPage}`
        : null,
      previous: meta.previousPage
        ? `?page=${meta.previousPage}&limit=${meta.itemsPerPage}`
        : null,
    };
  }

  /**
   * Parse query parameters
   */
  parseQueryParams(query: PaginationQuery): { page: number; limit: number } {
    return {
      page: parseInt(query.page as string, 10) || 1,
      limit: parseInt(query.limit as string, 10) || 10,
    };
  }

  /**
   * Create Cursor-based pagination
   */
  cursorPaginate<T extends { _id: string }>(
    data: T[],
    limit: number = 10,
  ): CursorPaginatedResponse<T> {
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? items[items.length - 1]._id : null;

    return {
      data: items,
      meta: {
        hasMore,
        nextCursor,
        count: items.length,
      },
    };
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  skip: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface PaginationLinks {
  first: string;
  last: string;
  next: string | null;
  previous: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    hasMore: boolean;
    nextCursor: string | null;
    count: number;
  };
}

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  cursor?: string;
}
