import { Injectable, signal, inject } from '@angular/core';

interface ModalConfig {
  id?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  data?: any;
}

interface Modal extends ModalConfig {
  id: string;
  component: any;
  isOpen: boolean;
  resolve?: (value: any) => void;
  reject?: (reason: any) => void;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger' | 'warning';
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  public modals = signal<Modal[]>([]);
  private activeModal = signal<Modal | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      // الاستماع لـ Escape
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.handleEscape();
        }
      });
    }
  }

  /**
   * فتح modal
   */
  open<T = any>(component: any, config: ModalConfig = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const modal: Modal = {
        id: config.id || this.generateId(),
        component,
        isOpen: true,
        title: config.title,
        size: config.size || 'md',
        closable: config.closable ?? true,
        closeOnBackdrop: config.closeOnBackdrop ?? true,
        closeOnEscape: config.closeOnEscape ?? true,
        data: config.data,
        resolve,
        reject,
      };

      this.modals.update((modals) => [...modals, modal]);
      this.activeModal.set(modal);

      // منع التمرير
      document.body.style.overflow = 'hidden';
    });
  }

  /**
   * إغلاق modal
   */
  close(id?: string, result?: any): void {
    const modalId = id || this.activeModal()?.id;
    if (!modalId) return;

    const modal = this.modals().find((m) => m.id === modalId);
    if (!modal) return;

    if (modal.resolve) {
      modal.resolve(result);
    }

    this.modals.update((modals) => modals.filter((m) => m.id !== modalId));

    // تحديث الـ activeModal
    const remaining = this.modals();
    this.activeModal.set(remaining.length > 0 ? remaining[remaining.length - 1] : null);

    // إعادة التمرير
    if (remaining.length === 0) {
      document.body.style.overflow = '';
    }
  }

  /**
   * إلغاء modal
   */
  dismiss(id?: string, reason?: any): void {
    const modalId = id || this.activeModal()?.id;
    if (!modalId) return;

    const modal = this.modals().find((m) => m.id === modalId);
    if (!modal) return;

    if (modal.reject) {
      modal.reject(reason);
    }

    this.modals.update((modals) => modals.filter((m) => m.id !== modalId));

    const remaining = this.modals();
    this.activeModal.set(remaining.length > 0 ? remaining[remaining.length - 1] : null);

    if (remaining.length === 0) {
      document.body.style.overflow = '';
    }
  }

  /**
   * إغلاق جميع الـ modals
   */
  closeAll(): void {
    this.modals().forEach((modal) => {
      if (modal.reject) {
        modal.reject('closed_all');
      }
    });
    this.modals.set([]);
    this.activeModal.set(null);
    document.body.style.overflow = '';
  }

  /**
   * نافذة تأكيد
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    // سيتم استخدام component خارجي للتأكيد
    // هنا نعيد promise بسيط للتوضيح
    return new Promise((resolve) => {
      const confirmModal: Modal = {
        id: this.generateId(),
        component: 'confirm',
        isOpen: true,
        title: options.title,
        size: 'sm',
        closable: true,
        closeOnBackdrop: false,
        closeOnEscape: true,
        data: options,
        resolve: (confirmed: boolean) => resolve(confirmed),
      };

      this.modals.update((modals) => [...modals, confirmModal]);
      this.activeModal.set(confirmModal);
      document.body.style.overflow = 'hidden';
    });
  }

  /**
   * نافذة تنبيه
   */
  async alert(title: string, message: string): Promise<void> {
    return this.confirm({
      title,
      message,
      confirmText: 'حسناً',
      cancelText: '',
    }).then(() => {});
  }

  /**
   * النقر على الخلفية
   */
  onBackdropClick(id: string): void {
    const modal = this.modals().find((m) => m.id === id);
    if (modal?.closeOnBackdrop) {
      this.dismiss(id, 'backdrop');
    }
  }

  /**
   * معالجة Escape
   */
  private handleEscape(): void {
    const active = this.activeModal();
    if (active?.closeOnEscape) {
      this.dismiss(active.id, 'escape');
    }
  }

  /**
   * توليد معرف فريد
   */
  private generateId(): string {
    return `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * الحصول على حجم الـ modal بـ CSS
   */
  getModalSize(size: string): string {
    const sizes: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    };
    return sizes[size] || sizes['md'];
  }
}
