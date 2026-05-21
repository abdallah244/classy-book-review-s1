import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-for-teams',
  imports: [RouterLink],
  templateUrl: './for-teams.html',
  styleUrl: './for-teams.css',
})
export class ForTeams {
  themeService = inject(ThemeService);
  i18nService = inject(I18nService);

  isAr() {
    return this.i18nService.language() === 'ar';
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  toggleLanguage() {
    this.i18nService.toggle();
  }
}
