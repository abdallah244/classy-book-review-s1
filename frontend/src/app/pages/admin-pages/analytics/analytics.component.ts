import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  readonly isLoading = signal(true);

  readonly kpis = [
    {
      icon: 'fa-solid fa-eye',
      label: 'Page Views',
      value: '1.2M',
      trend: '+18.5%',
      color: '#3b82f6',
      up: true,
    },
    {
      icon: 'fa-solid fa-users',
      label: 'Unique Visitors',
      value: '345K',
      trend: '+12.3%',
      color: '#10b981',
      up: true,
    },
    {
      icon: 'fa-solid fa-clock',
      label: 'Avg. Session',
      value: '8m 42s',
      trend: '+5.1%',
      color: '#8b5cf6',
      up: true,
    },
    {
      icon: 'fa-solid fa-percent',
      label: 'Bounce Rate',
      value: '24.3%',
      trend: '-3.2%',
      color: '#f59e0b',
      up: false,
    },
  ];

  readonly revenueChart = [
    { month: 'Jan', value: 18500, height: 37 },
    { month: 'Feb', value: 22300, height: 45 },
    { month: 'Mar', value: 28900, height: 58 },
    { month: 'Apr', value: 24600, height: 49 },
    { month: 'May', value: 32100, height: 64 },
    { month: 'Jun', value: 38400, height: 77 },
    { month: 'Jul', value: 35200, height: 70 },
    { month: 'Aug', value: 41800, height: 84 },
    { month: 'Sep', value: 39500, height: 79 },
    { month: 'Oct', value: 45200, height: 90 },
    { month: 'Nov', value: 50000, height: 100 },
    { month: 'Dec', value: 48700, height: 97 },
  ];

  readonly enrollmentChart = [
    { day: 'Mon', value: 245, height: 49 },
    { day: 'Tue', value: 312, height: 62 },
    { day: 'Wed', value: 287, height: 57 },
    { day: 'Thu', value: 398, height: 80 },
    { day: 'Fri', value: 456, height: 91 },
    { day: 'Sat', value: 500, height: 100 },
    { day: 'Sun', value: 380, height: 76 },
  ];

  readonly topPages = [
    { page: '/courses/full-stack-dev', views: 45200, percentage: 100 },
    { page: '/courses/ui-ux-design', views: 38900, percentage: 86 },
    { page: '/courses/data-science', views: 32100, percentage: 71 },
    { page: '/courses/marketing', views: 28400, percentage: 63 },
    { page: '/courses/react-native', views: 21800, percentage: 48 },
  ];

  readonly trafficSources = [
    {
      source: 'Organic Search',
      percentage: 42,
      color: '#3b82f6',
      icon: 'fa-solid fa-magnifying-glass',
    },
    { source: 'Direct', percentage: 28, color: '#10b981', icon: 'fa-solid fa-globe' },
    { source: 'Social Media', percentage: 18, color: '#8b5cf6', icon: 'fa-solid fa-share-nodes' },
    { source: 'Referral', percentage: 8, color: '#f59e0b', icon: 'fa-solid fa-link' },
    { source: 'Paid Ads', percentage: 4, color: '#ef4444', icon: 'fa-solid fa-bullhorn' },
  ];

  readonly deviceBreakdown = [
    { device: 'Desktop', percentage: 52, color: '#3b82f6', icon: 'fa-solid fa-desktop' },
    { device: 'Mobile', percentage: 38, color: '#10b981', icon: 'fa-solid fa-mobile-screen' },
    {
      device: 'Tablet',
      percentage: 10,
      color: '#f59e0b',
      icon: 'fa-solid fa-tablet-screen-button',
    },
  ];

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }
}
