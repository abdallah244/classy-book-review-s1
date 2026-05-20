import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { ToastService } from '../../../core/services/toast.service';

interface ReportCard {
  icon: string;
  title: string;
  description: string;
  color: string;
  lastGenerated: string;
  type: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly toast = inject(ToastService);
  readonly isLoading = signal(true);

  readonly reports: ReportCard[] = [
    {
      icon: 'fa-solid fa-dollar-sign',
      title: 'Revenue Report',
      description: 'Complete financial overview including revenue, expenses, and profit margins',
      color: '#10b981',
      lastGenerated: '2 hours ago',
      type: 'financial',
    },
    {
      icon: 'fa-solid fa-users',
      title: 'Users Report',
      description: 'User registration trends, active users, retention rates, and demographics',
      color: '#3b82f6',
      lastGenerated: '4 hours ago',
      type: 'users',
    },
    {
      icon: 'fa-solid fa-graduation-cap',
      title: 'Courses Report',
      description: 'Course performance, enrollment rates, completion rates, and ratings',
      color: '#8b5cf6',
      lastGenerated: '1 day ago',
      type: 'courses',
    },
    {
      icon: 'fa-solid fa-cart-shopping',
      title: 'Sales Report',
      description: 'Order analytics, conversion rates, popular courses, and revenue per course',
      color: '#f59e0b',
      lastGenerated: '6 hours ago',
      type: 'sales',
    },
    {
      icon: 'fa-solid fa-shield-halved',
      title: 'Security Report',
      description: 'Login attempts, blocked IPs, suspicious activities, and security events',
      color: '#ef4444',
      lastGenerated: '30 min ago',
      type: 'security',
    },
    {
      icon: 'fa-solid fa-chart-line',
      title: 'Performance Report',
      description: 'Server metrics, response times, error rates, and system health',
      color: '#06b6d4',
      lastGenerated: '1 hour ago',
      type: 'performance',
    },
  ];

  readonly recentExports = [
    { name: 'Revenue_Report_June2024.pdf', size: '2.4 MB', date: '2024-06-15', type: 'PDF' },
    { name: 'Users_Report_Q2_2024.xlsx', size: '4.1 MB', date: '2024-06-14', type: 'Excel' },
    { name: 'Sales_Analytics_May2024.csv', size: '1.8 MB', date: '2024-06-10', type: 'CSV' },
    { name: 'Security_Audit_June2024.pdf', size: '3.2 MB', date: '2024-06-08', type: 'PDF' },
  ];

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }

  generateReport(report: ReportCard): void {
    this.toast.info({ title: 'Generating', message: `Generating ${report.title}...` });
  }

  downloadExport(exp: { name: string }): void {
    this.toast.success({ title: 'Download', message: `Downloading ${exp.name}` });
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'PDF':
        return 'fa-solid fa-file-pdf';
      case 'Excel':
        return 'fa-solid fa-file-excel';
      case 'CSV':
        return 'fa-solid fa-file-csv';
      default:
        return 'fa-solid fa-file';
    }
  }
  getFileColor(type: string): string {
    switch (type) {
      case 'PDF':
        return '#ef4444';
      case 'Excel':
        return '#10b981';
      case 'CSV':
        return '#3b82f6';
      default:
        return '#94a3b8';
    }
  }
}
