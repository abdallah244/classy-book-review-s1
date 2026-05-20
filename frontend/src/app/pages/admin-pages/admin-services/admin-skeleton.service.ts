import { Injectable, signal, computed } from '@angular/core';

/**
 * أنواع الـ Skeleton للأدمن
 */
export type AdminSkeletonType =
  | 'login-form'
  | 'dashboard'
  | 'users-table'
  | 'courses-table'
  | 'stats'
  | 'sidebar'
  | 'header'
  | 'chart';

/**
 * حالة Skeleton لقسم معين
 */
interface SkeletonState {
  isLoading: boolean;
  startTime: number;
  minDuration: number;
}

/**
 * 💀 Admin Skeleton Service
 * خدمة إدارة Skeleton Loading لصفحات الأدمن
 */
@Injectable()
export class AdminSkeletonService {
  // خريطة حالات التحميل لكل قسم
  private _sectionStates = signal<Map<AdminSkeletonType, SkeletonState>>(new Map());

  // Computed signals للأقسام الرئيسية
  readonly isLoginFormLoading = computed(() => this.isSectionLoading('login-form'));
  readonly isDashboardLoading = computed(() => this.isSectionLoading('dashboard'));
  readonly isUsersTableLoading = computed(() => this.isSectionLoading('users-table'));
  readonly isCoursesTableLoading = computed(() => this.isSectionLoading('courses-table'));
  readonly isStatsLoading = computed(() => this.isSectionLoading('stats'));
  readonly isSidebarLoading = computed(() => this.isSectionLoading('sidebar'));

  // حالة عامة
  readonly isAnyLoading = computed(() => {
    const states = this._sectionStates();
    return Array.from(states.values()).some((state) => state.isLoading);
  });

  readonly loadingProgress = computed(() => {
    const states = this._sectionStates();
    if (states.size === 0) return 100;

    const completed = Array.from(states.values()).filter((s) => !s.isLoading).length;
    return Math.round((completed / states.size) * 100);
  });

  /**
   * بدء Skeleton لقسم معين
   */
  startLoading(section: AdminSkeletonType, minDuration: number = 300): void {
    this._sectionStates.update((states) => {
      const newStates = new Map(states);
      newStates.set(section, {
        isLoading: true,
        startTime: Date.now(),
        minDuration,
      });
      return newStates;
    });
  }

  /**
   * إيقاف Skeleton لقسم معين
   */
  async stopLoading(section: AdminSkeletonType): Promise<void> {
    const states = this._sectionStates();
    const state = states.get(section);

    if (state) {
      const elapsed = Date.now() - state.startTime;
      const remaining = state.minDuration - elapsed;

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
    }

    this._sectionStates.update((states) => {
      const newStates = new Map(states);
      const existingState = newStates.get(section);
      if (existingState) {
        newStates.set(section, { ...existingState, isLoading: false });
      }
      return newStates;
    });
  }

  /**
   * التحقق من حالة قسم معين
   */
  isSectionLoading(section: AdminSkeletonType): boolean {
    const state = this._sectionStates().get(section);
    return state?.isLoading ?? false;
  }

  /**
   * تنفيذ عملية مع Skeleton تلقائي
   */
  async withSkeleton<T>(
    section: AdminSkeletonType,
    operation: () => Promise<T>,
    minDuration: number = 500,
  ): Promise<T> {
    this.startLoading(section, minDuration);

    try {
      const result = await operation();
      await this.stopLoading(section);
      return result;
    } catch (error) {
      await this.stopLoading(section);
      throw error;
    }
  }

  /**
   * إعادة تعيين كل الحالات
   */
  reset(): void {
    this._sectionStates.set(new Map());
  }
}
