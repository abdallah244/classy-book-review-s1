import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface ImageConfig {
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  lazy?: boolean;
  placeholder?: 'blur' | 'color' | 'none';
  placeholderColor?: string;
  breakpoints?: number[];
}

const DEFAULT_CONFIG: ImageConfig = {
  quality: 80,
  format: 'auto',
  lazy: true,
  placeholder: 'blur',
  breakpoints: [640, 768, 1024, 1280, 1536],
};

@Injectable({
  providedIn: 'root',
})
export class ImageLoaderService {
  private platformId = inject(PLATFORM_ID);
  private loadedImages = new Set<string>();
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initIntersectionObserver();
    }
  }

  /**
   * تحويل URL الصورة مع Cloudinary
   */
  getOptimizedUrl(src: string, config: Partial<ImageConfig> = {}): string {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    // إذا كان Cloudinary URL
    if (src.includes('cloudinary.com')) {
      return this.buildCloudinaryUrl(src, mergedConfig);
    }

    // إرجاع الـ URL كما هو إذا كان محلي
    return src;
  }

  /**
   * إنشاء srcset للصور المتجاوبة
   */
  getSrcSet(src: string, config: Partial<ImageConfig> = {}): string {
    const breakpoints = config.breakpoints || DEFAULT_CONFIG.breakpoints!;

    return breakpoints
      .map((width) => {
        const url = this.getOptimizedUrl(src, { ...config, width });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * إنشاء sizes attribute
   */
  getSizes(defaultSize: string = '100vw'): string {
    return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${defaultSize}`;
  }

  /**
   * الحصول على placeholder blur
   */
  getBlurPlaceholder(src: string): string {
    if (src.includes('cloudinary.com')) {
      const transformations = 'w_20,h_20,c_scale,e_blur:1000,q_1';
      return this.addCloudinaryTransformation(src, transformations);
    }
    return src;
  }

  /**
   * تحميل صورة مسبقاً
   */
  preload(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        reject(new Error('Not in browser'));
        return;
      }

      if (this.loadedImages.has(src)) {
        const img = new Image();
        img.src = src;
        resolve(img);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.loadedImages.add(src);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * تحميل كسول للصورة
   */
  lazyLoad(element: HTMLImageElement, src: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.intersectionObserver) {
      (element as any).__lazySrc = src;
      this.intersectionObserver.observe(element);
    } else {
      element.src = src;
    }
  }

  /**
   * التحقق من دعم صيغة معينة
   */
  supportsFormat(format: 'webp' | 'avif'): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    if (format === 'webp') {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    if (format === 'avif') {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }

    return false;
  }

  /**
   * الحصول على أفضل صيغة مدعومة
   */
  getBestFormat(): 'avif' | 'webp' | 'jpeg' {
    if (this.supportsFormat('avif')) return 'avif';
    if (this.supportsFormat('webp')) return 'webp';
    return 'jpeg';
  }

  /**
   * بناء Cloudinary URL
   */
  private buildCloudinaryUrl(src: string, config: ImageConfig): string {
    const transformations: string[] = [];

    if (config.width) transformations.push(`w_${config.width}`);
    if (config.height) transformations.push(`h_${config.height}`);
    if (config.quality) transformations.push(`q_${config.quality}`);

    if (config.fit) {
      const fitMap: Record<string, string> = {
        cover: 'c_fill',
        contain: 'c_fit',
        fill: 'c_scale',
        inside: 'c_limit',
        outside: 'c_lfill',
      };
      transformations.push(fitMap[config.fit] || 'c_fill');
    }

    if (config.format === 'auto') {
      transformations.push('f_auto');
    } else if (config.format) {
      transformations.push(`f_${config.format}`);
    }

    // Auto optimization
    transformations.push('fl_progressive');
    transformations.push('dpr_auto');

    return this.addCloudinaryTransformation(src, transformations.join(','));
  }

  /**
   * إضافة تحويلات Cloudinary
   */
  private addCloudinaryTransformation(url: string, transformations: string): string {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    return url.slice(0, uploadIndex + 8) + transformations + '/' + url.slice(uploadIndex + 8);
  }

  /**
   * تهيئة IntersectionObserver
   */
  private initIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = (img as any).__lazySrc;
            if (src) {
              img.src = src;
              this.intersectionObserver?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      },
    );
  }

  /**
   * تنظيف
   */
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
}
