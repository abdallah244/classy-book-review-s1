import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  Output,
  EventEmitter,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, fromEvent, throttleTime, takeUntil } from 'rxjs';

/**
 * 📜 Virtual Scroll Directive
 * توجيه للتحكم في السكرول الافتراضي وتحميل المحتوى تدريجياً
 *
 * الاستخدام:
 * <div appVirtualScroll
 *      [itemHeight]="100"
 *      [bufferSize]="5"
 *      (loadMore)="onLoadMore()">
 * </div>
 */
@Directive({
  selector: '[appVirtualScroll]',
  standalone: true,
})
export class VirtualScrollDirective implements OnInit, OnDestroy {
  // ارتفاع العنصر الواحد (بالبكسل)
  @Input() itemHeight: number = 100;

  // عدد العناصر الإضافية المحملة خارج نطاق الرؤية
  @Input() bufferSize: number = 5;

  // نسبة السكرول للوصول للنهاية (لتحميل المزيد)
  @Input() loadThreshold: number = 0.8;

  // تفعيل تأثير Parallax
  @Input() enableParallax: boolean = false;

  // سرعة تأثير Parallax
  @Input() parallaxSpeed: number = 0.5;

  // أحداث
  @Output() loadMore = new EventEmitter<void>();
  @Output() scrollProgress = new EventEmitter<number>();
  @Output() scrollDirection = new EventEmitter<'up' | 'down'>();
  @Output() reachedTop = new EventEmitter<void>();
  @Output() reachedBottom = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private lastScrollTop: number = 0;
  private loadingMore: boolean = false;

  constructor(
    private el: ElementRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.setupScrollListener();

    if (this.enableParallax) {
      this.setupParallaxEffect();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * إعداد مستمع السكرول
   */
  private setupScrollListener(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'scroll')
        .pipe(throttleTime(16), takeUntil(this.destroy$))
        .subscribe(() => {
          this.ngZone.run(() => this.onScroll());
        });
    });
  }

  /**
   * معالجة حدث السكرول
   */
  private onScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // حساب نسبة التقدم في السكرول
    const progress = scrollTop / (scrollHeight - clientHeight);
    this.scrollProgress.emit(Math.min(1, Math.max(0, progress)));

    // تحديد اتجاه السكرول
    const direction: 'up' | 'down' = scrollTop > this.lastScrollTop ? 'down' : 'up';
    this.scrollDirection.emit(direction);

    // التحقق من الوصول للأعلى
    if (scrollTop === 0) {
      this.reachedTop.emit();
    }

    // التحقق من الوصول للأسفل وتحميل المزيد
    if (progress >= this.loadThreshold && !this.loadingMore) {
      this.loadingMore = true;
      this.loadMore.emit();
      this.reachedBottom.emit();

      // إعادة تفعيل التحميل بعد فترة
      setTimeout(() => {
        this.loadingMore = false;
      }, 1000);
    }

    this.lastScrollTop = scrollTop;
  }

  /**
   * إعداد تأثير Parallax
   */
  private setupParallaxEffect(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'scroll')
        .pipe(throttleTime(16), takeUntil(this.destroy$))
        .subscribe(() => {
          const scrollTop = window.pageYOffset;
          const parallaxElements = this.el.nativeElement.querySelectorAll('[data-parallax]');

          parallaxElements.forEach((element: HTMLElement) => {
            const speed = parseFloat(element.dataset['parallax'] || String(this.parallaxSpeed));
            const yPos = -(scrollTop * speed);
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
          });
        });
    });
  }

  /**
   * السكرول لأعلى الصفحة بسلاسة
   */
  scrollToTop(duration: number = 500): void {
    if (!this.isBrowser) return;

    const start = window.pageYOffset;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      window.scrollTo(0, start * (1 - easeInOutCubic(progress)));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }

  /**
   * السكرول لعنصر معين
   */
  scrollToElement(selector: string, offset: number = 0): void {
    if (!this.isBrowser) return;

    const element = document.querySelector(selector);
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  /**
   * إيقاف/استئناف السكرول
   */
  toggleScroll(disable: boolean): void {
    if (!this.isBrowser) return;

    if (disable) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
}
