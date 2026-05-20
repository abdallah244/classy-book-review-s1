import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
  inject,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private observer!: IntersectionObserver;
  readonly themeService = inject(ThemeService);
  readonly i18nService = inject(I18nService);
  private readonly toast = inject(ToastService);

  readonly scrollY = signal(0);
  readonly menuOpen = signal(false);
  readonly activeSection = signal('hero');
  readonly yearlyPricing = signal(false);
  readonly openFaqIndex = signal(-1);
  readonly animatedStats = signal<string[]>([]);
  private statsAnimated = false;
  private tickerInterval: ReturnType<typeof setInterval> | null = null;
  private activityIndex = 0;
  readonly showTicker = signal(false);
  readonly currentActivity = signal({
    avatar: 'A',
    textEn: 'Ahmed just enrolled in Python Course',
    textAr: 'أحمد سجّل في دورة Python',
    timeEn: 'Just now',
    timeAr: 'الآن',
  });

  readonly scrollProgress = computed(() => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? (this.scrollY() / docHeight) * 100 : 0;
  });

  readonly navSolid = computed(() => this.scrollY() > 60);
  readonly showScrollTop = computed(() => this.scrollY() > 400);
  readonly isAr = computed(() => this.i18nService.language() === 'ar');

  readonly stats = [
    { value: '50K+', numericEnd: 50, suffix: 'K+', labelAr: 'طالب نشط', labelEn: 'Active Students' },
    { value: '1,200+', numericEnd: 1200, suffix: '+', labelAr: 'دورة تعليمية', labelEn: 'Courses' },
    { value: '300+', numericEnd: 300, suffix: '+', labelAr: 'معلم خبير', labelEn: 'Expert Tutors' },
    { value: '98%', numericEnd: 98, suffix: '%', labelAr: 'رضا الطلاب', labelEn: 'Satisfaction' },
  ];

  readonly features = [
    {
      icon: 'fa-solid fa-graduation-cap',
      titleAr: 'تعليم تفاعلي',
      titleEn: 'Interactive Learning',
      descAr: 'دروس فيديو عالية الجودة مع تمارين تفاعلية واختبارات فورية تضمن فهمك الكامل',
      descEn: 'High-quality video lessons with interactive exercises and instant quizzes',
      color: '#166534',
    },
    {
      icon: 'fa-solid fa-users',
      titleAr: 'مجتمع تعليمي',
      titleEn: 'Learning Community',
      descAr: 'تواصل مع زملائك ومعلميك في مجتمع تفاعلي يدعم رحلتك التعليمية',
      descEn: 'Connect with peers and instructors in a supportive learning community',
      color: '#15803d',
    },
    {
      icon: 'fa-solid fa-certificate',
      titleAr: 'شهادات معتمدة',
      titleEn: 'Certified Courses',
      descAr: 'احصل على شهادات معتمدة عند إتمام الدورات لتعزيز سيرتك الذاتية',
      descEn: 'Earn recognized certificates upon course completion to boost your resume',
      color: '#166534',
    },
    {
      icon: 'fa-solid fa-mobile-screen-button',
      titleAr: 'تعلم في أي مكان',
      titleEn: 'Learn Anywhere',
      descAr: 'ادرس من هاتفك أو حاسوبك في أي وقت ومن أي مكان بدون قيود',
      descEn: 'Study from your phone or computer anytime, anywhere with no restrictions',
      color: '#15803d',
    },
    {
      icon: 'fa-solid fa-comments',
      titleAr: 'دعم مباشر',
      titleEn: 'Live Support',
      descAr: 'محادثات مباشرة مع المعلمين ونظام أسئلة وأجوبة للمساعدة الفورية',
      descEn: 'Live chat with instructors and Q&A system for instant help',
      color: '#166534',
    },
    {
      icon: 'fa-solid fa-chart-line',
      titleAr: 'تتبع تقدمك',
      titleEn: 'Track Progress',
      descAr: 'لوحة تحكم شخصية تعرض تقدمك وإنجازاتك وخطة دراستك',
      descEn: 'Personal dashboard showing your progress, achievements, and study plan',
      color: '#15803d',
    },
  ];

  readonly categories = [
    { icon: 'fa-solid fa-code', labelAr: 'البرمجة', labelEn: 'Programming', count: 320 },
    { icon: 'fa-solid fa-paint-brush', labelAr: 'التصميم', labelEn: 'Design', count: 180 },
    { icon: 'fa-solid fa-bullhorn', labelAr: 'التسويق', labelEn: 'Marketing', count: 150 },
    { icon: 'fa-solid fa-language', labelAr: 'اللغات', labelEn: 'Languages', count: 200 },
    { icon: 'fa-solid fa-brain', labelAr: 'الذكاء الاصطناعي', labelEn: 'AI & ML', count: 95 },
    { icon: 'fa-solid fa-briefcase', labelAr: 'إدارة الأعمال', labelEn: 'Business', count: 140 },
  ];

  readonly testimonials = [
    {
      nameAr: 'أحمد محمد',
      nameEn: 'Ahmed Mohamed',
      roleAr: 'مطور واجهات أمامية',
      roleEn: 'Frontend Developer',
      textAr: 'منصة Classy Book غيّرت حياتي المهنية. الدورات عملية ومحدثة والمجتمع داعم جداً.',
      textEn: 'Classy Book transformed my career. The courses are practical, up-to-date, and the community is incredibly supportive.',
      rating: 5,
      avatar: 'A',
    },
    {
      nameAr: 'سارة أحمد',
      nameEn: 'Sara Ahmed',
      roleAr: 'مصممة UI/UX',
      roleEn: 'UI/UX Designer',
      textAr: 'أفضل منصة تعليمية عربية. المحتوى مميز والشهادات معترف بها في سوق العمل.',
      textEn: 'Best Arabic learning platform. Outstanding content and certificates recognized in the job market.',
      rating: 5,
      avatar: 'S',
    },
    {
      nameAr: 'محمد علي',
      nameEn: 'Mohamed Ali',
      roleAr: 'مهندس بيانات',
      roleEn: 'Data Engineer',
      textAr: 'التعلم هنا مختلف تماماً. ميزة السوشيال ميديا والتواصل مع الطلاب الآخرين رائعة.',
      textEn: 'Learning here is completely different. The social features and connecting with other students is amazing.',
      rating: 5,
      avatar: 'M',
    },
  ];

  readonly trustedLogos = [
    { name: 'Google', icon: 'fa-brands fa-google' },
    { name: 'Microsoft', icon: 'fa-brands fa-microsoft' },
    { name: 'Amazon', icon: 'fa-brands fa-amazon' },
    { name: 'Meta', icon: 'fa-brands fa-meta' },
    { name: 'Apple', icon: 'fa-brands fa-apple' },
    { name: 'Netflix', icon: 'fa-solid fa-film' },
    { name: 'Spotify', icon: 'fa-brands fa-spotify' },
    { name: 'Adobe', icon: 'fa-solid fa-wand-magic-sparkles' },
  ];

  readonly instructors = [
    {
      nameAr: 'د. ليلى حسن',
      nameEn: 'Dr. Layla Hassan',
      roleAr: 'خبيرة ذكاء اصطناعي',
      roleEn: 'AI Expert',
      company: 'Google',
      companyIcon: 'fa-brands fa-google',
      students: '12K',
      courses: 8,
      rating: '4.9',
      avatar: 'L',
    },
    {
      nameAr: 'م. خالد يوسف',
      nameEn: 'Eng. Khaled Youssef',
      roleAr: 'مهندس برمجيات أول',
      roleEn: 'Senior Software Engineer',
      company: 'Microsoft',
      companyIcon: 'fa-brands fa-microsoft',
      students: '8.5K',
      courses: 12,
      rating: '4.8',
      avatar: 'K',
    },
    {
      nameAr: 'أ. نور الدين',
      nameEn: 'Prof. Nour Eldeen',
      roleAr: 'مصمم UX رئيسي',
      roleEn: 'Lead UX Designer',
      company: 'Meta',
      companyIcon: 'fa-brands fa-meta',
      students: '15K',
      courses: 6,
      rating: '4.9',
      avatar: 'N',
    },
    {
      nameAr: 'د. مريم العلي',
      nameEn: 'Dr. Mariam Al-Ali',
      roleAr: 'عالمة بيانات',
      roleEn: 'Data Scientist',
      company: 'Amazon',
      companyIcon: 'fa-brands fa-amazon',
      students: '10K',
      courses: 9,
      rating: '4.7',
      avatar: 'M',
    },
  ];

  readonly pricingPlans = [
    {
      nameAr: 'مجاني',
      nameEn: 'Free',
      descAr: 'للمبتدئين والمستكشفين',
      descEn: 'For beginners and explorers',
      icon: 'fa-solid fa-paper-plane',
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      ctaAr: 'ابدأ مجاناً',
      ctaEn: 'Get Started Free',
      features: [
        { en: '5 free courses', ar: '5 دورات مجانية', included: true },
        { en: 'Community access', ar: 'وصول للمجتمع', included: true },
        { en: 'Basic progress tracking', ar: 'تتبع تقدم أساسي', included: true },
        { en: 'Certificates', ar: 'شهادات', included: false },
        { en: 'Live support', ar: 'دعم مباشر', included: false },
        { en: 'Offline access', ar: 'وصول بدون إنترنت', included: false },
      ],
    },
    {
      nameAr: 'احترافي',
      nameEn: 'Pro',
      descAr: 'للمتعلمين الجادين',
      descEn: 'For serious learners',
      icon: 'fa-solid fa-rocket',
      monthlyPrice: 19,
      yearlyPrice: 182,
      popular: true,
      ctaAr: 'ابدأ مع Pro',
      ctaEn: 'Start with Pro',
      features: [
        { en: 'All 1,200+ courses', ar: 'جميع +1,200 دورة', included: true },
        { en: 'Community access', ar: 'وصول للمجتمع', included: true },
        { en: 'Advanced analytics', ar: 'تحليلات متقدمة', included: true },
        { en: 'Certificates', ar: 'شهادات معتمدة', included: true },
        { en: 'Live support', ar: 'دعم مباشر', included: true },
        { en: 'Offline access', ar: 'وصول بدون إنترنت', included: false },
      ],
    },
    {
      nameAr: 'مؤسسات',
      nameEn: 'Enterprise',
      descAr: 'للفرق والشركات',
      descEn: 'For teams and companies',
      icon: 'fa-solid fa-building',
      monthlyPrice: 49,
      yearlyPrice: 470,
      popular: false,
      ctaAr: 'تواصل معنا',
      ctaEn: 'Contact Sales',
      features: [
        { en: 'All 1,200+ courses', ar: 'جميع +1,200 دورة', included: true },
        { en: 'Team management', ar: 'إدارة الفريق', included: true },
        { en: 'Custom learning paths', ar: 'مسارات تعلم مخصصة', included: true },
        { en: 'Certificates', ar: 'شهادات معتمدة', included: true },
        { en: 'Priority support', ar: 'دعم أولوية', included: true },
        { en: 'Offline + API access', ar: 'وصول بدون إنترنت + API', included: true },
      ],
    },
  ];

  readonly faqs = [
    {
      questionAr: 'هل يمكنني البدء مجاناً؟',
      questionEn: 'Can I start for free?',
      answerAr: 'نعم! لدينا خطة مجانية تتضمن 5 دورات ووصول كامل للمجتمع. لا تحتاج بطاقة ائتمان للبدء.',
      answerEn: 'Yes! We have a free plan that includes 5 courses and full community access. No credit card required to get started.',
    },
    {
      questionAr: 'هل الشهادات معترف بها؟',
      questionEn: 'Are the certificates recognized?',
      answerAr: 'نعم، شهاداتنا معتمدة ومعترف بها من قبل أكثر من 500 شركة وجامعة حول العالم.',
      answerEn: 'Yes, our certificates are accredited and recognized by 500+ companies and universities worldwide.',
    },
    {
      questionAr: 'كيف يعمل التعلم الاجتماعي؟',
      questionEn: 'How does social learning work?',
      answerAr: 'يمكنك الانضمام لمجموعات دراسة، المشاركة في منتديات النقاش، التحدث مع الزملاء، ومشاركة إنجازاتك مع المجتمع.',
      answerEn: 'You can join study groups, participate in discussion forums, chat with peers, and share your achievements with the community.',
    },
    {
      questionAr: 'هل يمكنني التعلم بالعربية؟',
      questionEn: 'Can I learn in Arabic?',
      answerAr: 'نعم! المنصة تدعم العربية والإنجليزية بالكامل، مع محتوى متخصص في كلتا اللغتين.',
      answerEn: 'Yes! The platform fully supports both Arabic and English, with specialized content in both languages.',
    },
    {
      questionAr: 'هل يمكنني إلغاء اشتراكي في أي وقت؟',
      questionEn: 'Can I cancel my subscription anytime?',
      answerAr: 'بالطبع! يمكنك إلغاء اشتراكك في أي وقت بدون أي رسوم إضافية أو عقوبات.',
      answerEn: 'Absolutely! You can cancel your subscription at any time with no extra fees or penalties.',
    },
    {
      questionAr: 'هل يمكنني الوصول للدورات بدون إنترنت؟',
      questionEn: 'Can I access courses offline?',
      answerAr: 'نعم، مع خطة Pro أو Enterprise يمكنك تحميل الدورات والوصول إليها بدون اتصال بالإنترنت.',
      answerEn: 'Yes, with the Pro or Enterprise plan you can download courses and access them offline.',
    },
  ];

  readonly activities = [
    { avatar: 'A', textEn: 'Ahmed just enrolled in Python Course', textAr: 'أحمد سجّل في دورة Python', timeEn: 'Just now', timeAr: 'الآن' },
    { avatar: 'S', textEn: 'Sara earned "JavaScript Master" badge', textAr: 'سارة حصلت على وسام JavaScript', timeEn: '2 min ago', timeAr: 'منذ دقيقتين' },
    { avatar: 'M', textEn: 'Mohamed completed UX Design course', textAr: 'محمد أكمل دورة تصميم UX', timeEn: '5 min ago', timeAr: 'منذ 5 دقائق' },
    { avatar: 'L', textEn: 'Layla joined the AI study group', textAr: 'ليلى انضمت لمجموعة دراسة AI', timeEn: '8 min ago', timeAr: 'منذ 8 دقائق' },
    { avatar: 'K', textEn: 'Khaled earned a React certificate', textAr: 'خالد حصل على شهادة React', timeEn: '12 min ago', timeAr: 'منذ 12 دقيقة' },
    { avatar: 'N', textEn: 'Nour started Data Science path', textAr: 'نور بدأت مسار علم البيانات', timeEn: '15 min ago', timeAr: 'منذ 15 دقيقة' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollY.set(window.scrollY);
  }

  ngOnInit(): void {
    this.startActivityTicker();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.tickerInterval) clearInterval(this.tickerInterval);
  }

  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleLanguage(): void {
    this.i18nService.toggle();
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? -1 : index);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  subscribeNewsletter(): void {
    this.toast.info({
      title: this.isAr() ? 'شكراً!' : 'Thank you!',
      message: this.isAr()
        ? 'تم تسجيلك في النشرة البريدية بنجاح'
        : 'You have been subscribed to our newsletter',
    });
  }

  private startActivityTicker(): void {
    // Show first activity after 3 seconds
    setTimeout(() => {
      this.showTicker.set(true);
      this.currentActivity.set(this.activities[0]);
    }, 3000);

    // Cycle through activities
    this.tickerInterval = setInterval(() => {
      this.showTicker.set(false);
      setTimeout(() => {
        this.activityIndex = (this.activityIndex + 1) % this.activities.length;
        this.currentActivity.set(this.activities[this.activityIndex]);
        this.showTicker.set(true);
      }, 500);
    }, 5000);
  }

  private animateCounters(): void {
    if (this.statsAnimated) return;
    this.statsAnimated = true;

    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const values = this.stats.map((stat) => {
        const val = Math.round(stat.numericEnd * eased);
        if (stat.numericEnd >= 1000) {
          return val.toLocaleString() + stat.suffix;
        }
        return val + stat.suffix;
      });

      this.animatedStats.set(values);

      if (current >= steps) {
        clearInterval(interval);
        this.animatedStats.set(this.stats.map((s) => s.value));
      }
    }, stepTime);
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const id = entry.target.getAttribute('id');
            if (id) this.activeSection.set(id);

            // Trigger counter animation when stats bar is visible
            if (entry.target.classList.contains('stats-bar') || entry.target.closest?.('.hero')) {
              this.animateCounters();
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: '-50px' },
    );

    const sections = this.el.nativeElement.querySelectorAll('.reveal');
    sections.forEach((s: Element) => this.observer.observe(s));

    // Also observe stats bar
    const statsBar = this.el.nativeElement.querySelector('.stats-bar');
    if (statsBar) this.observer.observe(statsBar);
  }

  showUnderDevelopment(event: Event): void {
    event.preventDefault();
    this.toast.info({
      title: this.isAr() ? 'قريباً' : 'Coming Soon',
      message: this.isAr()
        ? 'هذه الميزة لا تزال تحت التطوير'
        : 'This feature is still under development',
    });
  }
}
