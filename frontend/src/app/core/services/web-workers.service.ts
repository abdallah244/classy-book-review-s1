import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable } from 'rxjs';

/**
 * ⚙️ Web Workers Service
 * خدمة تنفيذ العمليات الثقيلة في الخلفية
 */
@Injectable({
  providedIn: 'root',
})
export class WebWorkersService {
  private isBrowser: boolean;
  private workers: Map<string, Worker> = new Map();
  private taskQueue: Map<string, TaskItem[]> = new Map();
  private maxWorkers = navigator?.hardwareConcurrency || 4;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * تنفيذ عملية في Web Worker
   */
  execute<T, R>(taskName: string, data: T, workerFn: (data: T) => R): Promise<R> {
    if (!this.isBrowser || typeof Worker === 'undefined') {
      // Fallback: تنفيذ في الـ Main Thread
      return Promise.resolve(workerFn(data));
    }

    return new Promise((resolve, reject) => {
      try {
        const workerCode = this.createWorkerCode(workerFn);
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        const timeout = setTimeout(() => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(new Error('Worker timeout'));
        }, 30000); // 30 ثانية timeout

        worker.onmessage = (event) => {
          clearTimeout(timeout);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        };

        worker.onerror = (error) => {
          clearTimeout(timeout);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(error);
        };

        worker.postMessage(data);
      } catch (error) {
        // Fallback: تنفيذ في الـ Main Thread
        try {
          const result = workerFn(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  /**
   * تنفيذ عمليات متوازية
   */
  async executeParallel<T, R>(
    items: T[],
    workerFn: (data: T) => R,
    concurrency: number = this.maxWorkers,
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = this.execute('parallel', item, workerFn).then((result) => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1,
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * فرز البيانات في الخلفية
   */
  async sortData<T>(data: T[], compareFn?: (a: T, b: T) => number): Promise<T[]> {
    return this.execute('sort', { data, compareFn: compareFn?.toString() }, (input: any) => {
      const { data, compareFn } = input;
      if (compareFn) {
        const fn = new Function('return ' + compareFn)();
        return [...data].sort(fn);
      }
      return [...data].sort();
    });
  }

  /**
   * فلترة البيانات في الخلفية
   */
  async filterData<T>(data: T[], predicateFn: (item: T) => boolean): Promise<T[]> {
    return this.execute('filter', { data, predicateFn: predicateFn.toString() }, (input: any) => {
      const { data, predicateFn } = input;
      const fn = new Function('return ' + predicateFn)();
      return data.filter(fn);
    });
  }

  /**
   * البحث في البيانات في الخلفية
   */
  async searchData<T>(data: T[], query: string, fields: (keyof T)[]): Promise<T[]> {
    return this.execute('search', { data, query, fields }, (input: any) => {
      const { data, query, fields } = input;
      const lowerQuery = query.toLowerCase();

      return data.filter((item: any) =>
        fields.some((field: string) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerQuery);
          }
          return false;
        }),
      );
    });
  }

  /**
   * حسابات رياضية معقدة
   */
  async calculate<T>(data: T, calculationFn: (data: T) => number): Promise<number> {
    return this.execute('calculate', { data, fn: calculationFn.toString() }, (input: any) => {
      const fn = new Function('return ' + input.fn)();
      return fn(input.data);
    });
  }

  /**
   * تحويل البيانات في الخلفية
   */
  async transformData<T, R>(data: T[], transformFn: (item: T) => R): Promise<R[]> {
    return this.execute(
      'transform',
      { data, transformFn: transformFn.toString() },
      (input: any) => {
        const { data, transformFn } = input;
        const fn = new Function('return ' + transformFn)();
        return data.map(fn);
      },
    );
  }

  /**
   * تجميع البيانات في الخلفية
   */
  async aggregateData<T>(data: T[], groupByKey: keyof T): Promise<Map<any, T[]>> {
    const result = await this.execute('aggregate', { data, groupByKey }, (input: any) => {
      const { data, groupByKey } = input;
      const groups: { [key: string]: any[] } = {};

      data.forEach((item: any) => {
        const key = item[groupByKey];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });

      return groups;
    });

    return new Map(Object.entries(result));
  }

  /**
   * معالجة JSON كبير
   */
  async parseJSON<T>(jsonString: string): Promise<T> {
    return this.execute('parseJSON', jsonString, (data: string) => {
      return JSON.parse(data);
    });
  }

  /**
   * تحويل إلى JSON
   */
  async stringifyJSON(data: any): Promise<string> {
    return this.execute('stringifyJSON', data, (input: any) => {
      return JSON.stringify(input);
    });
  }

  /**
   * إنشاء كود الـ Worker
   */
  private createWorkerCode(fn: Function): string {
    return `
      self.onmessage = function(event) {
        try {
          const workerFn = ${fn.toString()};
          const result = workerFn(event.data);
          self.postMessage({ result });
        } catch (error) {
          self.postMessage({ error: error.message });
        }
      };
    `;
  }

  /**
   * تنظيف جميع الـ Workers
   */
  terminateAll(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers.clear();
    this.taskQueue.clear();
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

interface TaskItem {
  id: string;
  data: any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}
