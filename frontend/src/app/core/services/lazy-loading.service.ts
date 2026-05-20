import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, Routes } from '@angular/router';

/**
 * ⚡ Lazy Loading Service
 * خدمة التحميل الكسول للموارد والمكونات
 */
@Injectable({
  providedIn: 'root',
})
export class LazyLoadingService {
  private isBrowser: boolean;
  private loadedScripts: Set<string> = new Set();
  private loadedStyles: Set<string> = new Set();
  private observers: Map<string, IntersectionObserver> = new Map();

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * تحميل سكريبت خارجي بشكل كسول
   */
  loadScript(src: string, async: boolean = true): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();

    // تجنب التحميل المكرر
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.defer = true;

      script.onload = () => {
        this.loadedScripts.add(src);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.body.appendChild(script);
    });
  }

  /**
   * تحميل ملف CSS بشكل كسول
   */
  loadStyle(href: string): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();

    // تجنب التحميل المكرر
    if (this.loadedStyles.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      link.onload = () => {
        this.loadedStyles.add(href);
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load style: ${href}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * تحميل صورة بشكل كسول
   */
  lazyLoadImage(imgElement: HTMLImageElement, src: string, placeholder?: string): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();

    // عرض placeholder أثناء التحميل
    if (placeholder) {
      imgElement.src = placeholder;
    }

    return new Promise((resolve, reject) => {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;

            img.onload = () => {
              imgElement.src = src;
              imgElement.classList.add('loaded');
              resolve();
            };

            img.onerror = () => {
              reject(new Error(`Failed to load image: ${src}`));
            };

            obs.unobserve(entry.target);
          }
        });
      });

      observer.observe(imgElement);
    });
  }

  /**
   * تحميل مكون عند الحاجة فقط
   */
  loadComponentOnVisible(
    element: HTMLElement,
    loadFn: () => Promise<any>,
    options?: IntersectionObserverInit,
  ): void {
    if (!this.isBrowser) return;

    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '100px',
      threshold: 0,
      ...options,
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadFn().then(() => {
            obs.unobserve(entry.target);
          });
        }
      });
    }, defaultOptions);

    observer.observe(element);

    // حفظ المراقب للتنظيف لاحقاً
    const observerId = `observer_${Date.now()}`;
    this.observers.set(observerId, observer);
  }

  /**
   * التحميل المسبق للمسارات
   */
  preloadRoute(path: string): void {
    if (!this.isBrowser) return;

    // إنشاء رابط prefetch للمسار
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
  }

  /**
   * التحميل المسبق لقائمة مسارات
   */
  preloadRoutes(paths: string[]): void {
    paths.forEach((path) => this.preloadRoute(path));
  }

  /**
   * تحميل iframe بشكل كسول
   */
  lazyLoadIframe(
    container: HTMLElement,
    src: string,
    options?: { width?: string; height?: string; title?: string },
  ): void {
    if (!this.isBrowser) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.width = options?.width || '100%';
          iframe.height = options?.height || '400';
          iframe.title = options?.title || 'Embedded content';
          iframe.loading = 'lazy';
          iframe.style.border = 'none';

          container.appendChild(iframe);
          obs.unobserve(entry.target);
        }
      });
    });

    observer.observe(container);
  }

  /**
   * تحميل فيديو بشكل كسول
   */
  lazyLoadVideo(videoElement: HTMLVideoElement, sources: { src: string; type: string }[]): void {
    if (!this.isBrowser) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sources.forEach((source) => {
            const sourceEl = document.createElement('source');
            sourceEl.src = source.src;
            sourceEl.type = source.type;
            videoElement.appendChild(sourceEl);
          });

          videoElement.load();
          obs.unobserve(entry.target);
        }
      });
    });

    observer.observe(videoElement);
  }

  /**
   * تحميل خط بشكل كسول
   */
  loadFont(fontFamily: string, fontUrl: string): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();

    return new Promise((resolve) => {
      const font = new FontFace(fontFamily, `url(${fontUrl})`);
      font.load().then((loadedFont) => {
        (document.fonts as any).add(loadedFont);
        resolve();
      });
    });
  }

  /**
   * تأخير تحميل المحتوى غير المرئي
   */
  deferNonCritical(callback: () => void): void {
    if (!this.isBrowser) return;

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback);
    } else {
      setTimeout(callback, 200);
    }
  }

  /**
   * تنظيف جميع المراقبين
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }

  /**
   * التحقق من دعم المتصفح للـ Lazy Loading الأصلي
   */
  supportsNativeLazyLoading(): boolean {
    if (!this.isBrowser) return false;
    return 'loading' in HTMLImageElement.prototype;
  }
}
