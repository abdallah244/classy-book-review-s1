import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-for-teams',
  imports: [RouterLink, FormsModule],
  templateUrl: './for-teams.html',
  styleUrl: './for-teams.css',
})
export class ForTeams {
  themeService = inject(ThemeService);
  i18nService = inject(I18nService);
  menuOpen = signal(false);

  // Form State
  demoName = '';
  demoEmail = '';
  companyName = '';
  companySize = '10-50';
  demoNotes = '';
  demoSubmitted = signal(false);

  isAr() {
    return this.i18nService.language() === 'ar';
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  toggleLanguage() {
    this.i18nService.toggle();
  }

  toggleMenu() {
    this.menuOpen.set(!this.menuOpen());
  }

  submitDemoRequest(event: Event) {
    event.preventDefault();
    if (!this.demoName || !this.demoEmail || !this.companyName) {
      const errorMsg = this.isAr() 
        ? 'يرجى ملء جميع الحقول المطلوبة الأساسية.' 
        : 'Please fill in all the required fields.';
      alert(errorMsg);
      return;
    }

    // Process submission
    this.demoSubmitted.set(true);
    
    // Auto reset form after alert
    setTimeout(() => {
      this.demoName = '';
      this.demoEmail = '';
      this.companyName = '';
      this.companySize = '10-50';
      this.demoNotes = '';
    }, 200);
  }

  resetForm() {
    this.demoSubmitted.set(false);
  }

  stats = [
    {
      icon: 'fa-chart-line',
      value: '94%',
      titleAr: 'زيادة في إنتاجية التعلم',
      titleEn: 'Increase in Learning Productivity'
    },
    {
      icon: 'fa-user-clock',
      value: '14+ ساعة',
      titleAr: 'توفير أسبوعي لكل متدرب',
      titleEn: 'Weekly Saved per Trainee'
    },
    {
      icon: 'fa-circle-nodes',
      value: '3.5x',
      titleAr: 'معدل تفاعل جماعي أعلى',
      titleEn: 'Higher Collaborative Engagement'
    }
  ];

  features = [
    {
      icon: 'fa-shield-halved',
      titleAr: 'إدارة متكاملة للمجموعات',
      titleEn: 'Advanced Group Admin',
      descAr: 'تحكم كامل في مسارات التعلم، الفِرق، والمجموعات وتوزيع الصلاحيات الإدارية والمراقبة بكل سهولة.',
      descEn: 'Complete control over learning paths, user classes, team managers, and role distribution.'
    },
    {
      icon: 'fa-chart-pie',
      titleAr: 'تحليلات تفصيلية للأداء',
      titleEn: 'Detailed Analytics & Reports',
      descAr: 'راقب تقدم الموظفين أو الطلاب في القراءة والتعلم، وحدد فجوات المهارات، وقس العائد على الاستثمار.',
      descEn: 'Monitor student or employee reading and test progress, analyze skills, and export structured reports.'
    },
    {
      icon: 'fa-palette',
      titleAr: 'تخصيص الهوية التجارية',
      titleEn: 'White-Label Branding',
      descAr: 'خصص مظهر المنصة بالكامل بشعار مؤسستك وألوانك الخاصة لتشعر فِرقك بالانتماء الكامل للمؤسسة.',
      descEn: 'Customize the application UI completely with your organization logo, color scheme, and custom subdomain.'
    },
    {
      icon: 'fa-key',
      titleAr: 'ربط تسجيل الدخول الموحد (SSO)',
      titleEn: 'Single Sign-On (SSO)',
      descAr: 'تكامل آمن وسريع مع أنظمة الهوية الحالية لشركتك أو جامعتك مثل Okta و Active Directory و Google Workspace.',
      descEn: 'Secure and instant integrations with your company identity provider (Okta, Azure AD, G Suite).'
    },
    {
      icon: 'fa-graduation-cap',
      titleAr: 'مناهج مخصصة ومسارات موجهة',
      titleEn: 'Curated Learning Pathways',
      descAr: 'أنشئ مسارات مخصصة لفريقك تحتوي على كتب واختبارات ونقاشات تركز على المهارات المطلوبة لمشروعك.',
      descEn: 'Build specialized study paths containing books, assessments, and tasks tailored for your team.'
    },
    {
      icon: 'fa-headset',
      titleAr: 'مدير نجاح عملاء مخصص',
      titleEn: 'Dedicated Support Account',
      descAr: 'احصل على دعم فني مباشر وأولوية استجابة ومساعدة كاملة في إعداد وتهيئة الحسابات وربط الأنظمة.',
      descEn: 'Enjoy premium support SLA, dedicated integration engineers, and custom workspace onboarding sessions.'
    }
  ];

  plans = [
    {
      nameAr: 'الباقة البرونزية للمجموعات',
      nameEn: 'Starter Teams',
      descAr: 'مثالية للشركات الناشئة والفِرق الصغيرة لبدء التعلم المنظم.',
      descEn: 'Ideal for startups and small teams looking to structure their learning journey.',
      price: '15',
      periodAr: '/ مستخدم / شهرياً',
      periodEn: '/ user / month',
      popular: false,
      featuresAr: [
        'حتى 25 مستخدم مفعل',
        'مكتبة كتب أساسية مشتركة',
        'لوحة تحكم إدارية مبسطة',
        'دعم فني عبر البريد الإلكتروني',
        'تقارير أداء شهرية أساسية'
      ],
      featuresEn: [
        'Up to 25 active users',
        'Shared basic library access',
        'Standard admin dashboard',
        'Email support ticket response',
        'Basic monthly reports'
      ]
    },
    {
      nameAr: 'الباقة الذهبية للنمو',
      nameEn: 'Growth & Business',
      descAr: 'الخيار الأفضل للشركات المتوسطة والمؤسسات التعليمية المتنامية.',
      descEn: 'The perfect choice for growing businesses and academic institutions.',
      price: '29',
      periodAr: '/ مستخدم / شهرياً',
      periodEn: '/ user / month',
      popular: true,
      featuresAr: [
        'عدد غير محدود من المستخدمين',
        'مكتبة كتب كاملة غير محدودة',
        'تقارير أداء وتحليلات لحظية متقدمة',
        'تخصيص الهوية والشعار الأساسي',
        'دعم فني سريع على مدار الساعة',
        'إنشاء مسارات وقنوات تعلم مخصصة'
      ],
      featuresEn: [
        'Unlimited total users capacity',
        'Full premium library access',
        'Real-time detailed analytics',
        'Basic branding configuration',
        'Priority support chat',
        'Custom learning paths creation'
      ]
    },
    {
      nameAr: 'المؤسسات الكبرى (Enterprise)',
      nameEn: 'Enterprise Suite',
      descAr: 'حلول مخصصة بالكامل للشركات الكبرى والجامعات الحكومية بميزات أمان متقدمة.',
      descEn: 'Tailored solutions for large companies and public universities needing premium security.',
      price: 'تخصيص',
      priceEn: 'Custom',
      periodAr: '',
      periodEn: '',
      popular: false,
      featuresAr: [
        'ربط تسجيل الدخول الموحد (SSO)',
        'خادم وقاعدة بيانات مخصصة أو سحابية مستقلة',
        'تخصيص كامل للهوية (White-label) مع دومين مخصص',
        'مدير نجاح عملاء مخصص وتدريب حي',
        'اتفاقية مستوى الخدمة (SLA) للدعم 99.9%',
        'عقود وحلول دفع سنوية مخصصة'
      ],
      featuresEn: [
        'Single Sign-On (SSO) configuration',
        'Dedicated cloud servers & db instances',
        'Full White-Label & Custom Domain',
        'Dedicated CSM & live training',
        '99.9% uptime SLA guarantee',
        'Flexible custom annual invoicing'
      ]
    }
  ];
}
