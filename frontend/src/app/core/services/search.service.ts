import { Injectable, inject, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import {
  Observable,
  map,
  catchError,
  of,
  tap,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs';
import { Subject } from 'rxjs';

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  query: string;
}

interface SearchFilters {
  category?: string;
  level?: string;
  price?: { min?: number; max?: number };
  rating?: number;
  duration?: { min?: number; max?: number };
  language?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SearchSuggestion {
  text: string;
  type: 'query' | 'course' | 'teacher' | 'category';
  id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private api = inject(ApiClientService);

  // Signals
  public isSearching = signal(false);
  public recentSearches = signal<string[]>(this.loadRecentSearches());
  public suggestions = signal<SearchSuggestion[]>([]);

  // Subject للبحث الفوري
  private searchInput$ = new Subject<string>();

  constructor() {
    this.setupAutocomplete();
  }

  /**
   * البحث الأساسي
   */
  search<T>(
    endpoint: string,
    query: string,
    page = 1,
    limit = 20,
    filters?: SearchFilters,
  ): Observable<SearchResult<T>> {
    this.isSearching.set(true);
    this.saveRecentSearch(query);

    const params: Record<string, any> = {
      q: query,
      page,
      limit,
      ...this.flattenFilters(filters),
    };

    return this.api.get<SearchResult<T>>(`${endpoint}/search`, { params }).pipe(
      tap(() => this.isSearching.set(false)),
      catchError((error) => {
        this.isSearching.set(false);
        throw error;
      }),
    );
  }

  /**
   * البحث في الدورات
   */
  searchCourses(query: string, page = 1, filters?: SearchFilters): Observable<SearchResult<any>> {
    return this.search('/courses', query, page, 20, filters);
  }

  /**
   * البحث في المعلمين
   */
  searchTeachers(query: string, page = 1): Observable<SearchResult<any>> {
    return this.search('/teachers', query, page);
  }

  /**
   * البحث الشامل
   */
  globalSearch(query: string): Observable<{
    courses: any[];
    teachers: any[];
    categories: any[];
  }> {
    return this.api.get('/search/global', { params: { q: query } });
  }

  /**
   * البحث الاجتماعي الشامل
   */
  socialSearch(query: string, limit = 5): Observable<any> {
    return this.api.get('/social/search', { params: { q: query, limit } });
  }

  /**
   * الاقتراحات التلقائية
   */
  autocomplete(query: string): Observable<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return of([]);
    }

    return this.api
      .get<SearchSuggestion[]>('/search/autocomplete', {
        params: { q: query },
      })
      .pipe(catchError(() => of([])));
  }

  /**
   * إرسال نص للبحث الفوري
   */
  inputSearch(query: string): void {
    this.searchInput$.next(query);
  }

  /**
   * حفظ بحث حديث
   */
  private saveRecentSearch(query: string): void {
    if (!query.trim()) return;

    const recent = this.recentSearches();
    const filtered = recent.filter((s) => s !== query);
    const updated = [query, ...filtered].slice(0, 10);

    this.recentSearches.set(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  }

  /**
   * تحميل عمليات البحث الحديثة
   */
  private loadRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem('recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * مسح عمليات البحث الحديثة
   */
  clearRecentSearches(): void {
    this.recentSearches.set([]);
    localStorage.removeItem('recent_searches');
  }

  /**
   * إعداد الاقتراحات التلقائية
   */
  private setupAutocomplete(): void {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.autocomplete(query)),
      )
      .subscribe((suggestions) => {
        this.suggestions.set(suggestions);
      });
  }

  /**
   * تسطيح الفلاتر
   */
  private flattenFilters(filters?: SearchFilters): Record<string, any> {
    if (!filters) return {};

    const flat: Record<string, any> = {};

    if (filters.category) flat['category'] = filters.category;
    if (filters.level) flat['level'] = filters.level;
    if (filters.price?.min !== undefined) flat['price_min'] = filters.price.min;
    if (filters.price?.max !== undefined) flat['price_max'] = filters.price.max;
    if (filters.rating) flat['rating'] = filters.rating;
    if (filters.duration?.min !== undefined) flat['duration_min'] = filters.duration.min;
    if (filters.duration?.max !== undefined) flat['duration_max'] = filters.duration.max;
    if (filters.language) flat['language'] = filters.language;
    if (filters.sortBy) flat['sort'] = filters.sortBy;
    if (filters.sortOrder) flat['order'] = filters.sortOrder;

    return flat;
  }

  /**
   * البحث المتقدم مع facets
   */
  advancedSearch<T>(
    query: string,
    facets: string[],
    filters?: SearchFilters,
  ): Observable<{
    results: SearchResult<T>;
    facets: Record<string, { value: string; count: number }[]>;
  }> {
    return this.api.get('/search/advanced', {
      params: {
        q: query,
        facets: facets.join(','),
        ...this.flattenFilters(filters),
      },
    });
  }
}
