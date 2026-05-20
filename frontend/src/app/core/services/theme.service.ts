import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  // Signal للثيم الحالي
  private themeSignal = signal<Theme>(this.getStoredTheme());
  public theme = this.themeSignal.asReadonly();

  // Signal للثيم الفعلي (light أو dark)
  public effectiveTheme = signal<'light' | 'dark'>('light');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // تطبيق الثيم عند التغيير
      effect(() => {
        this.applyTheme(this.themeSignal());
      });

      // مراقبة تغييرات النظام
      this.watchSystemTheme();
    }
  }

  /**
   * تغيير الثيم
   */
  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    localStorage.setItem('theme', theme);
  }

  /**
   * التبديل بين الثيمات
   */
  toggle(): void {
    const current = this.effectiveTheme();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }

  /**
   * الحصول على الثيم المخزن
   */
  private getStoredTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }
    return (localStorage.getItem('theme') as Theme) || 'system';
  }

  /**
   * تطبيق الثيم
   */
  private applyTheme(theme: Theme): void {
    const effectiveTheme = theme === 'system' ? this.getSystemTheme() : theme;

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // تحديث meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1e293b' : '#ffffff');
    }

    this.effectiveTheme.set(effectiveTheme);
  }

  /**
   * الحصول على ثيم النظام
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * مراقبة تغييرات ثيم النظام
   */
  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      if (this.themeSignal() === 'system') {
        this.effectiveTheme.set(e.matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }
}
