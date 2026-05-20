import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🖼️ Image Optimization Service
 * خدمة ضغط وتحسين الصور
 */
@Injectable({
  providedIn: 'root',
})
export class ImageOptimizationService {
  private isBrowser: boolean;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  /**
   * ضغط الصورة مع الحفاظ على الجودة
   */
  async compressImage(file: File, options: CompressionOptions = {}): Promise<CompressedImage> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'webp' } = options;

    return new Promise((resolve, reject) => {
      if (!this.isBrowser || !this.canvas || !this.ctx) {
        reject(new Error('Canvas not available'));
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        // حساب الأبعاد الجديدة
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        // رسم الصورة على الـ Canvas
        this.canvas!.width = width;
        this.canvas!.height = height;
        this.ctx!.drawImage(img, 0, 0, width, height);

        // تحويل إلى الصيغة المطلوبة
        const mimeType = `image/${format}`;
        const dataUrl = this.canvas!.toDataURL(mimeType, quality);
        const blob = this.dataURLtoBlob(dataUrl);

        resolve({
          blob,
          dataUrl,
          width,
          height,
          originalSize: file.size,
          compressedSize: blob.size,
          compressionRatio: ((1 - blob.size / file.size) * 100).toFixed(2) + '%',
          format,
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsDataURL(file);
    });
  }

  /**
   * ضغط عدة صور
   */
  async compressImages(
    files: File[],
    options: CompressionOptions = {},
  ): Promise<CompressedImage[]> {
    return Promise.all(files.map((file) => this.compressImage(file, options)));
  }

  /**
   * تحويل الصورة إلى WebP (أفضل ضغط)
   */
  async convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
    const result = await this.compressImage(file, { format: 'webp', quality });
    return result.blob;
  }

  /**
   * إنشاء صورة مصغرة (Thumbnail)
   */
  async createThumbnail(file: File, size: number = 150): Promise<CompressedImage> {
    return this.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'webp',
    });
  }

  /**
   * تحميل الصورة بشكل تدريجي (Progressive Loading)
   */
  async progressiveLoad(src: string, imgElement: HTMLImageElement): Promise<void> {
    if (!this.isBrowser) return;

    // عرض نسخة مصغرة ضبابية أولاً
    const tinyImg = new Image();
    tinyImg.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      // تحميل الصورة الكاملة
      const fullImg = new Image();
      fullImg.crossOrigin = 'anonymous';

      fullImg.onload = () => {
        imgElement.src = fullImg.src;
        imgElement.classList.add('loaded');
        resolve();
      };

      fullImg.src = src;
    });
  }

  /**
   * إنشاء Placeholder ضبابي (Blur Placeholder)
   */
  async createBlurPlaceholder(file: File, size: number = 20): Promise<string> {
    const result = await this.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.5,
      format: 'jpeg',
    });
    return result.dataUrl;
  }

  /**
   * التحقق من نوع الصورة
   */
  isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return validTypes.includes(file.type);
  }

  /**
   * الحصول على أبعاد الصورة
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsDataURL(file);
    });
  }

  /**
   * تحويل DataURL إلى Blob
   */
  private dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  /**
   * تحويل Blob إلى File
   */
  blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, { type: blob.type });
  }

  /**
   * تحسين الصور للـ Retina Display
   */
  async createRetinaVersions(
    file: File,
  ): Promise<{ '1x': CompressedImage; '2x': CompressedImage; '3x': CompressedImage }> {
    const dimensions = await this.getImageDimensions(file);

    const [img1x, img2x, img3x] = await Promise.all([
      this.compressImage(file, {
        maxWidth: dimensions.width / 3,
        maxHeight: dimensions.height / 3,
      }),
      this.compressImage(file, {
        maxWidth: (dimensions.width * 2) / 3,
        maxHeight: (dimensions.height * 2) / 3,
      }),
      this.compressImage(file, {
        maxWidth: dimensions.width,
        maxHeight: dimensions.height,
      }),
    ]);

    return { '1x': img1x, '2x': img2x, '3x': img3x };
  }

  /**
   * إنشاء srcset للصور المتجاوبة
   */
  createSrcSet(images: { url: string; width: number }[]): string {
    return images.map((img) => `${img.url} ${img.width}w`).join(', ');
  }
}

// ==========================================
// 📦 Interfaces
// ==========================================

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
}

interface CompressedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  format: string;
}
