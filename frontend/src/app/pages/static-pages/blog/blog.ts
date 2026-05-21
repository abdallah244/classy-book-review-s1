import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-blog',
  imports: [RouterLink],
  templateUrl: './blog.html',
  styleUrl: './blog.css',
})
export class Blog {
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

  featuredPost = {
    tagAr: 'إرشاد دراسي',
    tagEn: 'Study Guide',
    titleAr: 'كيف تبني خطة دراسية ناجحة في عام 2026؟',
    titleEn: 'How to Build a Successful Study Plan in 2026?',
    descAr: 'التعلم المستمر ليس مجرد رغبة بل هو منهجية. في هذا المقال المفصل، نناقش استراتيجيات تنظيم الوقت، اختيار المواد التعليمية المناسبة، والالتزام بأهدافك الدراسية الطموحة باستخدام التكنولوجيا الحديثة.',
    descEn: 'Continuous learning is a methodology, not just a desire. In this detailed guide, we discuss time management strategies, choosing the right educational materials, and sticking to your study goals using modern tech.',
    author: 'Yasmin Soliman',
    dateAr: '15 مايو 2026',
    dateEn: 'May 15, 2026',
    readAr: 'قراءة 8 دقائق',
    readEn: '8 min read',
    avatar: 'YS'
  };

  posts = [
    {
      tagAr: 'التعلم الاجتماعي',
      tagEn: 'Social Learning',
      titleAr: 'صعود منصات التعلم الاجتماعي وأثرها على الطلاب',
      titleEn: 'The Rise of Social Learning & Its Impact on Students',
      descAr: 'كيف يساهم التعلم الجماعي وتبادل المراجعات ومناقشة الدروس في رفع كفاءة الاستيعاب وتوسيع المدارك مقارنة بالتعلم الفردي التقليدي.',
      descEn: 'How peer discussions, book reviews, and interactive lesson comments boost comprehension and retention compared to traditional learning.',
      author: 'Abdallah Fares',
      dateAr: '10 مايو 2026',
      dateEn: 'May 10, 2026',
      readAr: 'قراءة 5 دقائق',
      readEn: '5 min read',
      avatar: 'AF'
    },
    {
      tagAr: 'تطوير البرمجيات',
      tagEn: 'Software Engineering',
      titleAr: 'أفضل 5 كتب تخصصية يجب على كل مهندس برمجيات قراءتها',
      titleEn: 'Top 5 Books Every Software Engineer Should Read',
      descAr: 'مراجعة سريعة لأهم المراجع البرمجية الكلاسيكية التي تشكل الأساس المتين لبناء برمجيات نظيفة وقابلة للتوسع والصيانة.',
      descEn: 'A review of the classic programming books that build a solid foundation for designing clean, scalable, and maintainable software systems.',
      author: 'Ahmed Mostafa',
      dateAr: '05 مايو 2026',
      dateEn: 'May 5, 2026',
      readAr: 'قراءة 6 دقائق',
      readEn: '6 min read',
      avatar: 'AM'
    },
    {
      tagAr: 'علم النفس التربوي',
      tagEn: 'Educational Psychology',
      titleAr: 'فهم تقنيات التذكر الفعال والتكرار المتباعد',
      titleEn: 'Understanding Active Recall & Spaced Repetition',
      descAr: 'دراسة علمية مبسطة حول آلية عمل الذاكرة البشرية وكيفية تسخير التكرار الذكي لضمان بقاء المعلومات في الذاكرة طويلة المدى.',
      descEn: 'A simplified study on human memory systems and how to leverage active recovery tools to ensure learning shifts into long-term memory.',
      author: 'Yasmin Soliman',
      dateAr: '28 أبريل 2026',
      dateEn: 'April 28, 2026',
      readAr: 'قراءة 7 دقائق',
      readEn: '7 min read',
      avatar: 'YS'
    },
    {
      tagAr: 'إدارة الأعمال',
      tagEn: 'Business & LMS',
      titleAr: 'كيف يغير نظام إدارة التعلم (LMS) تدريب الشركات؟',
      titleEn: 'How Learning Management Systems Redefine Corporate Training',
      descAr: 'المزايا الاقتصادية والعملية لتطبيق منصات التعلم الرقمية في تدريب وتأهيل الموظفين الجدد ورفع كفاءة فرق العمل في الشركات الكبرى.',
      descEn: 'The economic and practical benefits of utilizing digital learning hubs to onboard recruits and upskill teams in modern enterprises.',
      author: 'Abdallah Fares',
      dateAr: '20 أبريل 2026',
      dateEn: 'April 20, 2026',
      readAr: 'قراءة 5 دقائق',
      readEn: '5 min read',
      avatar: 'AF'
    }
  ];
}
