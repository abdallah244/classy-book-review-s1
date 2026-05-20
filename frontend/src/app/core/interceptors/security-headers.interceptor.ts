import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
} from '@angular/common/http';
import { tap } from 'rxjs/operators';

/**
 * Functional Security Headers Interceptor
 * يضيف headers أمنية لكل طلب ويتحقق من سلامة الاستجابات
 */
export const securityHeadersInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  // Add security headers
  const secureRequest = req.clone({
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Security-Token': `${Date.now()}-${Math.random().toString(36).substring(2)}`,
    },
  });

  return next(secureRequest).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          // التحقق من وجود سكربتات ضارة في الاستجابة
          if (event.body && typeof event.body === 'object') {
            const responseStr = JSON.stringify(event.body);
            if (
              responseStr.includes('<script') ||
              responseStr.includes('eval(') ||
              responseStr.includes('Function(')
            ) {
              console.warn('🔒 Suspicious content detected in response');
            }
          }
        }
      },
    }),
  );
};

// Keep the class-based version for backward compatibility if needed elsewhere
export { securityHeadersInterceptor as SecurityHeadersInterceptor };
