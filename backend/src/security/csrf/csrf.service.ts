import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class CsrfService {
  /**
   * Generate CSRF Token
   */
  generateToken(req: Request): string {
    return (req as any).csrfToken();
  }

  /**
   * Add CSRF Token to Response Cookie
   */
  setTokenCookie(req: Request, res: Response): void {
    const token = this.generateToken(req);
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable from JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
