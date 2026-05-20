import { Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DevToolsDetectionService {
  isDevToolsOpen = signal<boolean>(false);

  private checkInterval: any;
  private devToolsWarningShown = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    this.initializeDetection();
  }

  private initializeDetection(): void {
    if (!environment.production) {
      return;
    }

    // Check every 500ms
    this.checkInterval = setInterval(() => {
      this.detectDevTools();
      this.detectCodeInjection();
      this.detectDebugger();
    }, 500);
  }

  /**
   * Detect DevTools using console.log performance
   */
  private detectDevTools(): void {
    const threshold = 160;
    const start = performance.now();
    debugger; // Will add extra time if DevTools open
    const elapsed = performance.now() - start;

    if (elapsed > threshold) {
      this.handleDevToolsDetected('DevTools Detected');
    }
  }

  /**
   * Detect Code Injection via console methods override
   */
  private detectCodeInjection(): void {
    // Check if console methods are overridden
    const originalLog = console.log.toString();
    const originalError = console.error.toString();

    if (!originalLog.includes('[native code]') || !originalError.includes('[native code]')) {
      this.handleDevToolsDetected('Code Injection Detected');
    }

    // Check for external scripts
    if (this.hasExternalScripts()) {
      this.handleDevToolsDetected('External Script Detected');
    }
  }

  /**
   * Detect Debugger statement
   */
  private detectDebugger(): void {
    const fn = function () {};
    const start = performance.now();
    fn.constructor('debugger')();
    const elapsed = performance.now() - start;

    if (elapsed > 100) {
      this.handleDevToolsDetected('Debugger Detected');
    }
  }

  /**
   * Check for external/injected scripts
   */
  private hasExternalScripts(): boolean {
    const scripts = document.querySelectorAll('script');
    let suspiciousCount = 0;

    scripts.forEach((script) => {
      // Check for scripts without src (inline eval)
      if (!script.src && script.innerHTML.trim().length > 50) {
        // Suspicious if too much inline code
        if (script.innerHTML.includes('eval(') || script.innerHTML.includes('Function(')) {
          suspiciousCount++;
        }
      }

      // Check for scripts from unknown sources
      if (
        script.src &&
        !script.src.includes(window.location.hostname) &&
        !script.src.includes('cdn.') &&
        !script.src.includes('googleapis') &&
        !script.src.includes('cloudflare')
      ) {
        suspiciousCount++;
      }
    });

    return suspiciousCount > 2;
  }

  /**
   * Handle DevTools/Injection detection
   */
  private handleDevToolsDetected(reason: string): void {
    this.isDevToolsOpen.set(true);

    if (!this.devToolsWarningShown) {
      this.devToolsWarningShown = true;

      console.warn('%c🚨 SECURITY WARNING 🚨', 'color: red; font-size: 20px; font-weight: bold;');
      console.warn('%c' + reason, 'color: orange; font-size: 16px; font-weight: bold;');
      console.warn(
        '%cDeveloper Tools are disabled for security reasons.',
        'color: red; font-size: 14px;',
      );

      // Force logout after 2 seconds
      setTimeout(() => {
        this.forceLogout();
      }, 2000);
    }
  }

  /**
   * Force logout user
   */
  private forceLogout(): void {
    // Clear all sessions
    sessionStorage.clear();
    localStorage.clear();

    // Show alert
    alert(
      '🔒 SECURITY ALERT\n\nYour session has been terminated due to unauthorized access attempt.\n\nDevTools and code injection are not permitted.',
    );

    // Logout
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/admin/login']);
        window.location.reload();
      },
      error: () => {
        this.router.navigate(['/admin/login']);
        window.location.reload();
      },
    });
  }

  /**
   * Cleanup interval
   */
  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Get current DevTools status
   */
  isOpen(): boolean {
    return this.isDevToolsOpen();
  }
}
