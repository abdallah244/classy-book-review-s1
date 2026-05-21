import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-careers',
  imports: [RouterLink, UpperCasePipe],
  templateUrl: './careers.html',
  styleUrl: './careers.css',
})
export class Careers {
  themeService = inject(ThemeService);
  i18nService = inject(I18nService);
  menuOpen = signal(false);
  selectedDepartment = signal('all');

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

  setDepartment(dept: string) {
    this.selectedDepartment.set(dept);
  }

  applyJob(titleAr: string, titleEn: string) {
    const jobTitle = this.isAr() ? titleAr : titleEn;
    const msg = this.isAr() 
      ? `للتقديم على وظيفة "${jobTitle}"، يرجى إرسال سيرتك الذاتية ورابط محفظة أعمالك إلى: careers@classybook.com مع ذكر اسم الوظيفة في عنوان الرسالة.`
      : `To apply for the "${jobTitle}" position, please send your resume and portfolio link to: careers@classybook.com with the job title in the subject line.`;
    alert(msg);
  }

  filteredJobs() {
    const dept = this.selectedDepartment();
    if (dept === 'all') {
      return this.jobs;
    }
    return this.jobs.filter(j => j.dept === dept);
  }

  benefits = [
    {
      icon: 'fa-house-laptop',
      titleAr: 'عمل مرن وهجين',
      titleEn: 'Flexible & Hybrid Work',
      descAr: 'اعمل من مكتبنا في القاهرة أو من منزلك بمرونة كاملة لتضمن التوازن بين حياتك وعملك.',
      descEn: 'Work from our Cairo office or from the comfort of your home with full flexibility to ensure work-life balance.'
    },
    {
      icon: 'fa-book-open-reader',
      titleAr: 'بدل تعليم وتطوير',
      titleEn: 'Learning Stipend',
      descAr: 'نوفر لك بدلاً سنوياً لشراء الكتب، حضور الدورات، والاشتراك في المؤتمرات لتطوير مهاراتك.',
      descEn: 'We provide an annual allowance to buy books, attend courses, and join tech conferences to boost your skills.'
    },
    {
      icon: 'fa-heart-pulse',
      titleAr: 'تأمين طبي شامل',
      titleEn: 'Comprehensive Health Care',
      descAr: 'رعايتك الصحية تهمنا، لذلك نوفر تأميناً طبياً ممتازاً لك ولأفراد عائلتك المقربين.',
      descEn: 'Your health matters to us, which is why we provide premium medical insurance coverage for you and your family.'
    },
    {
      icon: 'fa-umbrella-beach',
      titleAr: 'إجازات سنوية مدفوعة',
      titleEn: 'Paid Time Off',
      descAr: 'احصل على إجازات سنوية وشخصية مدفوعة الأجر لتستريح وتستعيد طاقتك ونشاطك.',
      descEn: 'Get paid annual and personal leaves to rest, travel, recharge, and return with full energy.'
    }
  ];

  jobs = [
    {
      dept: 'engineering',
      titleAr: 'مهندس واجهات أمامية أول (Angular)',
      titleEn: 'Senior Frontend Engineer (Angular)',
      locationAr: 'عن بعد / القاهرة',
      locationEn: 'Remote / Cairo',
      typeAr: 'دوام كامل',
      typeEn: 'Full-time',
      descAr: 'نبحث عن مطور ذو خبرة لقيادة تصميم وتطوير لوحات تحكم الطلاب والمعلمين التفاعلية وتحسين أداء صفحات المنصة.',
      descEn: 'We are looking for an experienced developer to lead the design and implementation of our interactive student dashboards.'
    },
    {
      dept: 'content',
      titleAr: 'أخصائي تطوير مناهج ومحتوى تعليمي',
      titleEn: 'Educational Content Developer',
      locationAr: 'القاهرة (مقر الشركة)',
      locationEn: 'Cairo Office',
      typeAr: 'دوام كامل',
      typeEn: 'Full-time',
      descAr: 'صمم مسارات تعلم مميزة وكتابة شروحات توضيحية تفاعلية للمناهج الدراسية الأكثر طلباً في السوق العربي.',
      descEn: 'Design premium study tracks and write interactive study materials for the most requested skills in the Arab market.'
    },
    {
      dept: 'design',
      titleAr: 'مصمم واجهات وتجربة مستخدم (UI/UX)',
      titleEn: 'Product UI/UX Designer',
      locationAr: 'عن بعد',
      locationEn: 'Remote',
      typeAr: 'دوام كامل',
      typeEn: 'Full-time',
      descAr: 'ابتكر تصاميم عصرية، تفاعلية، وسهلة الاستخدام للموقع الإلكتروني وتطبيقات الهاتف الذكي بما يطابق الهوية التجارية.',
      descEn: 'Create modern, interactive, and responsive designs for our web app and mobile layouts matching our brand guidelines.'
    },
    {
      dept: 'engineering',
      titleAr: 'مطور خادم وقواعد بيانات أول (NodeJS/TS)',
      titleEn: 'Senior Backend Engineer (NodeJS/TS)',
      locationAr: 'عن بعد / القاهرة',
      locationEn: 'Remote / Cairo',
      typeAr: 'دوام كامل',
      typeEn: 'Full-time',
      descAr: 'أشرف على تطوير وبناء خوادم API سريعة، قواعد بيانات MongoDB مشفرة، وبنية سحابية قابلة للتوسع بملايين المستخدمين.',
      descEn: 'Oversee the design of fast APIs, encrypted MongoDB clusters, and scalable cloud solutions built to handle millions.'
    }
  ];
}
