import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, forkJoin, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionTimerService } from '../../../core/services/session-timer.service';
import {
  WebSocketService,
  LoginAttemptEvent,
  AdminSession,
} from '../../../core/services/websocket.service';
import { MasterCodeService } from '../../../core/services/master-code.service';
import { ToastService } from '../../../core/services/toast.service';

// Interfaces
interface LoginAttempt {
  _id?: string;
  email: string;
  ipAddress: string;
  success: boolean;
  timestamp: Date;
  deviceInfo?: string;
  failureReason?: string;
  sessionId?: string;
}

interface BlockedIP {
  _id?: string;
  ipAddress: string;
  attempts: number;
  reason: string;
  blockedUntil: Date;
  permanent?: boolean;
}

interface SecurityMetrics {
  successfulLogins: number;
  failedLogins: number;
  blockedIPs: number;
  activeSessions: number;
}

// Translations interface
interface Translations {
  pageTitle: string;
  pageSubtitle: string;
  refresh: string;
  successfulLogins: string;
  failedAttempts: string;
  blockedIPs: string;
  activeSessions: string;
  recentLoginAttempts: string;
  attempts: string;
  email: string;
  ipAddress: string;
  status: string;
  reason: string;
  timestamp: string;
  sessionId: string;
  blockedIPAddresses: string;
  blocked: string;
  blockedUntil: string;
  actions: string;
  unblock: string;
  noLoginAttempts: string;
  noBlockedIPs: string;
  loading: string;
  // Admin Sessions
  activeAdminSessions: string;
  adminName: string;
  role: string;
  loginTime: string;
  expiresAt: string;
  remainingTime: string;
  extendSession: string;
  noActiveSessions: string;
  minutes: string;
  extendBy: string;
  sessionExtended: string;
}

