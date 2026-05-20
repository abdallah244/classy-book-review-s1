import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  Renderer2,
  Output,
  EventEmitter,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🎬 Scroll Animation Directive
 * توجيه للتحكم في الأنيميشن أثناء السكرول
 *
 * الاستخدام:
 * <div appScrollAnimation
 *      [animation]="'fadeInUp'"
 *      [threshold]="0.2"
 *      [delay]="100"
 *      [once]="true">
 * </div>
 */
@Directive({
  selector: '[appScrollAnimation]',
  standalone: true,
})
export class ScrollAnimationDirective implements OnInit, OnDestroy {
  // نوع الأنيميشن
  @Input() animation: AnimationType = 'fadeInUp';

  // نسبة ظهور العنصر المطلوبة لبدء الأنيميشن (0 - 1)
  @Input() threshold: number = 0.2;

  // تأخير قبل بدء الأنيميشن (بالميلي ثانية)
  @Input() delay: number = 0;

  // مدة الأنيميشن (بالميلي ثانية)
  @Input() duration: number = 600;

  // تشغيل الأنيميشن مرة واحدة فقط
  @Input() once: boolean = true;

  // تفعيل/تعطيل الأنيميشن
  @Input() disabled: boolean = false;

  // المسافة للتحريك (للأنيميشنات التي تتضمن حركة)
  @Input() distance: string = '50px';

  // أحداث
  @Output() animationStart = new EventEmitter<void>();
  @Output() animationEnd = new EventEmitter<void>();
  @Output() elementVisible = new EventEmitter<boolean>();

  private observer: IntersectionObserver | null = null;
  private isBrowser: boolean;
  private hasAnimated: boolean = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser || this.disabled) return;

    this.setupInitialStyles();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * إعداد الأنماط الأولية
   */
  private setupInitialStyles(): void {
    const element = this.el.nativeElement;

    // إضافة transition
    this.renderer.setStyle(
      element,
      'transition',
      `opacity ${this.duration}ms ease-out, transform ${this.duration}ms ease-out`,
    );

    // إخفاء العنصر وتطبيق التحويل الأولي
    this.renderer.setStyle(element, 'opacity', '0');

    // تطبيق التحويل حسب نوع الأنيميشن
    this.applyInitialTransform();
  }

  /**
   * تطبيق التحويل الأولي حسب نوع الأنيميشن
   */
  private applyInitialTransform(): void {
    const element = this.el.nativeElement;

    switch (this.animation) {
      case 'fadeInUp':
        this.renderer.setStyle(element, 'transform', `translateY(${this.distance})`);
        break;
      case 'fadeInDown':
        this.renderer.setStyle(element, 'transform', `translateY(-${this.distance})`);
        break;
      case 'fadeInLeft':
        this.renderer.setStyle(element, 'transform', `translateX(-${this.distance})`);
        break;
      case 'fadeInRight':
        this.renderer.setStyle(element, 'transform', `translateX(${this.distance})`);
        break;
      case 'zoomIn':
        this.renderer.setStyle(element, 'transform', 'scale(0.8)');
        break;
      case 'zoomOut':
        this.renderer.setStyle(element, 'transform', 'scale(1.2)');
        break;
      case 'rotateIn':
        this.renderer.setStyle(element, 'transform', 'rotate(-10deg) scale(0.9)');
        break;
      case 'flipInX':
        this.renderer.setStyle(element, 'transform', 'perspective(400px) rotateX(90deg)');
        break;
      case 'flipInY':
        this.renderer.setStyle(element, 'transform', 'perspective(400px) rotateY(90deg)');
        break;
      case 'slideInUp':
        this.renderer.setStyle(element, 'transform', `translateY(100%)`);
        break;
      case 'slideInDown':
        this.renderer.setStyle(element, 'transform', `translateY(-100%)`);
        break;
      case 'fadeIn':
      default:
        // فقط fade، بدون transform
        break;
    }
  }

  /**
   * إعداد مراقب التقاطع
   */
  private setupIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px',
      threshold: this.threshold,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.elementVisible.emit(entry.isIntersecting);

        if (entry.isIntersecting) {
          if (!this.hasAnimated || !this.once) {
            this.animateIn();
          }
        } else if (!this.once) {
          this.animateOut();
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }

  /**
   * تشغيل أنيميشن الظهور
   */
  private animateIn(): void {
    const element = this.el.nativeElement;

    setTimeout(() => {
      this.animationStart.emit();

      this.renderer.setStyle(element, 'opacity', '1');
      this.renderer.setStyle(element, 'transform', 'none');

      this.hasAnimated = true;

      // إطلاق حدث انتهاء الأنيميشن
      setTimeout(() => {
        this.animationEnd.emit();
      }, this.duration);
    }, this.delay);
  }

  /**
   * تشغيل أنيميشن الاختفاء
   */
  private animateOut(): void {
    const element = this.el.nativeElement;

    this.renderer.setStyle(element, 'opacity', '0');
    this.applyInitialTransform();
    this.hasAnimated = false;
  }

  /**
   * إعادة تشغيل الأنيميشن يدوياً
   */
  replay(): void {
    this.hasAnimated = false;
    this.animateOut();
    setTimeout(() => this.animateIn(), 100);
  }
}

/**
 * أنواع الأنيميشن المتاحة
 */
export type AnimationType =
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'rotateIn'
  | 'flipInX'
  | 'flipInY'
  | 'slideInUp'
  | 'slideInDown';
