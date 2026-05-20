import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionTimerService } from '../../core/services/session-timer.service';
import { ThemeService } from '../../core/services/theme.service';
import { I18nService } from '../../core/services/i18n.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="admin-navbar" [attr.dir]="currentDirection()">
      <!-- Left Section: Logo & Title -->
      <div class="navbar-left">
        <button class="back-btn" (click)="navigateToDashboard()" *ngIf="!isOnDashboard">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="navbar-title">
          {{ currentLanguage() === 'ar' ? currentPageTitle.ar : currentPageTitle.en }}
        </h1>
      </div>

      <!-- Center Section: Session Timer -->
      <div class="navbar-center" *ngIf="sessionTimer.isSessionActive()">
        <div class="session-timer" [class.warning]="sessionTimer.isExpiringSoon()">
          <i class="fa-solid fa-clock"></i>
          <span class="timer-label">
            {{ currentLanguage() === 'ar' ? 'الجلسة تنتهي خلال:' : 'Session expires in:' }}
          </span>
          <span class="timer-value">{{ sessionTimer.remainingTime() }}</span>

          <!-- زر تمديد الجلسة -->
          <button
            class="extend-btn"
            (click)="extendSession()"
            [disabled]="extendingSession"
            *ngIf="canShowExtendButton"
          >
            <i class="fa-solid fa-plus"></i>
            {{ currentLanguage() === 'ar' ? 'تمديد' : 'Extend' }}
          </button>
        </div>
      </div>

      <!-- Right Section: Actions -->
      <div class="navbar-right">
        <!-- Theme Toggle -->
        <button
          class="action-btn"
          (click)="toggleTheme()"
          [attr.aria-label]="currentTheme() === 'dark' ? 'Light mode' : 'Dark mode'"
        >
          <i [class]="currentTheme() === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
        </button>

        <!-- Language Toggle -->
        <button
          class="action-btn"
          (click)="toggleLanguage()"
          [attr.aria-label]="currentLanguage() === 'ar' ? 'English' : 'العربية'"
        >
          <span class="lang">{{ currentLanguage() === 'ar' ? 'EN' : 'ع' }}</span>
        </button>

        <!-- Logout -->
        <button
          class="action-btn logout-btn"
          (click)="logout()"
          [attr.aria-label]="currentLanguage() === 'ar' ? 'تسجيل الخروج' : 'Logout'"
        >
          <i class="fa-solid fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      .admin-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 2rem;
        background: var(--nav-bg);
        border-bottom: 1px solid var(--border-color);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        position: sticky;
        top: 0;
        z-index: 1000;
        gap: 2rem;
      }

      .navbar-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .back-btn {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-primary);
      }

      .back-btn:hover {
        background: var(--primary-color);
        color: white;
        transform: translateX(-3px);
      }

      [dir='rtl'] .back-btn:hover {
        transform: translateX(3px);
      }

      .navbar-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .navbar-center {
        flex: 2;
        display: flex;
        justify-content: center;
      }

      .session-timer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: var(--card-bg);
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        border: 2px solid var(--border-color);
        transition: all 0.3s;
      }

      .session-timer.warning {
        border-color: #ff9800;
        background: rgba(255, 152, 0, 0.1);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);
        }
      }

      .session-timer i {
        font-size: 1.1rem;
        color: var(--primary-color);
      }

      .session-timer.warning i {
        color: #ff9800;
        animation: shake 0.5s infinite;
      }

      @keyframes shake {
        0%,
        100% {
          transform: rotate(0deg);
        }
        25% {
          transform: rotate(-10deg);
        }
        75% {
          transform: rotate(10deg);
        }
      }

      .timer-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .timer-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
        font-family: 'Courier New', monospace;
        min-width: 50px;
        text-align: center;
      }

      .extend-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.4rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition: all 0.2s;
      }

      .extend-btn:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: scale(1.05);
      }

      .extend-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .navbar-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        justify-content: flex-end;
      }

      .action-btn {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-primary);
        font-size: 1rem;
      }

      .action-btn:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
      }

      .action-btn.logout-btn:hover {
        background: #dc3545;
      }

      .lang {
        font-weight: 600;
        font-size: 0.9rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .admin-navbar {
          flex-wrap: wrap;
          padding: 1rem;
        }

        .navbar-center {
          flex: 100%;
          order: 3;
          margin-top: 1rem;
        }

        .session-timer {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class AdminNavbarComponent implements OnInit, OnDestroy {
  protected readonly sessionTimer = inject(SessionTimerService);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthService);
  private router = inject(Router);

  // Inputs
  @Input() pageTitle?: string;
  @Input() showExtendButton: boolean = false;

  // Signals
  readonly currentTheme = this.theme.effectiveTheme;
  readonly currentLanguage = this.i18n.language;
  readonly currentDirection = this.i18n.direction;

  // State
  extendingSession = false;
  isOnDashboard = false;
  canShowExtendButton = false;

  currentPageTitle = {
    ar: 'لوحة التحكم',
    en: 'Admin Dashboard',
  };

  ngOnInit(): void {
    // استمرار الـ session timer (لا نعيد تشغيله - يبدأ فقط عند تسجيل الدخول)
    this.sessionTimer.startLocalSession();
    this.detectCurrentPage();

    // استخدام pageTitle من Input إذا وُجد
    if (this.pageTitle) {
      this.currentPageTitle = {
        ar: this.pageTitle,
        en: this.pageTitle,
      };
    }

    // استخدام showExtendButton من Input
    this.canShowExtendButton = this.showExtendButton;
  }

  detectCurrentPage(): void {
    const url = this.router.url;
    this.isOnDashboard = url.includes('/admin/dashboard');

    if (url.includes('/monitoring')) {
      this.currentPageTitle = {
        ar: 'المراقبة الأمنية العامة',
        en: 'General Security Monitoring',
      };
    } else {
      this.currentPageTitle = {
        ar: 'لوحة التحكم',
        en: 'Admin Dashboard',
      };
    }

    // Always show extend button in admin pages
    this.canShowExtendButton = true;
  }

  async extendSession(): Promise<void> {
    this.extendingSession = true;

    const success = await this.sessionTimer.extendSession(15); // 15 دقيقة

    if (success) {
      alert(
        this.currentLanguage() === 'ar'
          ? '✅ تم تمديد الجلسة 15 دقيقة'
          : '✅ Session extended by 15 minutes',
      );
    } else {
      alert(
        this.currentLanguage() === 'ar' ? '❌ فشل تمديد الجلسة' : '❌ Failed to extend session',
      );
    }

    this.extendingSession = false;
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  toggleLanguage(): void {
    this.i18n.toggle();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    if (
      confirm(
        this.currentLanguage() === 'ar'
          ? 'هل تريد تسجيل الخروج؟'
          : 'Are you sure you want to logout?',
      )
    ) {
      // مسح الجلسة المحلية
      this.sessionTimer.clearSession();

      // مسح بيانات الأدمن من localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('sessionStartTime');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('master_code_verified');

      // استدعاء logout من الـ service
      this.auth.logout().subscribe({
        next: () => {
          this.router.navigate(['/admin/login']);
        },
        error: () => {
          // حتى لو فشل الـ API، نظل نوجه للـ login
          this.router.navigate(['/admin/login']);
        },
      });
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
