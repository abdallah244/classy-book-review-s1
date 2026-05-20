import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Animation types available for page transitions
 */
export type TransitionType =
  | 'fade' // Simple fade in/out
  | 'slide-up' // Slide from bottom to top
  | 'slide-down' // Slide from top to bottom
  | 'slide-left' // Slide from right to left
  | 'slide-right' // Slide from left to right
  | 'scale' // Scale up effect
  | 'scale-fade' // Scale with fade
  | 'flip' // 3D flip effect
  | 'rotate' // Rotate effect
  | 'blur'; // Blur transition

/**
 * Configuration for page transitions
 */
export interface TransitionConfig {
  type: TransitionType;
  duration: number; // Duration in milliseconds
  easing: string; // CSS easing function
  delay?: number; // Optional delay before animation
}

/**
 * Page Transition Service
 * Handles smooth, professional animations between route changes
 */
@Injectable({
  providedIn: 'root',
})
export class PageTransitionService {
  private readonly router = inject(Router);

  // Signals for reactive state management
  private readonly _isNavigating = signal(false);
  private readonly _currentTransition = signal<TransitionType>('slide-up');
  private readonly _transitionDuration = signal(300);
  private readonly _transitionEasing = signal('cubic-bezier(0.22, 1, 0.36, 1)');

  // Public readonly signals
  readonly isNavigating = this._isNavigating.asReadonly();
  readonly currentTransition = this._currentTransition.asReadonly();

  // Computed CSS custom properties
  readonly transitionStyles = computed(() => ({
    '--transition-duration': `${this._transitionDuration()}ms`,
    '--transition-easing': this._transitionEasing(),
    '--transition-type': this._currentTransition(),
  }));

  // Predefined transition presets
  readonly presets: Record<string, TransitionConfig> = {
    default: { type: 'slide-up', duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    fast: { type: 'fade', duration: 150, easing: 'ease-out' },
    smooth: { type: 'slide-up', duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    elegant: { type: 'scale-fade', duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    dynamic: { type: 'slide-left', duration: 300, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
  };

  constructor() {
    this.initRouterEvents();
  }

  /**
   * Initialize router event listeners
   */
  private initRouterEvents(): void {
    // Listen for navigation start
    this.router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
      this._isNavigating.set(true);
      this.triggerExitAnimation();
    });

    // Listen for navigation end
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
      )
      .subscribe(() => {
        this.triggerEnterAnimation();
        // Small delay to ensure animation completes
        setTimeout(() => {
          this._isNavigating.set(false);
        }, this._transitionDuration() + 50);
      });
  }

  /**
   * Set the transition type
   */
  setTransitionType(type: TransitionType): void {
    this._currentTransition.set(type);
  }

  /**
   * Set transition duration in milliseconds
   */
  setTransitionDuration(duration: number): void {
    this._transitionDuration.set(Math.max(100, Math.min(1000, duration)));
  }

  /**
   * Set transition easing function
   */
  setTransitionEasing(easing: string): void {
    this._transitionEasing.set(easing);
  }

  /**
   * Apply a preset configuration
   */
  applyPreset(presetName: keyof typeof this.presets): void {
    const preset = this.presets[presetName];
    if (preset) {
      this._currentTransition.set(preset.type);
      this._transitionDuration.set(preset.duration);
      this._transitionEasing.set(preset.easing);
    }
  }

  /**
   * Navigate with custom transition
   */
  navigateWithTransition(
    path: string | string[],
    transitionType?: TransitionType,
    config?: Partial<TransitionConfig>,
  ): Promise<boolean> {
    // Apply custom transition if provided
    if (transitionType) {
      this._currentTransition.set(transitionType);
    }
    if (config?.duration) {
      this._transitionDuration.set(config.duration);
    }
    if (config?.easing) {
      this._transitionEasing.set(config.easing);
    }

    // Navigate
    const route = Array.isArray(path) ? path : [path];
    return this.router.navigate(route);
  }

  /**
   * Get CSS classes for current transition
   */
  getTransitionClasses(): string[] {
    const classes = ['page-transition'];

    if (this._isNavigating()) {
      classes.push('transitioning', 'exiting');
    } else {
      classes.push('entering');
    }

    classes.push(`transition-${this._currentTransition()}`);

    return classes;
  }

  /**
   * Get inline styles for transition
   */
  getTransitionStyles(): Record<string, string> {
    return {
      '--page-transition-duration': `${this._transitionDuration()}ms`,
      '--page-transition-easing': this._transitionEasing(),
    };
  }

  /**
   * Trigger exit animation on current page
   */
  private triggerExitAnimation(): void {
    const container = document.querySelector('.router-outlet-container');
    if (container) {
      container.classList.add('page-exiting');
      container.classList.remove('page-entering');
    }
  }

  /**
   * Trigger enter animation on new page
   */
  private triggerEnterAnimation(): void {
    const container = document.querySelector('.router-outlet-container');
    if (container) {
      container.classList.remove('page-exiting');
      container.classList.add('page-entering');

      // Remove class after animation
      setTimeout(() => {
        container.classList.remove('page-entering');
      }, this._transitionDuration());
    }
  }

  /**
   * Navigate back with reverse animation
   */
  navigateBack(transitionType?: TransitionType): void {
    const reverseType = this.getReverseTransition(transitionType || this._currentTransition());
    this._currentTransition.set(reverseType);
    this.router.navigate(['..']);
  }

  /**
   * Get reverse transition type for back navigation
   */
  private getReverseTransition(type: TransitionType): TransitionType {
    const reverseMap: Record<TransitionType, TransitionType> = {
      fade: 'fade',
      'slide-up': 'slide-down',
      'slide-down': 'slide-up',
      'slide-left': 'slide-right',
      'slide-right': 'slide-left',
      scale: 'scale',
      'scale-fade': 'scale-fade',
      flip: 'flip',
      rotate: 'rotate',
      blur: 'blur',
    };
    return reverseMap[type];
  }

  /**
   * Apply transition animation to current page
   */
  applyTransition(transitionType?: TransitionType, duration?: number): void {
    if (transitionType) {
      this._currentTransition.set(transitionType);
    }

    if (duration) {
      this._transitionDuration.set(duration);
    }

    const container = document.querySelector('main') || document.querySelector('app-root');
    if (container) {
      container.classList.add('page-entering');

      setTimeout(() => {
        container.classList.remove('page-entering');
      }, duration || this._transitionDuration());
    }
  }
}
