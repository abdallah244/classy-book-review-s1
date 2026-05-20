import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MasterCodeService } from '../../../core/services/master-code.service';

// ─── Interfaces ───
interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  isPrimaryAdmin?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

interface PageOption {
  key: string;
  icon: string;
  labelAr: string;
  labelEn: string;
}

@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayoutComponent],
  templateUrl: './roles-permissions.component.html',
  styleUrl: './roles-permissions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPermissionsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/users`;

  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly masterCode = inject(MasterCodeService);

  readonly currentLang = this.i18n.language;
  readonly currentTheme = this.theme.effectiveTheme;
  readonly currentDirection = this.i18n.direction;

  // Data
  readonly loading = signal(true);
  readonly staff = signal<StaffMember[]>([]);
  readonly selectedStaff = signal<StaffMember | null>(null);
  readonly saving = signal(false);

  // Modal
  readonly showAddModal = signal(false);
  newStaff = { name: '', email: '', password: '', permissions: [] as string[] };

  // Available pages for assignment
  readonly pages: PageOption[] = [
    {
      key: 'dashboard',
      icon: 'fa-solid fa-gauge-high',
      labelAr: 'لوحة المعلومات',
      labelEn: 'Dashboard',
    },
    { key: 'users', icon: 'fa-solid fa-users', labelAr: 'المستخدمون', labelEn: 'Users' },
    { key: 'courses', icon: 'fa-solid fa-graduation-cap', labelAr: 'الدورات', labelEn: 'Courses' },
    {
      key: 'categories',
      icon: 'fa-solid fa-layer-group',
      labelAr: 'الفئات',
      labelEn: 'Categories',
    },
    { key: 'orders', icon: 'fa-solid fa-cart-shopping', labelAr: 'الطلبات', labelEn: 'Orders' },
    { key: 'payments', icon: 'fa-solid fa-credit-card', labelAr: 'المدفوعات', labelEn: 'Payments' },
    { key: 'reviews', icon: 'fa-solid fa-star', labelAr: 'المراجعات', labelEn: 'Reviews' },
    { key: 'reports', icon: 'fa-solid fa-chart-bar', labelAr: 'التقارير', labelEn: 'Reports' },
    {
      key: 'analytics',
      icon: 'fa-solid fa-chart-line',
      labelAr: 'الإحصائيات',
      labelEn: 'Analytics',
    },
    {
      key: 'monitoring',
      icon: 'fa-solid fa-shield-halved',
      labelAr: 'المراقبة',
      labelEn: 'Monitoring',
    },
    {
      key: 'notifications',
      icon: 'fa-solid fa-bell',
      labelAr: 'الإشعارات',
      labelEn: 'Notifications',
    },
    { key: 'settings', icon: 'fa-solid fa-gear', labelAr: 'الإعدادات', labelEn: 'Settings' },
    { key: 'backup', icon: 'fa-solid fa-database', labelAr: 'النسخ الاحتياطي', labelEn: 'Backup' },
    {
      key: 'activity-log',
      icon: 'fa-solid fa-clock-rotate-left',
      labelAr: 'سجل العمليات',
      labelEn: 'Activity Log',
    },
  ];

  readonly t = computed(() => this.getTranslations());

  ngOnInit(): void {
    this.verifyAndLoad();
  }

  private async verifyAndLoad(): Promise<void> {
    const isVerified = await this.masterCode.verifyMasterCode();
    if (!isVerified) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    this.loadStaff();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  loadStaff(): void {
    this.loading.set(true);
    const headers = this.getAuthHeaders();

    this.http
      .get<any>(`${this.apiUrl}?role=admin&limit=100`, { headers })
      .pipe(catchError(() => of({ data: [] })))
      .subscribe((response) => {
        const list = Array.isArray(response) ? response : response.data || [];
        this.staff.set(list.filter((s: StaffMember) => s.role === 'admin' && !s.isPrimaryAdmin));
        this.loading.set(false);
      });
  }

  selectStaff(member: StaffMember): void {
    this.selectedStaff.set({ ...member });
  }

  getPageCount(member: StaffMember): number {
    return member.permissions.filter((p) => p.startsWith('page:')).length;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // ─── Selected staff page management ───
  hasPage(key: string): boolean {
    const s = this.selectedStaff();
    return s ? s.permissions.includes(`page:${key}`) : false;
  }

  togglePage(key: string): void {
    const s = this.selectedStaff();
    if (!s) return;
    const perm = `page:${key}`;
    const has = s.permissions.includes(perm);
    this.selectedStaff.set({
      ...s,
      permissions: has ? s.permissions.filter((p) => p !== perm) : [...s.permissions, perm],
    });
  }

  toggleAllPages(): void {
    const s = this.selectedStaff();
    if (!s) return;
    const allPagePerms = this.pages.map((p) => `page:${p.key}`);
    const allSelected = allPagePerms.every((p) => s.permissions.includes(p));
    const nonPagePerms = s.permissions.filter((p) => !p.startsWith('page:'));
    this.selectedStaff.set({
      ...s,
      permissions: allSelected ? nonPagePerms : [...nonPagePerms, ...allPagePerms],
    });
  }

  get allPagesSelected(): boolean {
    const s = this.selectedStaff();
    if (!s) return false;
    return this.pages.every((p) => s.permissions.includes(`page:${p.key}`));
  }

  savePermissions(): void {
    const s = this.selectedStaff();
    if (!s) return;
    this.saving.set(true);
    const toastId = this.toast.loading(this.currentLang() === 'ar' ? 'جاري الحفظ...' : 'Saving...');
    const headers = this.getAuthHeaders();

    this.http
      .patch<any>(
        `${this.apiUrl}/${s._id}/permissions`,
        { permissions: s.permissions },
        { headers },
      )
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          const perms = result?.permissions || s.permissions;
          this.staff.update((list) =>
            list.map((m) => (m._id === s._id ? { ...m, permissions: perms } : m)),
          );
          this.toast.update(toastId, {
            type: 'success',
            title: this.currentLang() === 'ar' ? 'تم حفظ الصلاحيات' : 'Permissions saved',
            duration: 4000,
            dismissible: true,
          });
        },
        error: () => {
          this.saving.set(false);
          this.toast.update(toastId, {
            type: 'error',
            title: this.currentLang() === 'ar' ? 'فشل الحفظ' : 'Failed to save',
            duration: 5000,
            dismissible: true,
          });
        },
      });
  }

  // ─── Add staff ───
  openAddModal(): void {
    this.newStaff = { name: '', email: '', password: '', permissions: [] };
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  hasNewPage(key: string): boolean {
    return this.newStaff.permissions.includes(`page:${key}`);
  }

  toggleNewPage(key: string): void {
    const perm = `page:${key}`;
    const idx = this.newStaff.permissions.indexOf(perm);
    if (idx === -1) {
      this.newStaff.permissions = [...this.newStaff.permissions, perm];
    } else {
      this.newStaff.permissions = this.newStaff.permissions.filter((p) => p !== perm);
    }
  }

  addStaff(): void {
    if (!this.newStaff.name.trim() || !this.newStaff.email.trim() || !this.newStaff.password.trim())
      return;

    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري إضافة الموظف...' : 'Adding staff...',
    );
    const headers = this.getAuthHeaders();

    this.http
      .post<StaffMember>(
        this.apiUrl,
        {
          name: this.newStaff.name.trim(),
          email: this.newStaff.email.trim(),
          password: this.newStaff.password,
          role: 'admin',
          permissions: this.newStaff.permissions,
        },
        { headers },
      )
      .subscribe({
        next: (result) => {
          this.staff.update((list) => [...list, result]);
          this.showAddModal.set(false);
          this.toast.update(toastId, {
            type: 'success',
            title: this.currentLang() === 'ar' ? 'تم إضافة الموظف' : 'Staff added',
            duration: 4000,
            dismissible: true,
          });
        },
        error: () => {
          this.toast.update(toastId, {
            type: 'error',
            title: this.currentLang() === 'ar' ? 'فشل إضافة الموظف' : 'Failed to add staff',
            duration: 5000,
            dismissible: true,
          });
        },
      });
  }

  // ─── Delete staff ───
  deleteStaff(member: StaffMember): void {
    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري الحذف...' : 'Deleting...',
    );
    const headers = this.getAuthHeaders();

    this.http.delete(`${this.apiUrl}/${member._id}`, { headers, responseType: 'text' }).subscribe({
      next: () => {
        this.staff.update((list) => list.filter((s) => s._id !== member._id));
        if (this.selectedStaff()?._id === member._id) {
          this.selectedStaff.set(null);
        }
        this.toast.update(toastId, {
          type: 'success',
          title: this.currentLang() === 'ar' ? 'تم حذف الموظف' : 'Staff deleted',
          duration: 4000,
          dismissible: true,
        });
      },
      error: () => {
        this.toast.update(toastId, {
          type: 'error',
          title: this.currentLang() === 'ar' ? 'فشل الحذف' : 'Failed to delete',
          duration: 5000,
          dismissible: true,
        });
      },
    });
  }

  // ─── Toggle active ───
  toggleActive(member: StaffMember): void {
    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري التحديث...' : 'Updating...',
    );
    const headers = this.getAuthHeaders();

    this.http.patch<any>(`${this.apiUrl}/${member._id}/toggle-active`, {}, { headers }).subscribe({
      next: () => {
        this.staff.update((list) =>
          list.map((s) => (s._id === member._id ? { ...s, isActive: !s.isActive } : s)),
        );
        if (this.selectedStaff()?._id === member._id) {
          this.selectedStaff.update((s) => (s ? { ...s, isActive: !s.isActive } : null));
        }
        this.toast.update(toastId, {
          type: 'success',
          title: this.currentLang() === 'ar' ? 'تم التحديث' : 'Updated',
          duration: 3000,
          dismissible: true,
        });
      },
      error: () => {
        this.toast.update(toastId, {
          type: 'error',
          title: this.currentLang() === 'ar' ? 'فشل التحديث' : 'Failed to update',
          duration: 5000,
          dismissible: true,
        });
      },
    });
  }

  private getTranslations() {
    if (this.currentLang() === 'ar') {
      return {
        pageTitle: 'إدارة الموظفين',
        pageSubtitle: 'إضافة موظفين وتحديد الصفحات المتاحة لهم',
        staff: 'الموظفون',
        addStaff: 'إضافة موظف',
        selectStaff: 'اختر موظف لتعديل صلاحياته',
        noStaff: 'لا يوجد موظفون بعد',
        save: 'حفظ التغييرات',
        cancel: 'إلغاء',
        delete: 'حذف',
        pages: 'الصفحات المتاحة',
        pagesCount: 'صفحة',
        selectAll: 'تحديد الكل',
        active: 'نشط',
        inactive: 'معطّل',
        toggleActive: 'تفعيل / تعطيل',
        addStaffTitle: 'إضافة موظف جديد',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        assignPages: 'تحديد الصفحات',
        add: 'إضافة',
        lastLogin: 'آخر دخول',
        never: 'لم يسجل دخول',
      };
    }
    return {
      pageTitle: 'Staff Management',
      pageSubtitle: 'Add staff members and control their page access',
      staff: 'Staff',
      addStaff: 'Add Staff',
      selectStaff: 'Select a staff member to manage their pages',
      noStaff: 'No staff members yet',
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      pages: 'Accessible Pages',
      pagesCount: 'pages',
      selectAll: 'Select All',
      active: 'Active',
      inactive: 'Inactive',
      toggleActive: 'Toggle Active',
      addStaffTitle: 'Add New Staff',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      assignPages: 'Assign Pages',
      add: 'Add',
      lastLogin: 'Last Login',
      never: 'Never',
    };
  }
}
