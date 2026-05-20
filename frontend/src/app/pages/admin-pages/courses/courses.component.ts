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
import { ToastService } from '../../../core/services/toast.service';

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  students: number;
  rating: number;
  price: number;
  status: 'published' | 'draft' | 'review';
  thumbnail: string;
  lessons: number;
  createdAt: string;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly i18n = inject(I18nService);
  protected readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly searchQuery = signal('');
  readonly selectedCategory = signal('all');
  readonly selectedStatus = signal('all');
  readonly viewMode = signal<'grid' | 'table'>('grid');

  readonly stats = [
    {
      icon: 'fa-solid fa-graduation-cap',
      label: 'Total Courses',
      value: '1,247',
      trend: '+18.2%',
      color: '#3b82f6',
      up: true,
    },
    {
      icon: 'fa-solid fa-book-open',
      label: 'Published',
      value: '1,089',
      trend: '+12.5%',
      color: '#10b981',
      up: true,
    },
    {
      icon: 'fa-solid fa-users',
      label: 'Total Enrollments',
      value: '45,678',
      trend: '+25.3%',
      color: '#8b5cf6',
      up: true,
    },
    {
      icon: 'fa-solid fa-star',
      label: 'Avg Rating',
      value: '4.7',
      trend: '+0.2',
      color: '#f59e0b',
      up: true,
    },
  ];

  readonly categories = [
    'all',
    'Programming',
    'Design',
    'Marketing',
    'Languages',
    'AI & ML',
    'Business',
  ];

  readonly courses = signal<Course[]>([
    {
      id: 'CRS-001',
      title: 'Full-Stack Web Development',
      instructor: 'Youssef Tarek',
      category: 'Programming',
      students: 2340,
      rating: 4.9,
      price: 99.99,
      status: 'published',
      thumbnail: '🖥️',
      lessons: 64,
      createdAt: '2024-01-15',
    },
    {
      id: 'CRS-002',
      title: 'UI/UX Design Masterclass',
      instructor: 'Sara Ahmed',
      category: 'Design',
      students: 1856,
      rating: 4.8,
      price: 79.99,
      status: 'published',
      thumbnail: '🎨',
      lessons: 42,
      createdAt: '2024-02-20',
    },
    {
      id: 'CRS-003',
      title: 'Digital Marketing Pro',
      instructor: 'Ahmed Hassan',
      category: 'Marketing',
      students: 1200,
      rating: 4.7,
      price: 69.99,
      status: 'published',
      thumbnail: '📱',
      lessons: 38,
      createdAt: '2024-03-10',
    },
    {
      id: 'CRS-004',
      title: 'Python for Data Science',
      instructor: 'Mohamed Ibrahim',
      category: 'AI & ML',
      students: 980,
      rating: 4.8,
      price: 89.99,
      status: 'published',
      thumbnail: '🐍',
      lessons: 55,
      createdAt: '2024-01-25',
    },
    {
      id: 'CRS-005',
      title: 'React Native Mobile Apps',
      instructor: 'Youssef Tarek',
      category: 'Programming',
      students: 756,
      rating: 4.6,
      price: 84.99,
      status: 'review',
      thumbnail: '📲',
      lessons: 48,
      createdAt: '2024-04-05',
    },
    {
      id: 'CRS-006',
      title: 'Business Strategy 101',
      instructor: 'Layla Mostafa',
      category: 'Business',
      students: 0,
      rating: 0,
      price: 59.99,
      status: 'draft',
      thumbnail: '💼',
      lessons: 28,
      createdAt: '2024-05-01',
    },
  ]);

  readonly filteredCourses = computed(() => {
    let result = this.courses();
    const q = this.searchQuery().toLowerCase();
    if (q)
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q),
      );
    if (this.selectedCategory() !== 'all')
      result = result.filter((c) => c.category === this.selectedCategory());
    if (this.selectedStatus() !== 'all')
      result = result.filter((c) => c.status === this.selectedStatus());
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
  onCategoryFilter(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
  }
  onStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
  }
  toggleView(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'table' : 'grid');
  }

  editCourse(course: Course): void {
    this.toast.info({ title: 'Edit', message: `Editing ${course.title}` });
  }
  deleteCourse(course: Course): void {
    if (confirm(`Delete "${course.title}"?`)) {
      this.toast.success({ title: 'Deleted', message: `${course.title} removed` });
    }
  }
  getStatusClass(s: string): string {
    return `status-${s}`;
  }
  getStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}
