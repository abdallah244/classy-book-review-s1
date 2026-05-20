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
 * 📊 Admin Progress Bar Service
 * خدمة شريط التحميل لصفحات الأدمن
 */
@Injectable()
export class AdminProgressBarService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // حالة Progress Bar
  private _state = signal<ProgressState>({
    isVisible: false,
    progress: 0,
    type: 'linear',
    color: 'var(--admin-primary, #6366f1)',
    isIndeterminate: false,
  });

  // Signals للقراءة
  readonly isVisible = computed(() => this._state().isVisible);
  readonly progress = computed(() => this._state().progress);
  readonly type = computed(() => this._state().type);
  readonly color = computed(() => this._state().color);
  readonly isIndeterminate = computed(() => this._state().isIndeterminate);

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
   * زيادة Progress
   */
  increment(amount: number = 10): void {
    this._state.update((state) => ({
      ...state,
      progress: Math.min(100, state.progress + amount),
      isIndeterminate: false,
    }));
  }

  /**
   * إكمال Progress
   */
  async complete(delay: number = 300): Promise<void> {
    this.stopIndeterminateAnimation();

    this._state.update((state) => ({
      ...state,
      progress: 100,
      isIndeterminate: false,
    }));

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
  async withProgress<T>(operation: () => Promise<T>): Promise<T> {
    this.start({ isIndeterminate: true });

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
   * الحصول على CSS Styles
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
