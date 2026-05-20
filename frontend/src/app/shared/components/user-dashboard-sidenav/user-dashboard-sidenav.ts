import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { GlobalSearchDropdownComponent } from '../global-search-dropdown/global-search-dropdown';

export interface NavItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-user-dashboard-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent, GlobalSearchDropdownComponent],
  templateUrl: './user-dashboard-sidenav.html',
  styleUrl: './user-dashboard-sidenav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardSidenav {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly i18n = inject(I18nService);
  readonly themeService = inject(ThemeService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly user = this.auth.user;
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly searchQuery = signal('');
  readonly isSearchVisible = signal(false);

  readonly userInitial = computed(() => {
    const name = this.user()?.name || 'U';
    return name.charAt(0).toUpperCase();
  });

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.user()?.name || 'User';
    if (this.isAr()) {
      if (hour < 12) return `صباح الخير، ${name}`;
      return `مساء الخير، ${name}`;
    }
    if (hour < 12) return `Good Morning, ${name}`;
    if (hour < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  });

  readonly navItems: NavItem[] = [
    { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: 'grid', route: '/dashboard' },
    { id: 'courses', labelEn: 'My Courses', labelAr: 'دوراتي', icon: 'book', route: '/dashboard/courses' },
    { id: 'progress', labelEn: 'Progress', labelAr: 'التقدم', icon: 'chart', route: '/dashboard/progress' },
    { id: 'certificates', labelEn: 'Certificates', labelAr: 'الشهادات', icon: 'award', route: '/dashboard/certificates' },
    { id: 'messages', labelEn: 'Messages', labelAr: 'الرسائل', icon: 'message', route: '/dashboard/messages' },
    { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: 'settings', route: '/dashboard/settings' },
  ];

  readonly activeItem = signal('overview');

  selectItem(item: NavItem): void {
    this.activeItem.set(item.id);
    this.mobileOpen.set(false);
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleLanguage(): void {
    this.i18n.toggle();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.isSearchVisible.set(value.length >= 2);
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.toast.success({
        title: this.isAr() ? 'تم بنجاح' : 'Success',
        message: this.isAr() ? 'تم تسجيل الخروج' : 'Logged out successfully',
      });
      this.router.navigate(['/']);
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
