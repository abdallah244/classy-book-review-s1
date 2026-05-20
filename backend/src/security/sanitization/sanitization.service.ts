import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizationService {
  /**
   * Sanitize text from HTML
   */
  sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return input;

    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    });
  }

  /**
   * Sanitize HTML allowing some elements (for educational content)
   */
  sanitizeRichText(input: string): string {
    if (!input || typeof input !== 'string') return input;

    return sanitizeHtml(input, {
      allowedTags: [
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
      ],
      allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        '*': ['class', 'id', 'dir', 'lang'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        a: (tagName, attribs) => {
          return {
            tagName,
            attribs: {
              ...attribs,
              rel: 'noopener noreferrer',
              target: '_blank',
            },
          };
        },
      },
    });
  }

  /**
   * Prevent NoSQL Injection
   */
  sanitizeMongoQuery(input: any): any {
    if (input === null || input === undefined) return input;

    if (typeof input === 'string') {
      // Remove MongoDB operators
      return input.replace(/[\${}]/g, '');
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeMongoQuery(item));
    }

    if (typeof input === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(input)) {
        // Reject keys starting with $
        if (key.startsWith('$')) {
          continue;
        }
        sanitized[key] = this.sanitizeMongoQuery(input[key]);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Sanitize entire object
   */
  sanitizeObject<T extends object>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeHtml(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string'
            ? this.sanitizeHtml(item)
            : typeof item === 'object'
              ? this.sanitizeObject(item)
              : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  /**
   * Sanitize XSS from text
   */
  escapeXss(input: string): string {
    if (!input || typeof input !== 'string') return input;

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    if (!filename) return filename;

    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}
