import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface ScrollConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
  threshold?: number;
}

interface VirtualScrollState<T> {
  items: T[];
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

@Injectable({
  providedIn: 'root',
})
export class VirtualScrollService {
  private platformId = inject(PLATFORM_ID);

  /**
   * إنشاء حالة التمرير الافتراضي
   */
  createVirtualScrollState<T>(allItems: T[], config: ScrollConfig): VirtualScrollState<T> {
    const { itemHeight, containerHeight, bufferSize = 5 } = config;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize * 2;

    return {
      items: allItems,
      visibleItems: allItems.slice(0, visibleCount),
      startIndex: 0,
      endIndex: Math.min(visibleCount, allItems.length),
      offsetY: 0,
      totalHeight: allItems.length * itemHeight,
    };
  }

  /**
   * تحديث عند التمرير
   */
  updateOnScroll<T>(
    state: VirtualScrollState<T>,
    scrollTop: number,
    config: ScrollConfig,
  ): VirtualScrollState<T> {
    const { itemHeight, containerHeight, bufferSize = 5 } = config;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize * 2;
    const endIndex = Math.min(startIndex + visibleCount, state.items.length);

    return {
      ...state,
      visibleItems: state.items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight,
    };
  }

  /**
   * تحديث العناصر
   */
  updateItems<T>(
    state: VirtualScrollState<T>,
    newItems: T[],
    config: ScrollConfig,
  ): VirtualScrollState<T> {
    return {
      ...state,
      items: newItems,
      totalHeight: newItems.length * config.itemHeight,
      visibleItems: newItems.slice(state.startIndex, state.endIndex),
    };
  }

  /**
   * إضافة عناصر (للتحميل اللانهائي)
   */
  appendItems<T>(
    state: VirtualScrollState<T>,
    newItems: T[],
    config: ScrollConfig,
  ): VirtualScrollState<T> {
    const allItems = [...state.items, ...newItems];
    return this.updateItems(state, allItems, config);
  }

  /**
   * إنشاء Signal للتمرير الافتراضي
   */
  createVirtualScrollSignal<T>(initialItems: T[], config: ScrollConfig) {
    const state = signal(this.createVirtualScrollState(initialItems, config));

    return {
      state: state.asReadonly(),
      onScroll: (scrollTop: number) => {
        state.update((s) => this.updateOnScroll(s, scrollTop, config));
      },
      setItems: (items: T[]) => {
        state.update((s) => this.updateItems(s, items, config));
      },
      appendItems: (items: T[]) => {
        state.update((s) => this.appendItems(s, items, config));
      },
      reset: () => {
        state.update((s) => ({
          ...s,
          startIndex: 0,
          endIndex: Math.min(
            Math.ceil(config.containerHeight / config.itemHeight) + 10,
            s.items.length,
          ),
          offsetY: 0,
          visibleItems: s.items.slice(
            0,
            Math.ceil(config.containerHeight / config.itemHeight) + 10,
          ),
        }));
      },
    };
  }

  /**
   * حساب الحجم الديناميكي
   */
  calculateDynamicHeight(items: { height: number }[]): {
    totalHeight: number;
    positions: number[];
  } {
    let totalHeight = 0;
    const positions: number[] = [];

    items.forEach((item) => {
      positions.push(totalHeight);
      totalHeight += item.height;
    });

    return { totalHeight, positions };
  }

  /**
   * البحث عن العنصر بالموقع
   */
  findIndexByPosition(positions: number[], scrollTop: number): number {
    // Binary search للأداء
    let low = 0;
    let high = positions.length - 1;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (positions[mid] < scrollTop) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return Math.max(0, low - 1);
  }
}
