import { Injectable, signal } from '@angular/core';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  percentage?: number; // للـ Gradual Rollout
  userRoles?: string[]; // للأدوار المحددة
  startDate?: Date;
  endDate?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagsService {
  private flags = signal<Map<string, FeatureFlag>>(new Map());
  private userId: string | null = null;

  constructor() {
    this.loadFlags();
  }

  /**
   * تعيين معرف المستخدم (للـ Consistent Rollout)
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * التحقق من تفعيل ميزة
   */
  isEnabled(key: string, userRole?: string): boolean {
    const flag = this.flags().get(key);

    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // التحقق من التاريخ
    const now = new Date();
    if (flag.startDate && now < flag.startDate) {
      return false;
    }
    if (flag.endDate && now > flag.endDate) {
      return false;
    }

    // التحقق من الأدوار
    if (flag.userRoles && flag.userRoles.length > 0 && userRole) {
      if (!flag.userRoles.includes(userRole)) {
        return false;
      }
    }

    // التحقق من النسبة المئوية (Gradual Rollout)
    if (flag.percentage !== undefined && flag.percentage < 100) {
      return this.isInPercentage(key, flag.percentage);
    }

    return true;
  }

  /**
   * الحصول على قيمة الميزة
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags().get(key);
  }

  /**
   * تحديث الأعلام (من الخادم)
   */
  updateFlags(newFlags: FeatureFlag[]): void {
    const flagMap = new Map<string, FeatureFlag>();
    newFlags.forEach((flag) => {
      flagMap.set(flag.key, flag);
    });
    this.flags.set(flagMap);
    this.saveFlags(newFlags);
  }

  /**
   * تحميل الأعلام
   */
  private loadFlags(): void {
    // الأعلام الافتراضية
    const defaultFlags: FeatureFlag[] = [
      { key: 'dark_mode', enabled: true },
      { key: 'new_editor', enabled: false },
      { key: 'ai_assistant', enabled: true, userRoles: ['teacher', 'admin', 'super_admin'] },
      { key: 'video_chat', enabled: false, percentage: 10 },
      { key: 'live_streaming', enabled: true, userRoles: ['teacher'] },
      { key: 'gamification', enabled: true },
      { key: 'certificates', enabled: true },
      { key: 'mobile_app_promo', enabled: true },
      { key: 'analytics_v2', enabled: false, percentage: 50 },
      { key: 'social_login', enabled: true },
    ];

    // محاولة تحميل من التخزين المحلي
    try {
      const stored = localStorage.getItem('feature_flags');
      if (stored) {
        const parsed = JSON.parse(stored) as FeatureFlag[];
        this.updateFlags(parsed);
        return;
      }
    } catch (e) {
      console.warn('Failed to load feature flags from storage');
    }

    this.updateFlags(defaultFlags);
  }

  /**
   * حفظ الأعلام
   */
  private saveFlags(flags: FeatureFlag[]): void {
    try {
      localStorage.setItem('feature_flags', JSON.stringify(flags));
    } catch (e) {
      console.warn('Failed to save feature flags');
    }
  }

  /**
   * التحقق من أن المستخدم ضمن النسبة المئوية
   */
  private isInPercentage(key: string, percentage: number): boolean {
    // استخدام hash ثابت للمستخدم + المفتاح للحصول على نتيجة ثابتة
    const identifier = this.userId || this.getAnonymousId();
    const hash = this.hashString(`${key}:${identifier}`);
    const userPercentage = hash % 100;

    return userPercentage < percentage;
  }

  /**
   * الحصول على معرف مجهول للمستخدم
   */
  private getAnonymousId(): string {
    let id = localStorage.getItem('anonymous_id');
    if (!id) {
      id = Math.random().toString(36).substring(2);
      localStorage.setItem('anonymous_id', id);
    }
    return id;
  }

  /**
   * دالة hash بسيطة
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * إنشاء signal للميزة
   */
  featureSignal(key: string, userRole?: string) {
    return signal(this.isEnabled(key, userRole));
  }
}
