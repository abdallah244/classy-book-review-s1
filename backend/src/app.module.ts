import {
  Module,
  Logger,
  OnModuleInit,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RedisCacheModule } from './common/cache';
import { QueueModule } from './common/queue';
import { PaginationModule } from './common/pagination';
import { ResponseOptimizerModule } from './common/response';

// 🔐 Security Modules
import {
  AuthModule,
  UsersModule,
  SessionsModule,
  RolesPermissionsModule,
  RateLimitModule,
  BruteForceModule,
  ValidationModule,
  SanitizationModule,
  HelmetModule,
  CsrfModule,
  AuditLogModule,
  WebhookSecurityModule,
  ApiKeyModule,
} from './security';

// 📋 Admin Management Module
import { AdminManagementModule } from './security/admin-management/admin-management.module';

// ⚡ Performance Modules
import {
  SearchModule,
  RealtimeModule,
  FileModule,
  IdempotencyModule,
  CircuitBreakerModule,
  ObservabilityModule,
} from './performance';

// 🗄️ MongoDB Modules
import {
  IndexesModule,
  SoftDeleteModule,
  MultiTenancyModule,
  DataAccessModule,
} from './mongodb';

// 📊 Monitoring Module
import { MonitoringModule } from './monitoring/monitoring.module';

// 📚 Courses Module
import { CoursesModule } from './courses/courses.module';

// 🌐 Social Module
import { SocialModule } from './social/social.module';

// Middleware
import { TenantMiddleware } from './mongodb/multi-tenancy/tenant.middleware';

@Module({
  imports: [
    // ⚙️ Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 🗄️ Connect to MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: 'classy-book',
      }),
      inject: [ConfigService],
    }),

    // 🛡️ Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ☁️ Cloudinary for images and files
    CloudinaryModule,

    // 🔴 Redis Cache for fast caching
    RedisCacheModule,

    // 📋 Queue System for background operations
    QueueModule,

    // 📄 Pagination for data splitting
    PaginationModule,

    // 🔧 Response Optimizer for improving responses
    ResponseOptimizerModule,

    // ========== 🔐 Security Modules ==========
    AuthModule,
    UsersModule,
    SessionsModule,
    RolesPermissionsModule,
    RateLimitModule,
    BruteForceModule,
    ValidationModule,
    SanitizationModule,
    HelmetModule,
    CsrfModule,
    AuditLogModule,
    WebhookSecurityModule,
    ApiKeyModule,
    AdminManagementModule,

    // ========== ⚡ Performance Modules ==========
    SearchModule,
    RealtimeModule,
    FileModule,
    IdempotencyModule,
    CircuitBreakerModule,
    ObservabilityModule,

    // ========== 🗄️ MongoDB Modules ==========
    IndexesModule,
    SoftDeleteModule,
    MultiTenancyModule,
    DataAccessModule,

    // ========== 📊 Monitoring Module ==========
    MonitoringModule,

    // ========== 📚 Courses Module ==========
    CoursesModule,

    // ========== 🌐 Social Module ==========
    SocialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit, NestModule {
  private readonly logger = new Logger(AppModule.name);

  configure(consumer: MiddlewareConsumer) {
    // Apply Multi-Tenancy Middleware to all routes
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }

  onModuleInit() {
    this.logger.log('🚀 MongoDB Connected Successfully! ✅');
    this.logger.log('🔐 Security Modules Loaded! ✅');
    this.logger.log('⚡ Performance Modules Loaded! ✅');
    this.logger.log('🗄️ MongoDB Modules Loaded! ✅');
    this.logger.log('📦 All Systems Ready! 🎉');
  }
}
