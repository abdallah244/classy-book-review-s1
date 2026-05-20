import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directive لإظهار/إخفاء العناصر بناءً على الصلاحيات
 *
 * استخدام:
 * <button *hasPermission="'courses.create'">إنشاء دورة</button>
 * <button *hasPermission="['courses.create', 'courses.update']">إنشاء/تعديل</button>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  @Input() set hasPermission(permissions: string | string[]) {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

    effect(() => {
      const user = this.authService.user();

      if (!user) {
        this.hideElement();
        return;
      }

      // Super admin يرى كل شيء
      if (user.role === 'super_admin' || user.permissions.includes('*')) {
        this.showElement();
        return;
      }

      // التحقق من الصلاحيات
      const hasPermission = permissionArray.some((permission) =>
        user.permissions.includes(permission),
      );

      if (hasPermission) {
        this.showElement();
      } else {
        this.hideElement();
      }
    });
  }

  private showElement(): void {
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }

  private hideElement(): void {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Directive لإظهار/إخفاء العناصر بناءً على الدور
 *
 * استخدام:
 * <button *hasRole="'admin'">إدارة</button>
 * <button *hasRole="['admin', 'teacher']">المعلمين والإدارة</button>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  @Input() set hasRole(roles: string | string[]) {
    const roleArray = Array.isArray(roles) ? roles : [roles];

    effect(() => {
      const user = this.authService.user();

      if (!user) {
        this.hideElement();
        return;
      }

      // Super admin يرى كل شيء
      if (user.role === 'super_admin') {
        this.showElement();
        return;
      }

      if (roleArray.includes(user.role)) {
        this.showElement();
      } else {
        this.hideElement();
      }
    });
  }

  private showElement(): void {
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }

  private hideElement(): void {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Directive لإظهار العناصر فقط للمستخدمين المسجلين
 */
@Directive({
  selector: '[isAuthenticated]',
  standalone: true,
})
export class IsAuthenticatedDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  constructor() {
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();

      if (isAuthenticated && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!isAuthenticated && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}

/**
 * Directive لإظهار العناصر فقط للزوار
 */
@Directive({
  selector: '[isGuest]',
  standalone: true,
})
export class IsGuestDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  constructor() {
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();

      if (!isAuthenticated && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (isAuthenticated && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
