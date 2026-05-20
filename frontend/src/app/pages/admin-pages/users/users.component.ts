import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'banned';
  joinDate: string;
  lastLogin: string;
  courses: number;
  avatar: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  protected readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly searchQuery = signal('');
  readonly selectedRole = signal('all');
  readonly selectedStatus = signal('all');
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly stats = [
    {
      icon: 'fa-solid fa-users',
      label: 'Total Users',
      value: '12,458',
      trend: '+12.5%',
      color: '#3b82f6',
      up: true,
    },
    {
      icon: 'fa-solid fa-user-check',
      label: 'Active Users',
      value: '10,234',
      trend: '+8.3%',
      color: '#10b981',
      up: true,
    },
    {
      icon: 'fa-solid fa-user-plus',
      label: 'New This Month',
      value: '847',
      trend: '+23.1%',
      color: '#8b5cf6',
      up: true,
    },
    {
      icon: 'fa-solid fa-user-slash',
      label: 'Banned Users',
      value: '56',
      trend: '-5.2%',
      color: '#ef4444',
      up: false,
    },
  ];

  readonly roles = ['all', 'student', 'instructor', 'admin', 'super_admin'];
  readonly statuses = ['all', 'active', 'inactive', 'banned'];

  readonly users = signal<User[]>([
    {
      id: 'USR-001',
      name: 'Ahmed Hassan',
      email: 'ahmed@email.com',
      role: 'student',
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2 hours ago',
      courses: 8,
      avatar: 'AH',
    },
    {
      id: 'USR-002',
      name: 'Sara Mohamed',
      email: 'sara@email.com',
      role: 'instructor',
      status: 'active',
      joinDate: '2023-11-20',
      lastLogin: '30 min ago',
      courses: 12,
      avatar: 'SM',
    },
    {
      id: 'USR-003',
      name: 'Omar Ali',
      email: 'omar@email.com',
      role: 'student',
      status: 'active',
      joinDate: '2024-03-08',
      lastLogin: '1 day ago',
      courses: 3,
      avatar: 'OA',
    },
    {
      id: 'USR-004',
      name: 'Fatma Khaled',
      email: 'fatma@email.com',
      role: 'student',
      status: 'inactive',
      joinDate: '2024-02-14',
      lastLogin: '2 weeks ago',
      courses: 5,
      avatar: 'FK',
    },
    {
      id: 'USR-005',
      name: 'Mohamed Ibrahim',
      email: 'mohamed@email.com',
      role: 'admin',
      status: 'active',
      joinDate: '2023-06-01',
      lastLogin: '5 min ago',
      courses: 0,
      avatar: 'MI',
    },
    {
      id: 'USR-006',
      name: 'Nour Adel',
      email: 'nour@email.com',
      role: 'student',
      status: 'banned',
      joinDate: '2024-04-22',
      lastLogin: '1 month ago',
      courses: 2,
      avatar: 'NA',
    },
    {
      id: 'USR-007',
      name: 'Youssef Tarek',
      email: 'youssef@email.com',
      role: 'instructor',
      status: 'active',
      joinDate: '2023-09-10',
      lastLogin: '1 hour ago',
      courses: 15,
      avatar: 'YT',
    },
    {
      id: 'USR-008',
      name: 'Layla Mostafa',
      email: 'layla@email.com',
      role: 'student',
      status: 'active',
      joinDate: '2024-05-30',
      lastLogin: '3 hours ago',
      courses: 6,
      avatar: 'LM',
    },
  ]);

  readonly filteredUsers = computed(() => {
    let result = this.users();
    const q = this.searchQuery().toLowerCase();
    if (q)
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    if (this.selectedRole() !== 'all')
      result = result.filter((u) => u.role === this.selectedRole());
    if (this.selectedStatus() !== 'all')
      result = result.filter((u) => u.status === this.selectedStatus());
    return result;
  });

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onRoleFilter(event: Event): void {
    this.selectedRole.set((event.target as HTMLSelectElement).value);
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
  }

  toggleUserStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.toast.success({ title: 'Updated', message: `${user.name} is now ${newStatus}` });
  }

  banUser(user: User): void {
    this.toast.warning({ title: 'Banned', message: `${user.name} has been banned` });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.toast.success({ title: 'Deleted', message: `${user.name} has been removed` });
    }
  }

  exportUsers(): void {
    this.toast.info({ title: 'Export', message: 'Exporting users data...' });
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
  getRoleClass(role: string): string {
    return `role-${role}`;
  }
}
