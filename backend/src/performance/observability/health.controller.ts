import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../security/auth/decorators/public.decorator';
import { MetricsService } from './metrics.service';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private metricsService: MetricsService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024), // 500MB
    ]);
  }

  @Get('ready')
  readiness() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Get('live')
  liveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('metrics')
  metrics() {
    return this.metricsService.getStats();
  }

  @Get('metrics/prometheus')
  prometheusMetrics() {
    return this.metricsService.toPrometheus();
  }
}
