import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * تكوين الأمان
 */
interface SecurityConfig {
  enableXssProtection: boolean;
  enableClickjacking: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
}

/**
 * 🔒 Home Page Security Service
 * خدمة أمان مخصصة لصفحة الهوم
 */
@Injectable()
export class HomeSecurityService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // تكوين افتراضي
  private config: SecurityConfig = {
    enableXssProtection: true,
    enableClickjacking: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
  };

  // تتبع الطلبات للـ Rate Limiting
  private requestTimestamps: number[] = [];

  // حالة الأمان
  private _securityAlerts = signal<string[]>([]);
  readonly securityAlerts = computed(() => this._securityAlerts());

  /**
   * تهيئة حماية الأمان
   */
  initialize(): void {
    if (!this.isBrowser) return;

    if (this.config.enableClickjacking) {
      this.preventClickjacking();
    }

    if (this.config.enableXssProtection) {
      this.setupXssProtection();
    }
  }

  /**
   * تنظيف نص من XSS
   */
  sanitizeHtml(html: string): string {
    if (!this.config.enableXssProtection) return html;

    // إزالة السكريبتات
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // إزالة event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // إزالة javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');

    // إزالة data: URLs خطيرة
    sanitized = sanitized.replace(/data:\s*text\/html/gi, '');

    return sanitized;
  }

  /**
   * تنظيف URL من المخاطر
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';

    // قائمة البروتوكولات المسموحة
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    try {
      const parsed = new URL(url, window.location.origin);
      if (allowedProtocols.includes(parsed.protocol)) {
        return url;
      }
    } catch {
      // URL غير صالح
    }

    return '';
  }

  /**
   * التحقق من Rate Limiting
   */
  checkRateLimit(): { allowed: boolean; remaining: number; resetIn: number } {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remaining: this.config.maxRequestsPerMinute, resetIn: 0 };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // تنظيف الطلبات القديمة
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo);

    const remaining = this.config.maxRequestsPerMinute - this.requestTimestamps.length;
    const allowed = remaining > 0;

    if (allowed) {
      this.requestTimestamps.push(now);
    }

    // حساب وقت إعادة التعيين
    const oldestRequest = this.requestTimestamps[0] || now;
    const resetIn = Math.max(0, 60000 - (now - oldestRequest));

    if (!allowed) {
      this.addSecurityAlert('Rate limit exceeded');
    }

    return { allowed, remaining: Math.max(0, remaining), resetIn };
  }

  /**
   * إنشاء Nonce لـ CSP
   */
  generateNonce(): string {
    if (this.isBrowser && 'crypto' in window) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * التحقق من صحة المدخلات
   */
  validateInput(input: string, type: 'email' | 'text' | 'number' | 'url'): boolean {
    if (!input) return false;

    const patterns: Record<string, RegExp> = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      text: /^[\p{L}\p{N}\s\-_.,!?@#$%&*()+='"]+$/u,
      number: /^\d+$/,
      url: /^https?:\/\/[^\s]+$/,
    };

    return patterns[type]?.test(input) ?? false;
  }

  /**
   * تشفير البيانات الحساسة للتخزين المؤقت
   */
  encodeForStorage(data: string): string {
    if (!this.isBrowser) return data;

    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  }

  /**
   * فك تشفير البيانات
   */
  decodeFromStorage(encoded: string): string {
    if (!this.isBrowser) return encoded;

    try {
      return decodeURIComponent(atob(encoded));
    } catch {
      return encoded;
    }
  }

  /**
   * منع Clickjacking
   */
  private preventClickjacking(): void {
    if (!this.isBrowser) return;

    // التحقق من أن الصفحة ليست في iframe
    if (window.self !== window.top) {
      this.addSecurityAlert('Clickjacking attempt detected');

      // محاولة الخروج من الـ iframe
      try {
        window.top!.location.href = window.self.location.href;
      } catch {
        // إخفاء المحتوى إذا لم نتمكن من الخروج
        document.body.innerHTML = '';
        document.body.style.display = 'none';
      }
    }
  }

  /**
   * إعداد حماية XSS
   */
  private setupXssProtection(): void {
    if (!this.isBrowser) return;

    // مراقبة DOM للعناصر المشبوهة
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // التحقق من السكريبتات المضافة ديناميكياً
            if (element.tagName === 'SCRIPT') {
              const src = element.getAttribute('src');
              if (src && !this.isAllowedScriptSource(src)) {
                element.remove();
                this.addSecurityAlert(`Blocked suspicious script: ${src}`);
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * التحقق من مصدر السكريبت
   */
  private isAllowedScriptSource(src: string): boolean {
    const allowedDomains = [
      window.location.origin,
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ];

    return allowedDomains.some((domain) => src.startsWith(domain));
  }

  /**
   * إضافة تنبيه أمني
   */
  private addSecurityAlert(message: string): void {
    this._securityAlerts.update((alerts) => [
      ...alerts,
      `[${new Date().toISOString()}] ${message}`,
    ]);

    // تسجيل في الكونسول (Development فقط)
    if (this.isBrowser && (window as any).__DEV__) {
      console.warn('🔒 Security Alert:', message);
    }
  }

  /**
   * مسح التنبيهات
   */
  clearAlerts(): void {
    this._securityAlerts.set([]);
  }

  /**
   * تحديث التكوين
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
