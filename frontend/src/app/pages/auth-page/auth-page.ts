import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly themeService = inject(ThemeService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly mode = signal<'login' | 'register'>('login');
  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly focusedField = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
  });

  readonly passwordStrength = computed(() => {
    const val = this.registerForm.get('password')?.value || '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  });

  readonly passwordStrengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (this.isAr()) {
      if (s <= 1) return 'ضعيفة';
      if (s === 2) return 'متوسطة';
      return 'قوية';
    }
    if (s <= 1) return 'Weak';
    if (s === 2) return 'Medium';
    return 'Strong';
  });

  switchMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.errorMessage.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleLanguage(): void {
    this.i18n.toggle();
  }

  setFocus(field: string | null): void {
    this.focusedField.set(field);
  }

  isInvalid(form: 'login' | 'register', field: string): boolean {
    const control = form === 'login' ? this.loginForm.get(field) : this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success({
          title: this.isAr() ? 'تم بنجاح' : 'Success',
          message: this.isAr() ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully',
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || err?.message;
        this.errorMessage.set(msg || (this.isAr() ? 'بيانات غير صحيحة' : 'Invalid credentials'));
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, email, password, phone } = this.registerForm.value;
    this.auth
      .register({ name: name!, email: email!, password: password!, phone: phone || undefined })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.toast.success({
            title: this.isAr() ? 'تم بنجاح' : 'Success',
            message: this.isAr() ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
          });
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.isLoading.set(false);
          const msg = err?.error?.message || err?.message;
          this.errorMessage.set(
            msg || (this.isAr() ? 'حدث خطأ أثناء التسجيل' : 'Registration failed'),
          );
        },
      });
  }

  socialLogin(provider: string): void {
    this.toast.info({
      title: this.isAr() ? 'قريباً' : 'Coming Soon',
      message: this.isAr()
        ? `تسجيل الدخول عبر ${provider} سيكون متاحاً قريباً`
        : `Sign in with ${provider} will be available soon`,
    });
  }
}
