import { Injectable, signal, inject, LOCALE_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface TranslationMap {
  [key: string]: string | TranslationMap;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private document = inject(DOCUMENT);

  // Signals
  private languageSignal = signal<Language>(this.getStoredLanguage());
  public language = this.languageSignal.asReadonly();

  public direction = signal<Direction>('rtl');

  // الترجمات المحملة
  private translations: Map<Language, TranslationMap> = new Map();

  constructor() {
    this.setLanguage(this.languageSignal());
    this.loadTranslations(this.languageSignal());
  }

  /**
   * تغيير اللغة
   */
  async setLanguage(lang: Language): Promise<void> {
    this.languageSignal.set(lang);
    localStorage.setItem('language', lang);

    // تحديث الاتجاه
    const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';
    this.direction.set(dir);

    // تطبيق على الـ document
    this.document.documentElement.setAttribute('lang', lang);
    this.document.documentElement.setAttribute('dir', dir);
    this.document.body.setAttribute('dir', dir);

    // تحميل الترجمات
    await this.loadTranslations(lang);
  }

  /**
   * التبديل بين اللغات
   */
  async toggle(): Promise<void> {
    const newLang: Language = this.languageSignal() === 'ar' ? 'en' : 'ar';
    await this.setLanguage(newLang);
  }

  /**
   * الترجمة
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const lang = this.languageSignal();
    const translations = this.translations.get(lang);

    if (!translations) {
      return key;
    }

    let value = this.getNestedValue(translations, key);

    if (!value || typeof value !== 'string') {
      return key;
    }

    // استبدال المتغيرات
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = (value as string).replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }

    return value;
  }

  /**
   * اختصار للترجمة
   */
  t(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }

  /**
   * تحميل الترجمات
   */
  private async loadTranslations(lang: Language): Promise<void> {
    if (this.translations.has(lang)) {
      return;
    }

    try {
      // الترجمات المضمنة (يمكن استبدالها بتحميل من ملفات JSON)
      const translations =
        lang === 'ar' ? this.getArabicTranslations() : this.getEnglishTranslations();
      this.translations.set(lang, translations);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
    }
  }

  /**
   * الحصول على قيمة متداخلة
   */
  private getNestedValue(obj: TranslationMap, key: string): string | TranslationMap | undefined {
    return key.split('.').reduce((acc: any, part) => acc?.[part], obj);
  }

  /**
   * الحصول على اللغة المخزنة
   */
  private getStoredLanguage(): Language {
    const stored = localStorage.getItem('language') as Language;
    return stored || 'ar';
  }

  /**
   * الترجمات العربية
   */
  private getArabicTranslations(): TranslationMap {
    return {
      common: {
        loading: 'جاري التحميل...',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        create: 'إنشاء',
        search: 'بحث',
        filter: 'تصفية',
        more: 'المزيد',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',
        yes: 'نعم',
        no: 'لا',
        confirm: 'تأكيد',
        close: 'إغلاق',
      },
      auth: {
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        logout: 'تسجيل الخروج',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        forgotPassword: 'نسيت كلمة المرور؟',
        rememberMe: 'تذكرني',
        noAccount: 'ليس لديك حساب؟',
        hasAccount: 'لديك حساب بالفعل؟',
      },
      nav: {
        home: 'الرئيسية',
        courses: 'الدورات',
        dashboard: 'لوحة التحكم',
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
      },
      errors: {
        required: 'هذا الحقل مطلوب',
        email: 'البريد الإلكتروني غير صحيح',
        minLength: 'الحد الأدنى {{min}} حرف',
        maxLength: 'الحد الأقصى {{max}} حرف',
        serverError: 'حدث خطأ في الخادم',
        networkError: 'خطأ في الاتصال',
      },
      messages: {
        success: 'تمت العملية بنجاح',
        error: 'حدث خطأ',
        saved: 'تم الحفظ',
        deleted: 'تم الحذف',
        updated: 'تم التحديث',
      },
    };
  }

  /**
   * الترجمات الإنجليزية
   */
  private getEnglishTranslations(): TranslationMap {
    return {
      common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        more: 'More',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        yes: 'Yes',
        no: 'No',
        confirm: 'Confirm',
        close: 'Close',
      },
      auth: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot Password?',
        rememberMe: 'Remember Me',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
      },
      nav: {
        home: 'Home',
        courses: 'Courses',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
      },
      errors: {
        required: 'This field is required',
        email: 'Invalid email address',
        minLength: 'Minimum {{min}} characters',
        maxLength: 'Maximum {{max}} characters',
        serverError: 'Server error occurred',
        networkError: 'Network error',
      },
      messages: {
        success: 'Operation successful',
        error: 'An error occurred',
        saved: 'Saved successfully',
        deleted: 'Deleted successfully',
        updated: 'Updated successfully',
      },
    };
  }
}
