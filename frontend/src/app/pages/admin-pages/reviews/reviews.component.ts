import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { ToastService } from '../../../core/services/toast.service';

interface Review {
  id: string;
  user: string;
  avatar: string;
  course: string;
  rating: number;
  comment: string;
  status: 'approved' | 'pending' | 'rejected';
  date: string;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly toast = inject(ToastService);
  readonly isLoading = signal(true);

  readonly stats = [
    { icon: 'fa-solid fa-star', label: 'Total Reviews', value: '6,789', color: '#f59e0b' },
    { icon: 'fa-solid fa-check-circle', label: 'Approved', value: '5,432', color: '#10b981' },
    { icon: 'fa-solid fa-clock', label: 'Pending', value: '234', color: '#3b82f6' },
    { icon: 'fa-solid fa-chart-simple', label: 'Avg Rating', value: '4.7', color: '#8b5cf6' },
  ];

  readonly reviews = signal<Review[]>([
    {
      id: 'REV-001',
      user: 'Ahmed Hassan',
      avatar: 'AH',
      course: 'Full-Stack Web Development',
      rating: 5,
      comment:
        'Excellent course! The instructor explains complex concepts in a very clear way. Highly recommended for anyone looking to become a full-stack developer.',
      status: 'approved',
      date: '2024-06-15',
    },
    {
      id: 'REV-002',
      user: 'Sara Mohamed',
      avatar: 'SM',
      course: 'UI/UX Design Masterclass',
      rating: 4,
      comment:
        'Great course overall. Would love to see more real-world project examples. The Figma tutorials were especially helpful.',
      status: 'approved',
      date: '2024-06-14',
    },
    {
      id: 'REV-003',
      user: 'Omar Ali',
      avatar: 'OA',
      course: 'Digital Marketing Pro',
      rating: 5,
      comment:
        'This course changed my understanding of digital marketing. Very practical and up-to-date with the latest trends.',
      status: 'pending',
      date: '2024-06-14',
    },
    {
      id: 'REV-004',
      user: 'Nour Adel',
      avatar: 'NA',
      course: 'Python for Data Science',
      rating: 3,
      comment: 'Good content but some videos need updating. The exercises are great though.',
      status: 'pending',
      date: '2024-06-13',
    },
    {
      id: 'REV-005',
      user: 'Layla Mostafa',
      avatar: 'LM',
      course: 'React Native Mobile Apps',
      rating: 5,
      comment: 'Best React Native course available! Built my first app within 2 weeks of starting.',
      status: 'approved',
      date: '2024-06-12',
    },
    {
      id: 'REV-006',
      user: 'Youssef Tarek',
      avatar: 'YT',
      course: 'Business Strategy 101',
      rating: 2,
      comment: 'Content seems outdated and lacks depth. Expected more from this course.',
      status: 'rejected',
      date: '2024-06-11',
    },
  ]);

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }

  approveReview(r: Review): void {
    this.toast.success({ title: 'Approved', message: `Review by ${r.user} approved` });
  }
  rejectReview(r: Review): void {
    this.toast.warning({ title: 'Rejected', message: `Review by ${r.user} rejected` });
  }
  deleteReview(r: Review): void {
    if (confirm(`Delete review by ${r.user}?`))
      this.toast.success({ title: 'Deleted', message: 'Review removed' });
  }

  getStars(n: number): number[] {
    return Array(n).fill(0);
  }
  getEmptyStars(n: number): number[] {
    return Array(5 - n).fill(0);
  }
  getStatusClass(s: string): string {
    return `status-${s}`;
  }
}
