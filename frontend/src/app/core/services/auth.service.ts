import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClientService } from './api-client.service';
import { StateStoreService } from './state-store.service';
import { Observable, BehaviorSubject, tap, catchError, of, map, switchMap } from 'rxjs';

interface UserProfile {
  bio?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  country?: string;
  city?: string;
  education?: string;
  occupation?: string;
}

interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

interface UserSubscription {
  plan?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'expired' | 'cancelled';
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  permissions: string[];
  avatar?: string;
  isEmailVerified: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
  subscription?: UserSubscription;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface LocalAuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'teacher' | 'student';
  permissions: string[];
  isEmailVerified: boolean;
  avatar?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(ApiClientService);
  private stateStore = inject(StateStoreService);
  private router = inject(Router);

  // State
  private authStore = this.stateStore.createStore<AuthState>({
    key: 'auth',
    defaultValue: {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
    },
    persist: true,
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 يوم
  });

  // Signals
  public user = computed(() => this.authStore().user);
  public isAuthenticated = computed(() => this.authStore().isAuthenticated);
  public isLoading = computed(() => this.authStore().isLoading);
  public accessToken = computed(() => this.authStore().accessToken);

  // التحقق من الصلاحيات
  public hasRole = (role: string) => computed(() => this.user()?.role === role);
  public hasPermission = (permission: string) =>
    computed(
      () =>
        this.user()?.permissions.includes(permission) ||
        this.user()?.permissions.includes('*') ||
        this.user()?.role === 'super_admin',
    );

  constructor() {
    // التحقق من صحة الـ token عند بدء التطبيق
    this.checkAuthStatus();
  }

  /**
   * تسجيل الدخول
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.setLoading(true);

    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.setAuthState(response);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        throw error;
      }),
    );
  }

  /**
   * تسجيل دخول الأدمن - يستخدم endpoint خاص
   */
  adminLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    this.setLoading(true);

    return this.api.post<AuthResponse>('/auth/admin/login', credentials).pipe(
      tap((response) => {
        this.setAdminAuthState(response);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        throw error;
      }),
    );
  }

  /**
   * تعيين حالة مصادقة الأدمن
   */
  private setAdminAuthState(response: AuthResponse): void {
    // تخزين في localStorage للـ guards
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('adminUser', JSON.stringify(response.user));

    this.authStore.set({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  /**
   * التسجيل
   */
  register(data: RegisterData): Observable<AuthResponse> {
    this.setLoading(true);

    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap((response) => {
        this.setAuthState(response);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        throw error;
      }),
    );
  }

  /**
   * تسجيل الخروج
   */
  logout(): Observable<void> {
    const refreshToken = this.authStore().refreshToken;

    return this.api.post<void>('/auth/logout', { refreshToken }).pipe(
      tap(() => this.clearAuthState()),
      catchError(() => {
        this.clearAuthState();
        return of(undefined);
      }),
    );
  }

  /**
   * تسجيل الخروج من جميع الأجهزة
   */
  logoutAll(): Observable<void> {
    return this.api.post<void>('/auth/logout-all', {}).pipe(tap(() => this.clearAuthState()));
  }

  /**
   * تحديث الـ Token
   */
  refreshAccessToken(): Observable<{ accessToken: string; refreshToken: string } | null> {
    const refreshToken = this.authStore().refreshToken;

    if (!refreshToken) {
      return of(null);
    }

    return this.api
      .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
      .pipe(
        tap((response) => {
          this.authStore.update((state) => ({
            ...state,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          }));
        }),
        catchError(() => {
          this.clearAuthState();
          return of(null);
        }),
      );
  }

  /**
   * التحقق من حالة المصادقة
   */
  private checkAuthStatus(): void {
    const state = this.authStore();

    if (state.accessToken) {
      // التحقق من صحة الـ token
      this.api
        .get<User>('/auth/me')
        .pipe(
          tap((user) => {
            this.authStore.update((s) => ({
              ...s,
              user,
              isAuthenticated: true,
              isLoading: false,
            }));
          }),
          catchError(() => {
            // الـ token منتهي — نحاول نجدده بالـ refresh token
            const refreshToken = this.authStore().refreshToken;
            if (refreshToken) {
              return this.api
                .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
                  refreshToken,
                })
                .pipe(
                  tap((res) => {
                    this.authStore.update((s) => ({
                      ...s,
                      accessToken: res.accessToken,
                      refreshToken: res.refreshToken,
                    }));
                  }),
                  // بعد التجديد نجيب بيانات اليوزر تاني
                  switchMap(() =>
                    this.api.get<User>('/auth/me').pipe(
                      tap((user) => {
                        this.authStore.update((s) => ({
                          ...s,
                          user,
                          isAuthenticated: true,
                          isLoading: false,
                        }));
                      }),
                    ),
                  ),
                  catchError(() => {
                    this.clearAuthState();
                    return of(null);
                  }),
                );
            }
            this.clearAuthState();
            return of(null);
          }),
        )
        .subscribe();
    } else {
      this.setLoading(false);
    }
  }

  /**
   * تعيين حالة المصادقة
   */
  private setAuthState(response: AuthResponse): void {
    this.authStore.set({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  /**
   * مسح حالة المصادقة
   */
  private clearAuthState(): void {
    this.authStore.set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // مسح بيانات localStorage الخاصة بالأدمن
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminUser');
  }

  /**
   * تعيين حالة التحميل
   */
  private setLoading(isLoading: boolean): void {
    this.authStore.update((state) => ({ ...state, isLoading }));
  }

  /**
   * تعيين جلسة محلية (للتجربة بدون API)
   */
  setLocalAuth(user: LocalAuthUser): void {
    const accessToken = 'local-access-token-' + Date.now();
    const refreshToken = 'local-refresh-token-' + Date.now();

    // تخزين في localStorage للـ guards
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('adminUser', JSON.stringify(user));

    // تحديث الـ store
    this.authStore.set({
      user: user as User,
      accessToken: accessToken,
      refreshToken: refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  /**
   * طلب إعادة تعيين كلمة المرور
   */
  forgotPassword(email: string): Observable<void> {
    return this.api.post<void>('/auth/forgot-password', { email });
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  resetPassword(token: string, password: string): Observable<void> {
    return this.api.post<void>('/auth/reset-password', { token, password });
  }

  /**
   * التحقق من البريد الإلكتروني
   */
  verifyEmail(token: string): Observable<void> {
    return this.api.post<void>('/auth/verify-email', { token });
  }

  /**
   * إعادة إرسال رمز التحقق
   */
  resendVerification(): Observable<void> {
    return this.api.post<void>('/auth/resend-verification', {});
  }

  /**
   * تحديث الملف الشخصي
   */
  updateProfile(data: Partial<User>): Observable<User> {
    return this.api.patch<User>('/auth/profile', data).pipe(
      tap((user) => {
        this.authStore.update((state) => ({ ...state, user }));
      }),
    );
  }

  /**
   * تغيير كلمة المرور
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.api.post<void>('/auth/change-password', { currentPassword, newPassword });
  }

  /**
   * الحصول على بيانات المسؤول
   */
  getAdminData(): User | null {
    const user = this.user();
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      return user;
    }
    return null;
  }
}
