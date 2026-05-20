import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { CachingService } from './caching.service';

/**
 * 🔄 HTTP Cache Interceptor
 * اعتراض طلبات HTTP وتخزينها مؤقتاً
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private inFlightRequests: Map<string, Observable<HttpEvent<any>>> = new Map();

  constructor(private cachingService: CachingService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // فقط تخزين طلبات GET
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    // التحقق من header لتجاوز الكاش
    if (request.headers.has('X-Skip-Cache')) {
      const newRequest = request.clone({
        headers: request.headers.delete('X-Skip-Cache'),
      });
      return next.handle(newRequest);
    }

    const cacheKey = this.createCacheKey(request);
    const cacheDuration = this.getCacheDuration(request);

    // التحقق من الكاش
    const cachedResponse = this.cachingService.getMemory<HttpResponse<any>>(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse.clone());
    }

    // التحقق من طلب قيد التنفيذ (منع الطلبات المكررة)
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // تنفيذ الطلب
    const request$ = next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // تخزين في الكاش
          this.cachingService.setMemory(cacheKey, event.clone(), cacheDuration);
          // إزالة من الطلبات قيد التنفيذ
          this.inFlightRequests.delete(cacheKey);
        }
      }),
      shareReplay(1)
    );

    // إضافة للطلبات قيد التنفيذ
    this.inFlightRequests.set(cacheKey, request$);

    return request$;
  }

  /**
   * إنشاء مفتاح فريد للكاش
   */
  private createCacheKey(request: HttpRequest<any>): string {
    const url = request.urlWithParams;
    return `http_cache_${url}`;
  }

  /**
   * الحصول على مدة الكاش من الـ Headers
   */
  private getCacheDuration(request: HttpRequest<any>): number {
    const customDuration = request.headers.get('X-Cache-Duration');
    if (customDuration) {
      return parseInt(customDuration, 10);
    }

    // مدة افتراضية حسب نوع الطلب
    const url = request.url;
    if (url.includes('/static/') || url.includes('/assets/')) {
      return 3600; // ساعة للملفات الثابتة
    }
    if (url.includes('/api/config') || url.includes('/api/settings')) {
      return 300; // 5 دقائق للإعدادات
    }
    return 60; // دقيقة للباقي
  }

  /**
   * مسح الكاش لـ URL معين
   */
  invalidateCache(url: string): void {
    this.cachingService.deleteMemory(`http_cache_${url}`);
  }

  /**
   * مسح كل الكاش
   */
  clearAllCache(): void {
    this.cachingService.clearMemory();
    this.inFlightRequests.clear();
  }
}

/**
 * 🔄 HTTP Cache Service
 * خدمة للتحكم في كاش HTTP
 */
@Injectable({
  providedIn: 'root',
})
export class HttpCacheService {
  private cacheConfig: Map<string, CacheConfig> = new Map();

  constructor(private cachingService: CachingService) {
    this.setupDefaultConfigs();
  }

  /**
   * إعداد التكوينات الافتراضية
   */
  private setupDefaultConfigs(): void {
    // الملفات الثابتة
    this.cacheConfig.set('/assets/', { duration: 86400, persist: true }); // يوم
    this.cacheConfig.set('/static/', { duration: 86400, persist: true });

    // API endpoints
    this.cacheConfig.set('/api/config', { duration: 300, persist: false }); // 5 دقائق
    this.cacheConfig.set('/api/categories', { duration: 600, persist: true }); // 10 دقائق
    this.cacheConfig.set('/api/courses', { duration: 120, persist: false }); // دقيقتين
  }

  /**
   * تعيين تكوين كاش مخصص
   */
  setCacheConfig(pattern: string, config: CacheConfig): void {
    this.cacheConfig.set(pattern, config);
  }

  /**
   * الحصول على تكوين الكاش لـ URL
   */
  getCacheConfig(url: string): CacheConfig | undefined {
    for (const [pattern, config] of this.cacheConfig) {
      if (url.includes(pattern)) {
        return config;
      }
    }
    return undefined;
  }

  /**
   * مسح الكاش لنمط معين
   */
  invalidatePattern(pattern: string): void {
    // يحتاج تنفيذ مخصص حسب احتياجاتك
    console.log(`Invalidating cache for pattern: ${pattern}`);
  }

  /**
   * مسح كل الكاش
   */
  async clearAll(): Promise<void> {
    this.cachingService.clearMemory();
    await this.cachingService.clearAll();
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

interface CacheConfig {
  duration: number; // بالثواني
  persist: boolean; // تخزين دائم؟
}
