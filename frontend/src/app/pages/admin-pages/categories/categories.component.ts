import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { ToastService } from '../../../core/services/toast.service';

interface Category {
  id: string;
  name: string;
  icon: string;
  courses: number;
  students: number;
  status: 'active' | 'inactive';
  color: string;
  createdAt: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly toast = inject(ToastService);
  readonly isLoading = signal(true);

  readonly categories = signal<Category[]>([
    {
      id: 'CAT-001',
      name: 'Programming',
      icon: 'fa-solid fa-code',
      courses: 320,
      students: 15600,
      status: 'active',
      color: '#3b82f6',
      createdAt: '2023-06-01',
    },
    {
      id: 'CAT-002',
      name: 'Design',
      icon: 'fa-solid fa-paint-brush',
      courses: 180,
      students: 8900,
      status: 'active',
      color: '#ec4899',
      createdAt: '2023-06-01',
    },
    {
      id: 'CAT-003',
      name: 'Marketing',
      icon: 'fa-solid fa-bullhorn',
      courses: 150,
      students: 7200,
      status: 'active',
      color: '#f59e0b',
      createdAt: '2023-06-15',
    },
    {
      id: 'CAT-004',
      name: 'Languages',
      icon: 'fa-solid fa-language',
      courses: 200,
      students: 12400,
      status: 'active',
      color: '#10b981',
      createdAt: '2023-07-01',
    },
    {
      id: 'CAT-005',
      name: 'AI & Machine Learning',
      icon: 'fa-solid fa-brain',
      courses: 95,
      students: 5600,
      status: 'active',
      color: '#8b5cf6',
      createdAt: '2023-08-20',
    },
    {
      id: 'CAT-006',
      name: 'Business',
      icon: 'fa-solid fa-briefcase',
      courses: 140,
      students: 6800,
      status: 'active',
      color: '#06b6d4',
      createdAt: '2023-07-15',
    },
    {
      id: 'CAT-007',
      name: 'Photography',
      icon: 'fa-solid fa-camera',
      courses: 65,
      students: 3200,
      status: 'active',
      color: '#f97316',
      createdAt: '2024-01-10',
    },
    {
      id: 'CAT-008',
      name: 'Music',
      icon: 'fa-solid fa-music',
      courses: 42,
      students: 1800,
      status: 'inactive',
      color: '#ef4444',
      createdAt: '2024-02-15',
    },
  ]);

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }

  editCategory(cat: Category): void {
    this.toast.info({ title: 'Edit', message: `Editing ${cat.name}` });
  }
  deleteCategory(cat: Category): void {
    if (confirm(`Delete "${cat.name}"?`))
      this.toast.success({ title: 'Deleted', message: `${cat.name} removed` });
  }
  toggleStatus(cat: Category): void {
    this.toast.success({ title: 'Updated', message: `${cat.name} status toggled` });
  }
}
