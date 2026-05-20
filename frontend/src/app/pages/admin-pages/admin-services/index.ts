/**
 * 🔐 Admin Services
 * خدمات مخصصة لصفحات الأدمن
 */

// Performance
export * from './admin-performance.service';

// Skeleton Loading
export * from './admin-skeleton.service';

// Progress Bar
export * from './admin-progress-bar.service';

// Security
export * from './admin-security.service';

// تصدير كل الخدمات كمصفوفة للـ providers
import { AdminPerformanceService } from './admin-performance.service';
import { AdminSkeletonService } from './admin-skeleton.service';
import { AdminProgressBarService } from './admin-progress-bar.service';
import { AdminSecurityService } from './admin-security.service';

export const ADMIN_PAGE_SERVICES = [
  AdminPerformanceService,
  AdminSkeletonService,
  AdminProgressBarService,
  AdminSecurityService,
];
