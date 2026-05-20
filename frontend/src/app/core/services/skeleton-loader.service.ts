import { Injectable, signal, computed } from '@angular/core';

/**
 * 💀 Skeleton Loader Service
 * خدمة عرض هيكل التحميل أثناء انتظار البيانات
 */
@Injectable({
  providedIn: 'root',
})
export class SkeletonLoaderService {
  // حالة التحميل العامة
  private _isLoading = signal<boolean>(false);
  private _loadingComponents = signal<Set<string>>(new Set());

  // Signals للقراءة فقط
  readonly isLoading = computed(() => this._isLoading());
  readonly loadingComponents = computed(() => this._loadingComponents());

  // خريطة لتتبع حالة التحميل لكل مكون
  private componentLoadingState: Map<string, boolean> = new Map();

  /**
   * بدء عرض الـ Skeleton Loader
   */
  show(componentId?: string): void {
    this._isLoading.set(true);

    if (componentId) {
      this.componentLoadingState.set(componentId, true);
      this._loadingComponents.update((components) => {
        const newSet = new Set(components);
        newSet.add(componentId);
        return newSet;
      });
    }
  }

  /**
   * إخفاء الـ Skeleton Loader
   */
  hide(componentId?: string): void {
    if (componentId) {
      this.componentLoadingState.set(componentId, false);
      this._loadingComponents.update((components) => {
        const newSet = new Set(components);
        newSet.delete(componentId);
        return newSet;
      });

      // إخفاء الحالة العامة إذا لم يكن هناك مكونات تحمل
      if (this._loadingComponents().size === 0) {
        this._isLoading.set(false);
      }
    } else {
      this._isLoading.set(false);
      this.componentLoadingState.clear();
      this._loadingComponents.set(new Set());
    }
  }

  /**
   * التحقق من حالة التحميل لمكون معين
   */
  isComponentLoading(componentId: string): boolean {
    return this.componentLoadingState.get(componentId) || false;
  }

  /**
   * عرض Skeleton مع مدة زمنية محددة
   */
  showWithDelay(componentId: string, duration: number = 1000): Promise<void> {
    this.show(componentId);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.hide(componentId);
        resolve();
      }, duration);
    });
  }

  /**
   * تنفيذ عملية مع عرض Skeleton تلقائياً
   */
  async withLoading<T>(
    componentId: string,
    operation: () => Promise<T>,
    minDuration: number = 500,
  ): Promise<T> {
    this.show(componentId);
    const startTime = Date.now();

    try {
      const result = await operation();

      // التأكد من عرض الـ Skeleton لمدة minimum
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      return result;
    } finally {
      this.hide(componentId);
    }
  }

  /**
   * إعادة تعيين كل حالات التحميل
   */
  reset(): void {
    this._isLoading.set(false);
    this._loadingComponents.set(new Set());
    this.componentLoadingState.clear();
  }
}

/**
 * أنواع الـ Skeleton المتاحة
 */
export type SkeletonType =
  | 'text'
  | 'title'
  | 'avatar'
  | 'thumbnail'
  | 'card'
  | 'list'
  | 'table'
  | 'paragraph';

/**
 * إعدادات الـ Skeleton
 */
export interface SkeletonConfig {
  type: SkeletonType;
  count?: number;
  width?: string;
  height?: string;
  animated?: boolean;
  rounded?: boolean;
}
