import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close
  timeout: number; // Duration to stay open (in milliseconds)
}

interface CircuitInfo {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

@Injectable()
export class CircuitBreakerService {
  private circuits = new Map<string, CircuitInfo>();

  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000, // 30 seconds
  };

  /**
   * Execute operation with Circuit Breaker
   */
  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {},
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(name);

    // Check Circuit state
    if (circuit.state === 'OPEN') {
      if (Date.now() < (circuit.nextAttemptTime || 0)) {
        throw new ServiceUnavailableException(
          `Service ${name} is temporarily unavailable. Please try again later`,
        );
      }
      // Transition to HALF_OPEN
      circuit.state = 'HALF_OPEN';
      circuit.successes = 0;
    }

    try {
      const result = await operation();
      this.onSuccess(name, opts);
      return result;
    } catch (error) {
      this.onFailure(name, opts);
      throw error;
    }
  }

  /**
   * Handle success
   */
  private onSuccess(name: string, options: CircuitBreakerOptions): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    if (circuit.state === 'HALF_OPEN') {
      circuit.successes++;
      if (circuit.successes >= options.successThreshold) {
        this.reset(name);
      }
    } else {
      // In CLOSED state, reset failures
      circuit.failures = 0;
    }
  }

  /**
   * Handle failure
   */
  private onFailure(name: string, options: CircuitBreakerOptions): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === 'HALF_OPEN') {
      // Return to OPEN
      this.trip(name, options.timeout);
    } else if (circuit.failures >= options.failureThreshold) {
      this.trip(name, options.timeout);
    }
  }

  /**
   * Open the Circuit
   */
  private trip(name: string, timeout: number): void {
    const circuit = this.circuits.get(name);
    if (circuit) {
      circuit.state = 'OPEN';
      circuit.nextAttemptTime = Date.now() + timeout;
    }
  }

  /**
   * Reset the Circuit
   */
  reset(name: string): void {
    this.circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
    });
  }

  /**
   * Get or create Circuit
   */
  private getOrCreateCircuit(name: string): CircuitInfo {
    if (!this.circuits.has(name)) {
      this.reset(name);
    }
    return this.circuits.get(name)!;
  }

  /**
   * Get Circuit state
   */
  getState(name: string): CircuitInfo | null {
    return this.circuits.get(name) || null;
  }

  /**
   * Get all Circuits
   */
  getAllStates(): Record<string, CircuitInfo> {
    const states: Record<string, CircuitInfo> = {};
    for (const [name, info] of this.circuits.entries()) {
      states[name] = { ...info };
    }
    return states;
  }

  /**
   * Decorator helper for use with methods
   */
  static forService(
    serviceName: string,
    options?: Partial<CircuitBreakerOptions>,
  ) {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor,
    ) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const circuitBreaker = this.circuitBreaker as CircuitBreakerService;
        if (!circuitBreaker) {
          return originalMethod.apply(this, args);
        }

        return circuitBreaker.execute(
          `${serviceName}:${propertyKey}`,
          () => originalMethod.apply(this, args),
          options,
        );
      };

      return descriptor;
    };
  }
}
