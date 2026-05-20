import { Injectable } from '@nestjs/common';

interface MetricData {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

interface Counter {
  value: number;
  increment: (amount?: number) => void;
}

interface Gauge {
  value: number;
  set: (value: number) => void;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
}

interface Histogram {
  values: number[];
  observe: (value: number) => void;
  getPercentile: (p: number) => number;
}

@Injectable()
export class MetricsService {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();
  private metrics: MetricData[] = [];

  /**
   * Create or get Counter
   */
  counter(name: string): Counter {
    if (!this.counters.has(name)) {
      const counter: Counter = {
        value: 0,
        increment: (amount = 1) => {
          counter.value += amount;
          this.record(name, counter.value, { type: 'counter' });
        },
      };
      this.counters.set(name, counter);
    }
    return this.counters.get(name)!;
  }

  /**
   * Create or get Gauge
   */
  gauge(name: string): Gauge {
    if (!this.gauges.has(name)) {
      const gauge: Gauge = {
        value: 0,
        set: (value) => {
          gauge.value = value;
          this.record(name, gauge.value, { type: 'gauge' });
        },
        increment: (amount = 1) => {
          gauge.value += amount;
          this.record(name, gauge.value, { type: 'gauge' });
        },
        decrement: (amount = 1) => {
          gauge.value -= amount;
          this.record(name, gauge.value, { type: 'gauge' });
        },
      };
      this.gauges.set(name, gauge);
    }
    return this.gauges.get(name)!;
  }

  /**
   * Create or get Histogram
   */
  histogram(name: string): Histogram {
    if (!this.histograms.has(name)) {
      const histogram: Histogram = {
        values: [],
        observe: (value) => {
          histogram.values.push(value);
          // Keep only last 1000 values
          if (histogram.values.length > 1000) {
            histogram.values.shift();
          }
        },
        getPercentile: (p) => {
          if (histogram.values.length === 0) return 0;
          const sorted = [...histogram.values].sort((a, b) => a - b);
          const index = Math.ceil((p / 100) * sorted.length) - 1;
          return sorted[Math.max(0, index)];
        },
      };
      this.histograms.set(name, histogram);
    }
    return this.histograms.get(name)!;
  }

  /**
   * Measure execution time
   */
  async measureTime<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      this.histogram(`${name}_duration_ms`).observe(duration);
      this.counter(`${name}_success`).increment();
      return result;
    } catch (error) {
      this.counter(`${name}_error`).increment();
      throw error;
    }
  }

  /**
   * Record metric
   */
  private record(
    name: string,
    value: number,
    tags: Record<string, string> = {},
  ): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });

    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<
      string,
      { p50: number; p90: number; p99: number; count: number }
    >;
  } {
    const counters: Record<string, number> = {};
    const gauges: Record<string, number> = {};
    const histograms: Record<
      string,
      { p50: number; p90: number; p99: number; count: number }
    > = {};

    for (const [name, counter] of this.counters) {
      counters[name] = counter.value;
    }

    for (const [name, gauge] of this.gauges) {
      gauges[name] = gauge.value;
    }

    for (const [name, histogram] of this.histograms) {
      histograms[name] = {
        p50: histogram.getPercentile(50),
        p90: histogram.getPercentile(90),
        p99: histogram.getPercentile(99),
        count: histogram.values.length,
      };
    }

    return { counters, gauges, histograms };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.metrics = [];
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheus(): string {
    const lines: string[] = [];

    for (const [name, counter] of this.counters) {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${counter.value}`);
    }

    for (const [name, gauge] of this.gauges) {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${gauge.value}`);
    }

    for (const [name, histogram] of this.histograms) {
      lines.push(`# TYPE ${name} histogram`);
      lines.push(`${name}_p50 ${histogram.getPercentile(50)}`);
      lines.push(`${name}_p90 ${histogram.getPercentile(90)}`);
      lines.push(`${name}_p99 ${histogram.getPercentile(99)}`);
      lines.push(`${name}_count ${histogram.values.length}`);
    }

    return lines.join('\n');
  }
}
