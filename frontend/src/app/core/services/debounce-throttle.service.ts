import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable, fromEvent } from 'rxjs';
import { debounceTime, throttleTime, map, distinctUntilChanged } from 'rxjs/operators';

/**
 * ⏱️ Debounce/Throttle Service
 * خدمة تقليل الطلبات المتكررة وتحسين الأداء
 */
@Injectable({
  providedIn: 'root',
})
export class DebounceThrottleService {
  private isBrowser: boolean;
  private subjects: Map<string, Subject<any>> = new Map();
  private lastExecutionTimes: Map<string, number> = new Map();

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ==========================================
  // ⏳ Debounce Functions
  // ==========================================

  /**
   * إنشاء دالة Debounce
   * تنتظر حتى يتوقف المستخدم ثم تنفذ
   */
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300,
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        fn.apply(null, args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Debounce مع Promise
   */
  debounceAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay: number = 300,
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: number | null = null;
    let pendingPromise: Promise<any> | null = null;
    let resolve: ((value: any) => void) | null = null;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!pendingPromise) {
        pendingPromise = new Promise((res) => {
          resolve = res;
        });
      }

      timeoutId = window.setTimeout(async () => {
        const result = await fn.apply(null, args);
        resolve!(result);
        pendingPromise = null;
        resolve = null;
        timeoutId = null;
      }, delay);

      return pendingPromise;
    };
  }

  /**
   * Debounce باستخدام Subject (للـ Observables)
   */
  createDebouncedSubject<T>(key: string, delay: number = 300): Subject<T> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<T>());
    }
    return this.subjects.get(key) as Subject<T>;
  }

  getDebouncedObservable<T>(key: string, delay: number = 300): Observable<T> {
    const subject = this.createDebouncedSubject<T>(key, delay);
    return subject.pipe(debounceTime(delay), distinctUntilChanged());
  }

  // ==========================================
  // 🚦 Throttle Functions
  // ==========================================

  /**
   * إنشاء دالة Throttle
   * تنفذ مرة واحدة كل فترة محددة
   */
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number = 300,
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn.apply(null, args);
        inThrottle = true;

        setTimeout(() => {
          inThrottle = false;
          if (lastArgs) {
            fn.apply(null, lastArgs);
            lastArgs = null;
          }
        }, limit);
      } else {
        lastArgs = args;
      }
    };
  }

  /**
   * Throttle مع Leading و Trailing
   */
  throttleAdvanced<T extends (...args: any[]) => any>(
    fn: T,
    limit: number = 300,
    options: ThrottleOptions = {},
  ): (...args: Parameters<T>) => void {
    const { leading = true, trailing = true } = options;
    let lastExecutionTime = 0;
    let timeoutId: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecutionTime;

      const execute = () => {
        lastExecutionTime = Date.now();
        fn.apply(null, args);
      };

      if (timeSinceLastExecution >= limit) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (leading) {
          execute();
        } else {
          lastArgs = args;
        }
      } else {
        lastArgs = args;
        if (trailing && !timeoutId) {
          timeoutId = window.setTimeout(() => {
            if (lastArgs) {
              fn.apply(null, lastArgs);
              lastExecutionTime = Date.now();
              lastArgs = null;
            }
            timeoutId = null;
          }, limit - timeSinceLastExecution);
        }
      }
    };
  }

  // ==========================================
  // 🎯 Event Helpers
  // ==========================================

  /**
   * Debounce لأحداث الإدخال (Input Events)
   */
  onInputDebounce(
    element: HTMLInputElement,
    callback: (value: string) => void,
    delay: number = 300,
  ): () => void {
    if (!this.isBrowser) return () => {};

    const debouncedCallback = this.debounce((event: Event) => {
      const target = event.target as HTMLInputElement;
      callback(target.value);
    }, delay);

    element.addEventListener('input', debouncedCallback);

    return () => {
      element.removeEventListener('input', debouncedCallback);
    };
  }

  /**
   * Throttle لأحداث السكرول
   */
  onScrollThrottle(callback: (event: Event) => void, limit: number = 100): () => void {
    if (!this.isBrowser) return () => {};

    const throttledCallback = this.throttle(callback, limit);

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', throttledCallback, { passive: true });
    });

    return () => {
      window.removeEventListener('scroll', throttledCallback);
    };
  }

  /**
   * Throttle لأحداث تغيير حجم النافذة
   */
  onResizeThrottle(callback: (event: Event) => void, limit: number = 200): () => void {
    if (!this.isBrowser) return () => {};

    const throttledCallback = this.throttle(callback, limit);

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', throttledCallback, { passive: true });
    });

    return () => {
      window.removeEventListener('resize', throttledCallback);
    };
  }

  /**
   * Debounce لأحداث البحث
   */
  createSearchDebounce(delay: number = 300): {
    search$: Observable<string>;
    onSearch: (query: string) => void;
    destroy: () => void;
  } {
    const subject = new Subject<string>();

    return {
      search$: subject.pipe(
        debounceTime(delay),
        distinctUntilChanged(),
        map((query) => query.trim()),
      ),
      onSearch: (query: string) => subject.next(query),
      destroy: () => subject.complete(),
    };
  }

  // ==========================================
  // 🔄 Rate Limiting
  // ==========================================

  /**
   * تحديد معدل الطلبات
   */
  rateLimit<T extends (...args: any[]) => any>(
    fn: T,
    maxCalls: number,
    timeWindow: number = 1000,
  ): (...args: Parameters<T>) => boolean {
    const calls: number[] = [];

    return (...args: Parameters<T>): boolean => {
      const now = Date.now();

      // إزالة الطلبات القديمة
      while (calls.length > 0 && calls[0] < now - timeWindow) {
        calls.shift();
      }

      if (calls.length < maxCalls) {
        calls.push(now);
        fn.apply(null, args);
        return true;
      }

      console.warn('Rate limit exceeded');
      return false;
    };
  }

  /**
   * طابور الطلبات (Request Queue)
   */
  createRequestQueue<T>(concurrency: number = 3, delay: number = 100): RequestQueue<T> {
    const queue: QueueItem<T>[] = [];
    let activeRequests = 0;

    const processQueue = async () => {
      while (queue.length > 0 && activeRequests < concurrency) {
        const item = queue.shift()!;
        activeRequests++;

        try {
          const result = await item.fn();
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        } finally {
          activeRequests--;
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          processQueue();
        }
      }
    };

    return {
      add: (fn: () => Promise<T>): Promise<T> => {
        return new Promise((resolve, reject) => {
          queue.push({ fn, resolve, reject });
          processQueue();
        });
      },
      clear: () => {
        queue.length = 0;
      },
      get pending() {
        return queue.length;
      },
      get active() {
        return activeRequests;
      },
    };
  }

  // ==========================================
  // 🧹 Cleanup
  // ==========================================

  /**
   * تنظيف كل الـ Subjects
   */
  cleanup(): void {
    this.subjects.forEach((subject) => subject.complete());
    this.subjects.clear();
    this.lastExecutionTimes.clear();
  }

  /**
   * إزالة subject معين
   */
  removeSubject(key: string): void {
    const subject = this.subjects.get(key);
    if (subject) {
      subject.complete();
      this.subjects.delete(key);
    }
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

interface QueueItem<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}

interface RequestQueue<T> {
  add: (fn: () => Promise<T>) => Promise<T>;
  clear: () => void;
  readonly pending: number;
  readonly active: number;
}
