import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CsrfService } from './csrf.service';

@Controller('csrf')
export class CsrfController {
  constructor(private csrfService: CsrfService) {}

  @Get('token')
  @Public()
  getToken(@Req() req: Request, @Res() res: Response) {
    this.csrfService.setTokenCookie(req, res);
    res.json({ success: true });
  }
}
