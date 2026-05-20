import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ADMIN_PAGE_SERVICES,
  AdminPerformanceService,
  AdminSkeletonService,
  AdminProgressBarService,
  AdminSecurityService,
} from '../admin-services';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionTimerService } from '../../../core/services/session-timer.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
  providers: [...ADMIN_PAGE_SERVICES],
})
export class AdminLogin implements OnInit, OnDestroy, AfterViewInit {
  // حقن الخدمات
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected readonly performance = inject(AdminPerformanceService);
  protected readonly skeleton = inject(AdminSkeletonService);
  protected readonly progressBar = inject(AdminProgressBarService);
  protected readonly security = inject(AdminSecurityService);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly sessionTimer = inject(SessionTimerService);

  // نموذج تسجيل الدخول
  loginForm!: FormGroup;

  // حالات الصفحة
  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isPageReady = signal(false);

  // تحديث عداد القفل
  private lockoutTimerId: ReturnType<typeof setInterval> | null = null;
  readonly lockoutTick = signal(0);

  // أمان
  readonly isLocked = this.security.isLocked;
  readonly remainingAttempts = this.security.remainingAttempts;
  readonly lockoutEndTime = this.security.lockoutEndTime;
  readonly devToolsOpen = this.security.devToolsOpen;

  // بصمة الجهاز
  readonly deviceFingerprint = signal<string>('');

  // الثيم الحالي
  readonly currentTheme = this.theme.effectiveTheme;

  // اللغة الحالية
  readonly currentLanguage = this.i18n.language;
  readonly currentDirection = this.i18n.direction;

  // تنسيق وقت القفل
  readonly formattedLockoutTime = computed(() => {
    // اجبار التحديث كل ثانية
    this.lockoutTick();
    const endTime = this.lockoutEndTime();
    const seconds = endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    // بدء قياس الأداء
    this.performance.startMeasure('login-page-init');

    // تهيئة الأمان
    this.security.initialize();

    // إنشاء بصمة الجهاز
    this.deviceFingerprint.set(this.security.generateDeviceFingerprint());

    // إنشاء النموذج
    this.initForm();

    // تحديث العداد كل ثانية بدون الحاجة لريفريش
    this.lockoutTimerId = setInterval(() => {
      this.lockoutTick.update((v) => v + 1);
    }, 1000);

    // إنهاء قياس الأداء
    this.performance.endMeasure('login-page-init');
  }

  ngAfterViewInit(): void {
    // تفعيل الصفحة بعد التحميل لبدء الـ animations
    this.performance.defer(() => {
      this.isPageReady.set(true);
    }, 50);
  }

  /**
   * تهيئة النموذج
   */
  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  /**
   * تبديل إظهار كلمة المرور
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  /**
   * تبديل الثيم
   */
  toggleTheme(): void {
    this.theme.toggle();
  }

  /**
   * تبديل اللغة
   */
  toggleLanguage(): void {
    this.i18n.toggle();
  }

  /**
   * ترجمة نص
   */
  t(key: string, params?: Record<string, string | number>): string {
    return this.i18n.translate(key, params);
  }

  /**
   * التحقق من صحة الحقل
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * الحصول على رسالة الخطأ للحقل
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return this.t('errors.required');
    }
    if (field.errors['email']) {
      return this.t('errors.email');
    }
    if (field.errors['minlength']) {
      return this.t('errors.minLength', { min: 8 });
    }

    return '';
  }

  /**
   * إرسال النموذج
   */
  async onSubmit(): Promise<void> {
    // التحقق من الأمان قبل المتابعة
    const preCheck = this.security.preLoginCheck();
    if (!preCheck.allowed) {
      this.errorMessage.set(
        preCheck.reason || (this.currentLanguage() === 'ar' ? 'غير مسموح' : 'Not allowed'),
      );
      return;
    }

    // التحقق من صحة النموذج
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.progressBar.start({ isIndeterminate: true });

    // تنظيف المدخلات
    const email = this.security.sanitizeInput(this.loginForm.get('email')?.value);
    const password = this.loginForm.get('password')?.value;

    // التحقق من صحة البريد
    if (!this.security.validateEmail(email)) {
      this.errorMessage.set(
        this.currentLanguage() === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address',
      );
      this.isLoading.set(false);
      this.progressBar.hide();
      return;
    }

    // استخدام API الحقيقي لتسجيل الدخول
    this.auth.adminLogin({ email, password }).subscribe({
      next: async () => {
        // تسجيل محاولة ناجحة
        this.security.recordLoginAttempt(true);

        // بدء جلسة جديدة (force restart)
        this.sessionTimer.forceRestartSession();

        this.successMessage.set(
          this.currentLanguage() === 'ar'
            ? 'تم تسجيل الدخول بنجاح! جاري التحويل...'
            : 'Login successful! Redirecting...',
        );
        this.toast.success({
          title: this.currentLanguage() === 'ar' ? 'تم بنجاح' : 'Success',
          message:
            this.currentLanguage() === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully',
        });
        await this.progressBar.complete();

        // التحويل إلى لوحة التحكم
        setTimeout(() => {
          this.router.navigate(['/admin/dashboard']);
        }, 1000);
      },
      error: (error: any) => {
        // تسجيل محاولة فاشلة
        const result = this.security.recordLoginAttempt(false);

        if (!result.allowed) {
          const lockoutMinutes = Math.ceil((result.lockoutTime || 0) / 60);
          const msg =
            this.currentLanguage() === 'ar'
              ? `تم قفل الحساب لمدة ${lockoutMinutes} دقيقة بسبب محاولات متعددة فاشلة`
              : `Account locked for ${lockoutMinutes} minutes due to multiple failed attempts`;
          this.errorMessage.set(msg);
          this.toast.error({
            title: this.currentLanguage() === 'ar' ? 'تم القفل' : 'Account Locked',
            message: msg,
            duration: 8000,
          });
        } else {
          const errorMsg = error?.error?.message || error?.message;
          const msg =
            this.currentLanguage() === 'ar'
              ? errorMsg || `بيانات غير صحيحة. المحاولات المتبقية: ${result.remainingAttempts}`
              : errorMsg || `Invalid credentials. Attempts left: ${result.remainingAttempts}`;
          this.errorMessage.set(msg);
          this.toast.error({
            title: this.currentLanguage() === 'ar' ? 'خطأ' : 'Error',
            message: msg,
          });
        }

        this.progressBar.hide();
        this.isLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.lockoutTimerId) {
      clearInterval(this.lockoutTimerId);
      this.lockoutTimerId = null;
    }
    this.progressBar.hide();
    this.skeleton.reset();
  }
}
