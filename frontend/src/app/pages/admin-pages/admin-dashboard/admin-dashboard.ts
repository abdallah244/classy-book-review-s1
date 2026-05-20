import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ADMIN_PAGE_SERVICES,
  AdminPerformanceService,
  AdminSkeletonService,
  AdminProgressBarService,
  AdminSecurityService,
} from '../admin-services';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageTransitionService } from '../../../core/services/page-transition.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionTimerService } from '../../../core/services/session-timer.service';
import { MasterCodeService } from '../../../core/services/master-code.service';
import { ApiClientService } from '../../../core/services/api-client.service';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { forkJoin } from 'rxjs';

// ─── Interfaces ───
interface StatCard {
  icon: string;
  labelAr: string;
  labelEn: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: number; // percentage change
  color: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  course: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded';
  date: string;
}

interface TopCourse {
  name: string;
  students: number;
  revenue: number;
  rating: number;
  progress: number;
}

interface ActivityItem {
  icon: string;
  color: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  time: string;
}

interface ChartBar {
  label: string;
  value: number;
  height: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit, OnDestroy, AfterViewInit {
  private router = inject(Router);
  protected readonly performance = inject(AdminPerformanceService);
  protected readonly skeleton = inject(AdminSkeletonService);
  protected readonly progressBar = inject(AdminProgressBarService);
  protected readonly security = inject(AdminSecurityService);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly toast = inject(ToastService);
  protected readonly pageTransition = inject(PageTransitionService);
  protected readonly auth = inject(AuthService);
  protected readonly sessionTimer = inject(SessionTimerService);
  protected readonly masterCode = inject(MasterCodeService);
  private api = inject(ApiClientService);

  readonly isPageReady = signal(false);
  readonly isLoading = signal(true);
  readonly adminVerified = signal(false);
  readonly currentTheme = this.theme.effectiveTheme;
  readonly currentLanguage = this.i18n.language;
  readonly currentDirection = this.i18n.direction;

  // ─── Stat Cards ───
  readonly statCards: StatCard[] = [
    {
      icon: 'fa-solid fa-users',
      labelAr: 'إجمالي المستخدمين',
      labelEn: 'Total Users',
      value: 0,
      trend: 0,
      color: '#376bfa',
    },
    {
      icon: 'fa-solid fa-graduation-cap',
      labelAr: 'الدورات النشطة',
      labelEn: 'Active Courses',
      value: 0,
      trend: 0,
      color: '#10b981',
    },
    {
      icon: 'fa-solid fa-cart-shopping',
      labelAr: 'الطلبات الجديدة',
      labelEn: 'New Orders',
      value: 0,
      trend: 0,
      color: '#f59e0b',
    },
    {
      icon: 'fa-solid fa-dollar-sign',
      labelAr: 'الإيرادات',
      labelEn: 'Revenue',
      value: 0,
      prefix: '$',
      trend: 0,
      color: '#8b5cf6',
    },
  ];

  // ─── Revenue Chart (monthly) ───
  readonly revenueChart: ChartBar[] = [
    { label: 'Jan', value: 0, height: 0 },
    { label: 'Feb', value: 0, height: 0 },
    { label: 'Mar', value: 0, height: 0 },
    { label: 'Apr', value: 0, height: 0 },
    { label: 'May', value: 0, height: 0 },
    { label: 'Jun', value: 0, height: 0 },
    { label: 'Jul', value: 0, height: 0 },
    { label: 'Aug', value: 0, height: 0 },
    { label: 'Sep', value: 0, height: 0 },
    { label: 'Oct', value: 0, height: 0 },
    { label: 'Nov', value: 0, height: 0 },
    { label: 'Dec', value: 0, height: 0 },
  ];

  // ─── Users chart (weekly) ───
  readonly usersChart: ChartBar[] = [
    { label: 'Mon', value: 0, height: 0 },
    { label: 'Tue', value: 0, height: 0 },
    { label: 'Wed', value: 0, height: 0 },
    { label: 'Thu', value: 0, height: 0 },
    { label: 'Fri', value: 0, height: 0 },
    { label: 'Sat', value: 0, height: 0 },
    { label: 'Sun', value: 0, height: 0 },
  ];

  // ─── Course Categories (donut chart data) ───
  readonly courseCategories = [
    { nameAr: 'برمجة', nameEn: 'Programming', percentage: 0, color: '#376bfa' },
    { nameAr: 'تصميم', nameEn: 'Design', percentage: 0, color: '#10b981' },
    { nameAr: 'تسويق', nameEn: 'Marketing', percentage: 0, color: '#f59e0b' },
    { nameAr: 'أعمال', nameEn: 'Business', percentage: 0, color: '#8b5cf6' },
    { nameAr: 'أخرى', nameEn: 'Others', percentage: 0, color: '#6b7280' },
  ];

  // ─── Donut chart SVG segments ───
  readonly donutSegments = computed(() => {
    const segments: { offset: number; length: number; color: string }[] = [];
    let cumulative = 0;
    const circumference = 2 * Math.PI * 54; // r=54
    for (const cat of this.courseCategories) {
      const length = (cat.percentage / 100) * circumference;
      segments.push({ offset: cumulative, length, color: cat.color });
      cumulative += length;
    }
    return segments;
  });

  readonly donutCircumference = 2 * Math.PI * 54;

  // ─── Top Courses ───
  readonly topCourses: TopCourse[] = [
    {
      name: 'Full-Stack Web Development',
      students: 0,
      revenue: 0,
      rating: 0,
      progress: 0,
    },
    { name: 'UI/UX Design Masterclass', students: 0, revenue: 0, rating: 0, progress: 0 },
    { name: 'Digital Marketing Pro', students: 0, revenue: 0, rating: 0, progress: 0 },
    { name: 'Data Science & AI', students: 0, revenue: 0, rating: 0, progress: 0 },
    { name: 'Mobile App Development', students: 0, revenue: 0, rating: 0, progress: 0 },
  ];

  // ─── Recent Orders ───
  readonly recentOrders: RecentOrder[] = [
    {
      id: '#ORD-0000',
      customer: '-',
      course: '-',
      amount: 0,
      status: 'completed',
      date: '-',
    },
    {
      id: '#ORD-0000',
      customer: '-',
      course: '-',
      amount: 0,
      status: 'pending',
      date: '-',
    },
    {
      id: '#ORD-0000',
      customer: '-',
      course: '-',
      amount: 0,
      status: 'completed',
      date: '-',
    },
    {
      id: '#ORD-0000',
      customer: '-',
      course: '-',
      amount: 0,
      status: 'completed',
      date: '-',
    },
    {
      id: '#ORD-0000',
      customer: '-',
      course: '-',
      amount: 0,
      status: 'pending',
      date: '-',
    },
    {
      id: '#ORD-0000',
      customer: '-',
      course: '-',
      amount: 0,
      status: 'completed',
      date: '-',
    },
  ];

  // ─── Activity Feed ───
  readonly activityFeed: ActivityItem[] = [
    {
      icon: 'fa-solid fa-clock',
      color: '#6b7280',
      titleAr: 'لا توجد أنشطة',
      titleEn: 'No Activity',
      descAr: 'لا توجد أنشطة حتى الآن',
      descEn: 'No activity yet',
      time: '-',
    },
  ];

  // ─── Server / System Stats ───
  readonly serverStats = [
    { labelAr: 'وحدة المعالجة', labelEn: 'CPU Usage', value: 0, color: '#376bfa' },
    { labelAr: 'الذاكرة', labelEn: 'Memory', value: 0, color: '#f59e0b' },
    { labelAr: 'التخزين', labelEn: 'Storage', value: 0, color: '#10b981' },
    { labelAr: 'عرض النطاق', labelEn: 'Bandwidth', value: 0, color: '#8b5cf6' },
  ];

  // ─── Quick Actions Grid ───
  readonly quickActions = [
    {
      icon: 'fa-solid fa-user-plus',
      labelAr: 'إضافة مستخدم',
      labelEn: 'Add User',
      color: '#376bfa',
    },
    {
      icon: 'fa-solid fa-plus-circle',
      labelAr: 'دورة جديدة',
      labelEn: 'New Course',
      color: '#10b981',
    },
    {
      icon: 'fa-solid fa-paper-plane',
      labelAr: 'إرسال إشعار',
      labelEn: 'Send Notice',
      color: '#f59e0b',
    },
    {
      icon: 'fa-solid fa-file-export',
      labelAr: 'تصدير تقرير',
      labelEn: 'Export Report',
      color: '#8b5cf6',
    },
    {
      icon: 'fa-solid fa-shield-halved',
      labelAr: 'المراقبة',
      labelEn: 'Monitoring',
      color: '#ef4444',
    },
    { icon: 'fa-solid fa-database', labelAr: 'نسخ احتياطي', labelEn: 'Backup', color: '#6b7280' },
  ];

  // ─── Traffic Sources ───
  readonly trafficSources = [
    {
      nameAr: 'بحث مباشر',
      nameEn: 'Direct Search',
      percentage: 0,
      color: '#376bfa',
      icon: 'fa-solid fa-magnifying-glass',
    },
    {
      nameAr: 'وسائل التواصل',
      nameEn: 'Social Media',
      percentage: 0,
      color: '#10b981',
      icon: 'fa-solid fa-share-nodes',
    },
    {
      nameAr: 'إحالة',
      nameEn: 'Referral',
      percentage: 0,
      color: '#f59e0b',
      icon: 'fa-solid fa-link',
    },
    {
      nameAr: 'إعلانات',
      nameEn: 'Paid Ads',
      percentage: 0,
      color: '#8b5cf6',
      icon: 'fa-solid fa-bullhorn',
    },
  ];

  ngOnInit(): void {
    this.sessionTimer.startLocalSession();
    this.performance.startMeasure('admin-dashboard-init');
    this.progressBar.start();
    this.verifyAdminAccess();
    this.loadDashboardData();

    setTimeout(() => {
      this.progressBar.complete();
      this.isLoading.set(false);
      this.isPageReady.set(true);
      this.performance.endMeasure('admin-dashboard-init');
    }, 500);
  }

  private loadDashboardData(): void {
    forkJoin({
      courseStats: this.api.get<any>('/courses/admin/stats'),
      securityMetrics: this.api.get<any>('/monitoring/security-metrics'),
      auditStats: this.api.get<any>('/audit-log/stats'),
    }).subscribe({
      next: ({ courseStats, securityMetrics, auditStats }) => {
        // Update stat cards with real data
        this.statCards[0].value = securityMetrics.totalUsers || securityMetrics.activeSessions || 0;
        this.statCards[1].value = courseStats.publishedCourses || 0;
        this.statCards[2].value = courseStats.totalEnrollments || 0;
        this.statCards[3].value = 0; // Revenue (no payment system yet)

        // Update activity feed with recent audit logs
        if (auditStats.recentActivity?.length) {
          this.activityFeed.length = 0;
          auditStats.recentActivity.slice(0, 5).forEach((log: any) => {
            const iconMap: Record<string, string> = {
              login: 'fa-solid fa-right-to-bracket',
              logout: 'fa-solid fa-right-from-bracket',
              create: 'fa-solid fa-plus-circle',
              update: 'fa-solid fa-pen-to-square',
              delete: 'fa-solid fa-trash',
              read: 'fa-solid fa-eye',
            };
            const colorMap: Record<string, string> = {
              login: '#10b981',
              logout: '#6b7280',
              create: '#3b82f6',
              update: '#f59e0b',
              delete: '#ef4444',
              read: '#8b5cf6',
            };
            this.activityFeed.push({
              icon: iconMap[log.actionType] || 'fa-solid fa-circle-info',
              color: colorMap[log.actionType] || '#94a3b8',
              titleAr: log.action,
              titleEn: log.action,
              descAr: `${log.resource} - ${log.status}`,
              descEn: `${log.resource} - ${log.status}`,
              time: this.formatTimeAgo(log.createdAt),
            });
          });
        }

        // Update top courses from admin stats
        if (courseStats.topCourses?.length) {
          for (let i = 0; i < Math.min(courseStats.topCourses.length, this.topCourses.length); i++) {
            const tc = courseStats.topCourses[i];
            this.topCourses[i].name = tc.title || tc.name || this.topCourses[i].name;
            this.topCourses[i].students = tc.enrollmentCount || 0;
            this.topCourses[i].rating = tc.rating || 0;
          }
        }
      },
      error: () => {
        // Dashboard still shows with default zeros
      },
    });
  }

  private formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  ngAfterViewInit(): void {
    this.pageTransition.applyTransition();
  }

  ngOnDestroy(): void {
    this.progressBar.complete();
  }

  private verifyAdminAccess(): void {
    const adminData = this.auth.getAdminData();

    if (!adminData) {
      this.toast.error({
        title: 'Access Denied',
        message: 'Admin credentials not found. Redirecting to login.',
      });
      setTimeout(() => this.router.navigate(['/admin/login']), 2000);
      return;
    }

    if (!this.security.isAdminAuthorized(adminData)) {
      this.toast.error({
        title: 'Unauthorized',
        message: 'Your account does not have admin privileges.',
      });
      setTimeout(() => this.router.navigate(['/']), 2000);
      return;
    }

    this.adminVerified.set(true);
    this.security.logAdminAccess(adminData);
    this.toast.success({ title: 'Welcome Admin', message: `Welcome back, ${adminData.email}!` });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const isAr = this.currentLanguage() === 'ar';
    switch (status) {
      case 'completed':
        return isAr ? 'مكتمل' : 'Completed';
      case 'pending':
        return isAr ? 'قيد الانتظار' : 'Pending';
      case 'refunded':
        return isAr ? 'مسترجع' : 'Refunded';
      default:
        return status;
    }
  }

  onQuickAction(action: { labelEn: string }): void {
    if (action.labelEn === 'Monitoring') {
      this.navigateToMonitoring();
    } else {
      this.toast.info({
        title: this.currentLanguage() === 'ar' ? 'قريباً' : 'Coming Soon',
        message:
          this.currentLanguage() === 'ar'
            ? 'هذه الميزة تحت التطوير'
            : 'This feature is under development',
      });
    }
  }

  async navigateToMonitoring(): Promise<void> {
    if (this.masterCode.isBlocked()) {
      this.toast.error({
        title: this.currentLanguage() === 'ar' ? 'تم حظرك' : 'Blocked',
        message:
          this.currentLanguage() === 'ar'
            ? 'تم حظر IP الخاص بك بسبب محاولات خاطئة متعددة'
            : 'Your IP has been blocked due to multiple failed attempts',
        duration: 8000,
      });
      return;
    }

    const verified = await this.masterCode.verifyMasterCode();

    if (verified) {
      this.toast.success({
        title: this.currentLanguage() === 'ar' ? 'تم التحقق' : 'Verified',
        message: this.currentLanguage() === 'ar' ? 'جاري التحويل...' : 'Redirecting...',
        duration: 2000,
      });
      this.progressBar.start();
      setTimeout(() => {
        this.router.navigate(['/admin/monitoring']);
        this.progressBar.complete();
      }, 300);
    } else if (this.masterCode.isBlocked()) {
      this.toast.error({
        title: this.currentLanguage() === 'ar' ? 'تم حظرك نهائياً' : 'Permanently Blocked',
        message:
          this.currentLanguage() === 'ar'
            ? 'تم حظر IP الخاص بك بسبب 3 محاولات خاطئة. تواصل مع المسؤول.'
            : 'Your IP has been blocked due to 3 failed attempts. Contact admin.',
        duration: 10000,
      });
    }
  }
}
