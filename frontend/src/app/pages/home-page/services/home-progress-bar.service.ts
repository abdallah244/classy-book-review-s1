import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * أنواع Progress Bar
 */
export type ProgressBarType = 'linear' | 'circular';

/**
 * حالة Progress Bar
 */
interface ProgressState {
  isVisible: boolean;
  progress: number;
  type: ProgressBarType;
  color: string;
  isIndeterminate: boolean;
}

/**
 * 📊 Home Page Progress Bar Service
 * خدمة شريط التحميل في أعلى الصفحة
 */
@Injectable()
export class HomeProgressBarService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // حالة Progress Bar
  private _state = signal<ProgressState>({
    isVisible: false,
    progress: 0,
    type: 'linear',
    color: 'var(--primary-color, #6366f1)',
    isIndeterminate: false,
  });

  // Signals للقراءة
  readonly isVisible = computed(() => this._state().isVisible);
  readonly progress = computed(() => this._state().progress);
  readonly type = computed(() => this._state().type);
  readonly color = computed(() => this._state().color);
  readonly isIndeterminate = computed(() => this._state().isIndeterminate);

  // Animation frame ID للتنظيف
  private animationFrameId: number | null = null;
  private incrementInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * بدء Progress Bar
   */
  start(options: Partial<Pick<ProgressState, 'type' | 'color' | 'isIndeterminate'>> = {}): void {
    this._state.update((state) => ({
      ...state,
      isVisible: true,
      progress: 0,
      type: options.type ?? state.type,
      color: options.color ?? state.color,
      isIndeterminate: options.isIndeterminate ?? false,
    }));

    // بدء التزايد التلقائي (لـ Indeterminate)
    if (options.isIndeterminate) {
      this.startIndeterminateAnimation();
    }
  }

  /**
   * تحديث Progress
   */
  set(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    this._state.update((state) => ({
      ...state,
      progress: clampedProgress,
      isIndeterminate: false,
    }));
  }

  /**
   * زيادة Progress بمقدار معين
   */
  increment(amount: number = 10): void {
    this._state.update((state) => ({
      ...state,
      progress: Math.min(100, state.progress + amount),
      isIndeterminate: false,
    }));
  }

  /**
   * إكمال Progress بـ Animation
   */
  async complete(delay: number = 300): Promise<void> {
    this.stopIndeterminateAnimation();

    // الوصول إلى 100%
    this._state.update((state) => ({
      ...state,
      progress: 100,
      isIndeterminate: false,
    }));

    // انتظار ثم إخفاء
    await new Promise((resolve) => setTimeout(resolve, delay));
    this.hide();
  }

  /**
   * إخفاء Progress Bar
   */
  hide(): void {
    this.stopIndeterminateAnimation();
    this._state.update((state) => ({
      ...state,
      isVisible: false,
      progress: 0,
    }));
  }

  /**
   * تشغيل أثناء عملية معينة
   */
  async withProgress<T>(
    operation: () => Promise<T>,
    options: {
      simulateProgress?: boolean;
      onProgress?: (progress: number) => void;
    } = {},
  ): Promise<T> {
    this.start({ isIndeterminate: !options.simulateProgress });

    if (options.simulateProgress) {
      this.startProgressSimulation();
    }

    try {
      const result = await operation();
      await this.complete();
      return result;
    } catch (error) {
      this.hide();
      throw error;
    }
  }

  /**
   * بدء Animation للـ Indeterminate
   */
  private startIndeterminateAnimation(): void {
    if (!this.isBrowser) return;

    this.stopIndeterminateAnimation();

    let progress = 0;
    let direction = 1;

    const animate = () => {
      progress += direction * 2;

      if (progress >= 90) {
        direction = -1;
      } else if (progress <= 10) {
        direction = 1;
      }

      this._state.update((state) => ({
        ...state,
        progress,
      }));

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * محاكاة Progress تدريجي
   */
  private startProgressSimulation(): void {
    if (!this.isBrowser) return;

    this.incrementInterval = setInterval(() => {
      const currentProgress = this._state().progress;

      if (currentProgress < 30) {
        this.increment(10);
      } else if (currentProgress < 60) {
        this.increment(5);
      } else if (currentProgress < 80) {
        this.increment(2);
      } else if (currentProgress < 90) {
        this.increment(0.5);
      }
      // يتوقف عند 90% وينتظر complete()
    }, 200);
  }

  /**
   * إيقاف Animation
   */
  private stopIndeterminateAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.incrementInterval !== null) {
      clearInterval(this.incrementInterval);
      this.incrementInterval = null;
    }
  }

  /**
   * تغيير اللون
   */
  setColor(color: string): void {
    this._state.update((state) => ({
      ...state,
      color,
    }));
  }

  /**
   * تغيير النوع
   */
  setType(type: ProgressBarType): void {
    this._state.update((state) => ({
      ...state,
      type,
    }));
  }

  /**
   * الحصول على CSS Styles للـ Progress Bar
   */
  getProgressBarStyles(): Record<string, string> {
    const state = this._state();
    return {
      '--progress-width': `${state.progress}%`,
      '--progress-color': state.color,
      '--progress-visibility': state.isVisible ? 'visible' : 'hidden',
      '--progress-opacity': state.isVisible ? '1' : '0',
    };
  }
}
