import { Module } from '@nestjs/common';
import { SanitizationService } from './sanitization.service';
import { SanitizationInterceptor } from './sanitization.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    SanitizationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizationInterceptor,
    },
  ],
  exports: [SanitizationService],
})
export class SanitizationModule {}
