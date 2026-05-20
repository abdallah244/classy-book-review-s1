import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true, // Removes undefined fields in DTO
          forbidNonWhitelisted: true, // Rejects requests with undefined fields
          transform: true, // Automatically transforms data to correct types
          transformOptions: {
            enableImplicitConversion: true,
          },
          stopAtFirstError: false, // Shows all errors
          validateCustomDecorators: true,
          exceptionFactory: (errors) => {
            const messages = errors.map((error) => ({
              field: error.property,
              errors: Object.values(error.constraints || {}),
            }));

            return {
              statusCode: 400,
              message: 'Validation failed',
              errors: messages,
            };
          },
        }),
    },
  ],
})
export class ValidationModule {}
