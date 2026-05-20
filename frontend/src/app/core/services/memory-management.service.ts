import { Injectable, OnDestroy, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Subscription } from 'rxjs';

/**
 * 🧹 Memory Management Service
 * خدمة إدارة الذاكرة ومنع التسريبات
 */
@Injectable({
  providedIn: 'root',
})
export class MemoryManagementService implements OnDestroy {
  private isBrowser: boolean;
  private subscriptions: Map<string, Subscription[]> = new Map();
  private intervals: Map<string, number[]> = new Map();
  private timeouts: Map<string, number[]> = new Map();
  private eventListeners: Map<string, EventListenerInfo[]> = new Map();
  private observers: Map<string, any[]> = new Map();
  private memoryWarningThreshold = 0.9; // 90%
  private checkInterval: number | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.startMemoryMonitoring();
    }
  }

  ngOnDestroy(): void {
    this.cleanupAll();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  // ==========================================
  // 📊 Memory Monitoring
  // ==========================================

  /**
   * بدء مراقبة الذاكرة
   */
  private startMemoryMonitoring(): void {
    if (!this.isBrowser) return;

    this.ngZone.runOutsideAngular(() => {
      this.checkInterval = window.setInterval(() => {
        const memoryInfo = this.getMemoryInfo();
        if (memoryInfo && memoryInfo.usageRatio > this.memoryWarningThreshold) {
          console.warn('⚠️ Memory usage is high:', memoryInfo);
          this.triggerGarbageCollection();
        }
      }, 30000); // كل 30 ثانية
    });
  }

  /**
   * الحصول على معلومات الذاكرة
   */
  getMemoryInfo(): MemoryInfo | null {
    if (!this.isBrowser) return null;

    const performance = window.performance as any;
    if (performance?.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      return {
        usedHeap: usedJSHeapSize,
        totalHeap: totalJSHeapSize,
        heapLimit: jsHeapSizeLimit,
        usageRatio: usedJSHeapSize / jsHeapSizeLimit,
        usedMB: Math.round(usedJSHeapSize / 1048576),
        totalMB: Math.round(totalJSHeapSize / 1048576),
        limitMB: Math.round(jsHeapSizeLimit / 1048576),
      };
    }
    return null;
  }

  /**
   * محاولة تحفيز Garbage Collection
   */
  triggerGarbageCollection(): void {
    // تفريغ المراجع القديمة
    this.cleanupExpired();

    // محاولة تحفيز GC (لن يعمل دائماً)
    if (this.isBrowser && (window as any).gc) {
      (window as any).gc();
    }
  }

  // ==========================================
  // 🔄 Subscription Management
  // ==========================================

  /**
   * تسجيل Subscription
   */
  registerSubscription(componentId: string, subscription: Subscription): void {
    if (!this.subscriptions.has(componentId)) {
      this.subscriptions.set(componentId, []);
    }
    this.subscriptions.get(componentId)!.push(subscription);
  }

  /**
   * تسجيل عدة Subscriptions
   */
  registerSubscriptions(componentId: string, subscriptions: Subscription[]): void {
    subscriptions.forEach((sub) => this.registerSubscription(componentId, sub));
  }

  /**
   * إلغاء Subscriptions لمكون
   */
  unsubscribeComponent(componentId: string): void {
    const subs = this.subscriptions.get(componentId);
    if (subs) {
      subs.forEach((sub) => {
        if (sub && !sub.closed) {
          sub.unsubscribe();
        }
      });
      this.subscriptions.delete(componentId);
    }
  }

  // ==========================================
  // ⏱️ Interval/Timeout Management
  // ==========================================

  /**
   * تسجيل Interval
   */
  registerInterval(componentId: string, intervalId: number): void {
    if (!this.intervals.has(componentId)) {
      this.intervals.set(componentId, []);
    }
    this.intervals.get(componentId)!.push(intervalId);
  }

  /**
   * إنشاء وتسجيل Interval
   */
  setInterval(componentId: string, callback: () => void, ms: number): number {
    const id = window.setInterval(callback, ms);
    this.registerInterval(componentId, id);
    return id;
  }

  /**
   * إلغاء Intervals لمكون
   */
  clearIntervals(componentId: string): void {
    const intervals = this.intervals.get(componentId);
    if (intervals) {
      intervals.forEach((id) => clearInterval(id));
      this.intervals.delete(componentId);
    }
  }

  /**
   * تسجيل Timeout
   */
  registerTimeout(componentId: string, timeoutId: number): void {
    if (!this.timeouts.has(componentId)) {
      this.timeouts.set(componentId, []);
    }
    this.timeouts.get(componentId)!.push(timeoutId);
  }

  /**
   * إنشاء وتسجيل Timeout
   */
  setTimeout(componentId: string, callback: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      callback();
      // إزالة من القائمة بعد التنفيذ
      const timeouts = this.timeouts.get(componentId);
      if (timeouts) {
        const index = timeouts.indexOf(id);
        if (index > -1) {
          timeouts.splice(index, 1);
        }
      }
    }, ms);
    this.registerTimeout(componentId, id);
    return id;
  }

  /**
   * إلغاء Timeouts لمكون
   */
  clearTimeouts(componentId: string): void {
    const timeouts = this.timeouts.get(componentId);
    if (timeouts) {
      timeouts.forEach((id) => clearTimeout(id));
      this.timeouts.delete(componentId);
    }
  }

  // ==========================================
  // 🎯 Event Listener Management
  // ==========================================

  /**
   * تسجيل Event Listener
   */
  addEventListener(
    componentId: string,
    element: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, []);
    }

    element.addEventListener(event, handler, options);

    this.eventListeners.get(componentId)!.push({
      element,
      event,
      handler,
      options,
    });
  }

  /**
   * إزالة Event Listeners لمكون
   */
  removeEventListeners(componentId: string): void {
    const listeners = this.eventListeners.get(componentId);
    if (listeners) {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this.eventListeners.delete(componentId);
    }
  }

  // ==========================================
  // 👁️ Observer Management
  // ==========================================

  /**
   * تسجيل Observer
   */
  registerObserver(
    componentId: string,
    observer: IntersectionObserver | MutationObserver | ResizeObserver,
  ): void {
    if (!this.observers.has(componentId)) {
      this.observers.set(componentId, []);
    }
    this.observers.get(componentId)!.push(observer);
  }

  /**
   * إلغاء Observers لمكون
   */
  disconnectObservers(componentId: string): void {
    const observers = this.observers.get(componentId);
    if (observers) {
      observers.forEach((observer) => observer.disconnect());
      this.observers.delete(componentId);
    }
  }

  // ==========================================
  // 🧹 Cleanup
  // ==========================================

  /**
   * تنظيف كل موارد مكون
   */
  cleanupComponent(componentId: string): void {
    this.unsubscribeComponent(componentId);
    this.clearIntervals(componentId);
    this.clearTimeouts(componentId);
    this.removeEventListeners(componentId);
    this.disconnectObservers(componentId);
  }

  /**
   * تنظيف الموارد المنتهية
   */
  private cleanupExpired(): void {
    // تنظيف الـ Subscriptions المغلقة
    this.subscriptions.forEach((subs, componentId) => {
      const activeSubs = subs.filter((sub) => !sub.closed);
      if (activeSubs.length === 0) {
        this.subscriptions.delete(componentId);
      } else {
        this.subscriptions.set(componentId, activeSubs);
      }
    });
  }

  /**
   * تنظيف كل شيء
   */
  cleanupAll(): void {
    // Subscriptions
    this.subscriptions.forEach((subs) => {
      subs.forEach((sub) => sub.unsubscribe());
    });
    this.subscriptions.clear();

    // Intervals
    this.intervals.forEach((intervals) => {
      intervals.forEach((id) => clearInterval(id));
    });
    this.intervals.clear();

    // Timeouts
    this.timeouts.forEach((timeouts) => {
      timeouts.forEach((id) => clearTimeout(id));
    });
    this.timeouts.clear();

    // Event Listeners
    this.eventListeners.forEach((listeners) => {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.eventListeners.clear();

    // Observers
    this.observers.forEach((observers) => {
      observers.forEach((observer) => observer.disconnect());
    });
    this.observers.clear();
  }

  /**
   * الحصول على إحصائيات الموارد
   */
  getResourceStats(): ResourceStats {
    let totalSubscriptions = 0;
    this.subscriptions.forEach((subs) => (totalSubscriptions += subs.length));

    let totalIntervals = 0;
    this.intervals.forEach((intervals) => (totalIntervals += intervals.length));

    let totalTimeouts = 0;
    this.timeouts.forEach((timeouts) => (totalTimeouts += timeouts.length));

    let totalEventListeners = 0;
    this.eventListeners.forEach((listeners) => (totalEventListeners += listeners.length));

    let totalObservers = 0;
    this.observers.forEach((observers) => (totalObservers += observers.length));

    return {
      components: this.subscriptions.size,
      subscriptions: totalSubscriptions,
      intervals: totalIntervals,
      timeouts: totalTimeouts,
      eventListeners: totalEventListeners,
      observers: totalObservers,
      memory: this.getMemoryInfo(),
    };
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

interface MemoryInfo {
  usedHeap: number;
  totalHeap: number;
  heapLimit: number;
  usageRatio: number;
  usedMB: number;
  totalMB: number;
  limitMB: number;
}

interface EventListenerInfo {
  element: EventTarget;
  event: string;
  handler: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
}

interface ResourceStats {
  components: number;
  subscriptions: number;
  intervals: number;
  timeouts: number;
  eventListeners: number;
  observers: number;
  memory: MemoryInfo | null;
}
