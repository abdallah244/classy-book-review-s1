import { Injectable, signal, computed } from '@angular/core';

/**
 * أنواع الـ Skeleton للهوم
 */
export type HomeSkeletonType =
  | 'hero'
  | 'featured-courses'
  | 'categories'
  | 'testimonials'
  | 'stats'
  | 'instructors'
  | 'cta'
  | 'footer';

/**
 * حالة Skeleton لقسم معين
 */
interface SkeletonState {
  isLoading: boolean;
  startTime: number;
  minDuration: number;
}

/**
 * 💀 Home Page Skeleton Service
 * خدمة إدارة Skeleton Loading لصفحة الهوم
 */
@Injectable()
export class HomeSkeletonService {
  // خريطة حالات التحميل لكل قسم
  private _sectionStates = signal<Map<HomeSkeletonType, SkeletonState>>(new Map());

  // Computed signals للأقسام الرئيسية
  readonly isHeroLoading = computed(() => this.isSectionLoading('hero'));
  readonly isFeaturedLoading = computed(() => this.isSectionLoading('featured-courses'));
  readonly isCategoriesLoading = computed(() => this.isSectionLoading('categories'));
  readonly isTestimonialsLoading = computed(() => this.isSectionLoading('testimonials'));
  readonly isStatsLoading = computed(() => this.isSectionLoading('stats'));
  readonly isInstructorsLoading = computed(() => this.isSectionLoading('instructors'));

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
  startLoading(section: HomeSkeletonType, minDuration: number = 300): void {
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
   * بدء Skeleton لعدة أقسام
   */
  startMultiple(sections: HomeSkeletonType[], minDuration: number = 300): void {
    sections.forEach((section) => this.startLoading(section, minDuration));
  }

  /**
   * إيقاف Skeleton لقسم معين (مع احترام الـ minDuration)
   */
  async stopLoading(section: HomeSkeletonType): Promise<void> {
    const states = this._sectionStates();
    const state = states.get(section);

    if (state) {
      const elapsed = Date.now() - state.startTime;
      const remaining = state.minDuration - elapsed;

      // انتظر إذا لم يمر الوقت الأدنى
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
   * إيقاف كل الـ Skeletons
   */
  async stopAll(): Promise<void> {
    const sections = Array.from(this._sectionStates().keys());
    await Promise.all(sections.map((section) => this.stopLoading(section)));
  }

  /**
   * التحقق من حالة قسم معين
   */
  isSectionLoading(section: HomeSkeletonType): boolean {
    const state = this._sectionStates().get(section);
    return state?.isLoading ?? false;
  }

  /**
   * تنفيذ عملية مع Skeleton تلقائي
   */
  async withSkeleton<T>(
    section: HomeSkeletonType,
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
   * تنفيذ عمليات متعددة بالتوازي
   */
  async withMultipleSkeletons<T>(
    operations: { section: HomeSkeletonType; operation: () => Promise<T> }[],
    minDuration: number = 500,
  ): Promise<T[]> {
    // بدء كل الـ Skeletons
    operations.forEach((op) => this.startLoading(op.section, minDuration));

    try {
      // تنفيذ كل العمليات بالتوازي
      const results = await Promise.all(
        operations.map(async (op) => {
          const result = await op.operation();
          await this.stopLoading(op.section);
          return result;
        }),
      );
      return results;
    } catch (error) {
      await this.stopAll();
      throw error;
    }
  }

  /**
   * إعادة تعيين كل الحالات
   */
  reset(): void {
    this._sectionStates.set(new Map());
  }

  /**
   * الحصول على عدد Skeleton items للقسم
   */
  getSkeletonCount(section: HomeSkeletonType): number {
    const counts: Record<HomeSkeletonType, number> = {
      hero: 1,
      'featured-courses': 4,
      categories: 6,
      testimonials: 3,
      stats: 4,
      instructors: 4,
      cta: 1,
      footer: 1,
    };
    return counts[section] || 3;
  }
}