@Component({
  selector: 'app-general-monitoring',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './general-monitoring.component.html',
  styleUrl: './general-monitoring.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralMonitoringComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private apiUrl = `${environment.apiUrl}/monitoring`;

  // Services
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  protected readonly sessionTimer = inject(SessionTimerService);
  protected readonly ws = inject(WebSocketService);
  protected readonly masterCode = inject(MasterCodeService);
  private readonly toast = inject(ToastService);

  // WebSocket connection status
  readonly wsConnected = this.ws.isConnected;

  // Language & Theme signals
  readonly currentLang = this.i18n.language;
  readonly currentTheme = this.theme.effectiveTheme;
  readonly currentDirection = this.i18n.direction;

  // Data signals
  readonly loading = signal<boolean>(true);
  readonly securityMetrics = signal<SecurityMetrics | null>(null);
  readonly loginAttempts = signal<LoginAttempt[]>([]);
  readonly blockedIPs = signal<BlockedIP[]>([]);
  readonly error = signal<string | null>(null);
  readonly adminVerified = signal<boolean>(false);

  // Admin Sessions signals
  readonly adminSessions = signal<AdminSession[]>([]);
  readonly extendingSession = signal<string | null>(null);
  readonly sessionExtendMinutes = signal<Record<string, number>>({});

  // Carousel pagination
  readonly currentPage = signal<number>(0);
  readonly itemsPerPage = 3;

  // Computed: current page attempts
  readonly currentPageAttempts = computed(() => {
    const attempts = this.loginAttempts();
    const start = this.currentPage() * this.itemsPerPage;
    return attempts.slice(start, start + this.itemsPerPage);
  });

  // Computed: total pages
  readonly totalPages = computed(() => {
    return Math.ceil(this.loginAttempts().length / this.itemsPerPage);
  });

  // Computed: pages array for pagination
  readonly pagesArray = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  });

  // ─── Threat Level Computations ───
  readonly threatScore = computed(() => {
    const m = this.securityMetrics();
    if (!m) return 0;
    const total = m.successfulLogins + m.failedLogins;
    if (total === 0) return 0;
    const failRate = m.failedLogins / total;
    const blockFactor = Math.min(m.blockedIPs * 10, 40);
    return Math.min(Math.round(failRate * 60 + blockFactor), 100);
  });

  readonly threatLevel = computed(() => {
    const s = this.threatScore();
    if (s <= 20) return 'low';
    if (s <= 50) return 'medium';
    if (s <= 75) return 'high';
    return 'critical';
  });

  readonly threatColor = computed(() => {
    const l = this.threatLevel();
    if (l === 'low') return '#10b981';
    if (l === 'medium') return '#f59e0b';
    if (l === 'high') return '#f97316';
    return '#ef4444';
  });

  readonly threatArc = computed(() => {
    const maxLen = 251; // π × 80 (semicircle arc length)
    const filled = (this.threatScore() / 100) * maxLen;
    return `${filled} ${maxLen}`;
  });

  readonly threatIcon = computed(() => {
    const l = this.threatLevel();
    if (l === 'low') return 'fa-solid fa-shield-check';
    if (l === 'medium') return 'fa-solid fa-shield-halved';
    if (l === 'high') return 'fa-solid fa-shield-exclamation';
    return 'fa-solid fa-skull-crossbones';
  });

  readonly threatLabel = computed(() => {
    const l = this.threatLevel();
    const ar = l === 'low' ? 'منخفض' : l === 'medium' ? 'متوسط' : l === 'high' ? 'مرتفع' : 'حرج';
    const en =
      l === 'low'
        ? 'Low Risk'
        : l === 'medium'
          ? 'Medium Risk'
          : l === 'high'
            ? 'High Risk'
            : 'Critical';
    return this.currentLang() === 'ar' ? ar : en;
  });

  // Translations - cached per language
  readonly t = computed(() => this.getTranslations());

  // Cached date formatter
  private dateFormatCache = new Map<string, string>();
  private lastCacheLang = '';

  constructor() {
    // Listen for real-time login attempts
    effect(() => {
      const newAttempt = this.ws.lastLoginAttempt();
      if (newAttempt) {
        this.addLoginAttempt(newAttempt);
      }
    });

    // Listen for real-time metrics updates
    effect(() => {
      const metrics = this.ws.securityMetrics();
      if (metrics) {
        this.securityMetrics.set(metrics);
      }
    });

    // Listen for IP blocked events
    effect(() => {
      const blocked = this.ws.lastIPBlocked();
      if (blocked) {
        this.loadBlockedIPs();
      }
    });

    // Listen for IP unblocked events
    effect(() => {
      const unblocked = this.ws.lastIPUnblocked();
      if (unblocked) {
        this.loadBlockedIPs();
      }
    });

    // Listen for admin sessions updates from WebSocket
    // فقط نستخدمه عند التحديث من الخادم، وليس عند التحديث المحلي
    effect(() => {
      const sessions = this.ws.adminSessions();
      if (sessions && sessions.length > 0) {
        // مقارنة بمعرفات الجلسات وليس العدد فقط
        const currentIds = this.adminSessions()
          .map((s) => s.sessionId)
          .sort()
          .join(',');
        const newIds = sessions
          .map((s) => s.sessionId)
          .sort()
          .join(',');
        if (newIds !== currentIds) {
          this.adminSessions.set(sessions);
        }
      }
    });

    // لا نحتاج effect منفصل للـ session extended لأننا نحدث محلياً في الـ HTTP response
  }

  ngOnInit(): void {
    // التحقق من صلاحيات الأدمن
    this.verifyAdminAccess();

    // استمرار الـ session timer (لا نعيد تشغيله)
    this.sessionTimer.startLocalSession();

    // الاتصال بـ WebSocket
    this.ws.connect();

    // التحقق من الماستر كود أولاً قبل تحميل البيانات
    this.verifyMasterCodeAndLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // قطع الاتصال بـ WebSocket
    this.ws.leaveMonitoring();

    // مسح الماستر كود session عند الخروج من الصفحة
    this.masterCode.clearSession();
  }

  /**
   * Verify master code then load data
   */
  private async verifyMasterCodeAndLoad(): Promise<void> {
    const isVerified = await this.masterCode.verifyMasterCode();
    if (!isVerified) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    this.loadAllData();
  }

  /**
   * Add new login attempt from WebSocket
   */
  private addLoginAttempt(event: LoginAttemptEvent): void {
    const attempt: LoginAttempt = {
      _id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      email: event.email,
      ipAddress: event.ipAddress,
      success: event.success,
      timestamp: new Date(event.timestamp),
      deviceInfo: event.deviceInfo,
      failureReason: event.failureReason,
      sessionId: event.sessionId,
    };

    const current = this.loginAttempts();
    this.loginAttempts.set([attempt, ...current].slice(0, 50));

    // Update metrics
    const metrics = this.securityMetrics();
    if (metrics) {
      this.securityMetrics.set({
        ...metrics,
        successfulLogins: event.success ? metrics.successfulLogins + 1 : metrics.successfulLogins,
        failedLogins: !event.success ? metrics.failedLogins + 1 : metrics.failedLogins,
      });
    }
  }

  /**
   * Load blocked IPs
   */
  private loadBlockedIPs(): void {
    const headers = this.getAuthHeaders();
    this.http
      .get<{ success: boolean; data: BlockedIP[] }>(`${this.apiUrl}/blocked-ips`, { headers })
      .pipe(catchError(() => of({ success: true, data: [] })))
      .subscribe((result) => {
        if (result.success) {
          this.blockedIPs.set(result.data);
        }
      });
  }

  /**
   * التحقق من صلاحيات الأدمن
   */
  private verifyAdminAccess(): void {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (!token) {
      console.warn('🔒 No access token - redirecting to login');
      this.router.navigate(['/admin/login']);
      return;
    }

    const adminData = this.auth.getAdminData();

    if (!adminData) {
      // محاولة التحقق من البيانات المخزنة
      const storedUser = localStorage.getItem('adminUser');
      if (!storedUser) {
        console.warn('🔒 No admin data - redirecting to login');
        this.router.navigate(['/admin/login']);
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          console.warn('🔒 User is not admin');
          this.router.navigate(['/']);
          return;
        }
      } catch {
        this.router.navigate(['/admin/login']);
        return;
      }
    }

    this.adminVerified.set(true);
  }

  /**
   * Get HTTP headers with authorization token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Load all monitoring data from API
   */
  loadAllData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dateFormatCache.clear();

    const headers = this.getAuthHeaders();

    forkJoin({
      metrics: this.http
        .get<{ success: boolean; data: SecurityMetrics }>(`${this.apiUrl}/security-metrics`, {
          headers,
        })
        .pipe(
          catchError(() =>
            of({
              success: true,
              data: { successfulLogins: 0, failedLogins: 0, blockedIPs: 0, activeSessions: 1 },
            }),
          ),
        ),
      attempts: this.http
        .get<{ success: boolean; data: LoginAttempt[] }>(`${this.apiUrl}/login-attempts`, {
          headers,
        })
        .pipe(catchError(() => of({ success: true, data: [] }))),
      blocked: this.http
        .get<{ success: boolean; data: BlockedIP[] }>(`${this.apiUrl}/blocked-ips`, { headers })
        .pipe(catchError(() => of({ success: true, data: [] }))),
      adminSessions: this.http
        .get<{ success: boolean; data: AdminSession[] }>(`${this.apiUrl}/admin-sessions`, {
          headers,
        })
        .pipe(catchError(() => of({ success: true, data: [] }))),
    }).subscribe({
      next: (results) => {
        if (results.metrics.success) {
          this.securityMetrics.set(results.metrics.data);
        }
        if (results.attempts.success) {
          this.loginAttempts.set(results.attempts.data);
        }
        if (results.blocked.success) {
          this.blockedIPs.set(results.blocked.data);
        }
        if (results.adminSessions.success) {
          this.adminSessions.set(results.adminSessions.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load monitoring data:', err);
        this.error.set(this.currentLang() === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data');
        this.loading.set(false);
      },
    });
  }

  /**
   * Load admin sessions
   */
  loadAdminSessions(): void {
    const headers = this.getAuthHeaders();
    this.http
      .get<{ success: boolean; data: AdminSession[] }>(`${this.apiUrl}/admin-sessions`, {
        headers,
      })
      .pipe(catchError(() => of({ success: true, data: [] })))
      .subscribe((result) => {
        if (result.success) {
          this.adminSessions.set(result.data);
        }
      });
  }

  /**
   * Extend admin session
   */
  extendSession(sessionId: string, additionalMinutes: number = 30): void {
    this.extendingSession.set(sessionId);
    const headers = this.getAuthHeaders();

    this.http
      .post<{
        success: boolean;
        message: string;
        data: {
          sessionId: string;
          email: string;
          newExpiresAt: string;
          remainingMinutes: number;
        };
      }>(`${this.apiUrl}/extend-session`, { sessionId, additionalMinutes }, { headers })
      .subscribe({
        next: (result) => {
          this.extendingSession.set(null);
          if (result.success && result.data) {
            // تحديث الجلسة محلياً فوراً
            const current = this.adminSessions();
            const updated = current.map((s) =>
              s.sessionId === sessionId
                ? {
                    ...s,
                    expiresAt: new Date(result.data.newExpiresAt),
                    remainingMinutes: result.data.remainingMinutes,
                  }
                : s,
            );
            this.adminSessions.set(updated);

            // تحديث الـ session timer إذا كانت نفس الجلسة
            const mySessionId = this.sessionTimer.getCurrentSessionId();
            if (sessionId === mySessionId) {
              this.sessionTimer.updateSessionExpiry(new Date(result.data.newExpiresAt));
            }

            const successMsg =
              this.currentLang() === 'ar'
                ? `تم تمديد الجلسة ${additionalMinutes} دقيقة`
                : `Session extended by ${additionalMinutes} minutes`;
            this.toast.success(successMsg);
          } else {
            this.toast.error(
              this.currentLang() === 'ar' ? 'فشل تمديد الجلسة' : 'Failed to extend session',
            );
          }
        },
        error: (err) => {
          console.error('Failed to extend session:', err);
          this.extendingSession.set(null);
          this.toast.error(
            this.currentLang() === 'ar' ? 'فشل تمديد الجلسة' : 'Failed to extend session',
          );
        },
      });
  }

  /**
   * Format remaining time
   */
  formatRemainingTime(minutes: number): string {
    if (minutes <= 0) return this.currentLang() === 'ar' ? 'منتهية' : 'Expired';
    if (minutes < 60) {
      return this.currentLang() === 'ar' ? `${minutes} دقيقة` : `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (this.currentLang() === 'ar') {
      return mins > 0 ? `${hours} ساعة ${mins} دقيقة` : `${hours} ساعة`;
    }
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Get extend minutes for a specific session
   */
  getExtendMinutes(sessionId: string): number {
    return this.sessionExtendMinutes()[sessionId] ?? 30;
  }

  /**
   * Set extend minutes for a specific session
   */
  setExtendMinutes(sessionId: string, minutes: number): void {
    this.sessionExtendMinutes.update((m) => ({ ...m, [sessionId]: minutes }));
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadAllData();
  }

  /**
   * Unblock IP address
   */
  unblockIP(ipAddress: string): void {
    const confirmMsg =
      this.currentLang() === 'ar'
        ? `هل أنت متأكد من إلغاء حظر ${ipAddress}؟`
        : `Are you sure you want to unblock ${ipAddress}?`;

    if (!confirm(confirmMsg)) return;

    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري إلغاء الحظر...' : 'Unblocking IP...',
    );
    const headers = this.getAuthHeaders();
    this.http.post(`${this.apiUrl}/unblock-ip`, { ipAddress }, { headers }).subscribe({
      next: () => {
        this.toast.update(toastId, {
          type: 'success',
          title:
            this.currentLang() === 'ar'
              ? `تم إلغاء حظر ${ipAddress}`
              : `Successfully unblocked ${ipAddress}`,
          duration: 4000,
          dismissible: true,
        });
        this.loadBlockedIPs();
      },
      error: () => {
        this.toast.update(toastId, {
          type: 'error',
          title: this.currentLang() === 'ar' ? 'فشل إلغاء الحظر' : 'Failed to unblock IP',
          duration: 6000,
          dismissible: true,
        });
      },
    });
  }

  /**
   * Format date for display (with caching)
   */
  formatDate(date: Date | string): string {
    const lang = this.currentLang();
    // Clear cache when language changes
    if (lang !== this.lastCacheLang) {
      this.dateFormatCache.clear();
      this.lastCacheLang = lang;
    }

    const key = String(date);
    let formatted = this.dateFormatCache.get(key);
    if (formatted) return formatted;

    const d = new Date(date);
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    formatted = d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    this.dateFormatCache.set(key, formatted);
    return formatted;
  }

  /**
   * Get status class for login attempt
   */
  getAttemptStatusClass(success: boolean): string {
    return success ? 'status-success' : 'status-failed';
  }

  /**
   * Get status text for login attempt
   */
  getAttemptStatusText(success: boolean): string {
    if (this.currentLang() === 'ar') {
      return success ? 'ناجح' : 'فاشل';
    }
    return success ? 'Success' : 'Failed';
  }

  /**
   * Get translations based on current language
   */
  private getTranslations(): Translations {
    if (this.currentLang() === 'ar') {
      return {
        pageTitle: 'المراقبة العامة للأمان',
        pageSubtitle: 'مراقبة شاملة لجميع محاولات تسجيل الدخول والأمان والجلسات',
        refresh: 'تحديث',
        successfulLogins: 'تسجيلات دخول ناجحة',
        failedAttempts: 'محاولات فاشلة',
        blockedIPs: 'عناوين IP محظورة',
        activeSessions: 'جلسات نشطة',
        recentLoginAttempts: 'محاولات تسجيل الدخول الأخيرة',
        attempts: 'محاولة',
        email: 'البريد الإلكتروني',
        ipAddress: 'عنوان IP',
        status: 'الحالة',
        reason: 'السبب',
        timestamp: 'التاريخ',
        sessionId: 'معرف الجلسة',
        blockedIPAddresses: 'عناوين IP المحظورة',
        blocked: 'محظور',
        blockedUntil: 'محظور حتى',
        actions: 'الإجراءات',
        unblock: 'إلغاء الحظر',
        noLoginAttempts: 'لا توجد محاولات تسجيل دخول',
        noBlockedIPs: 'لا توجد عناوين IP محظورة',
        loading: 'جاري التحميل...',
        // Admin Sessions
        activeAdminSessions: 'جلسات الأدمن النشطة',
        adminName: 'اسم الأدمن',
        role: 'الدور',
        loginTime: 'وقت الدخول',
        expiresAt: 'تنتهي في',
        remainingTime: 'الوقت المتبقي',
        extendSession: 'تمديد الجلسة',
        noActiveSessions: 'لا توجد جلسات نشطة',
        minutes: 'دقيقة',
        extendBy: 'تمديد بـ',
        sessionExtended: 'تم تمديد الجلسة',
      };
    }
    return {
      pageTitle: 'General Security Monitoring',
      pageSubtitle: 'Comprehensive monitoring of all login attempts, security, and sessions',
      refresh: 'Refresh',
      successfulLogins: 'Successful Logins',
      failedAttempts: 'Failed Attempts',
      blockedIPs: 'Blocked IPs',
      activeSessions: 'Active Sessions',
      recentLoginAttempts: 'Recent Login Attempts',
      attempts: 'attempts',
      email: 'Email',
      ipAddress: 'IP Address',
      status: 'Status',
      reason: 'Reason',
      timestamp: 'Timestamp',
      sessionId: 'Session ID',
      blockedIPAddresses: 'Blocked IP Addresses',
      blocked: 'blocked',
      blockedUntil: 'Blocked Until',
      actions: 'Actions',
      unblock: 'Unblock',
      noLoginAttempts: 'No login attempts found',
      noBlockedIPs: 'No blocked IP addresses',
      loading: 'Loading...',
      // Admin Sessions
      activeAdminSessions: 'Active Admin Sessions',
      adminName: 'Admin Name',
      role: 'Role',
      loginTime: 'Login Time',
      expiresAt: 'Expires At',
      remainingTime: 'Remaining',
      extendSession: 'Extend Session',
      noActiveSessions: 'No active sessions',
      minutes: 'minutes',
      extendBy: 'Extend by',
      sessionExtended: 'Session Extended',
    };
  }

  /**
   * Navigate to next page in carousel
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
    }
  }

  /**
   * Navigate to previous page in carousel
   */
  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Get global index for attempt numbering
   */
  getAttemptIndex(localIndex: number): number {
    return this.currentPage() * this.itemsPerPage + localIndex + 1;
  }

  /**
   * Print monitoring report - requires master code verification
   */
  async printReport(): Promise<void> {
    // Always ask for master code before printing
    const verified = await this.masterCode.forceVerifyMasterCode();

    if (!verified) {
      console.warn('🔒 Master code verification failed - print cancelled');
      return;
    }

    // Proceed with printing
    window.print();
  }

  /**
   * Clear login attempts - requires master code, deletes from DB
   */
  async clearLoginAttempts(): Promise<void> {
    const verified = await this.masterCode.forceVerifyMasterCode();
    if (!verified) return;

    const headers = this.getAuthHeaders();
    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري الحذف...' : 'Clearing login attempts...',
    );
    this.http
      .post<{ success: boolean; deletedCount: number }>(
        `${this.apiUrl}/clear-login-attempts`,
        {},
        { headers },
      )
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result?.success) {
          this.loginAttempts.set([]);
          this.currentPage.set(0);
          this.ws.clearLoginAttempts();
          this.toast.update(toastId, {
            type: 'success',
            title:
              this.currentLang() === 'ar'
                ? `تم حذف ${result.deletedCount} محاولة`
                : `Cleared ${result.deletedCount} attempts`,
            duration: 4000,
            dismissible: true,
          });
        } else {
          this.toast.update(toastId, {
            type: 'error',
            title: this.currentLang() === 'ar' ? 'فشل الحذف' : 'Failed to clear',
            duration: 5000,
            dismissible: true,
          });
        }
      });
  }

  /**
   * Clear admin sessions - requires master code, terminates from DB
   */
  async clearAdminSessions(): Promise<void> {
    const verified = await this.masterCode.forceVerifyMasterCode();
    if (!verified) return;

    const headers = this.getAuthHeaders();
    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري إنهاء الجلسات...' : 'Terminating sessions...',
    );
    this.http
      .post<{ success: boolean; terminatedCount: number }>(
        `${this.apiUrl}/terminate-sessions`,
        {},
        { headers },
      )
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result?.success) {
          const myEmail = this.auth.getAdminData()?.email;
          this.adminSessions.update((sessions) => sessions.filter((s) => s.email === myEmail));
          this.toast.update(toastId, {
            type: 'success',
            title:
              this.currentLang() === 'ar'
                ? `تم إنهاء ${result.terminatedCount} جلسة`
                : `Terminated ${result.terminatedCount} sessions`,
            duration: 4000,
            dismissible: true,
          });
        } else {
          this.toast.update(toastId, {
            type: 'error',
            title: this.currentLang() === 'ar' ? 'فشل إنهاء الجلسات' : 'Failed to terminate',
            duration: 5000,
            dismissible: true,
          });
        }
      });
  }

  /**
   * Clear blocked IPs - requires master code, unblocks all from DB
   */
  async clearBlockedIPs(): Promise<void> {
    const verified = await this.masterCode.forceVerifyMasterCode();
    if (!verified) return;

    const headers = this.getAuthHeaders();
    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري إلغاء الحظر...' : 'Unblocking all IPs...',
    );
    this.http
      .post<{ success: boolean; deletedCount: number }>(
        `${this.apiUrl}/unblock-all`,
        {},
        { headers },
      )
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result?.success) {
          this.blockedIPs.set([]);
          this.toast.update(toastId, {
            type: 'success',
            title: this.currentLang() === 'ar' ? 'تم إلغاء حظر جميع العناوين' : 'All IPs unblocked',
            duration: 4000,
            dismissible: true,
          });
        } else {
          this.toast.update(toastId, {
            type: 'error',
            title: this.currentLang() === 'ar' ? 'فشل إلغاء الحظر' : 'Failed to unblock',
            duration: 5000,
            dismissible: true,
          });
        }
      });
  }
}
