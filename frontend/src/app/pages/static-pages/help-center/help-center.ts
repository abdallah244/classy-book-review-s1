import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-help-center',
  imports: [RouterLink],
  templateUrl: './help-center.html',
  styleUrl: './help-center.css',
})
export class HelpCenter {
  themeService = inject(ThemeService);
  i18nService = inject(I18nService);
  menuOpen = signal(false);
  activeIndex = signal<number | null>(null);

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

  toggleFAQ(index: number) {
    if (this.activeIndex() === index) {
      this.activeIndex.set(null);
    } else {
      this.activeIndex.set(index);
    }
  }

  faqs = [
    {
      qAr: 'كيف يمكنني البدء في التعلم على Classy Book؟',
      qEn: 'How do I start learning on Classy Book?',
      aAr: 'الأمر بسيط للغاية! قم بإنشاء حساب مجاني عبر النقر على زر "ابدأ مجاناً"، ثم تصفح مكتبة الدورات التدريبية المتاحة واختر المسار الذي يناسب اهتماماتك لبدء الدراسة فوراً.',
      aEn: 'It is very simple! Create a free account by clicking the "Start Free" button, then browse our library of courses and choose the learning path that matches your interests to start learning immediately.'
    },
    {
      qAr: 'هل أحصل على شهادة بعد إتمام الدورة؟',
      qEn: 'Do I get a certificate after completing a course?',
      aAr: 'نعم، ستحصل على شهادة إتمام رقمية معتمدة من المنصة بمجرد اجتيازك لجميع الدروس والاختبارات المخصصة لكل دورة بنجاح، ويمكنك تحميلها أو مشاركتها عبر LinkedIn.',
      aEn: 'Yes! You will receive a verified digital certificate of completion as soon as you successfully pass all lessons and quizzes in a course. You can download it or share it directly to LinkedIn.'
    },
    {
      qAr: 'هل تدعم المنصة التعلم عبر الهواتف الذكية؟',
      qEn: 'Does the platform support learning on mobile devices?',
      aAr: 'نعم بالكامل! تم تصميم واجهة Classy Book لتكون متجاوبة وتعمل بسلاسة تامة على جميع الهواتف الذكية والأجهزة اللوحية بالإضافة إلى الحواسيب الشخصية دون أي مشاكل.',
      aEn: 'Absolutely! Classy Book is built with a responsive design, meaning it works flawlessly across all smartphones, tablets, and desktops for a seamless learning experience.'
    },
    {
      qAr: 'ما هي طرق الدفع المقبولة للاشتراكات المميزة؟',
      qEn: 'What payment methods are supported for premium subscriptions?',
      aAr: 'نقبل الدفع عبر بطاقات الائتمان الكبرى (Visa، MasterCard)، بالإضافة إلى حلول الدفع المحلية مثل فوري وفودافون كاش والمحافظ الإلكترونية لتسهيل الاشتراك لمستخدمينا في الوطن العربي.',
      aEn: 'We support all major credit/debit cards (Visa, MasterCard), along with local payment methods like Fawry, Vodafone Cash, and digital wallets for our users in the Middle East.'
    },
    {
      qAr: 'كيف يمكنني التفاعل مع زملائي والمعلمين؟',
      qEn: 'How can I interact with other students and instructors?',
      aAr: 'تتميز منصتنا بمفهوم "التعليم الاجتماعي"، حيث يمكنك طرح الأسئلة في أقسام التعليقات التابعة لكل درس، والمشاركة في مجموعات النقاش، وتقييم الكتب والمسارات، ومراسلة المعلمين مباشرة.',
      aEn: 'Our platform excels in "Social Learning." You can ask questions in the comments section under each lesson, join group discussions, rate books and learning paths, and directly message instructors.'
    }
  ];
}
