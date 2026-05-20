import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { LoggerService } from './logger.service';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule],
  providers: [MetricsService, LoggerService],
  controllers: [HealthController],
  exports: [MetricsService, LoggerService],
})
export class ObservabilityModule {}
