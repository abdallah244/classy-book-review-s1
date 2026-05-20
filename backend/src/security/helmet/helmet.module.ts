import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import helmet from 'helmet';

@Module({})
export class HelmetModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        helmet({
          // Content Security Policy
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
              fontSrc: ["'self'", 'fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
              connectSrc: [
                "'self'",
                'api.stripe.com',
                'accept.paymobsolutions.com',
              ],
              frameSrc: ["'self'", 'www.youtube.com', 'player.vimeo.com'],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          },
          // Prevent clickjacking
          frameguard: { action: 'deny' },
          // Hide X-Powered-By
          hidePoweredBy: true,
          // HSTS
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
          // Prevent MIME type sniffing
          noSniff: true,
          // XSS Protection
          xssFilter: true,
          // Referrer Policy
          referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
          // Cross-Origin-Embedder-Policy
          crossOriginEmbedderPolicy: false,
          // Cross-Origin-Resource-Policy
          crossOriginResourcePolicy: { policy: 'cross-origin' },
        }),
      )
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
