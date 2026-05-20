import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 🔧 Response Optimizer Service
 * Response optimization and cleanup service
 */
@Injectable()
export class ResponseOptimizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Add performance headers
        response.setHeader('X-Response-Time', `${duration}ms`);
        response.setHeader('X-Request-Id', this.generateRequestId());

        // Clean and optimize response
        return this.optimizeResponse(data, request);
      }),
    );
  }

  /**
   * Optimize response
   */
  private optimizeResponse(data: any, request: any): any {
    if (!data) return data;

    // If data is an array
    if (Array.isArray(data)) {
      return {
        success: true,
        count: data.length,
        data: data.map((item) => this.cleanObject(item)),
      };
    }

    // If data is an object with data
    if (data.data) {
      return {
        success: true,
        ...data,
        data: Array.isArray(data.data)
          ? data.data.map((item: any) => this.cleanObject(item))
          : this.cleanObject(data.data),
      };
    }

    // If data is a regular object
    if (typeof data === 'object') {
      return {
        success: true,
        data: this.cleanObject(data),
      };
    }

    return { success: true, data };
  }

  /**
   * Clean object from unwanted properties
   */
  private cleanObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    // Convert Mongoose document to regular object
    const plainObj = obj.toObject ? obj.toObject() : { ...obj };

    // Delete sensitive properties
    const sensitiveFields = [
      'password',
      '__v',
      'passwordResetToken',
      'passwordResetExpires',
    ];
    sensitiveFields.forEach((field) => {
      delete plainObj[field];
    });

    // Convert _id to id
    if (plainObj._id) {
      plainObj.id = plainObj._id.toString();
      delete plainObj._id;
    }

    return plainObj;
  }

  /**
   * Create unique request identifier
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 🔧 Response Optimizer Service
 */
@Injectable()
export class ResponseOptimizerService {
  /**
   * Optimize single response
   */
  optimize<T>(data: T): OptimizedResponse<T> {
    return {
      success: true,
      data: this.clean(data),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Optimize response with message
   */
  success<T>(data: T, message?: string): OptimizedResponse<T> {
    return {
      success: true,
      message,
      data: this.clean(data),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Error response
   */
  error(message: string, errors?: any): OptimizedResponse<null> {
    return {
      success: false,
      message,
      errors,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clean data
   */
  private clean<T>(data: T): T {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.cleanItem(item)) as unknown as T;
    }

    return this.cleanItem(data) as T;
  }

  /**
   * Clean single item
   */
  private cleanItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    const obj = item.toObject ? item.toObject() : { ...item };

    // Delete sensitive properties
    delete obj.password;
    delete obj.__v;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;

    // Convert _id
    if (obj._id) {
      obj.id = obj._id.toString();
      delete obj._id;
    }

    return obj;
  }

  /**
   * Reduce data size - select specific fields only
   */
  selectFields<T>(
    data: T | T[],
    fields: (keyof T)[],
  ): Partial<T> | Partial<T>[] {
    if (Array.isArray(data)) {
      return data.map((item) => this.pickFields(item, fields));
    }
    return this.pickFields(data, fields);
  }

  private pickFields<T>(obj: T, fields: (keyof T)[]): Partial<T> {
    const result: Partial<T> = {};
    fields.forEach((field) => {
      if (obj[field] !== undefined) {
        result[field] = obj[field];
      }
    });
    return result;
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

interface OptimizedResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
  timestamp: string;
}
