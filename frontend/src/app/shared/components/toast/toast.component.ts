import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" [class.toast-exit]="false">
          <!-- Icon -->
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" />
                  <polyline
                    points="22 4 12 14.01 9 11.01"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke-linecap="round" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke-linecap="round" />
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  />
                  <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" />
                </svg>
              }
              @case ('info') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" stroke-linecap="round" />
                  <line x1="12" y1="8" x2="12.01" y2="8" stroke-linecap="round" />
                </svg>
              }
              @case ('loading') {
                <svg
                  class="spinner"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                    stroke-linecap="round"
                  />
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="toast-body">
            <span class="toast-title">{{ toast.title }}</span>
            @if (toast.message) {
              <span class="toast-message">{{ toast.message }}</span>
            }
          </div>

          <!-- Action -->
          @if (toast.action) {
            <button
              class="toast-action"
              (click)="toast.action!.handler(); toastService.dismiss(toast.id)"
            >
              {{ toast.action.label }}
            </button>
          }

          <!-- Dismiss -->
          @if (toast.dismissible) {
            <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
              </svg>
            </button>
          }

          <!-- Progress bar -->
          @if (toast.progress) {
            <div class="toast-progress" [style.animation-duration.ms]="toast.duration"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* ═══ Container ═══ */
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        max-width: 420px;
        width: calc(100% - 2rem);
        pointer-events: none;
      }
      :host-context([dir='rtl']) .toast-container {
        right: auto;
        left: 1rem;
      }

      /* ═══ Toast base ═══ */
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 12px;
        background: var(--bg-primary, #ffffff);
        border: 1px solid var(--border-primary, #e5e7eb);
        box-shadow:
          0 8px 30px rgba(0, 0, 0, 0.12),
          0 2px 8px rgba(0, 0, 0, 0.06);
        pointer-events: auto;
        position: relative;
        overflow: hidden;
        animation: toastIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
      }

      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateX(100%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      :host-context([dir='rtl']) .toast {
        animation-name: toastInRtl;
      }
      @keyframes toastInRtl {
        from {
          opacity: 0;
          transform: translateX(-100%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      /* ═══ Type colors ═══ */
      .toast-success {
        border-left: 4px solid #10b981;
      }
      :host-context([dir='rtl']) .toast-success {
        border-left: 1px solid var(--border-primary, #e5e7eb);
        border-right: 4px solid #10b981;
      }
      .toast-success .toast-icon {
        color: #10b981;
        background: rgba(16, 185, 129, 0.1);
      }

      .toast-error {
        border-left: 4px solid #ef4444;
      }
      :host-context([dir='rtl']) .toast-error {
        border-left: 1px solid var(--border-primary, #e5e7eb);
        border-right: 4px solid #ef4444;
      }
      .toast-error .toast-icon {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }

      .toast-warning {
        border-left: 4px solid #f59e0b;
      }
      :host-context([dir='rtl']) .toast-warning {
        border-left: 1px solid var(--border-primary, #e5e7eb);
        border-right: 4px solid #f59e0b;
      }
      .toast-warning .toast-icon {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }

      .toast-info {
        border-left: 4px solid #3b82f6;
      }
      :host-context([dir='rtl']) .toast-info {
        border-left: 1px solid var(--border-primary, #e5e7eb);
        border-right: 4px solid #3b82f6;
      }
      .toast-info .toast-icon {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
      }

      .toast-loading {
        border-left: 4px solid #8b5cf6;
      }
      :host-context([dir='rtl']) .toast-loading {
        border-left: 1px solid var(--border-primary, #e5e7eb);
        border-right: 4px solid #8b5cf6;
      }
      .toast-loading .toast-icon {
        color: #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
      }

      /* ═══ Icon ═══ */
      .toast-icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .toast-icon svg {
        width: 20px;
        height: 20px;
      }

      .spinner {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ═══ Body ═══ */
      .toast-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding-top: 0.125rem;
      }
      .toast-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary, #1a1a2e);
        line-height: 1.4;
      }
      .toast-message {
        font-size: 0.8rem;
        color: var(--text-secondary, #6b7280);
        line-height: 1.4;
      }

      /* ═══ Action ═══ */
      .toast-action {
        flex-shrink: 0;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--accent-color, #3b82f6);
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        transition: background 0.15s;
        align-self: center;
      }
      .toast-action:hover {
        background: rgba(59, 130, 246, 0.1);
      }

      /* ═══ Close ═══ */
      .toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 6px;
        color: var(--text-tertiary, #9ca3af);
        transition: all 0.15s;
        align-self: flex-start;
      }
      .toast-close:hover {
        background: var(--bg-tertiary, #f3f4f6);
        color: var(--text-primary, #1a1a2e);
      }
      .toast-close svg {
        width: 16px;
        height: 16px;
      }

      /* ═══ Progress ═══ */
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.2;
        transform-origin: left;
        animation: progressShrink linear forwards;
      }
      @keyframes progressShrink {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }

      /* ═══ Responsive ═══ */
      @media (max-width: 640px) {
        .toast-container {
          top: 0.5rem;
          right: 0.5rem;
          max-width: calc(100% - 1rem);
        }
        .toast {
          padding: 0.75rem;
          border-radius: 10px;
        }
      }
    `,
  ],
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
