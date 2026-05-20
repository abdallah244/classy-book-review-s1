import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface PreloadConfig {
  strategy: 'eager' | 'lazy' | 'visible' | 'idle' | 'hover';
  delay?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PreloadStrategyService {
  private platformId = inject(PLATFORM_ID);
  private preloadedUrls = new Set<string>();
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initIntersectionObserver();
    }
  }

  /**
   * تحميل مسبق لرابط
   */
  preload(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.preloadedUrls.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    this.preloadedUrls.add(url);
  }

  /**
   * تحميل مسبق لصورة
   */
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = src;
    });
  }

  /**
   * تحميل مسبق لعدة صور
   */
  preloadImages(sources: string[]): Promise<void[]> {
    return Promise.all(sources.map((src) => this.preloadImage(src)));
  }

  /**
   * تحميل مسبق عند الـ hover
   */
  preloadOnHover(element: HTMLElement, url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let timeoutId: any;

    element.addEventListener('mouseenter', () => {
      timeoutId = setTimeout(() => this.preload(url), 100);
    });

    element.addEventListener('mouseleave', () => {
      if (timeoutId) clearTimeout(timeoutId);
    });
  }

  /**
   * تحميل مسبق عند الظهور في الـ viewport
   */
  preloadOnVisible(element: HTMLElement, url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.intersectionObserver) {
      (element as any).__preloadUrl = url;
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * تحميل مسبق عند فراغ المتصفح
   */
  preloadOnIdle(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => this.preload(url));
    } else {
      setTimeout(() => this.preload(url), 1000);
    }
  }

  /**
   * تحميل مسبق لموجه (Route)
   */
  preloadRoute(routePath: string): void {
    // يتم التعامل مع هذا عبر Angular Router
    this.preload(routePath);
  }

  /**
   * DNS Prefetch
   */
  dnsPrefetch(hostname: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${hostname}`;
    document.head.appendChild(link);
  }

  /**
   * Preconnect
   */
  preconnect(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  /**
   * تهيئة IntersectionObserver
   */
  private initIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const url = (element as any).__preloadUrl;
            if (url) {
              this.preload(url);
              this.intersectionObserver?.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      },
    );
  }

  /**
   * تنظيف
   */
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
}
