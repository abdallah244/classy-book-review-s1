import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;

interface SearchOptions {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  populate?: string | string[];
}

interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface TextSearchOptions extends SearchOptions {
  language?: string;
  caseSensitive?: boolean;
}

@Injectable()
export class SearchService {
  /**
   * Full text search using MongoDB Text Index
   */
  async textSearch<T extends Document>(
    model: Model<T>,
    query: string,
    filter: FilterQuery<T> = {},
    options: TextSearchOptions = {},
  ): Promise<SearchResult<T>> {
    const {
      page = 1,
      limit = 20,
      sort = '-score',
      fields,
      populate,
      language = 'arabic',
    } = options;

    const skip = (page - 1) * limit;

    const searchFilter = {
      ...filter,
      $text: {
        $search: query,
        $language: language,
        $caseSensitive: options.caseSensitive || false,
      },
    };

    let queryBuilder: any = model
      .find(searchFilter, { score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

    // Sorting
    if (sort === '-score') {
      queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' } });
    } else {
      queryBuilder = queryBuilder.sort(sort);
    }

    // Select fields
    if (fields) {
      queryBuilder = queryBuilder.select(fields);
    }

    // Populate
    if (populate) {
      const populateArray = Array.isArray(populate) ? populate : [populate];
      for (const p of populateArray) {
        queryBuilder = queryBuilder.populate(p);
      }
    }

    const [data, total] = await Promise.all([
      queryBuilder.exec(),
      model.countDocuments(searchFilter),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Regex search (for partial matching)
   */
  async regexSearch<T extends Document>(
    model: Model<T>,
    fields: string[],
    query: string,
    filter: FilterQuery<T> = {},
    options: SearchOptions = {},
  ): Promise<SearchResult<T>> {
    const { page = 1, limit = 20, sort = '-createdAt', populate } = options;
    const skip = (page - 1) * limit;

    const searchConditions = fields.map((field) => ({
      [field]: { $regex: query, $options: 'i' },
    }));

    const searchFilter = {
      ...filter,
      $or: searchConditions,
    };

    let queryBuilder = model
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    if (populate) {
      const populateArray = Array.isArray(populate) ? populate : [populate];
      for (const p of populateArray) {
        queryBuilder = queryBuilder.populate(p);
      }
    }

    const [data, total] = await Promise.all([
      queryBuilder.exec(),
      model.countDocuments(searchFilter),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch<T extends Document>(
    model: Model<T>,
    filters: {
      text?: { fields: string[]; query: string };
      range?: { field: string; min?: any; max?: any }[];
      exact?: Record<string, any>;
      in?: Record<string, any[]>;
      exists?: Record<string, boolean>;
    },
    options: SearchOptions = {},
  ): Promise<SearchResult<T>> {
    const { page = 1, limit = 20, sort = '-createdAt', populate } = options;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<T> = {};

    // Text search
    if (filters.text) {
      filter.$or = filters.text.fields.map((field) => ({
        [field]: { $regex: filters.text!.query, $options: 'i' },
      })) as any;
    }

    // Range search
    if (filters.range) {
      for (const range of filters.range) {
        filter[range.field] = {} as any;
        if (range.min !== undefined) {
          filter[range.field].$gte = range.min;
        }
        if (range.max !== undefined) {
          filter[range.field].$lte = range.max;
        }
      }
    }

    // Exact match search
    if (filters.exact) {
      Object.assign(filter, filters.exact);
    }

    // Search within list
    if (filters.in) {
      for (const [key, values] of Object.entries(filters.in)) {
        filter[key] = { $in: values } as any;
      }
    }

    // Check field existence
    if (filters.exists) {
      for (const [key, value] of Object.entries(filters.exists)) {
        filter[key] = { $exists: value } as any;
      }
    }

    let queryBuilder = model.find(filter).skip(skip).limit(limit).sort(sort);

    if (populate) {
      const populateArray = Array.isArray(populate) ? populate : [populate];
      for (const p of populateArray) {
        queryBuilder = queryBuilder.populate(p);
      }
    }

    const [data, total] = await Promise.all([
      queryBuilder.exec(),
      model.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Search suggestions (Autocomplete)
   */
  async autocomplete<T extends Document>(
    model: Model<T>,
    field: string,
    query: string,
    filter: FilterQuery<T> = {},
    limit = 10,
  ): Promise<string[]> {
    const results = await model
      .find({
        ...filter,
        [field]: { $regex: `^${query}`, $options: 'i' },
      })
      .select(field)
      .limit(limit)
      .lean();

    return results.map((r: any) => r[field]);
  }

  /**
   * Search with Aggregation
   */
  async aggregatedSearch<T extends Document>(
    model: Model<T>,
    pipeline: any[],
  ): Promise<any[]> {
    return model.aggregate(pipeline);
  }

  /**
   * Geo Search
   */
  async geoSearch<T extends Document>(
    model: Model<T>,
    locationField: string,
    coordinates: [number, number],
    maxDistanceKm: number,
    filter: FilterQuery<T> = {},
    options: SearchOptions = {},
  ): Promise<SearchResult<T>> {
    const { page = 1, limit = 20, populate } = options;
    const skip = (page - 1) * limit;

    const geoFilter = {
      ...filter,
      [locationField]: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates,
          },
          $maxDistance: maxDistanceKm * 1000,
        },
      },
    };

    let queryBuilder = model.find(geoFilter).skip(skip).limit(limit);

    if (populate) {
      const populateArray = Array.isArray(populate) ? populate : [populate];
      for (const p of populateArray) {
        queryBuilder = queryBuilder.populate(p);
      }
    }

    const [data, total] = await Promise.all([
      queryBuilder.exec(),
      model.countDocuments(geoFilter),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }
}
