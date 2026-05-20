import { Injectable, inject, signal, computed, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🚀 Home Page Performance Service
 * خدمة تحسين أداء صفحة الهوم مخصصة
 */
@Injectable()
export class HomePerformanceService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // مراقبين الأداء
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  // قياسات الأداء
  private _metrics = signal<Map<string, number>>(new Map());
  readonly metrics = computed(() => this._metrics());

  // حالة التحميل الكسول
  private _lazyLoadedCount = signal(0);
  readonly lazyLoadedCount = computed(() => this._lazyLoadedCount());

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
      performance.mark(`home-${sectionName}-start`);
    }
  }

  /**
   * إنهاء قياس الأداء
   */
  endMeasure(sectionName: string): number {
    if (this.isBrowser && 'performance' in window) {
      const startMark = `home-${sectionName}-start`;
      const endMark = `home-${sectionName}-end`;
      const measureName = `home-${sectionName}`;

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
   * تحميل الصور بشكل كسول داخل container محدد
   */
  setupLazyImages(container: HTMLElement): void {
    if (!this.isBrowser || !('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset['src'];

            if (src) {
              // تحميل الصورة
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.add('lazy-loaded');

              this._lazyLoadedCount.update((count) => count + 1);
              this.intersectionObserver?.unobserve(img);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '50px 0px', // تحميل قبل الظهور بـ 50px
        threshold: 0.01,
      },
    );

    // مراقبة كل الصور
    const images = container.querySelectorAll('img[data-src]');
    images.forEach((img) => this.intersectionObserver?.observe(img));

    this.cleanupCallbacks.push(() => this.intersectionObserver?.disconnect());
  }

  /**
   * تحميل مسبق للأقسام المهمة
   */
  preloadSection(sectionId: string): void {
    if (!this.isBrowser) return;

    const section = document.getElementById(sectionId);
    if (section) {
      // تحميل الصور في القسم
      const images = section.querySelectorAll('img[data-src]');
      images.forEach((img) => {
        const imgEl = img as HTMLImageElement;
        if (imgEl.dataset['src']) {
          imgEl.src = imgEl.dataset['src'];
          imgEl.removeAttribute('data-src');
        }
      });
    }
  }

  /**
   * تأجيل تنفيذ كود غير ضروري
   */
  defer(callback: () => void, delay: number = 0): void {
    if (this.isBrowser) {
      if ('requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(callback, { timeout: delay || 2000 });
        this.cleanupCallbacks.push(() => (window as any).cancelIdleCallback(id));
      } else {
        const id = setTimeout(callback, delay);
        this.cleanupCallbacks.push(() => clearTimeout(id));
      }
    }
  }

  /**
   * تحميل سكريبت خارجي بشكل كسول
   */
  loadScript(src: string, async: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBrowser) {
        resolve();
        return;
      }

      // تحقق إذا كان السكريبت محمل مسبقاً
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  /**
   * تحسين الـ Scroll Performance
   */
  enableSmoothScroll(container: HTMLElement): void {
    if (!this.isBrowser) return;

    container.style.scrollBehavior = 'smooth';
    container.style.overscrollBehavior = 'contain';

    // تفعيل GPU acceleration
    container.style.transform = 'translateZ(0)';
    container.style.willChange = 'scroll-position';
  }

  /**
   * الحصول على تقرير الأداء
   */
  getPerformanceReport(): {
    metrics: Record<string, number>;
    lazyLoadedImages: number;
    memoryUsage?: number;
  } {
    const metricsObj: Record<string, number> = {};
    this._metrics().forEach((value, key) => {
      metricsObj[key] = value;
    });

    let memoryUsage: number | undefined;
    if (this.isBrowser && (performance as any).memory) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // MB
    }

    return {
      metrics: metricsObj,
      lazyLoadedImages: this._lazyLoadedCount(),
      memoryUsage,
    };
  }

  ngOnDestroy(): void {
    // تنظيف كل الـ Resources
    this.cleanupCallbacks.forEach((cleanup) => cleanup());
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }
}
