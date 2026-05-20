import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterCodeService } from '../../../core/services/master-code.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-master-code-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Backdrop -->
    @if (masterCodeService.isModalOpen()) {
      <div
        class="modal-backdrop"
        [attr.data-theme]="currentTheme()"
        (click)="onBackdropClick($event)"
      >
        <div class="modal-container" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-icon">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h2>{{ t.title }}</h2>
            <p class="subtitle">{{ t.subtitle }}</p>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Skeleton while loading -->
            @if (masterCodeService.isVerifying()) {
              <div class="skeleton-container">
                <div class="skeleton skeleton-input"></div>
                <div class="skeleton skeleton-button"></div>
              </div>
            } @else {
              <!-- Input Field -->
              <div class="input-group">
                <label for="masterCode">{{ t.label }}</label>
                <div class="input-wrapper">
                  <input
                    #codeInput
                    type="password"
                    id="masterCode"
                    [(ngModel)]="codeValue"
                    (keydown.enter)="submitCode()"
                    [placeholder]="t.placeholder"
                    maxlength="10"
                    autocomplete="off"
                    [disabled]="masterCodeService.isVerifying()"
                  />
                  <button type="button" class="toggle-visibility" (click)="toggleVisibility()">
                    <i [class]="showCode() ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- Error Message -->
              @if (masterCodeService.errorMessage()) {
                <div class="error-message">
                  <i class="fa-solid fa-exclamation-circle"></i>
                  <span>{{ masterCodeService.errorMessage() }}</span>
                </div>
              }

              <!-- Attempts Indicator -->
              <div class="attempts-indicator">
                <span class="attempts-label">{{ t.attemptsLeft }}:</span>
                <div class="attempts-dots">
                  @for (i of [1, 2, 3]; track i) {
                    <span
                      class="dot"
                      [class.active]="i <= masterCodeService.attemptsLeft()"
                      [class.warning]="masterCodeService.attemptsLeft() === 1 && i === 1"
                    ></span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              (click)="cancel()"
              [disabled]="masterCodeService.isVerifying()"
            >
              <i class="fa-solid fa-times"></i>
              {{ t.cancel }}
            </button>
            <button
              class="btn btn-primary"
              (click)="submitCode()"
              [disabled]="masterCodeService.isVerifying() || !codeValue"
            >
              @if (masterCodeService.isVerifying()) {
                <i class="fa-solid fa-spinner fa-spin"></i>
              } @else {
                <i class="fa-solid fa-check"></i>
              }
              {{ t.submit }}
            </button>
          </div>

          <!-- Security Note -->
          <div class="security-note">
            <i class="fa-solid fa-info-circle"></i>
            <span>{{ t.securityNote }}</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.15s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-container {
        background: var(--card-bg, #ffffff);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 420px;
        overflow: hidden;
        animation: slideUp 0.2s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Header */
      .modal-header {
        text-align: center;
        padding: 2rem 2rem 1rem;
        background: var(--primary-color, #667eea);
        color: white;
      }

      .header-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
      }

      .header-icon i {
        font-size: 1.75rem;
      }

      .modal-header h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .modal-header .subtitle {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
      }

      /* Body */
      .modal-body {
        padding: 1.5rem 2rem;
      }

      .input-group {
        margin-bottom: 1rem;
      }

      .input-group label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-primary, #333);
        margin-bottom: 0.5rem;
      }

      .input-wrapper {
        position: relative;
        display: flex;
      }

      .input-wrapper input {
        flex: 1;
        padding: 0.875rem 1rem;
        padding-right: 3rem;
        border: 2px solid var(--border-color, #e1e5eb);
        border-radius: 10px;
        font-size: 1.1rem;
        letter-spacing: 0.2em;
        text-align: center;
        background: var(--input-bg, #f8f9fa);
        color: var(--text-primary, #333);
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }

      .input-wrapper input:focus {
        outline: none;
        border-color: var(--primary-color, #667eea);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
      }

      .input-wrapper input::placeholder {
        letter-spacing: 0.1em;
        color: var(--text-secondary, #999);
      }

      .toggle-visibility {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-secondary, #999);
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toggle-visibility:hover {
        color: var(--primary-color, #667eea);
      }

      /* Error Message */
      .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: rgba(220, 53, 69, 0.1);
        border: 1px solid rgba(220, 53, 69, 0.3);
        border-radius: 8px;
        color: #dc3545;
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }

      /* Attempts Indicator */
      .attempts-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--input-bg, #f8f9fa);
        border-radius: 8px;
      }

      .attempts-label {
        font-size: 0.85rem;
        color: var(--text-secondary, #666);
      }

      .attempts-dots {
        display: flex;
        gap: 0.5rem;
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--border-color, #ddd);
        transition: all 0.2s;
      }

      .dot.active {
        background: #28a745;
      }

      .dot.warning {
        background: #dc3545;
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
      }

      /* Skeleton */
      .skeleton-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .skeleton {
        background: var(--border-color, #e1e5eb);
        animation: skeletonPulse 1.5s infinite;
        border-radius: 8px;
      }

      @keyframes skeletonPulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .skeleton-input {
        height: 52px;
      }

      .skeleton-button {
        height: 44px;
        width: 60%;
        margin: 0 auto;
      }

      /* Footer */
      .modal-footer {
        display: flex;
        gap: 0.75rem;
        padding: 0 2rem 1.5rem;
      }

      .btn {
        flex: 1;
        padding: 0.875rem 1.25rem;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: var(--input-bg, #f0f0f0);
        color: var(--text-primary, #333);
      }

      .btn-secondary:hover:not(:disabled) {
        background: var(--border-color, #e1e5eb);
      }

      .btn-primary {
        background: var(--primary-color, #667eea);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      /* Security Note */
      .security-note {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 2rem 1.25rem;
        font-size: 0.8rem;
        color: var(--text-secondary, #888);
      }

      /* Dark Theme Adjustments */
      [data-theme='dark'] .modal-container {
        background: var(--card-bg, #1e1e2e);
      }

      [data-theme='dark'] .input-wrapper input {
        background: var(--input-bg, #2d2d3d);
        border-color: var(--border-color, #3d3d4d);
      }

      [data-theme='dark'] .attempts-indicator {
        background: var(--input-bg, #2d2d3d);
      }

      /* RTL Support */
      [dir='rtl'] .input-wrapper input {
        padding-left: 3rem;
        padding-right: 1rem;
      }

      [dir='rtl'] .toggle-visibility {
        right: auto;
        left: 0.75rem;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .modal-container {
          width: 95%;
          margin: 1rem;
        }

        .modal-header,
        .modal-body,
        .modal-footer {
          padding-left: 1.25rem;
          padding-right: 1.25rem;
        }
      }
    `,
  ],
})
export class MasterCodeModalComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly masterCodeService = inject(MasterCodeService);
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  @ViewChild('codeInput') codeInput!: ElementRef<HTMLInputElement>;

  codeValue = '';
  readonly showCode = signal(false);
  readonly currentTheme = this.theme.effectiveTheme;
  readonly currentLang = this.i18n.language;

  // Translations
  get t() {
    const isAr = this.currentLang() === 'ar';
    return {
      title: isAr ? 'تحقق الأمان' : 'Security Verification',
      subtitle: isAr ? 'أدخل الماستر كود للمتابعة' : 'Enter the master code to continue',
      label: isAr ? 'ماستر كود الأدمن الأساسي' : 'Primary Admin Master Code',
      placeholder: isAr ? '• • • •' : '• • • •',
      submit: isAr ? 'تحقق' : 'Verify',
      cancel: isAr ? 'إلغاء' : 'Cancel',
      attemptsLeft: isAr ? 'المحاولات المتبقية' : 'Attempts left',
      securityNote: isAr
        ? 'هذه المنطقة محمية. 3 محاولات خاطئة = حظر دائم'
        : 'Protected area. 3 wrong attempts = permanent block',
    };
  }

  ngOnInit(): void {
    // Reset code value when modal opens
  }

  ngAfterViewInit(): void {
    // Focus input when modal opens
    setTimeout(() => {
      if (this.codeInput?.nativeElement) {
        this.codeInput.nativeElement.focus();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.codeValue = '';
  }

  toggleVisibility(): void {
    this.showCode.update((v) => !v);
    if (this.codeInput?.nativeElement) {
      this.codeInput.nativeElement.type = this.showCode() ? 'text' : 'password';
    }
  }

  submitCode(): void {
    if (this.codeValue) {
      this.masterCodeService.submitCode(this.codeValue);
      this.codeValue = '';
    }
  }

  cancel(): void {
    this.codeValue = '';
    this.masterCodeService.cancelModal();
  }

  onBackdropClick(event: MouseEvent): void {
    // Optional: close on backdrop click
    // this.cancel();
  }
}
