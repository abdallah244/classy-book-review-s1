import {
  Component,
  Input,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionTimerService } from '../../../core/services/session-timer.service';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { MasterCodeModalComponent } from '../master-code-modal/master-code-modal.component';
import { ToastComponent } from '../toast/toast.component';

interface SidebarLink {
  icon: string;
  labelAr: string;
  labelEn: string;
  route: string;
  disabled: boolean;
  pageKey: string;
  superAdminOnly?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MasterCodeModalComponent, ToastComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  protected readonly sessionTimer = inject(SessionTimerService);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthService);
  private readonly ws = inject(WebSocketService);
  private router = inject(Router);

  @Input() pageTitle?: string;

  readonly currentTheme = this.theme.effectiveTheme;
  readonly currentLanguage = this.i18n.language;
  readonly currentDirection = this.i18n.direction;

  readonly sidebarOpen = signal(true);
  extendingSession = false;
  isOnDashboard = false;

  currentPageTitle = { ar: 'لوحة التحكم', en: 'Admin Dashboard' };

  private readonly allSidebarLinks: SidebarLink[] = [
    {
      icon: 'fa-solid fa-gauge-high',
      labelAr: 'لوحة المعلومات',
      labelEn: 'Dashboard',
      route: '/admin/dashboard',
      disabled: false,
      pageKey: 'dashboard',
    },
    {
      icon: 'fa-solid fa-users',
      labelAr: 'المستخدمون',
      labelEn: 'Users',
      route: '/admin/users',
      disabled: false,
      pageKey: 'users',
    },
    {
      icon: 'fa-solid fa-graduation-cap',
      labelAr: 'الدورات',
      labelEn: 'Courses',
      route: '/admin/courses',
      disabled: false,
      pageKey: 'courses',
    },
    {
      icon: 'fa-solid fa-layer-group',
      labelAr: 'الفئات',
      labelEn: 'Categories',
      route: '/admin/categories',
      disabled: false,
      pageKey: 'categories',
    },
    {
      icon: 'fa-solid fa-cart-shopping',
      labelAr: 'الطلبات',
      labelEn: 'Orders',
      route: '/admin/orders',
      disabled: false,
      pageKey: 'orders',
    },
    {
      icon: 'fa-solid fa-credit-card',
      labelAr: 'المدفوعات',
      labelEn: 'Payments',
      route: '/admin/payments',
      disabled: false,
      pageKey: 'payments',
    },
    {
      icon: 'fa-solid fa-star',
      labelAr: 'المراجعات',
      labelEn: 'Reviews',
      route: '/admin/reviews',
      disabled: false,
      pageKey: 'reviews',
    },
    {
      icon: 'fa-solid fa-chart-bar',
      labelAr: 'التقارير',
      labelEn: 'Reports',
      route: '/admin/reports',
      disabled: false,
      pageKey: 'reports',
    },
    {
      icon: 'fa-solid fa-chart-line',
      labelAr: 'الإحصائيات',
      labelEn: 'Analytics',
      route: '/admin/analytics',
      disabled: false,
      pageKey: 'analytics',
    },
    {
      icon: 'fa-solid fa-shield-halved',
      labelAr: 'المراقبة',
      labelEn: 'Monitoring',
      route: '/admin/monitoring',
      disabled: false,
      pageKey: 'monitoring',
    },
    {
      icon: 'fa-solid fa-bell',
      labelAr: 'الإشعارات',
      labelEn: 'Notifications',
      route: '/admin/notifications',
      disabled: false,
      pageKey: 'notifications',
    },
    {
      icon: 'fa-solid fa-gear',
      labelAr: 'الإعدادات',
      labelEn: 'Settings',
      route: '/admin/settings',
      disabled: false,
      pageKey: 'settings',
    },
    {
      icon: 'fa-solid fa-users-gear',
      labelAr: 'إدارة الموظفين',
      labelEn: 'Staff Management',
      route: '/admin/roles',
      disabled: false,
      pageKey: 'staff',
      superAdminOnly: true,
    },
    {
      icon: 'fa-solid fa-database',
      labelAr: 'النسخ الاحتياطي',
      labelEn: 'Backup',
      route: '/admin/backup',
      disabled: false,
      pageKey: 'backup',
    },
    {
      icon: 'fa-solid fa-clock-rotate-left',
      labelAr: 'سجل العمليات',
      labelEn: 'Activity Log',
      route: '/admin/activity-log',
      disabled: false,
      pageKey: 'activity-log',
    },
    {
      icon: 'fa-solid fa-comments',
      labelAr: 'إدارة المحتوى',
      labelEn: 'Moderation',
      route: '/admin/social-moderation',
      disabled: false,
      pageKey: 'social-moderation',
    },
  ];

  readonly sidebarLinks = computed(() => {
    const user = this.auth.user();
    if (!user || user.role === 'super_admin') return this.allSidebarLinks;
    return this.allSidebarLinks.filter((link) => {
      if (link.superAdminOnly) return false;
      if (link.disabled) return false;
      return user.permissions?.includes('page:' + link.pageKey);
    });
  });

  ngOnInit(): void {
    this.sessionTimer.startLocalSession();
    this.detectCurrentPage();
    this.ws.connect();

    if (this.pageTitle) {
      this.currentPageTitle = { ar: this.pageTitle, en: this.pageTitle };
    }
  }

  detectCurrentPage(): void {
    const url = this.router.url;
    this.isOnDashboard = url.includes('/admin/dashboard');

    if (url.includes('/monitoring')) {
      this.currentPageTitle = { ar: 'المراقبة الأمنية العامة', en: 'General Security Monitoring' };
    } else if (url.includes('/roles')) {
      this.currentPageTitle = { ar: 'إدارة الموظفين', en: 'Staff Management' };
    } else if (url.includes('/settings')) {
      this.currentPageTitle = { ar: 'الإعدادات', en: 'Settings' };
    } else if (url.includes('/users')) {
      this.currentPageTitle = { ar: 'المستخدمون', en: 'Users' };
    } else if (url.includes('/courses')) {
      this.currentPageTitle = { ar: 'الدورات', en: 'Courses' };
    } else if (url.includes('/categories')) {
      this.currentPageTitle = { ar: 'الفئات', en: 'Categories' };
    } else if (url.includes('/orders')) {
      this.currentPageTitle = { ar: 'الطلبات', en: 'Orders' };
    } else if (url.includes('/payments')) {
      this.currentPageTitle = { ar: 'المدفوعات', en: 'Payments' };
    } else if (url.includes('/reviews')) {
      this.currentPageTitle = { ar: 'المراجعات', en: 'Reviews' };
    } else if (url.includes('/reports')) {
      this.currentPageTitle = { ar: 'التقارير', en: 'Reports' };
    } else if (url.includes('/analytics')) {
      this.currentPageTitle = { ar: 'الإحصائيات', en: 'Analytics' };
    } else if (url.includes('/notifications')) {
      this.currentPageTitle = { ar: 'الإشعارات', en: 'Notifications' };
    } else if (url.includes('/backup')) {
      this.currentPageTitle = { ar: 'النسخ الاحتياطي', en: 'Backup' };
    } else if (url.includes('/activity-log')) {
      this.currentPageTitle = { ar: 'سجل العمليات', en: 'Activity Log' };
    } else if (url.includes('/social-moderation')) {
      this.currentPageTitle = { ar: 'إدارة المحتوى', en: 'Social Moderation' };
    } else {
      this.currentPageTitle = { ar: 'لوحة التحكم', en: 'Admin Dashboard' };
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  async extendSession(): Promise<void> {
    this.extendingSession = true;
    const success = await this.sessionTimer.extendSession(15);
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

  navigateToLink(link: SidebarLink): void {
    if (!link.disabled) {
      this.router.navigate([link.route]);
    }
  }

  isLinkActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  logout(): void {
    if (
      confirm(
        this.currentLanguage() === 'ar'
          ? 'هل تريد تسجيل الخروج؟'
          : 'Are you sure you want to logout?',
      )
    ) {
      this.sessionTimer.clearSession();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('sessionStartTime');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('master_code_verified');

      this.auth.logout().subscribe({
        next: () => this.router.navigate(['/admin/login']),
        error: () => this.router.navigate(['/admin/login']),
      });
    }
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }
}
