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
import { ToastService } from '../../../core/services/toast.service';

interface Order {
  id: string;
  customer: string;
  email: string;
  course: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  paymentMethod: string;
  date: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly toast = inject(ToastService);
  readonly isLoading = signal(true);
  readonly searchQuery = signal('');
  readonly selectedStatus = signal('all');

  readonly stats = [
    {
      icon: 'fa-solid fa-cart-shopping',
      label: 'Total Orders',
      value: '8,456',
      trend: '+15.3%',
      color: '#3b82f6',
      up: true,
    },
    {
      icon: 'fa-solid fa-check-circle',
      label: 'Completed',
      value: '7,234',
      trend: '+12.1%',
      color: '#10b981',
      up: true,
    },
    {
      icon: 'fa-solid fa-clock',
      label: 'Pending',
      value: '189',
      trend: '-3.2%',
      color: '#f59e0b',
      up: false,
    },
    {
      icon: 'fa-solid fa-rotate-left',
      label: 'Refunded',
      value: '1,033',
      trend: '+2.1%',
      color: '#ef4444',
      up: true,
    },
  ];

  readonly orders = signal<Order[]>([
    {
      id: '#ORD-4521',
      customer: 'Ahmed Hassan',
      email: 'ahmed@email.com',
      course: 'Full-Stack Web Development',
      amount: 99.99,
      status: 'completed',
      paymentMethod: 'Credit Card',
      date: '2024-06-15 14:32',
    },
    {
      id: '#ORD-4520',
      customer: 'Sara Mohamed',
      email: 'sara@email.com',
      course: 'UI/UX Design Masterclass',
      amount: 79.99,
      status: 'completed',
      paymentMethod: 'PayPal',
      date: '2024-06-15 12:18',
    },
    {
      id: '#ORD-4519',
      customer: 'Omar Ali',
      email: 'omar@email.com',
      course: 'Digital Marketing Pro',
      amount: 69.99,
      status: 'pending',
      paymentMethod: 'Credit Card',
      date: '2024-06-15 10:45',
    },
    {
      id: '#ORD-4518',
      customer: 'Nour Adel',
      email: 'nour@email.com',
      course: 'Python for Data Science',
      amount: 89.99,
      status: 'refunded',
      paymentMethod: 'Paymob',
      date: '2024-06-14 18:20',
    },
    {
      id: '#ORD-4517',
      customer: 'Layla Mostafa',
      email: 'layla@email.com',
      course: 'React Native Mobile Apps',
      amount: 84.99,
      status: 'completed',
      paymentMethod: 'Credit Card',
      date: '2024-06-14 15:55',
    },
    {
      id: '#ORD-4516',
      customer: 'Youssef Tarek',
      email: 'youssef@email.com',
      course: 'Business Strategy 101',
      amount: 59.99,
      status: 'failed',
      paymentMethod: 'Credit Card',
      date: '2024-06-14 09:30',
    },
    {
      id: '#ORD-4515',
      customer: 'Fatma Khaled',
      email: 'fatma@email.com',
      course: 'Full-Stack Web Development',
      amount: 99.99,
      status: 'completed',
      paymentMethod: 'Stripe',
      date: '2024-06-13 22:10',
    },
  ]);

  readonly filteredOrders = computed(() => {
    let result = this.orders();
    const q = this.searchQuery().toLowerCase();
    if (q)
      result = result.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.course.toLowerCase().includes(q),
      );
    if (this.selectedStatus() !== 'all')
      result = result.filter((o) => o.status === this.selectedStatus());
    return result;
  });

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }

  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }
  onStatusFilter(e: Event): void {
    this.selectedStatus.set((e.target as HTMLSelectElement).value);
  }
  viewOrder(order: Order): void {
    this.toast.info({ title: 'Details', message: `Viewing ${order.id}` });
  }
  refundOrder(order: Order): void {
    if (confirm(`Refund ${order.id}?`))
      this.toast.success({ title: 'Refunded', message: `${order.id} refunded` });
  }
  getStatusClass(s: string): string {
    return `status-${s}`;
  }
}
