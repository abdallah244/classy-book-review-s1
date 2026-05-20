import { Injectable, inject, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable, tap, map } from 'rxjs';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  id: string;
  url: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
}

interface FileValidation {
  maxSize: number; // بالبايت
  allowedTypes: string[];
  maxFiles?: number;
}

const VALIDATION_PRESETS: Record<string, FileValidation> = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 10,
  },
  video: {
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    maxFiles: 1,
  },
  document: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    maxFiles: 5,
  },
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 1,
  },
};

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private api = inject(ApiClientService);

  // Signals
  public uploadProgress = signal<UploadProgress | null>(null);
  public isUploading = signal(false);
  public errors = signal<string[]>([]);

  /**
   * رفع ملف واحد
   */
  uploadFile(
    file: File,
    folder: string = 'uploads',
    preset: keyof typeof VALIDATION_PRESETS = 'image',
  ): Observable<UploadResult> {
    // التحقق من الملف
    const validation = VALIDATION_PRESETS[preset];
    const validationError = this.validateFile(file, validation);
    if (validationError) {
      this.errors.set([validationError]);
      throw new Error(validationError);
    }

    this.isUploading.set(true);
    this.errors.set([]);
    this.uploadProgress.set({ loaded: 0, total: file.size, percentage: 0 });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return this.api.upload<UploadResult>('/files/upload', file, { folder }).pipe(
      tap({
        next: () => {
          this.uploadProgress.set({ loaded: file.size, total: file.size, percentage: 100 });
        },
        complete: () => {
          this.isUploading.set(false);
          this.uploadProgress.set(null);
        },
        error: (error) => {
          this.isUploading.set(false);
          this.uploadProgress.set(null);
          this.errors.set([error.message]);
        },
      }),
    );
  }

  /**
   * رفع عدة ملفات
   */
  uploadMultiple(
    files: File[],
    folder: string = 'uploads',
    preset: keyof typeof VALIDATION_PRESETS = 'image',
  ): Observable<UploadResult[]> {
    const validation = VALIDATION_PRESETS[preset];

    // التحقق من عدد الملفات
    if (validation.maxFiles && files.length > validation.maxFiles) {
      const error = `الحد الأقصى للملفات هو ${validation.maxFiles}`;
      this.errors.set([error]);
      throw new Error(error);
    }

    // التحقق من كل ملف
    const errors: string[] = [];
    files.forEach((file, index) => {
      const error = this.validateFile(file, validation);
      if (error) {
        errors.push(`الملف ${index + 1}: ${error}`);
      }
    });

    if (errors.length > 0) {
      this.errors.set(errors);
      throw new Error(errors.join('\n'));
    }

    this.isUploading.set(true);
    this.errors.set([]);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    return this.api.post<UploadResult[]>('/files/upload-multiple', formData).pipe(
      tap({
        complete: () => this.isUploading.set(false),
        error: () => this.isUploading.set(false),
      }),
    );
  }

  /**
   * رفع صورة بروفايل
   */
  uploadAvatar(file: File): Observable<UploadResult> {
    return this.uploadFile(file, 'avatars', 'avatar');
  }

  /**
   * رفع فيديو
   */
  uploadVideo(file: File, folder: string = 'videos'): Observable<UploadResult> {
    return this.uploadFile(file, folder, 'video');
  }

  /**
   * رفع مستند
   */
  uploadDocument(file: File, folder: string = 'documents'): Observable<UploadResult> {
    return this.uploadFile(file, folder, 'document');
  }

  /**
   * حذف ملف
   */
  deleteFile(publicId: string): Observable<void> {
    return this.api.delete(`/files/${publicId}`);
  }

  /**
   * التحقق من صحة الملف
   */
  private validateFile(file: File, validation: FileValidation): string | null {
    // التحقق من الحجم
    if (file.size > validation.maxSize) {
      const maxSizeMB = Math.round(validation.maxSize / (1024 * 1024));
      return `حجم الملف يتجاوز الحد الأقصى (${maxSizeMB}MB)`;
    }

    // التحقق من النوع
    if (!validation.allowedTypes.includes(file.type)) {
      return `نوع الملف غير مدعوم`;
    }

    return null;
  }

  /**
   * تحويل حجم الملف لنص مقروء
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * الحصول على أيقونة نوع الملف
   */
  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('word')) return 'word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'powerpoint';
    return 'file';
  }

  /**
   * قراءة ملف كـ Data URL
   */
  readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * ضغط صورة قبل الرفع
   */
  async compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name, { type: file.type }));
          },
          file.type,
          quality,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}
