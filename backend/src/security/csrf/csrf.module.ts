import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import { CsrfService } from './csrf.service';
import { CsrfController } from './csrf.controller';

@Module({
  providers: [CsrfService],
  controllers: [CsrfController],
  exports: [CsrfService],
})
export class CsrfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Cookie parser first
    consumer
      .apply(cookieParser())
      .forRoutes({ path: '*splat', method: RequestMethod.ALL });

    // CSRF middleware - استثناء API endpoints لأن الـ API بتستخدم JWT tokens
    consumer
      .apply(
        csurf({
          cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          },
          ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
        }),
      )
      .exclude(
        // ⚡ All API routes use JWT — CSRF not needed
        { path: '{*splat}', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*splat', method: RequestMethod.ALL });
  }
}
