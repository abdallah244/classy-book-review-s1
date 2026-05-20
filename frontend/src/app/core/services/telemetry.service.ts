import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  page?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  private sessionId: string = this.generateSessionId();
  private userId: string | null = null;
  private events: TelemetryEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private startTime = Date.now();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initPageTracking();
      this.initPerformanceObserver();
      this.setupBeforeUnload();
    }
  }

  /**
   * تعيين معرف المستخدم
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * تسجيل حدث
   */
  trackEvent(name: string, properties?: Record<string, any>): void {
    const event: TelemetryEvent = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      page: this.getCurrentPage(),
    };

    this.events.push(event);
    this.flushIfNeeded();
  }

  /**
   * تسجيل خطأ
   */
  trackError(error: Error, properties?: Record<string, any>): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...properties,
    });
  }

  /**
   * تسجيل مقياس أداء
   */
  trackMetric(name: string, value: number): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * بدء قياس الوقت
   */
  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.trackMetric(name, duration);
    };
  }

  /**
   * قياس تحميل مكون
   */
  measureComponent(componentName: string): { start: () => void; end: () => void } {
    let startTime: number;
    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        if (startTime) {
          const duration = performance.now() - startTime;
          this.trackMetric(`component_load_${componentName}`, duration);
        }
      },
    };
  }

  /**
   * تهيئة تتبع الصفحات
   */
  private initPageTracking(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.trackEvent('page_view', {
          url: (event as NavigationEnd).urlAfterRedirects,
          title: document.title,
        });
      });
  }

  /**
   * تهيئة مراقب الأداء
   */
  private initPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    // قياس LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    // قياس FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackMetric('fid', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {}

    // قياس CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.trackMetric('cls', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}

    // قياس الموارد
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 1000) {
            this.trackMetric('slow_resource', resource.duration);
            this.trackEvent('slow_resource_load', {
              name: resource.name,
              duration: resource.duration,
              type: resource.initiatorType,
            });
          }
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (e) {}
  }

  /**
   * إعداد الإرسال قبل مغادرة الصفحة
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - this.startTime;
      this.trackMetric('session_duration', sessionDuration);
      this.flush();
    });
  }

  /**
   * الحصول على الصفحة الحالية
   */
  private getCurrentPage(): string {
    return window.location.pathname;
  }

  /**
   * توليد معرف الجلسة
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * إرسال البيانات إذا وصلت للحد
   */
  private flushIfNeeded(): void {
    if (this.events.length >= 10) {
      this.flush();
    }
  }

  /**
   * إرسال البيانات للخادم
   */
  private flush(): void {
    if (this.events.length === 0 && this.metrics.length === 0) {
      return;
    }

    const data = {
      events: [...this.events],
      metrics: [...this.metrics],
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height,
      },
    };

    // استخدام sendBeacon للإرسال الموثوق
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry', JSON.stringify(data));
    }

    // مسح البيانات المرسلة
    this.events = [];
    this.metrics = [];
  }

  /**
   * الحصول على إحصائيات الجلسة
   */
  getSessionStats(): {
    duration: number;
    eventsCount: number;
    pagesViewed: number;
  } {
    const pageViews = this.events.filter((e) => e.name === 'page_view').length;
    return {
      duration: Date.now() - this.startTime,
      eventsCount: this.events.length,
      pagesViewed: pageViews,
    };
  }
}
