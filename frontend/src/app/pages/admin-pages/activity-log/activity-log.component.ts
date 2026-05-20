import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiClientService } from '../../../core/services/api-client.service';

interface AuditEntry {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  actionType: string;
  status: string;
  ip: string;
  method?: string;
  path?: string;
  duration?: number;
  userId?: { _id: string; name: string; email: string } | string;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: AuditEntry[];
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  private api = inject(ApiClientService);
  protected readonly i18n = inject(I18nService);
  protected readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly searchQuery = signal('');
  readonly selectedSeverity = signal('all');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalLogs = signal(0);

  readonly stats = signal([
    { icon: 'fa-solid fa-clock-rotate-left', label: 'Total Actions', labelAr: 'إجمالي الإجراءات', value: '0', color: '#3b82f6' },
    { icon: 'fa-solid fa-shield-halved', label: 'Security Events', labelAr: 'أحداث أمنية', value: '0', color: '#ef4444' },
    { icon: 'fa-solid fa-check-circle', label: 'Successful', labelAr: 'ناجحة', value: '0', color: '#10b981' },
    { icon: 'fa-solid fa-xmark-circle', label: 'Failed', labelAr: 'فاشلة', value: '0', color: '#f59e0b' },
  ]);

  readonly activities = signal<AuditEntry[]>([]);

  readonly filteredActivities = computed(() => {
    let list = this.activities();
    const query = this.searchQuery().toLowerCase();
    const severity = this.selectedSeverity();

    if (query) {
      list = list.filter(a =>
        a.action.toLowerCase().includes(query) ||
        a.resource.toLowerCase().includes(query) ||
        (a.path && a.path.toLowerCase().includes(query)) ||
        a.ip.toLowerCase().includes(query) ||
        this.getUserName(a.userId).toLowerCase().includes(query)
      );
    }

    if (severity !== 'all') {
      const statusMap: Record<string, string> = { critical: 'error', warning: 'failure', info: 'success' };
      list = list.filter(a => a.status === statusMap[severity]);
    }

    return list;
  });

  ngOnInit(): void {
    this.progressBar.start();
    this.loadStats();
    this.loadActivities();
  }

  private loadStats(): void {
    this.api.get<AuditStats>('/audit-log/stats').subscribe({
      next: (data) => {
        const loginEvents = (data.byAction['login'] || 0) + (data.byAction['logout'] || 0);
        this.stats.set([
          { icon: 'fa-solid fa-clock-rotate-left', label: 'Total Actions', labelAr: 'إجمالي الإجراءات', value: this.formatNum(data.totalLogs), color: '#3b82f6' },
          { icon: 'fa-solid fa-shield-halved', label: 'Security Events', labelAr: 'أحداث أمنية', value: this.formatNum(loginEvents), color: '#ef4444' },
          { icon: 'fa-solid fa-check-circle', label: 'Successful', labelAr: 'ناجحة', value: this.formatNum(data.byStatus['success'] || 0), color: '#10b981' },
          { icon: 'fa-solid fa-xmark-circle', label: 'Failed', labelAr: 'فاشلة', value: this.formatNum((data.byStatus['failure'] || 0) + (data.byStatus['error'] || 0)), color: '#f59e0b' },
        ]);
      },
      error: () => {},
    });
  }

  private loadActivities(page = 1): void {
    this.api.get<{ data: AuditEntry[]; total: number; pages: number }>('/audit-log/search', {
      params: { page: page.toString(), limit: '30' },
    }).subscribe({
      next: (res) => {
        this.activities.set(res.data);
        this.totalPages.set(res.pages);
        this.totalLogs.set(res.total);
        this.currentPage.set(page);
        this.isLoading.set(false);
        this.progressBar.complete();
      },
      error: () => {
        this.isLoading.set(false);
        this.progressBar.complete();
      },
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSeverityFilter(event: Event): void {
    this.selectedSeverity.set((event.target as HTMLSelectElement).value);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.loadActivities(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.loadActivities(this.currentPage() - 1);
    }
  }

  exportLog(): void {
    const rows = this.activities().map(a => ({
      Action: a.action,
      Resource: a.resource,
      Type: a.actionType,
      Status: a.status,
      User: this.getUserName(a.userId),
      IP: a.ip,
      Method: a.method || '',
      Path: a.path || '',
      Date: new Date(a.createdAt).toLocaleString(),
    }));
    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success({ title: 'Export', message: 'Activity log exported successfully' });
  }

  clearOldLogs(): void {
    this.toast.info({ title: 'Info', message: 'Old logs are automatically cleaned after 1 year' });
  }

  getUserName(userId: AuditEntry['userId']): string {
    if (!userId) return 'System';
    if (typeof userId === 'string') return userId;
    return userId.name || userId.email || 'Unknown';
  }

  getActionIcon(entry: AuditEntry): string {
    const map: Record<string, string> = {
      login: 'fa-solid fa-right-to-bracket',
      logout: 'fa-solid fa-right-from-bracket',
      create: 'fa-solid fa-plus-circle',
      update: 'fa-solid fa-pen-to-square',
      delete: 'fa-solid fa-trash',
      read: 'fa-solid fa-eye',
      other: 'fa-solid fa-circle-info',
    };
    return map[entry.actionType] || 'fa-solid fa-circle-info';
  }

  getActionColor(entry: AuditEntry): string {
    const map: Record<string, string> = {
      login: '#10b981',
      logout: '#6b7280',
      create: '#3b82f6',
      update: '#f59e0b',
      delete: '#ef4444',
      read: '#8b5cf6',
      other: '#94a3b8',
    };
    return map[entry.actionType] || '#94a3b8';
  }

  getSeverityFromStatus(status: string): string {
    if (status === 'error') return 'critical';
    if (status === 'failure') return 'warning';
    return 'info';
  }

  getSeverityClass(status: string): string {
    return `severity-${this.getSeverityFromStatus(status)}`;
  }

  formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  private formatNum(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }
}
