import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 🛡️ Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 📦 Compression - compress responses for faster transfer
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Compress files larger than 1KB
      level: 6, // Compression level (1-9)
    }),
  );
  logger.log('📦 Compression enabled ✅');

  // ✅ Validation Pipe - validate data
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 🌐 Enable CORS to allow connection from Frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-XSRF-TOKEN',
    ],
  });

  // 📚 Add prefix to API
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Prefix: ${process.env.API_PREFIX || 'api/v1'}`);
  logger.log(
    `🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:4200'}`,
  );
}
bootstrap().catch((err) => {
  console.error('Error starting server', err);
});
