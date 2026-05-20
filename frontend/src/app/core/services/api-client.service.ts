import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, timeout, map, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  withCredentials?: boolean;
  timeout?: number;
  retry?: number;
  cache?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    pages?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private pendingRequests = 0;

  /**
   * GET Request
   */
  get<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    return this.request<T>('GET', endpoint, null, options);
  }

  /**
   * POST Request
   */
  post<T>(endpoint: string, body: any, options: RequestOptions = {}): Observable<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT Request
   */
  put<T>(endpoint: string, body: any, options: RequestOptions = {}): Observable<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * PATCH Request
   */
  patch<T>(endpoint: string, body: any, options: RequestOptions = {}): Observable<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /**
   * DELETE Request
   */
  delete<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    return this.request<T>('DELETE', endpoint, null, options);
  }

  /**
   * Upload File
   */
  upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post<T>(endpoint, formData);
  }

  /**
   * Download File
   */
  download(endpoint: string, filename: string): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}${endpoint}`, {
        responseType: 'blob',
      })
      .pipe(
        map((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
          return blob;
        }),
      );
  }

  /**
   * Main Request Method
   */
  private request<T>(
    method: string,
    endpoint: string,
    body: any,
    options: RequestOptions,
  ): Observable<T> {
    this.startLoading();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(options.headers, body);
    const params = this.buildParams(options.params);

    let request$: Observable<any>;

    switch (method) {
      case 'GET':
        request$ = this.http.get(url, {
          headers,
          params,
          withCredentials: options.withCredentials,
        });
        break;
      case 'POST':
        request$ = this.http.post(url, body, {
          headers,
          params,
          withCredentials: options.withCredentials,
        });
        break;
      case 'PUT':
        request$ = this.http.put(url, body, {
          headers,
          params,
          withCredentials: options.withCredentials,
        });
        break;
      case 'PATCH':
        request$ = this.http.patch(url, body, {
          headers,
          params,
          withCredentials: options.withCredentials,
        });
        break;
      case 'DELETE':
        request$ = this.http.delete(url, {
          headers,
          params,
          withCredentials: options.withCredentials,
        });
        break;
      default:
        request$ = throwError(() => new Error(`Unsupported method: ${method}`));
    }

    return request$.pipe(
      timeout(options.timeout || 30000),
      retry(options.retry || 0),
      map((response: ApiResponse<T>) => response.data || (response as T)),
      catchError((error) => this.handleError(error)),
      finalize(() => this.stopLoading()),
    );
  }

  /**
   * Build Headers
   */
  private buildHeaders(customHeaders?: Record<string, string>, body?: any): HttpHeaders {
    const isFormData = body instanceof FormData;

    let headers = new HttpHeaders({
      Accept: 'application/json',
      'Accept-Language': 'ar',
    });

    // لا نضيف Content-Type للـ FormData — المتصفح يضيفها تلقائياً مع الـ boundary
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }

    // Add CSRF token if available
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers = headers.set('X-XSRF-TOKEN', csrfToken);
    }

    // Add custom headers
    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Build Query Params
   */
  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => {
              httpParams = httpParams.append(key, v.toString());
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return httpParams;
  }

  /**
   * Get CSRF Token from cookie
   */
  private getCsrfToken(): string | null {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Handle Errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'حدث خطأ غير متوقع';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      message = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          message = error.error?.message || 'بيانات غير صحيحة';
          break;
        case 401:
          message = 'يرجى تسجيل الدخول';
          break;
        case 403:
          message = 'ليس لديك صلاحية للوصول';
          break;
        case 404:
          message = 'المورد غير موجود';
          break;
        case 422:
          message = error.error?.message || 'خطأ في البيانات المدخلة';
          break;
        case 429:
          message = 'تم تجاوز عدد الطلبات المسموحة';
          break;
        case 500:
          message = 'خطأ في الخادم';
          break;
        case 503:
          message = 'الخدمة غير متاحة مؤقتاً';
          break;
      }
    }

    return throwError(() => ({ status: error.status, message, errors: error.error?.errors }));
  }

  /**
   * Loading State Management
   */
  private startLoading(): void {
    this.pendingRequests++;
    if (this.pendingRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  private stopLoading(): void {
    this.pendingRequests--;
    if (this.pendingRequests === 0) {
      this.loadingSubject.next(false);
    }
  }
}
