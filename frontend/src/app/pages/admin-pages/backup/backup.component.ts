import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { ToastService } from '../../../core/services/toast.service';

interface Backup {
  id: string; name: string; size: string; type: 'full' | 'incremental' | 'database';
  status: 'completed' | 'in-progress' | 'failed'; date: string; duration: string;
}

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './backup.component.html',
  styleUrl: './backup.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly toast = inject(ToastService);
  readonly isLoading = signal(true);
  readonly isBackingUp = signal(false);

  readonly stats = [
    { icon: 'fa-solid fa-database', label: 'Total Backups', value: '48', color: '#3b82f6' },
    { icon: 'fa-solid fa-hard-drive', label: 'Storage Used', value: '24.8 GB', color: '#8b5cf6' },
    { icon: 'fa-solid fa-check-circle', label: 'Last Backup', value: '2h ago', color: '#10b981' },
    { icon: 'fa-solid fa-calendar-check', label: 'Auto Backup', value: 'Daily', color: '#f59e0b' },
  ];

  readonly backups = signal<Backup[]>([
    { id: 'BKP-048', name: 'Full System Backup', size: '2.4 GB', type: 'full', status: 'completed', date: '2024-06-15 02:00', duration: '18 min' },
    { id: 'BKP-047', name: 'Database Backup', size: '856 MB', type: 'database', status: 'completed', date: '2024-06-14 14:00', duration: '5 min' },
    { id: 'BKP-046', name: 'Incremental Backup', size: '124 MB', type: 'incremental', status: 'completed', date: '2024-06-14 02:00', duration: '3 min' },
    { id: 'BKP-045', name: 'Full System Backup', size: '2.3 GB', type: 'full', status: 'completed', date: '2024-06-13 02:00', duration: '17 min' },
    { id: 'BKP-044', name: 'Database Backup', size: '0 MB', type: 'database', status: 'failed', date: '2024-06-12 14:00', duration: '-' },
    { id: 'BKP-043', name: 'Incremental Backup', size: '98 MB', type: 'incremental', status: 'completed', date: '2024-06-12 02:00', duration: '2 min' },
  ]);

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => { this.isLoading.set(false); this.progressBar.complete(); }, 400);
  }

  createBackup(type: string): void {
    this.isBackingUp.set(true);
    this.toast.info({ title: 'Backup Started', message: `Creating ${type} backup...` });
    setTimeout(() => {
      this.isBackingUp.set(false);
      this.toast.success({ title: 'Complete', message: `${type} backup created successfully` });
    }, 3000);
  }

  downloadBackup(b: Backup): void { this.toast.info({ title: 'Download', message: `Downloading ${b.name}...` }); }
  restoreBackup(b: Backup): void {
    if (confirm(`Restore from ${b.name} (${b.date})? This will overwrite current data.`)) {
      this.toast.warning({ title: 'Restoring', message: 'Restore in progress...' });
    }
  }
  deleteBackup(b: Backup): void {
    if (confirm(`Delete ${b.name}?`)) this.toast.success({ title: 'Deleted', message: 'Backup removed' });
  }
  getStatusClass(s: string): string { return `status-${s}`; }
  getTypeClass(t: string): string { return `type-${t}`; }
}
