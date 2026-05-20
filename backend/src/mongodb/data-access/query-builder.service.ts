import { Injectable } from '@nestjs/common';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;

interface QueryOptions {
  search?: {
    fields: string[];
    query: string;
  };
  filters?: Record<string, any>;
  range?: {
    field: string;
    min?: any;
    max?: any;
  }[];
  in?: Record<string, any[]>;
  notIn?: Record<string, any[]>;
  exists?: Record<string, boolean>;
  regex?: Record<string, { pattern: string; options?: string }>;
  sort?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class QueryBuilderService {
  /**
   * Build complex query
   */
  build<T>(options: QueryOptions): {
    filter: FilterQuery<T>;
    sort: string;
    skip: number;
    limit: number;
  } {
    const filter: FilterQuery<T> = {} as any;

    // Text search
    if (options.search?.query && options.search.fields.length > 0) {
      (filter as any).$or = options.search.fields.map((field) => ({
        [field]: { $regex: options.search!.query, $options: 'i' },
      }));
    }

    // Direct filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null && value !== '') {
          (filter as any)[key] = value;
        }
      }
    }

    // Ranges
    if (options.range) {
      for (const range of options.range) {
        if (range.min !== undefined || range.max !== undefined) {
          (filter as any)[range.field] = {};
          if (range.min !== undefined) {
            (filter as any)[range.field].$gte = range.min;
          }
          if (range.max !== undefined) {
            (filter as any)[range.field].$lte = range.max;
          }
        }
      }
    }

    // $in
    if (options.in) {
      for (const [key, values] of Object.entries(options.in)) {
        if (values.length > 0) {
          (filter as any)[key] = { $in: values };
        }
      }
    }

    // $nin
    if (options.notIn) {
      for (const [key, values] of Object.entries(options.notIn)) {
        if (values.length > 0) {
          (filter as any)[key] = { $nin: values };
        }
      }
    }

    // $exists
    if (options.exists) {
      for (const [key, value] of Object.entries(options.exists)) {
        (filter as any)[key] = { $exists: value };
      }
    }

    // $regex
    if (options.regex) {
      for (const [key, { pattern, options: regexOptions }] of Object.entries(
        options.regex,
      )) {
        (filter as any)[key] = {
          $regex: pattern,
          $options: regexOptions || 'i',
        };
      }
    }

    return {
      filter,
      sort: options.sort || '-createdAt',
      skip: ((options.page || 1) - 1) * (options.limit || 20),
      limit: options.limit || 20,
    };
  }

  /**
   * Parse query string from URL
   */
  parseQueryString(query: Record<string, any>): QueryOptions {
    const options: QueryOptions = {};

    // Search
    if (query.q || query.search) {
      options.search = {
        query: query.q || query.search,
        fields: query.searchFields?.split(',') || ['name', 'title'],
      };
    }

    // Sorting
    if (query.sort) {
      options.sort = query.sort;
    }

    // Page and limit
    if (query.page) {
      options.page = parseInt(query.page, 10);
    }
    if (query.limit) {
      options.limit = Math.min(parseInt(query.limit, 10), 100);
    }

    // Dynamic filters
    const excludedKeys = [
      'q',
      'search',
      'searchFields',
      'sort',
      'page',
      'limit',
    ];
    const filters: Record<string, any> = {};

    for (const [key, value] of Object.entries(query)) {
      if (!excludedKeys.includes(key) && value !== undefined) {
        // Process special values
        if (value === 'true') {
          filters[key] = true;
        } else if (value === 'false') {
          filters[key] = false;
        } else if (value === 'null') {
          filters[key] = null;
        } else if (!isNaN(Number(value)) && value !== '') {
          filters[key] = Number(value);
        } else {
          filters[key] = value;
        }
      }
    }

    if (Object.keys(filters).length > 0) {
      options.filters = filters;
    }

    return options;
  }

  /**
   * Build Aggregation Pipeline
   */
  buildAggregation(options: {
    match?: Record<string, any>;
    lookup?: {
      from: string;
      localField: string;
      foreignField: string;
      as: string;
    }[];
    unwind?: string[];
    group?: Record<string, any>;
    sort?: Record<string, 1 | -1>;
    skip?: number;
    limit?: number;
    project?: Record<string, 0 | 1 | any>;
  }): any[] {
    const pipeline: any[] = [];

    if (options.match) {
      pipeline.push({ $match: options.match });
    }

    if (options.lookup) {
      for (const lookup of options.lookup) {
        pipeline.push({ $lookup: lookup });
      }
    }

    if (options.unwind) {
      for (const field of options.unwind) {
        pipeline.push({
          $unwind: { path: `$${field}`, preserveNullAndEmptyArrays: true },
        });
      }
    }

    if (options.group) {
      pipeline.push({ $group: options.group });
    }

    if (options.sort) {
      pipeline.push({ $sort: options.sort });
    }

    if (options.skip !== undefined) {
      pipeline.push({ $skip: options.skip });
    }

    if (options.limit !== undefined) {
      pipeline.push({ $limit: options.limit });
    }

    if (options.project) {
      pipeline.push({ $project: options.project });
    }

    return pipeline;
  }
}
