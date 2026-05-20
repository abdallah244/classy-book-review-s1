/**
 * 🏠 Home Page Services
 * خدمات مخصصة لصفحة الهوم
 */

// Performance
export * from './home-performance.service';

// Skeleton Loading
export * from './home-skeleton.service';

// Virtual Scroll
export * from './home-virtual-scroll.service';

// Progress Bar
export * from './home-progress-bar.service';

// Security
export * from './home-security.service';

// تصدير كل الخدمات كمصفوفة للـ providers
import { HomePerformanceService } from './home-performance.service';
import { HomeSkeletonService } from './home-skeleton.service';
import { HomeVirtualScrollService } from './home-virtual-scroll.service';
import { HomeProgressBarService } from './home-progress-bar.service';
import { HomeSecurityService } from './home-security.service';

export const HOME_PAGE_SERVICES = [
  HomePerformanceService,
  HomeSkeletonService,
  HomeVirtualScrollService,
  HomeProgressBarService,
  HomeSecurityService,
];
