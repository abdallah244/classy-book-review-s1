import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-provider-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './provider-register.html',
  styleUrl: './provider-register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderRegisterPage {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly themeService = inject(ThemeService);

  readonly isAr = computed(() => this.i18n.language() === 'ar');
  readonly step = signal(1);
  readonly isLoading = signal(false);
  readonly agreedToTerms = signal(false);

  readonly stepsMeta = [
    { num: 1, titleEn: 'Company', titleAr: 'الشركة', subEn: 'Basic info', subAr: 'بيانات أساسية' },
    {
      num: 2,
      titleEn: 'Contact',
      titleAr: 'التواصل',
      subEn: 'Person & location',
      subAr: 'الشخص والموقع',
    },
    {
      num: 3,
      titleEn: 'Details',
      titleAr: 'التفاصيل',
      subEn: 'Services & social',
      subAr: 'الخدمات والتواصل',
    },
  ];

  // Step 1: Company Info
  readonly companyForm = this.fb.group({
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    companyNameAr: [''],
    industry: ['', Validators.required],
    companySize: ['', Validators.required],
    yearFounded: [''],
    website: [''],
    taxId: [''],
    registrationNumber: [''],
  });

  // Step 2: Contact Info
  readonly contactForm = this.fb.group({
    contactName: ['', [Validators.required, Validators.minLength(2)]],
    jobTitle: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    altPhone: [''],
    country: ['', Validators.required],
    city: ['', Validators.required],
    address: [''],
    postalCode: [''],
  });

  // Step 3: Business Details
  readonly businessForm = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(20)]],
    servicesOffered: ['', Validators.required],
    targetAudience: [''],
    socialLinkedin: [''],
    socialTwitter: [''],
    socialFacebook: [''],
    socialInstagram: [''],
  });

  readonly completionPercent = computed(() => {
    let filled = 0;
    let total = 0;

    // Step 1 required fields
    const s1 = this.companyForm;
    ['companyName', 'industry', 'companySize'].forEach((f) => {
      total++;
      if (s1.get(f)?.value) filled++;
    });

    // Step 2 required fields
    const s2 = this.contactForm;
    ['contactName', 'jobTitle', 'email', 'phone', 'country', 'city'].forEach((f) => {
      total++;
      if (s2.get(f)?.value) filled++;
    });

    // Step 3 required fields
    const s3 = this.businessForm;
    ['description', 'servicesOffered'].forEach((f) => {
      total++;
      if (s3.get(f)?.value) filled++;
    });

    return total === 0 ? 0 : Math.round((filled / total) * 100);
  });

  readonly industries = [
    { value: 'education', labelEn: 'Education & Training', labelAr: 'التعليم والتدريب' },
    { value: 'technology', labelEn: 'Technology & IT', labelAr: 'التكنولوجيا وتقنية المعلومات' },
    { value: 'healthcare', labelEn: 'Healthcare & Medical', labelAr: 'الرعاية الصحية والطبية' },
    { value: 'finance', labelEn: 'Finance & Banking', labelAr: 'المالية والبنوك' },
    { value: 'marketing', labelEn: 'Marketing & Advertising', labelAr: 'التسويق والإعلان' },
    { value: 'consulting', labelEn: 'Consulting & Advisory', labelAr: 'الاستشارات' },
    { value: 'ecommerce', labelEn: 'E-Commerce & Retail', labelAr: 'التجارة الإلكترونية' },
    { value: 'media', labelEn: 'Media & Entertainment', labelAr: 'الإعلام والترفيه' },
    { value: 'manufacturing', labelEn: 'Manufacturing & Industry', labelAr: 'التصنيع والصناعة' },
    { value: 'real_estate', labelEn: 'Real Estate', labelAr: 'العقارات' },
    { value: 'legal', labelEn: 'Legal Services', labelAr: 'الخدمات القانونية' },
    { value: 'nonprofit', labelEn: 'Non-Profit & NGO', labelAr: 'المنظمات غير الربحية' },
    { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
  ];

  readonly companySizes = [
    { value: '1-10', labelEn: '1–10 employees', labelAr: '1–10 موظفين' },
    { value: '11-50', labelEn: '11–50 employees', labelAr: '11–50 موظف' },
    { value: '51-200', labelEn: '51–200 employees', labelAr: '51–200 موظف' },
    { value: '201-500', labelEn: '201–500 employees', labelAr: '201–500 موظف' },
    { value: '501-1000', labelEn: '501–1,000 employees', labelAr: '501–1,000 موظف' },
    { value: '1000+', labelEn: '1,000+ employees', labelAr: '1,000+ موظف' },
  ];

  readonly countries = [
    { value: 'eg', labelEn: 'Egypt', labelAr: 'مصر' },
    { value: 'sa', labelEn: 'Saudi Arabia', labelAr: 'السعودية' },
    { value: 'ae', labelEn: 'United Arab Emirates', labelAr: 'الإمارات' },
    { value: 'kw', labelEn: 'Kuwait', labelAr: 'الكويت' },
    { value: 'qa', labelEn: 'Qatar', labelAr: 'قطر' },
    { value: 'bh', labelEn: 'Bahrain', labelAr: 'البحرين' },
    { value: 'om', labelEn: 'Oman', labelAr: 'عُمان' },
    { value: 'jo', labelEn: 'Jordan', labelAr: 'الأردن' },
    { value: 'lb', labelEn: 'Lebanon', labelAr: 'لبنان' },
    { value: 'iq', labelEn: 'Iraq', labelAr: 'العراق' },
    { value: 'ma', labelEn: 'Morocco', labelAr: 'المغرب' },
    { value: 'tn', labelEn: 'Tunisia', labelAr: 'تونس' },
    { value: 'dz', labelEn: 'Algeria', labelAr: 'الجزائر' },
    { value: 'us', labelEn: 'United States', labelAr: 'الولايات المتحدة' },
    { value: 'gb', labelEn: 'United Kingdom', labelAr: 'المملكة المتحدة' },
    { value: 'de', labelEn: 'Germany', labelAr: 'ألمانيا' },
    { value: 'fr', labelEn: 'France', labelAr: 'فرنسا' },
    { value: 'ca', labelEn: 'Canada', labelAr: 'كندا' },
    { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
  ];

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleLanguage(): void {
    this.i18n.toggle();
  }

  toggleTerms(): void {
    this.agreedToTerms.update((v) => !v);
  }

  isInvalid(step: number, field: string): boolean {
    const control =
      step === 1
        ? this.companyForm.get(field)
        : step === 2
          ? this.contactForm.get(field)
          : this.businessForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goToStep(num: number): void {
    if (num < this.step()) {
      this.step.set(num);
    }
  }

  nextStep(): void {
    if (this.step() === 1) {
      if (this.companyForm.invalid) {
        this.companyForm.markAllAsTouched();
        return;
      }
    } else if (this.step() === 2) {
      if (this.contactForm.invalid) {
        this.contactForm.markAllAsTouched();
        return;
      }
    }
    this.step.update((s) => Math.min(s + 1, 3));
  }

  prevStep(): void {
    this.step.update((s) => Math.max(s - 1, 1));
  }

  onSubmit(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }
    if (!this.agreedToTerms()) {
      this.toast.error({
        title: this.isAr() ? 'مطلوب' : 'Required',
        message: this.isAr()
          ? 'يجب الموافقة على الشروط والأحكام'
          : 'You must agree to the terms and conditions',
      });
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      this.toast.success({
        title: this.isAr() ? 'تم الإرسال' : 'Submitted',
        message: this.isAr()
          ? 'تم إرسال طلبك بنجاح. سنتواصل معك خلال 24-48 ساعة.'
          : 'Your application has been submitted. We will contact you within 24–48 hours.',
      });
      this.router.navigate(['/']);
    }, 2000);
  }
}
