import { Injectable, signal } from '@angular/core';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  dismissible: boolean;
  progress: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public toasts = signal<Toast[]>([]);

  private defaultDuration = 5000;
  private maxToasts = 5;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * إظهار toast نجاح
   */
  success(options: ToastOptions | string): string {
    return this.show('success', typeof options === 'string' ? { title: options } : options);
  }

  /**
   * إظهار toast خطأ
   */
  error(options: ToastOptions | string): string {
    return this.show(
      'error',
      typeof options === 'string' ? { title: options, duration: 8000 } : options,
    );
  }

  /**
   * إظهار toast تحذير
   */
  warning(options: ToastOptions | string): string {
    return this.show(
      'warning',
      typeof options === 'string' ? { title: options, duration: 6000 } : options,
    );
  }

  /**
   * إظهار toast معلومات
   */
  info(options: ToastOptions | string): string {
    return this.show('info', typeof options === 'string' ? { title: options } : options);
  }

  /**
   * إظهار toast تحميل (يبقى حتى يتم استبداله أو إغلاقه)
   */
  loading(options: ToastOptions | string): string {
    return this.show('loading', {
      ...(typeof options === 'string' ? { title: options } : options),
      duration: 0,
      dismissible: false,
    });
  }

  /**
   * Promise-based toast: loading → success/error
   */
  async promise<T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    },
  ): Promise<T> {
    const id = this.loading(msgs.loading);
    try {
      const result = await promise;
      const msg = typeof msgs.success === 'function' ? msgs.success(result) : msgs.success;
      this.update(id, { type: 'success', title: msg, duration: 4000, dismissible: true });
      return result;
    } catch (err) {
      const msg = typeof msgs.error === 'function' ? msgs.error(err) : msgs.error;
      this.update(id, { type: 'error', title: msg, duration: 8000, dismissible: true });
      throw err;
    }
  }

  /**
   * تحديث toast موجود (مثلاً من loading → success)
   */
  update(id: string, changes: Partial<Omit<Toast, 'id'>>): void {
    // Clear existing timer
    const existing = this.timers.get(id);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(id);
    }

    this.toasts.update((toasts) =>
      toasts.map((t) =>
        t.id === id ? { ...t, ...changes, progress: (changes.duration ?? 0) > 0 } : t,
      ),
    );

    const duration = changes.duration;
    if (duration && duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.timers.set(id, timer);
    }
  }

  /**
   * إظهار toast
   */
  private show(type: ToastType, options: ToastOptions): string {
    const id = this.generateId();
    const duration = options.duration ?? (type === 'loading' ? 0 : this.defaultDuration);

    const toast: Toast = {
      id,
      type,
      title: options.title,
      message: options.message,
      duration,
      dismissible: options.dismissible ?? type !== 'loading',
      progress: duration > 0,
      action: options.action,
    };

    this.toasts.update((toasts) => {
      const updated = [toast, ...toasts];
      if (updated.length > this.maxToasts) return updated.slice(0, this.maxToasts);
      return updated;
    });

    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  /**
   * إخفاء toast
   */
  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  /**
   * إخفاء كل الـ toasts
   */
  dismissAll(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.toasts.set([]);
  }

  /**
   * توليد معرف فريد
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
