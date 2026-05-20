import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  ResponseOptimizerInterceptor,
  ResponseOptimizerService,
} from './response-optimizer.service';

/**
 * 🔧 Response Optimizer Module
 * Response optimization module
 */
@Global()
@Module({
  providers: [
    ResponseOptimizerService,
    // Enable Interceptor globally (optional)
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ResponseOptimizerInterceptor,
    // },
  ],
  exports: [ResponseOptimizerService],
})
export class ResponseOptimizerModule {}
