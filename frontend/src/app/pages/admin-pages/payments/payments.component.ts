import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { ADMIN_PAGE_SERVICES, AdminProgressBarService } from '../admin-services';
import { ToastService } from '../../../core/services/toast.service';

interface Payment {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  fee: number;
  net: number;
  method: string;
  gateway: string;
  status: 'successful' | 'pending' | 'failed' | 'refunded';
  date: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, AdminLayoutComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css',
  providers: [...ADMIN_PAGE_SERVICES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent implements OnInit {
  private progressBar = inject(AdminProgressBarService);
  protected readonly toast = inject(ToastService);
  readonly isLoading = signal(true);

  readonly stats = [
    {
      icon: 'fa-solid fa-dollar-sign',
      label: 'Total Revenue',
      value: '$284,567',
      color: '#10b981',
    },
    { icon: 'fa-solid fa-credit-card', label: 'Transactions', value: '8,456', color: '#3b82f6' },
    { icon: 'fa-solid fa-percent', label: 'Avg. Order Value', value: '$78.50', color: '#8b5cf6' },
    { icon: 'fa-solid fa-rotate-left', label: 'Total Refunds', value: '$12,340', color: '#ef4444' },
  ];

  readonly payments = signal<Payment[]>([
    {
      id: 'PAY-7821',
      orderId: '#ORD-4521',
      customer: 'Ahmed Hassan',
      amount: 99.99,
      fee: 2.9,
      net: 97.09,
      method: 'Credit Card',
      gateway: 'Stripe',
      status: 'successful',
      date: '2024-06-15 14:32',
    },
    {
      id: 'PAY-7820',
      orderId: '#ORD-4520',
      customer: 'Sara Mohamed',
      amount: 79.99,
      fee: 2.32,
      net: 77.67,
      method: 'PayPal',
      gateway: 'PayPal',
      status: 'successful',
      date: '2024-06-15 12:18',
    },
    {
      id: 'PAY-7819',
      orderId: '#ORD-4519',
      customer: 'Omar Ali',
      amount: 69.99,
      fee: 2.03,
      net: 67.96,
      method: 'Credit Card',
      gateway: 'Paymob',
      status: 'pending',
      date: '2024-06-15 10:45',
    },
    {
      id: 'PAY-7818',
      orderId: '#ORD-4518',
      customer: 'Nour Adel',
      amount: 89.99,
      fee: 0,
      net: -89.99,
      method: 'Refund',
      gateway: 'Stripe',
      status: 'refunded',
      date: '2024-06-14 18:20',
    },
    {
      id: 'PAY-7817',
      orderId: '#ORD-4517',
      customer: 'Layla Mostafa',
      amount: 84.99,
      fee: 2.47,
      net: 82.52,
      method: 'Credit Card',
      gateway: 'Stripe',
      status: 'successful',
      date: '2024-06-14 15:55',
    },
    {
      id: 'PAY-7816',
      orderId: '#ORD-4516',
      customer: 'Youssef Tarek',
      amount: 59.99,
      fee: 0,
      net: 0,
      method: 'Credit Card',
      gateway: 'Paymob',
      status: 'failed',
      date: '2024-06-14 09:30',
    },
  ]);

  ngOnInit(): void {
    this.progressBar.start();
    setTimeout(() => {
      this.isLoading.set(false);
      this.progressBar.complete();
    }, 400);
  }

  getStatusClass(s: string): string {
    return `status-${s}`;
  }
  exportPayments(): void {
    this.toast.info({ title: 'Export', message: 'Exporting payment records...' });
  }
}
