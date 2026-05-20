import { Injectable, signal, computed, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * تكوين Virtual Scroll
 */
export interface HomeVirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
  loadMoreThreshold?: number;
}

/**
 * حالة Virtual Scroll
 */
export interface HomeVirtualScrollState<T> {
  allItems: T[];
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
  isLoadingMore: boolean;
  hasMore: boolean;
}

/**
 * 📜 Home Page Virtual Scroll Service
 * خدمة التمرير الافتراضي لصفحة الهوم
 */
@Injectable()
export class HomeVirtualScrollService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // تكوين افتراضي
  private defaultConfig: HomeVirtualScrollConfig = {
    itemHeight: 200,
    containerHeight: 800,
    bufferSize: 3,
    loadMoreThreshold: 0.8,
  };

  // Scroll listeners للتنظيف
  private scrollListeners: Map<HTMLElement, () => void> = new Map();

  /**
   * إنشاء حالة Virtual Scroll جديدة
   */
  createState<T>(
    items: T[],
    config: Partial<HomeVirtualScrollConfig> = {},
  ): HomeVirtualScrollState<T> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const { itemHeight, containerHeight, bufferSize = 3 } = mergedConfig;

    const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize * 2;
    const endIndex = Math.min(visibleCount, items.length);

    return {
      allItems: items,
      visibleItems: items.slice(0, endIndex),
      startIndex: 0,
      endIndex,
      offsetY: 0,
      totalHeight: items.length * itemHeight,
      isLoadingMore: false,
      hasMore: true,
    };
  }

  /**
   * إنشاء Signal-based Virtual Scroll
   */
  createVirtualScrollSignal<T>(initialItems: T[], config: Partial<HomeVirtualScrollConfig> = {}) {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const state = signal(this.createState(initialItems, mergedConfig));

    return {
      state: state.asReadonly(),
      visibleItems: computed(() => state().visibleItems),
      totalHeight: computed(() => state().totalHeight),
      offsetY: computed(() => state().offsetY),
      isLoadingMore: computed(() => state().isLoadingMore),
      hasMore: computed(() => state().hasMore),

      // Methods
      onScroll: (scrollTop: number) => {
        state.update((s) => this.updateOnScroll(s, scrollTop, mergedConfig));
      },
      updateItems: (items: T[]) => {
        state.update((s) => this.updateItems(s, items, mergedConfig));
      },
      appendItems: (items: T[]) => {
        state.update((s) => this.appendItems(s, items, mergedConfig));
      },
      setLoadingMore: (loading: boolean) => {
        state.update((s) => ({ ...s, isLoadingMore: loading }));
      },
      setHasMore: (hasMore: boolean) => {
        state.update((s) => ({ ...s, hasMore }));
      },
      reset: (items: T[] = []) => {
        state.set(this.createState(items, mergedConfig));
      },
    };
  }

  /**
   * تحديث الحالة عند التمرير
   */
  private updateOnScroll<T>(
    state: HomeVirtualScrollState<T>,
    scrollTop: number,
    config: HomeVirtualScrollConfig,
  ): HomeVirtualScrollState<T> {
    const { itemHeight, containerHeight, bufferSize = 3 } = config;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize * 2;
    const endIndex = Math.min(startIndex + visibleCount, state.allItems.length);

    return {
      ...state,
      visibleItems: state.allItems.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight,
    };
  }

  /**
   * تحديث العناصر
   */
  private updateItems<T>(
    state: HomeVirtualScrollState<T>,
    newItems: T[],
    config: HomeVirtualScrollConfig,
  ): HomeVirtualScrollState<T> {
    const newState = this.createState(newItems, config);
    return {
      ...newState,
      startIndex: state.startIndex,
      endIndex: Math.min(state.endIndex, newItems.length),
      visibleItems: newItems.slice(state.startIndex, Math.min(state.endIndex, newItems.length)),
    };
  }

  /**
   * إضافة عناصر جديدة (Infinite Scroll)
   */
  private appendItems<T>(
    state: HomeVirtualScrollState<T>,
    newItems: T[],
    config: HomeVirtualScrollConfig,
  ): HomeVirtualScrollState<T> {
    const allItems = [...state.allItems, ...newItems];
    return {
      ...state,
      allItems,
      totalHeight: allItems.length * config.itemHeight,
      isLoadingMore: false,
    };
  }

  /**
   * ربط Container بـ Virtual Scroll
   */
  attachScrollListener(
    container: HTMLElement,
    onScroll: (scrollTop: number) => void,
    onLoadMore?: () => void,
    config: Partial<HomeVirtualScrollConfig> = {},
  ): void {
    if (!this.isBrowser) return;

    const mergedConfig = { ...this.defaultConfig, ...config };
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;

          // تحديث الـ Virtual Scroll
          onScroll(scrollTop);

          // التحقق من الحاجة لتحميل المزيد
          if (onLoadMore) {
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
            if (scrollPercentage >= (mergedConfig.loadMoreThreshold || 0.8)) {
              onLoadMore();
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    this.scrollListeners.set(container, handleScroll);
  }

  /**
   * إزالة Scroll Listener
   */
  detachScrollListener(container: HTMLElement): void {
    const handler = this.scrollListeners.get(container);
    if (handler) {
      container.removeEventListener('scroll', handler);
      this.scrollListeners.delete(container);
    }
  }

  /**
   * تفعيل Smooth Scroll للـ Container
   */
  enableSmoothScroll(container: HTMLElement): void {
    if (!this.isBrowser) return;

    container.style.scrollBehavior = 'smooth';
    container.style.overscrollBehavior = 'contain';
    // webkitOverflowScrolling للمتصفحات القديمة
    (container.style as any).webkitOverflowScrolling = 'touch';
  }

  /**
   * التمرير إلى عنصر معين
   */
  scrollToIndex(
    container: HTMLElement,
    index: number,
    itemHeight: number,
    behavior: ScrollBehavior = 'smooth',
  ): void {
    if (!this.isBrowser) return;

    const targetOffset = index * itemHeight;
    container.scrollTo({
      top: targetOffset,
      behavior,
    });
  }

  ngOnDestroy(): void {
    // تنظيف كل الـ Scroll Listeners
    this.scrollListeners.forEach((handler, container) => {
      container.removeEventListener('scroll', handler);
    });
    this.scrollListeners.clear();
  }
}
