import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AdminLayoutComponent } from '../../../shared/components/admin-layout/admin-layout.component';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SessionTimerService } from '../../../core/services/session-timer.service';

type SettingsTab = 'session' | 'notifications' | 'appearance' | 'security';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayoutComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  protected theme = inject(ThemeService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  protected sessionTimer = inject(SessionTimerService);

  readonly currentLang = this.i18n.language;
  readonly currentTheme = this.theme.effectiveTheme;
  readonly currentDirection = this.i18n.direction;
  readonly themeMode = this.theme.theme;

  readonly activeTab = signal<SettingsTab>('session');
  readonly saving = signal(false);

  // Security
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);

  // Notifications
  readonly notifEmailAddress = signal('');
  readonly notifPhone = signal('');
  readonly notifEmail = signal(true);
  readonly notifPush = signal(true);
  readonly notifSms = signal(false);

  readonly passwordStrength = computed(() => {
    const pw = this.newPassword();
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels =
      this.currentLang() === 'ar'
        ? ['', 'ضعيفة', 'ضعيفة', 'متوسطة', 'قوية', 'ممتازة']
        : ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
    const colors = ['', '#ef4444', '#ef4444', '#f59e0b', '#10b981', '#376bfa'];
    return { score, label: labels[score], color: colors[score] };
  });

  readonly passwordsMatch = computed(() => {
    const np = this.newPassword();
    const cp = this.confirmPassword();
    if (!np || !cp) return true;
    return np === cp;
  });

  readonly userEmail = computed(() => this.auth.user()?.email ?? '');
  readonly userRole = computed(() => this.auth.user()?.role ?? '');

  readonly userName = computed(() => this.auth.user()?.name ?? '');

  readonly tabs = computed(() => {
    const isAr = this.currentLang() === 'ar';
    return [
      {
        key: 'session' as SettingsTab,
        icon: 'fa-solid fa-clock',
        label: isAr ? 'الجلسة' : 'Session',
      },
      {
        key: 'notifications' as SettingsTab,
        icon: 'fa-solid fa-bell',
        label: isAr ? 'الإشعارات' : 'Notifications',
      },
      {
        key: 'appearance' as SettingsTab,
        icon: 'fa-solid fa-palette',
        label: isAr ? 'المظهر' : 'Appearance',
      },
      {
        key: 'security' as SettingsTab,
        icon: 'fa-solid fa-lock',
        label: isAr ? 'الأمان' : 'Security',
      },
    ];
  });

  readonly t = computed(() => this.getTranslations());

  private apiUrl = environment.apiUrl + '/auth';

  ngOnInit(): void {
    this.loadProfile();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadProfile(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any>(`${this.apiUrl}/me`, { headers }).subscribe({
      next: (user) => {
        this.notifEmailAddress.set(user.email || '');
        this.notifPhone.set(user.phone || '');
        if (user.preferences?.notifications) {
          this.notifEmail.set(user.preferences.notifications.email !== false);
          this.notifPush.set(user.preferences.notifications.push !== false);
          this.notifSms.set(user.preferences.notifications.sms === true);
        }
      },
      error: () => {},
    });
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  // ─── Security ───
  changePassword(): void {
    if (!this.passwordsMatch() || this.passwordStrength().score < 3) return;

    this.saving.set(true);
    const toastId = this.toast.loading(
      this.currentLang() === 'ar' ? 'جاري تغيير كلمة المرور...' : 'Changing password...',
    );
    const headers = this.getAuthHeaders();

    this.http
      .post<any>(
        `${this.apiUrl}/change-password`,
        {
          currentPassword: this.currentPassword(),
          newPassword: this.newPassword(),
        },
        { headers },
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
          this.toast.update(toastId, {
            type: 'success',
            title: this.currentLang() === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed',
            duration: 3000,
            dismissible: true,
          });
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err?.error?.message ||
            (this.currentLang() === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to change password');
          this.toast.update(toastId, {
            type: 'error',
            title: msg,
            duration: 5000,
            dismissible: true,
          });
        },
      });
  }

  logoutAllDevices(): void {
    const toastId = this.toast.loading(
      this.currentLang() === 'ar'
        ? 'جاري تسجيل الخروج من كل الأجهزة...'
        : 'Logging out all devices...',
    );
    this.auth.logoutAll().subscribe({
      next: () => {
        this.toast.update(toastId, {
          type: 'success',
          title:
            this.currentLang() === 'ar'
              ? 'تم تسجيل الخروج من كل الأجهزة'
              : 'Logged out from all devices',
          duration: 3000,
          dismissible: true,
        });
      },
      error: () => {
        this.toast.update(toastId, {
          type: 'error',
          title: this.currentLang() === 'ar' ? 'حدث خطأ' : 'Error occurred',
          duration: 5000,
          dismissible: true,
        });
      },
    });
  }

  // ─── Appearance ───
  setThemeMode(mode: 'light' | 'dark' | 'system'): void {
    this.theme.setTheme(mode);
    const toastId = this.toast.success(
      this.currentLang() === 'ar' ? 'تم تغيير المظهر' : 'Theme updated',
    );
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.i18n.setLanguage(lang);
  }

  // ─── Notifications ───
  saveNotifications(): void {
    this.saving.set(true);
    const toastId = this.toast.loading(this.currentLang() === 'ar' ? 'جاري الحفظ...' : 'Saving...');
    const headers = this.getAuthHeaders();

    this.http
      .patch<any>(
        `${this.apiUrl}/profile`,
        {
          phone: this.notifPhone(),
          preferences: {
            notifications: {
              email: this.notifEmail(),
              push: this.notifPush(),
              sms: this.notifSms(),
            },
          },
        },
        { headers },
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.update(toastId, {
            type: 'success',
            title:
              this.currentLang() === 'ar'
                ? 'تم حفظ إعدادات الإشعارات'
                : 'Notification settings saved',
            duration: 3000,
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

  // ─── Session ───
  async extendSession(): Promise<void> {
    const success = await this.sessionTimer.extendSession(15);
    if (success) {
      this.toast.success(
        this.currentLang() === 'ar' ? 'تم تمديد الجلسة 15 دقيقة' : 'Session extended by 15 min',
      );
    } else {
      this.toast.error(
        this.currentLang() === 'ar' ? 'فشل تمديد الجلسة' : 'Failed to extend session',
      );
    }
  }

  private getTranslations() {
    if (this.currentLang() === 'ar') {
      return {
        pageTitle: 'الإعدادات',
        pageSubtitle: 'إدارة حسابك وتفضيلاتك الشخصية',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        // Security
        security: 'الأمان',
        changePassword: 'تغيير كلمة المرور',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        passwordHint: 'على الأقل 8 أحرف مع أحرف كبيرة وصغيرة وأرقام ورموز',
        passwordMismatch: 'كلمة المرور غير متطابقة',
        passwordStrength: 'قوة كلمة المرور',
        updatePassword: 'تحديث كلمة المرور',
        logoutAll: 'تسجيل الخروج من كل الأجهزة',
        logoutAllDesc: 'سيتم تسجيل خروجك من جميع الأجهزة الأخرى',
        // Appearance
        appearance: 'المظهر',
        themeTitle: 'السمة',
        themeDesc: 'اختر مظهر لوحة التحكم',
        light: 'فاتح',
        dark: 'داكن',
        system: 'تلقائي',
        languageTitle: 'اللغة',
        languageDesc: 'اختر لغة واجهة المستخدم',
        arabic: 'العربية',
        english: 'English',
        // Notifications
        notifications: 'الإشعارات',
        notifDesc: 'تحكم في طريقة وبيانات استلام الإشعارات',
        notifContactTitle: 'بيانات التواصل',
        notifContactDesc: 'البريد الإلكتروني ورقم الهاتف للإشعارات',
        notifChannelsTitle: 'طرق الإشعارات',
        emailNotif: 'إشعارات البريد الإلكتروني',
        emailNotifDesc: 'استلام الإشعارات عبر البريد الإلكتروني',
        pushNotif: 'إشعارات الدفع',
        pushNotifDesc: 'استلام إشعارات في المتصفح',
        smsNotif: 'إشعارات SMS',
        smsNotifDesc: 'استلام إشعارات عبر الرسائل النصية',
        saveNotifications: 'حفظ إعدادات الإشعارات',
        // Session
        session: 'الجلسة',
        sessionInfo: 'معلومات الجلسة الحالية',
        sessionActive: 'الجلسة نشطة',
        sessionExpiring: 'الجلسة على وشك الانتهاء',
        timeRemaining: 'الوقت المتبقي',
        extendSession: 'تمديد 15 دقيقة',
        role: 'الدور',
        name: 'الاسم',
      };
    }
    return {
      pageTitle: 'Settings',
      pageSubtitle: 'Manage your account and personal preferences',
      email: 'Email',
      phone: 'Phone',
      security: 'Security',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      passwordHint: 'At least 8 characters with uppercase, lowercase, numbers and symbols',
      passwordMismatch: 'Passwords do not match',
      passwordStrength: 'Password Strength',
      updatePassword: 'Update Password',
      logoutAll: 'Logout All Devices',
      logoutAllDesc: 'You will be logged out from all other devices',
      appearance: 'Appearance',
      themeTitle: 'Theme',
      themeDesc: 'Choose your dashboard appearance',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      languageTitle: 'Language',
      languageDesc: 'Select the UI language',
      arabic: 'العربية',
      english: 'English',
      notifications: 'Notifications',
      notifDesc: 'Manage notification channels and contact info',
      notifContactTitle: 'Contact Info',
      notifContactDesc: 'Email and phone number for notifications',
      notifChannelsTitle: 'Notification Channels',
      emailNotif: 'Email Notifications',
      emailNotifDesc: 'Receive notifications via email',
      pushNotif: 'Push Notifications',
      pushNotifDesc: 'Receive browser push notifications',
      smsNotif: 'SMS Notifications',
      smsNotifDesc: 'Receive notifications via text messages',
      saveNotifications: 'Save Notification Settings',
      session: 'Session',
      sessionInfo: 'Current Session Info',
      sessionActive: 'Session Active',
      sessionExpiring: 'Session Expiring Soon',
      timeRemaining: 'Time Remaining',
      extendSession: 'Extend 15 min',
      role: 'Role',
      name: 'Name',
    };
  }
}
