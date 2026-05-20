import { Injectable } from '@nestjs/common';
import { PROHIBITED_WORDS } from './utils/bad-words.data';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class ModerationService {
  /**
   * Checks if text contains any prohibited words
   */
  containsBadWords(text: string): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return PROHIBITED_WORDS.some((word) =>
      lowerText.includes(word.toLowerCase()),
    );
  }

  /**
   * Replaces prohibited words with asterisks
   */
  cleanText(text: string): string {
    if (!text) return '';

    // 1. Remove dangerous HTML (XSS Protection)
    let cleaned = sanitizeHtml(text);

    // 2. Replace prohibited words with asterisks
    PROHIBITED_WORDS.forEach((word) => {
      const regex = new RegExp(word, 'gi');
      cleaned = cleaned.replace(regex, '*'.repeat(word.length));
    });

    return cleaned;
  }

  /**
   * Returns a list of bad words found in the text
   */
  detectViolations(text: string): string[] {
    if (!text) return [];
    const lowerText = text.toLowerCase();
    return PROHIBITED_WORDS.filter((word) =>
      lowerText.includes(word.toLowerCase()),
    );
  }
}
