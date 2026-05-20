import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface MasterCodeAttempt {
  timestamp: number;
  success: boolean;
  ip?: string;
}

export interface MasterCodeState {
  isModalOpen: boolean;
  isVerifying: boolean;
  errorMessage: string | null;
  attemptsLeft: number;
  isBlocked: boolean;
  blockEndTime: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class MasterCodeService {
  private http = inject(HttpClient);

  private readonly MASTER_CODE = '1234';
  private readonly SESSION_KEY = 'master_code_verified';
  private readonly ATTEMPTS_KEY = 'master_code_attempts';
  private readonly BLOCK_KEY = 'master_code_blocked';
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_ATTEMPTS = 3;
  private readonly BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours (permanent-ish)

  private readonly apiUrl = `${environment.apiUrl}/monitoring`;

  // Signals
  readonly isVerified = signal<boolean>(false);
  readonly state = signal<MasterCodeState>({
    isModalOpen: false,
    isVerifying: false,
    errorMessage: null,
    attemptsLeft: 3,
    isBlocked: false,
    blockEndTime: null,
  });

  // Computed
  readonly isModalOpen = computed(() => this.state().isModalOpen);
  readonly isVerifying = computed(() => this.state().isVerifying);
  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly attemptsLeft = computed(() => this.state().attemptsLeft);
  readonly isBlocked = computed(() => this.state().isBlocked);

  // Resolve function للـ promise
  private resolveVerification: ((value: boolean) => void) | null = null;

  constructor() {
    this.checkSessionValidity();
    this.loadAttempts();
  }

  /**
   * Open modal and wait for verification
   */
  async verifyMasterCode(): Promise<boolean> {
    // Check if blocked
    if (this.checkIfBlocked()) {
      return false;
    }

    // Check if already verified in current session
    if (this.isSessionValid()) {
      this.isVerified.set(true);
      return true;
    }

    // Open modal and return promise
    return new Promise((resolve) => {
      this.resolveVerification = resolve;
      this.state.update((s) => ({
        ...s,
        isModalOpen: true,
        errorMessage: null,
      }));
    });
  }

  /**
   * Submit code from modal
   */
  async submitCode(code: string): Promise<void> {
    if (!code || code.trim() === '') {
      this.state.update((s) => ({
        ...s,
        errorMessage: 'الرجاء إدخال الكود',
      }));
      return;
    }

    this.state.update((s) => ({ ...s, isVerifying: true, errorMessage: null }));

    // Simulate small delay for UX
    await new Promise((r) => setTimeout(r, 300));

    if (code === this.MASTER_CODE) {
      // Success
      const timestamp = Date.now();
      sessionStorage.setItem(this.SESSION_KEY, timestamp.toString());
      this.clearAttempts();
      this.isVerified.set(true);

      this.state.update((s) => ({
        ...s,
        isModalOpen: false,
        isVerifying: false,
        errorMessage: null,
        attemptsLeft: this.MAX_ATTEMPTS,
      }));

      if (this.resolveVerification) {
        this.resolveVerification(true);
        this.resolveVerification = null;
      }
    } else {
      // Failed attempt
      const attempts = this.recordFailedAttempt();

      if (attempts >= this.MAX_ATTEMPTS) {
        // Block the user and report to backend
        this.blockUser();
        await this.reportBlockedIP();

        this.state.update((s) => ({
          ...s,
          isModalOpen: false,
          isVerifying: false,
          isBlocked: true,
          attemptsLeft: 0,
          errorMessage: null,
        }));

        if (this.resolveVerification) {
          this.resolveVerification(false);
          this.resolveVerification = null;
        }
      } else {
        const remaining = this.MAX_ATTEMPTS - attempts;
        this.state.update((s) => ({
          ...s,
          isVerifying: false,
          attemptsLeft: remaining,
          errorMessage: `كود خاطئ! المحاولات المتبقية: ${remaining}`,
        }));
      }
    }
  }

  /**
   * Cancel modal
   */
  cancelModal(): void {
    this.state.update((s) => ({
      ...s,
      isModalOpen: false,
      isVerifying: false,
      errorMessage: null,
    }));

    if (this.resolveVerification) {
      this.resolveVerification(false);
      this.resolveVerification = null;
    }
  }

  /**
   * Record failed attempt
   */
  private recordFailedAttempt(): number {
    const stored = localStorage.getItem(this.ATTEMPTS_KEY);
    let attempts: MasterCodeAttempt[] = [];

    if (stored) {
      try {
        attempts = JSON.parse(stored);
      } catch {
        attempts = [];
      }
    }

    attempts.push({
      timestamp: Date.now(),
      success: false,
    });

    localStorage.setItem(this.ATTEMPTS_KEY, JSON.stringify(attempts));
    return attempts.length;
  }

  /**
   * Clear attempts after successful verification
   */
  private clearAttempts(): void {
    localStorage.removeItem(this.ATTEMPTS_KEY);
  }

  /**
   * Load attempts from storage
   */
  private loadAttempts(): void {
    const stored = localStorage.getItem(this.ATTEMPTS_KEY);
    if (stored) {
      try {
        const attempts: MasterCodeAttempt[] = JSON.parse(stored);
        const remaining = Math.max(0, this.MAX_ATTEMPTS - attempts.length);
        this.state.update((s) => ({ ...s, attemptsLeft: remaining }));
      } catch {
        // ignore
      }
    }
  }

  /**
   * Block user permanently
   */
  private blockUser(): void {
    const blockEndTime = Date.now() + this.BLOCK_DURATION;
    localStorage.setItem(
      this.BLOCK_KEY,
      JSON.stringify({
        blocked: true,
        endTime: blockEndTime,
        timestamp: Date.now(),
      }),
    );

    this.state.update((s) => ({
      ...s,
      isBlocked: true,
      blockEndTime: blockEndTime,
    }));
  }

  /**
   * Check if user is blocked
   */
  private checkIfBlocked(): boolean {
    const stored = localStorage.getItem(this.BLOCK_KEY);
    if (!stored) return false;

    try {
      const { blocked, endTime } = JSON.parse(stored);
      if (blocked && endTime > Date.now()) {
        this.state.update((s) => ({
          ...s,
          isBlocked: true,
          blockEndTime: endTime,
          attemptsLeft: 0,
        }));
        return true;
      } else {
        // Block expired
        localStorage.removeItem(this.BLOCK_KEY);
        localStorage.removeItem(this.ATTEMPTS_KEY);
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Report blocked IP to backend
   */
  private async reportBlockedIP(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await this.http
        .post(
          `${this.apiUrl}/block-ip`,
          {
            reason: 'Master code failed 3 times',
            permanent: true,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .toPromise();
    } catch (error) {
      console.error('Failed to report blocked IP:', error);
    }
  }

  private checkSessionValidity(): void {
    if (this.isSessionValid()) {
      this.isVerified.set(true);
    } else {
      sessionStorage.removeItem(this.SESSION_KEY);
      this.isVerified.set(false);
    }
  }

  private isSessionValid(): boolean {
    const timestamp = sessionStorage.getItem(this.SESSION_KEY);
    if (!timestamp) return false;

    const elapsed = Date.now() - parseInt(timestamp);
    return elapsed < this.SESSION_DURATION;
  }

  clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    this.isVerified.set(false);
  }

  /**
   * Force verify master code - always asks for code (used for sensitive operations like printing)
   * This doesn't rely on session cache
   */
  async forceVerifyMasterCode(): Promise<boolean> {
    // Check if blocked
    if (this.checkIfBlocked()) {
      return false;
    }

    // Always open modal without checking session
    return new Promise((resolve) => {
      this.resolveVerification = resolve;
      this.state.update((s) => ({
        ...s,
        isModalOpen: true,
        errorMessage: null,
        attemptsLeft: this.MAX_ATTEMPTS,
      }));
    });
  }
}
