import { Injectable, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class XssSafeHtmlService {
  private sanitizer = inject(DomSanitizer);

  // العناصر المسموح بها
  private allowedTags = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'div',
    'span',
  ];

  // الخصائص المسموح بها
  private allowedAttributes: Record<string, string[]> = {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'id', 'dir', 'lang'],
  };

  /**
   * تنظيف HTML بشكل آمن
   */
  sanitize(html: string): SafeHtml {
    if (!html) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    // استخدام sanitizer المدمج أولاً
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, html);

    if (!sanitized) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    // تنظيف إضافي
    const cleaned = this.removeUnsafeElements(sanitized);

    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }

  /**
   * تنظيف نص عادي (إزالة جميع العلامات)
   */
  stripTags(html: string): string {
    if (!html) return '';

    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * تشفير الأحرف الخاصة
   */
  escapeHtml(text: string): string {
    if (!text) return '';

    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * فك تشفير الأحرف الخاصة
   */
  unescapeHtml(text: string): string {
    if (!text) return '';

    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || '';
  }

  /**
   * تنظيف URL
   */
  sanitizeUrl(url: string): string | null {
    if (!url) return null;

    try {
      const parsed = new URL(url, window.location.origin);

      // السماح فقط بـ http, https, mailto
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        return null;
      }

      return parsed.href;
    } catch {
      return null;
    }
  }

  /**
   * إزالة العناصر غير الآمنة
   */
  private removeUnsafeElements(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;

    // إزالة العناصر الخطرة
    const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'form'];
    dangerousTags.forEach((tag) => {
      const elements = div.getElementsByTagName(tag);
      while (elements.length > 0) {
        elements[0].parentNode?.removeChild(elements[0]);
      }
    });

    // إزالة خصائص الأحداث (onclick, onload, etc.)
    const allElements = div.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const attributes = Array.from(element.attributes);

      attributes.forEach((attr) => {
        if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
          element.removeAttribute(attr.name);
        }
      });
    }

    // تأمين الروابط
    const links = div.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.getAttribute('href');

      if (href) {
        const safeUrl = this.sanitizeUrl(href);
        if (safeUrl) {
          link.setAttribute('href', safeUrl);
          link.setAttribute('rel', 'noopener noreferrer');
          link.setAttribute('target', '_blank');
        } else {
          link.removeAttribute('href');
        }
      }
    }

    return div.innerHTML;
  }

  /**
   * تنظيف محتوى Rich Text Editor
   */
  sanitizeRichText(html: string): SafeHtml {
    return this.sanitize(html);
  }

  /**
   * تحويل Markdown إلى HTML آمن
   */
  markdownToSafeHtml(markdown: string): SafeHtml {
    // تحويل أساسي للـ Markdown
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    return this.sanitize(html);
  }
}
