import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * تكوين أمان الأدمن - مشدد جداً
 */
interface AdminSecurityConfig {
  enableXssProtection: boolean;
  enableClickjacking: boolean;
  enableRateLimiting: boolean;
  enableBruteForceProtection: boolean;
  enableDevToolsDetection: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // بالدقائق
  maxRequestsPerMinute: number;
  sessionTimeout: number; // بالدقائق
}

/**
 * محاولة تسجيل دخول
 */
interface LoginAttempt {
  timestamp: number;
  ip?: string;
  success: boolean;
}

/**
 * 🔒 Admin Security Service
 * خدمة أمان مشددة لصفحات الأدمن
 */
@Injectable()
export class AdminSecurityService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // تكوين أمان مشدد
  private config: AdminSecurityConfig = {
    enableXssProtection: true,
    enableClickjacking: true,
    enableRateLimiting: true,
    enableBruteForceProtection: true,
    enableDevToolsDetection: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    maxRequestsPerMinute: 30,
    sessionTimeout: 30,
  };

  // تتبع محاولات تسجيل الدخول
  private loginAttempts: LoginAttempt[] = [];
  private requestTimestamps: number[] = [];

  // حالات الأمان
  private _isLocked = signal<boolean>(false);
  private _lockoutEndTime = signal<number | null>(null);
  private _securityAlerts = signal<string[]>([]);
  private _devToolsOpen = signal<boolean>(false);

  // Signals للقراءة
  readonly isLocked = computed(() => this._isLocked());
  readonly lockoutEndTime = computed(() => this._lockoutEndTime());
  readonly securityAlerts = computed(() => this._securityAlerts());
  readonly devToolsOpen = computed(() => this._devToolsOpen());

  readonly remainingAttempts = computed(() => {
    const recentAttempts = this.getRecentFailedAttempts();
    return Math.max(0, this.config.maxLoginAttempts - recentAttempts.length);
  });

  readonly lockoutRemainingTime = computed(() => {
    const endTime = this._lockoutEndTime();
    if (!endTime) return 0;
    return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  });

  /**
   * تهيئة حماية الأمان المشددة
   */
  initialize(): void {
    if (!this.isBrowser) return;

    // التحقق من الحالة المحفوظة
    this.checkStoredLockout();

    if (this.config.enableClickjacking) {
      this.preventClickjacking();
    }

    if (this.config.enableXssProtection) {
      this.setupXssProtection();
    }

    if (this.config.enableDevToolsDetection) {
      this.detectDevTools();
    }

    // مراقبة نشاط الجلسة
    this.setupSessionMonitoring();
  }

  /**
   * تسجيل محاولة تسجيل دخول
   */
  recordLoginAttempt(success: boolean): {
    allowed: boolean;
    remainingAttempts: number;
    lockoutTime?: number;
  } {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      success,
    };

    this.loginAttempts.push(attempt);

    if (!success) {
      const recentFailed = this.getRecentFailedAttempts();

      if (recentFailed.length >= this.config.maxLoginAttempts) {
        this.lockAccount();
        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutTime: this.config.lockoutDuration * 60,
        };
      }

      return {
        allowed: true,
        remainingAttempts: this.config.maxLoginAttempts - recentFailed.length,
      };
    }

    // تسجيل دخول ناجح - مسح المحاولات
    this.loginAttempts = [];
    this.unlockAccount();

    return {
      allowed: true,
      remainingAttempts: this.config.maxLoginAttempts,
    };
  }

  /**
   * الحصول على المحاولات الفاشلة الأخيرة
   */
  private getRecentFailedAttempts(): LoginAttempt[] {
    const windowMs = this.config.lockoutDuration * 60 * 1000;
    const cutoff = Date.now() - windowMs;

    return this.loginAttempts.filter((a) => !a.success && a.timestamp > cutoff);
  }

  /**
   * قفل الحساب
   */
  private lockAccount(): void {
    const lockoutEndTime = Date.now() + this.config.lockoutDuration * 60 * 1000;

    this._isLocked.set(true);
    this._lockoutEndTime.set(lockoutEndTime);

    // حفظ في localStorage
    if (this.isBrowser) {
      localStorage.setItem(
        'admin_lockout',
        JSON.stringify({
          endTime: lockoutEndTime,
          attempts: this.loginAttempts,
        }),
      );
    }

    this.addSecurityAlert(`Account locked for ${this.config.lockoutDuration} minutes`);

    // فتح القفل تلقائياً بعد انتهاء المدة
    setTimeout(
      () => {
        this.unlockAccount();
      },
      this.config.lockoutDuration * 60 * 1000,
    );
  }

  /**
   * فتح قفل الحساب
   */
  unlockAccount(): void {
    this._isLocked.set(false);
    this._lockoutEndTime.set(null);
    this.loginAttempts = [];

    if (this.isBrowser) {
      localStorage.removeItem('admin_lockout');
    }
  }

  /**
   * التحقق من القفل المحفوظ
   */
  private checkStoredLockout(): void {
    if (!this.isBrowser) return;

    const stored = localStorage.getItem('admin_lockout');
    if (stored) {
      try {
        const { endTime, attempts } = JSON.parse(stored);
        if (endTime > Date.now()) {
          this._isLocked.set(true);
          this._lockoutEndTime.set(endTime);
          this.loginAttempts = attempts || [];

          // جدولة فتح القفل
          setTimeout(() => {
            this.unlockAccount();
          }, endTime - Date.now());
        } else {
          this.unlockAccount();
        }
      } catch {
        localStorage.removeItem('admin_lockout');
      }
    }
  }

  /**
   * التحقق من Rate Limiting
   */
  checkRateLimit(): { allowed: boolean; remaining: number; resetIn: number } {
    if (!this.config.enableRateLimiting) {
      return {
        allowed: true,
        remaining: this.config.maxRequestsPerMinute,
        resetIn: 0,
      };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo);

    const remaining = this.config.maxRequestsPerMinute - this.requestTimestamps.length;
    const allowed = remaining > 0;

    if (allowed) {
      this.requestTimestamps.push(now);
    }

    const oldestRequest = this.requestTimestamps[0] || now;
    const resetIn = Math.max(0, 60000 - (now - oldestRequest));

    if (!allowed) {
      this.addSecurityAlert('Rate limit exceeded');
    }

    return { allowed, remaining: Math.max(0, remaining), resetIn };
  }

  /**
   * تنظيف نص من XSS
   */
  sanitizeInput(input: string): string {
    if (!this.config.enableXssProtection) return input;

    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:\s*text\/html/gi, '')
      .replace(/[<>'"]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        };
        return entities[char] || char;
      });

    return sanitized.trim();
  }

  /**
   * التحقق من صحة البريد الإلكتروني
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * التحقق من قوة كلمة المرور
   */
  validatePassword(password: string): {
    valid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('يجب أن تكون 8 أحرف على الأقل');

    if (password.length >= 12) score++;

    if (/[a-z]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على حرف صغير');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على حرف كبير');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على رقم');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على رمز خاص');

    return {
      valid: score >= 4 && password.length >= 8,
      score,
      feedback,
    };
  }

  /**
   * إنشاء بصمة الجهاز
   */
  generateDeviceFingerprint(): string {
    if (!this.isBrowser) return '';

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
    ];

    const fingerprint = components.join('|');

    // تحويل إلى hash بسيط
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * منع Clickjacking
   */
  private preventClickjacking(): void {
    if (!this.isBrowser) return;

    if (window.self !== window.top) {
      this.addSecurityAlert('Clickjacking attempt detected');

      try {
        window.top!.location.href = window.self.location.href;
      } catch {
        document.body.innerHTML =
          '<h1>Access Denied</h1><p>This page cannot be displayed in a frame.</p>';
        document.body.style.display = 'block';
      }
    }
  }

  /**
   * إعداد حماية XSS
   */
  private setupXssProtection(): void {
    if (!this.isBrowser) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            if (element.tagName === 'SCRIPT') {
              const src = element.getAttribute('src');
              if (src && !this.isAllowedScriptSource(src)) {
                element.remove();
                this.addSecurityAlert(`Blocked suspicious script: ${src}`);
              }
            }

            // فحص الـ iframes
            if (element.tagName === 'IFRAME') {
              element.remove();
              this.addSecurityAlert('Blocked iframe injection');
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
   * كشف أدوات المطور
   */
  private detectDevTools(): void {
    if (!this.isBrowser) return;

    const threshold = 160;
    let devToolsOpen = false;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          this._devToolsOpen.set(true);
          this.addSecurityAlert('Developer tools detected');
        }
      } else {
        devToolsOpen = false;
        this._devToolsOpen.set(false);
      }
    };

    // فحص عند تغيير حجم النافذة
    window.addEventListener('resize', checkDevTools);
    checkDevTools();
  }

  /**
   * مراقبة نشاط الجلسة
   */
  private setupSessionMonitoring(): void {
    if (!this.isBrowser) return;

    let lastActivity = Date.now();
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;

    const resetActivity = () => {
      lastActivity = Date.now();
    };

    // مراقبة النشاط
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((event) => {
      document.addEventListener(event, resetActivity, { passive: true });
    });

    // فحص دوري
    setInterval(() => {
      if (Date.now() - lastActivity > timeoutMs) {
        this.addSecurityAlert('Session timeout - Please login again');
        // يمكن إضافة logout هنا
      }
    }, 60000);
  }

  /**
   * التحقق من مصدر السكريبت
   */
  private isAllowedScriptSource(src: string): boolean {
    const allowedDomains = [window.location.origin];

    return allowedDomains.some((domain) => src.startsWith(domain));
  }

  /**
   * إضافة تنبيه أمني
   */
  private addSecurityAlert(message: string): void {
    const timestamp = new Date().toISOString();
    this._securityAlerts.update((alerts) => [...alerts, `[${timestamp}] ${message}`]);

    console.warn('🔒 Admin Security Alert:', message);
  }

  /**
   * مسح التنبيهات
   */
  clearAlerts(): void {
    this._securityAlerts.set([]);
  }

  /**
   * تحقق شامل قبل تسجيل الدخول
   */
  preLoginCheck(): {
    allowed: boolean;
    reason?: string;
  } {
    // التحقق من القفل
    if (this._isLocked()) {
      return {
        allowed: false,
        reason: `الحساب مقفل. يرجى الانتظار ${Math.ceil(this.lockoutRemainingTime() / 60)} دقيقة`,
      };
    }

    // التحقق من Rate Limiting
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      return {
        allowed: false,
        reason: 'عدد كبير من المحاولات. يرجى الانتظار.',
      };
    }

    return { allowed: true };
  }

  /**
   * التحقق من صلاحيات المسؤول
   */
  isAdminAuthorized(adminData: any): boolean {
    if (!adminData) return false;

    const hasAdminRole = adminData.role === 'admin' || adminData.role === 'super_admin';
    const hasRequiredPermissions =
      adminData.permissions?.includes('*') ||
      adminData.permissions?.includes('admin:access') ||
      adminData.role === 'super_admin';

    return hasAdminRole && hasRequiredPermissions;
  }

  /**
   * تسجيل وصول المسؤول
   */
  logAdminAccess(adminData: any): void {
    if (!this.isBrowser) return;

    const accessLog = {
      timestamp: new Date().toISOString(),
      adminId: adminData.id,
      adminEmail: adminData.email,
      deviceFingerprint: this.generateDeviceFingerprint(),
      userAgent: navigator.userAgent,
    };

    // تخزين السجل محلياً
    const logs = JSON.parse(localStorage.getItem('admin_access_logs') || '[]');
    logs.push(accessLog);

    // الاحتفاظ بآخر 100 سجل فقط
    if (logs.length > 100) {
      logs.shift();
    }

    localStorage.setItem('admin_access_logs', JSON.stringify(logs));

    console.log('✅ Admin Access Logged:', accessLog);
  }

  /**
   * مسح جلسة المسؤول
   */
  clearAdminSession(): void {
    if (!this.isBrowser) return;

    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_last_activity');
    this._isLocked.set(false);
    this._lockoutEndTime.set(null);
    this._securityAlerts.set([]);
    this._devToolsOpen.set(false);

    console.log('🔒 Admin Session Cleared');
  }
}
