import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject, takeUntil } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SessionInfo {
  email: string;
  expiresAt: Date;
  remainingMinutes: number;
  remainingSeconds: number;
  sessionId: string;
  canExtend: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SessionTimerService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Signals
  readonly sessionInfo = signal<SessionInfo | null>(null);
  readonly isSessionActive = signal<boolean>(false);
  readonly remainingTime = signal<string>('--:--');
  readonly warningShown = signal<boolean>(false);

  // Session expiry time (will be fetched from backend)
  private sessionExpiresAt: number | null = null;
  private currentSessionId: string | null = null;

  // Computed
  readonly isExpiringSoon = computed(() => {
    const info = this.sessionInfo();
    if (!info) return false;
    return info.remainingMinutes < 1; // آخر دقيقة
  });

  private monitoringApiUrl = `${environment.apiUrl}/monitoring`;

  constructor() {
    this.initializeTimer();
    this.initSession();
  }

  /**
   * Initialize session from backend
   */
  private initSession(): void {
    const token = this.getToken();
    if (token) {
      this.fetchSessionFromBackend();
    }
  }

  /**
   * Fetch session info from backend
   */
  fetchSessionFromBackend(): void {
    const token = this.getToken();
    if (!token) {
      this.isSessionActive.set(false);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<{
        success: boolean;
        data: {
          sessionId: string;
          expiresAt: string;
          remainingMinutes: number;
          remainingSeconds: number;
        };
      }>(`${this.monitoringApiUrl}/my-session`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success && response.data.sessionId) {
            this.sessionExpiresAt = new Date(response.data.expiresAt).getTime();
            this.currentSessionId = response.data.sessionId;
            this.isSessionActive.set(true);
            localStorage.setItem('sessionExpiresAt', this.sessionExpiresAt.toString());
            localStorage.setItem('currentSessionId', this.currentSessionId);
          }
        },
        error: (err) => {
          console.warn('Failed to fetch session from backend:', err);
          // Fallback to stored values
          const stored = localStorage.getItem('sessionExpiresAt');
          if (stored) {
            this.sessionExpiresAt = parseInt(stored, 10);
            this.currentSessionId = localStorage.getItem('currentSessionId');
            this.isSessionActive.set(true);
          }
        },
      });
  }

  /**
   * Start a new local session (called after login)
   */
  startLocalSession(): void {
    // جلب الوقت من الـ Backend
    this.fetchSessionFromBackend();
  }

  /**
   * Force restart session (used after login)
   */
  forceRestartSession(): void {
    this.fetchSessionFromBackend();
    this.warningShown.set(false);
  }

  /**
   * بدء Timer
   */
  private initializeTimer(): void {
    // تحديث كل ثانية
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateRemainingTime();
      });

    // جلب معلومات الجلسة كل 30 ثانية (اختياري)
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Optional: sync with backend
        // this.refreshSessionInfo();
      });
  }

  /**
   * جلب معلومات الجلسة من Backend
   */
  refreshSessionInfo(): void {
    this.fetchSessionFromBackend();
  }

  /**
   * تحديث الوقت المتبقي
   */
  private updateRemainingTime(): void {
    // استخدام الوقت من الـ Backend
    if (this.sessionExpiresAt) {
      const now = Date.now();
      const diff = this.sessionExpiresAt - now;

      if (diff <= 0) {
        this.remainingTime.set('00:00');
        this.handleSessionExpired();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      // Update session info signal
      this.sessionInfo.update((current) => ({
        email: current?.email || '',
        expiresAt: new Date(this.sessionExpiresAt!),
        remainingMinutes: minutes,
        remainingSeconds: seconds,
        sessionId: this.currentSessionId || 'local',
        canExtend: true,
      }));

      this.remainingTime.set(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );

      // Warning at 30 seconds
      if (minutes === 0 && seconds === 30 && !this.warningShown()) {
        this.showExpiryWarning();
        this.warningShown.set(true);
      }
      return;
    }

    // Fallback: try to get from localStorage
    const stored = localStorage.getItem('sessionExpiresAt');
    if (stored) {
      this.sessionExpiresAt = parseInt(stored, 10);
      this.currentSessionId = localStorage.getItem('currentSessionId');
      return;
    }

    this.remainingTime.set('--:--');
  }

  /**
   * زيادة مدة الجلسة - تمديد من الـ Backend
   */
  extendSession(additionalMinutes: number = 15): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.currentSessionId) {
        resolve(false);
        return;
      }

      const token = this.getToken();
      if (!token) {
        resolve(false);
        return;
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http
        .post<{
          success: boolean;
          data: {
            sessionId: string;
            newExpiresAt: string;
            remainingMinutes: number;
          };
        }>(
          `${this.monitoringApiUrl}/extend-session`,
          {
            sessionId: this.currentSessionId,
            additionalMinutes,
          },
          { headers },
        )
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              // تحديث الوقت المحلي
              this.sessionExpiresAt = new Date(response.data.newExpiresAt).getTime();
              localStorage.setItem('sessionExpiresAt', this.sessionExpiresAt.toString());
              this.warningShown.set(false);
              resolve(true);
            } else {
              resolve(false);
            }
          },
          error: () => {
            resolve(false);
          },
        });
    });
  }

  /**
   * معالجة انتهاء الجلسة
   */
  private handleSessionExpired(): void {
    this.isSessionActive.set(false);
    this.sessionExpiresAt = null;
    this.currentSessionId = null;
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('currentSessionId');
    alert('⏰ انتهت جلستك! سيتم تسجيل الخروج تلقائياً.');

    // تسجيل الخروج
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    this.router.navigate(['/admin/login']);
  }

  /**
   * عرض تحذير انتهاء الجلسة
   */
  private showExpiryWarning(): void {
    // يمكن استبدالها بـ Toast notification
    console.warn('⚠️ جلستك ستنتهي خلال 30 ثانية!');
  }

  /**
   * الحصول على Token
   */
  private getToken(): string | null {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }

  /**
   * Reset session on logout
   */
  clearSession(): void {
    this.sessionExpiresAt = null;
    this.currentSessionId = null;
    this.isSessionActive.set(false);
    this.sessionInfo.set(null);
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('currentSessionId');
  }

  /**
   * Get current session ID (for extending from monitoring page)
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Update session expiry from external source (like monitoring page)
   */
  updateSessionExpiry(newExpiresAt: Date): void {
    this.sessionExpiresAt = newExpiresAt.getTime();
    localStorage.setItem('sessionExpiresAt', this.sessionExpiresAt.toString());
    this.warningShown.set(false);
  }

  /**
   * تنظيف
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
