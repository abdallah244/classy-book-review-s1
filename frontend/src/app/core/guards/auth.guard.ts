import { inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard للتحقق من تسجيل الدخول
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // حفظ الـ URL المطلوب للعودة بعد تسجيل الدخول
  router.navigate(['/auth'], {
    queryParams: { returnUrl: state.url },
  });

  return false;
};

/**
 * Guard للصفحات العامة فقط (مثل صفحة تسجيل الدخول)
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard للتحقق من الدور
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();

    if (!user) {
      router.navigate(['/auth']);
      return false;
    }

    if (allowedRoles.includes(user.role) || user.role === 'super_admin') {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};

/**
 * Guard للتحقق من الصلاحيات
 */
export const permissionGuard = (requiredPermissions: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();

    if (!user) {
      router.navigate(['/auth']);
      return false;
    }

    // Super admin يمكنه الوصول لكل شيء
    if (user.role === 'super_admin' || user.permissions.includes('*')) {
      return true;
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (hasAllPermissions) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};

/**
 * Guard للتحقق من تفعيل البريد الإلكتروني
 */
export const emailVerifiedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();

  if (user?.isEmailVerified) {
    return true;
  }

  router.navigate(['/auth/verify-email']);
  return false;
};
