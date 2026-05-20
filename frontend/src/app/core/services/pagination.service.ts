import { Injectable, inject, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable, tap } from 'rxjs';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  private api = inject(ApiClientService);

  /**
   * إنشاء حالة الصفحات
   */
  createPaginationState(limit = 20): ReturnType<typeof signal<PaginationState>> {
    return signal<PaginationState>({
      page: 1,
      limit,
      total: 0,
      pages: 0,
      hasNext: false,
      hasPrev: false,
      isLoading: false,
    });
  }

  /**
   * تحميل صفحة من البيانات
   */
  loadPage<T>(
    endpoint: string,
    state: ReturnType<typeof signal<PaginationState>>,
    page: number,
    params?: Record<string, any>,
  ): Observable<PaginatedResponse<T>> {
    state.update((s) => ({ ...s, isLoading: true }));

    return this.api
      .get<PaginatedResponse<T>>(endpoint, {
        params: {
          page,
          limit: state().limit,
          ...params,
        },
      })
      .pipe(
        tap((response) => {
          state.set({
            page: response.meta.page,
            limit: response.meta.limit,
            total: response.meta.total,
            pages: response.meta.pages,
            hasNext: response.meta.hasNext,
            hasPrev: response.meta.hasPrev,
            isLoading: false,
          });
        }),
      );
  }

  /**
   * الذهاب للصفحة التالية
   */
  nextPage<T>(
    endpoint: string,
    state: ReturnType<typeof signal<PaginationState>>,
    params?: Record<string, any>,
  ): Observable<PaginatedResponse<T>> | null {
    const current = state();
    if (!current.hasNext || current.isLoading) {
      return null;
    }
    return this.loadPage(endpoint, state, current.page + 1, params);
  }

  /**
   * الذهاب للصفحة السابقة
   */
  prevPage<T>(
    endpoint: string,
    state: ReturnType<typeof signal<PaginationState>>,
    params?: Record<string, any>,
  ): Observable<PaginatedResponse<T>> | null {
    const current = state();
    if (!current.hasPrev || current.isLoading) {
      return null;
    }
    return this.loadPage(endpoint, state, current.page - 1, params);
  }

  /**
   * الذهاب لصفحة معينة
   */
  goToPage<T>(
    endpoint: string,
    state: ReturnType<typeof signal<PaginationState>>,
    page: number,
    params?: Record<string, any>,
  ): Observable<PaginatedResponse<T>> | null {
    const current = state();
    if (page < 1 || page > current.pages || current.isLoading) {
      return null;
    }
    return this.loadPage(endpoint, state, page, params);
  }

  /**
   * تغيير عدد العناصر في الصفحة
   */
  setLimit<T>(
    endpoint: string,
    state: ReturnType<typeof signal<PaginationState>>,
    limit: number,
    params?: Record<string, any>,
  ): Observable<PaginatedResponse<T>> {
    state.update((s) => ({ ...s, limit }));
    return this.loadPage(endpoint, state, 1, params);
  }

  /**
   * الحصول على نطاق الصفحات للعرض
   */
  getPageRange(state: PaginationState, maxVisible = 5): number[] {
    const { page, pages } = state;

    if (pages <= maxVisible) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(pages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /**
   * حساب نطاق العناصر المعروضة
   */
  getDisplayRange(state: PaginationState): { from: number; to: number } {
    const { page, limit, total } = state;
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    return { from, to };
  }

  /**
   * التحميل اللانهائي
   */
  createInfiniteScroll<T>(endpoint: string, limit = 20) {
    const state = signal({
      items: [] as T[],
      page: 0,
      hasMore: true,
      isLoading: false,
      total: 0,
    });

    const loadMore = (params?: Record<string, any>) => {
      const current = state();
      if (!current.hasMore || current.isLoading) {
        return null;
      }

      state.update((s) => ({ ...s, isLoading: true }));

      return this.api
        .get<PaginatedResponse<T>>(endpoint, {
          params: {
            page: current.page + 1,
            limit,
            ...params,
          },
        })
        .pipe(
          tap((response) => {
            state.update((s) => ({
              items: [...s.items, ...response.data],
              page: response.meta.page,
              hasMore: response.meta.hasNext,
              isLoading: false,
              total: response.meta.total,
            }));
          }),
        );
    };

    const reset = () => {
      state.set({
        items: [],
        page: 0,
        hasMore: true,
        isLoading: false,
        total: 0,
      });
    };

    return {
      state: state.asReadonly(),
      loadMore,
      reset,
    };
  }
}
