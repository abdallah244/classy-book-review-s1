import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-contact',
  imports: [RouterLink],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  themeService = inject(ThemeService);
  i18nService = inject(I18nService);
  private toast = inject(ToastService);
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

  onSubmit(event: Event, nameEl: HTMLInputElement, emailEl: HTMLInputElement, subjectEl: HTMLInputElement, messageEl: HTMLTextAreaElement) {
    event.preventDefault();
    
    if (!nameEl.value || !emailEl.value || !subjectEl.value || !messageEl.value) {
      this.toast.error(this.isAr() ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    this.toast.success(
      this.isAr() 
        ? 'تم إرسال رسالتك بنجاح! وسنتواصل معك قريباً.' 
        : 'Your message has been sent successfully! We will get in touch soon.'
    );

    // Reset fields
    nameEl.value = '';
    emailEl.value = '';
    subjectEl.value = '';
    messageEl.value = '';
  }
}
