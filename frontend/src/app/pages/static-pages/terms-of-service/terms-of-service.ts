import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-terms-of-service',
  imports: [RouterLink],
  templateUrl: './terms-of-service.html',
  styleUrl: './terms-of-service.css',
})
export class TermsOfService {
  themeService = inject(ThemeService);
  i18nService = inject(I18nService);
  menuOpen = signal(false);

  isAr() {
    return this.i18nService.language() === 'ar';
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  toggleLanguage() {
    this.i18nService.toggle();
  }

  toggleMenu() {
    this.menuOpen.set(!this.menuOpen());
  }
}
