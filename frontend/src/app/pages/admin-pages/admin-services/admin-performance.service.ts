import { Injectable, inject, signal, computed, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🚀 Admin Performance Service
 * خدمة تحسين أداء صفحات الأدمن
 */
@Injectable()
export class AdminPerformanceService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // مراقبين الأداء
  private intersectionObserver: IntersectionObserver | null = null;

  // قياسات الأداء
  private _metrics = signal<Map<string, number>>(new Map());
  readonly metrics = computed(() => this._metrics());

  // تتبع الـ Resources
  private cleanupCallbacks: (() => void)[] = [];

  constructor() {
    if (this.isBrowser) {
      this.initPerformanceTracking();
    }
  }

  /**
   * تهيئة تتبع الأداء
   */
  private initPerformanceTracking(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this._metrics.update((metrics) => {
            const newMetrics = new Map(metrics);
            entries.forEach((entry) => {
              newMetrics.set(entry.name, entry.duration || entry.startTime);
            });
            return newMetrics;
          });
        });

        observer.observe({
          entryTypes: ['paint', 'largest-contentful-paint'],
        });

        this.cleanupCallbacks.push(() => observer.disconnect());
      } catch (e) {
        // المتصفح لا يدعم بعض أنواع الإدخالات
      }
    }
  }

  /**
   * بدء قياس الأداء لقسم معين
   */
  startMeasure(sectionName: string): void {
    if (this.isBrowser && 'performance' in window) {
      performance.mark(`admin-${sectionName}-start`);
    }
  }

  /**
   * إنهاء قياس الأداء
   */
  endMeasure(sectionName: string): number {
    if (this.isBrowser && 'performance' in window) {
      const startMark = `admin-${sectionName}-start`;
      const endMark = `admin-${sectionName}-end`;
      const measureName = `admin-${sectionName}`;

      try {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        const measures = performance.getEntriesByName(measureName, 'measure');
        const duration = measures.length > 0 ? measures[0].duration : 0;

        this._metrics.update((metrics) => {
          const newMetrics = new Map(metrics);
          newMetrics.set(sectionName, duration);
          return newMetrics;
        });

        // تنظيف العلامات
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);

        return duration;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  /**
   * تأجيل تنفيذ كود غير ضروري
   */
  defer(callback: () => void, delay: number = 0): void {
    if (this.isBrowser) {
      if ('requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(callback, {
          timeout: delay || 2000,
        });
        this.cleanupCallbacks.push(() => (window as any).cancelIdleCallback(id));
      } else {
        const id = setTimeout(callback, delay);
        this.cleanupCallbacks.push(() => clearTimeout(id));
      }
    }
  }

  /**
   * الحصول على تقرير الأداء
   */
  getPerformanceReport(): {
    metrics: Record<string, number>;
    memoryUsage?: number;
  } {
    const metricsObj: Record<string, number> = {};
    this._metrics().forEach((value, key) => {
      metricsObj[key] = value;
    });

    let memoryUsage: number | undefined;
    if (this.isBrowser && (performance as any).memory) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576;
    }

    return {
      metrics: metricsObj,
      memoryUsage,
    };
  }

  ngOnDestroy(): void {
    this.cleanupCallbacks.forEach((cleanup) => cleanup());
    this.intersectionObserver?.disconnect();
  }
}
