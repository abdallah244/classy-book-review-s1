import { inject } from '@angular/core';
import { Router, CanActivateFn, CanDeactivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionTimerService } from '../services/session-timer.service';
import { MasterCodeService } from '../services/master-code.service';

/**
 * مسح جلسة الأدمن بالكامل
 */
function clearAdminSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('sessionStartTime');
  localStorage.removeItem('master_code_attempts');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('master_code_verified');
}

/**
 * Guard للتحقق من صلاحيات الأدمن
 * يمنع الوصول لصفحات الأدمن بدون تسجيل دخول وبدون صلاحيات
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // التحقق من وجود token
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  if (!token) {
    console.warn('🔒 No access token found - redirecting to admin login');
    router.navigate(['/admin/login']);
    return false;
  }

  // التحقق من بيانات المستخدم
  const adminData = authService.getAdminData();

  if (!adminData) {
    // محاولة التحقق من البيانات المخزنة محلياً
    const storedUser = localStorage.getItem('adminUser');
    if (!storedUser) {
      console.warn('🔒 No admin data found - redirecting to admin login');
      router.navigate(['/admin/login']);
      return false;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        console.warn('🔒 User is not admin - redirecting to home');
        router.navigate(['/']);
        return false;
      }
    } catch {
      router.navigate(['/admin/login']);
      return false;
    }
  }

  return true;
};

/**
 * Guard لتسجيل الخروج عند مغادرة صفحات الأدمن
 * يُستخدم مع canDeactivate
 */
export const adminDeactivateGuard: CanDeactivateFn<unknown> = (
  component,
  currentRoute,
  currentState,
  nextState,
) => {
  // التحقق إذا كان المستخدم يغادر منطقة الأدمن
  const nextUrl = nextState?.url || '';
  const isLeavingAdminArea = !nextUrl.startsWith('/admin');

  if (isLeavingAdminArea) {
    // مسح جلسة الأدمن
    console.log('🚪 Leaving admin area - clearing session');

    const sessionTimer = inject(SessionTimerService);
    const masterCode = inject(MasterCodeService);

    sessionTimer.clearSession();
    masterCode.clearSession();
    clearAdminSession();
  }

  return true;
};

/**
 * Guard لصفحة تسجيل دخول الأدمن
 * يمنع الوصول إذا كان الأدمن مسجل دخوله بالفعل
 */
export const adminLoginGuard: CanActivateFn = () => {
  const router = inject(Router);

  // التحقق من وجود token وبيانات الأدمن
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const adminUser = localStorage.getItem('adminUser');

  if (token && adminUser) {
    try {
      const user = JSON.parse(adminUser);
      if (user.role === 'admin' || user.role === 'super_admin') {
        console.log('✅ Admin already logged in - redirecting to dashboard');
        router.navigate(['/admin/dashboard']);
        return false;
      }
    } catch {
      // البيانات غير صالحة، اسمح بالدخول لصفحة login
    }
  }

  return true;
};
