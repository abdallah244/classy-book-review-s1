import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🚀 Performance Service
 * خدمة تحسين الأداء وسرعة التحميل
 */
@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private isBrowser: boolean;
  private observer: PerformanceObserver | null = null;
  private metrics: Map<string, number> = new Map();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.initPerformanceObserver();
    }
  }

  /**
   * تهيئة مراقب الأداء
   */
  private initPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.set(entry.name, entry.startTime);
        }
      });

      try {
        this.observer.observe({
          entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'],
        });
      } catch (e) {
        // بعض المتصفحات لا تدعم كل أنواع الإدخالات
      }
    }
  }

  /**
   * قياس وقت تحميل مكون معين
   */
  startMeasure(name: string): void {
    if (this.isBrowser && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * إنهاء قياس وقت تحميل مكون
   */
  endMeasure(name: string): number {
    if (this.isBrowser && 'performance' in window) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        return measure ? measure.duration : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  /**
   * تحميل الصور بشكل كسول (Lazy)
   */
  lazyLoadImages(): void {
    if (this.isBrowser && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset['src'];
            if (src) {
              img.src = src;
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * تحميل مسبق للروابط المهمة
   */
  preloadLink(url: string, as: 'script' | 'style' | 'image' | 'font' = 'script'): void {
    if (this.isBrowser) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = as;
      if (as === 'font') {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    }
  }

  /**
   * تأخير تحميل السكريبتات غير المهمة
   */
  deferScript(src: string, callback?: () => void): void {
    if (this.isBrowser) {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      if (callback) {
        script.onload = callback;
      }
      document.body.appendChild(script);
    }
  }

  /**
   * التحميل المسبق للصفحات عند hover
   */
  prefetchOnHover(element: HTMLElement, url: string): void {
    if (this.isBrowser) {
      element.addEventListener(
        'mouseenter',
        () => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        },
        { once: true },
      );
    }
  }

  /**
   * تنظيف الذاكرة والموارد
   */
  cleanupResources(): void {
    if (this.isBrowser) {
      // تنظيف الصور غير المرئية من الذاكرة
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        if (!this.isElementInViewport(img)) {
          img.src = '';
        }
      });
    }
  }

  /**
   * التحقق من وجود العنصر في نطاق الرؤية
   */
  private isElementInViewport(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * الحصول على مقاييس الأداء
   */
  getMetrics(): { [key: string]: number } {
    if (this.isBrowser && 'performance' in window) {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
        loadComplete: navigation?.loadEventEnd || 0,
        firstPaint: this.metrics.get('first-paint') || 0,
        firstContentfulPaint: this.metrics.get('first-contentful-paint') || 0,
        timeToInteractive: navigation?.domInteractive || 0,
      };
    }
    return {};
  }

  /**
   * تسجيل الأداء في الـ Console
   */
  logPerformance(): void {
    if (this.isBrowser) {
      console.group('📊 Performance Metrics');
      const metrics = this.getMetrics();
      Object.entries(metrics).forEach(([key, value]) => {
        console.log(`${key}: ${value.toFixed(2)}ms`);
      });
      console.groupEnd();
    }
  }

  /**
   * إيقاف مراقب الأداء
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
