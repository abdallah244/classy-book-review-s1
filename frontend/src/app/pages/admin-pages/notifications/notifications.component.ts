import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { ToastService } from '../../../core/services/toast.service';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: string;
  sent: number;
  read: number;
  date: string;
  icon: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly toast = inject(ToastService);
  readonly isLoading = signal(true);
  readonly showCompose = signal(false);

  readonly stats = [
    { icon: 'fa-solid fa-bell', label: 'Total Sent', value: '24,567', color: '#3b82f6' },
    { icon: 'fa-solid fa-eye', label: 'Read Rate', value: '78.3%', color: '#10b981' },
    { icon: 'fa-solid fa-paper-plane', label: 'This Week', value: '156', color: '#8b5cf6' },
    { icon: 'fa-solid fa-users', label: 'Subscribers', value: '10,234', color: '#f59e0b' },
  ];

  readonly notifications = signal<Notification[]>([
    {
      id: 'NOT-001',
      title: 'New Course Launch',
      message: 'Full-Stack Development Bootcamp is now live! Start your journey today.',
      type: 'info',
      target: 'All Users',
      sent: 10234,
      read: 7845,
      date: '2024-06-15 10:00',
      icon: 'fa-solid fa-rocket',
    },
    {
      id: 'NOT-002',
      title: 'Maintenance Notice',
      message: 'Platform will be undergoing maintenance on June 20th from 2:00 AM to 4:00 AM.',
      type: 'warning',
      target: 'All Users',
      sent: 10234,
      read: 5621,
      date: '2024-06-14 16:30',
      icon: 'fa-solid fa-wrench',
    },
    {
      id: 'NOT-003',
      title: 'Flash Sale - 50% Off',
      message: 'Limited time offer! Get 50% off on all courses this weekend.',
      type: 'success',
      target: 'Students',
      sent: 8456,
      read: 6234,
      date: '2024-06-13 09:00',
      icon: 'fa-solid fa-tag',
    },
    {
      id: 'NOT-004',
      title: 'Security Alert',
      message: 'We detected unusual activity from your region. Please verify your account.',
      type: 'error',
      target: 'Flagged Users',
      sent: 23,
      read: 18,
      date: '2024-06-12 22:15',
      icon: 'fa-solid fa-shield-halved',
    },
    {
      id: 'NOT-005',
      title: 'Certificate Available',
      message: 'Congratulations! Your certificate for UI/UX Design Masterclass is ready.',
      type: 'success',
      target: 'Completers',
      sent: 1856,
      read: 1456,
      date: '2024-06-11 14:00',
      icon: 'fa-solid fa-certificate',
    },
  ]);

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }

  toggleCompose(): void {
    this.showCompose.set(!this.showCompose());
  }
  sendNotification(): void {
    this.toast.success({ title: 'Sent', message: 'Notification sent successfully!' });
    this.showCompose.set(false);
  }
  deleteNotification(n: Notification): void {
    if (confirm(`Delete "${n.title}"?`))
      this.toast.success({ title: 'Deleted', message: 'Notification removed' });
  }
  resendNotification(n: Notification): void {
    this.toast.info({ title: 'Resent', message: `"${n.title}" resent` });
  }
  getTypeClass(t: string): string {
    return `type-${t}`;
  }
  getReadRate(n: Notification): number {
    return n.sent > 0 ? Math.round((n.read / n.sent) * 100) : 0;
  }
}
