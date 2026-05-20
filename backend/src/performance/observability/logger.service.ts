import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: Record<string, any>;
  traceId?: string;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private traceId?: string;

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  setTraceId(traceId: string): this {
    this.traceId = traceId;
    return this;
  }

  log(message: string, ...optionalParams: any[]): void {
    this.writeLog('info', message, optionalParams);
  }

  error(message: string, ...optionalParams: any[]): void {
    this.writeLog('error', message, optionalParams);
  }

  warn(message: string, ...optionalParams: any[]): void {
    this.writeLog('warn', message, optionalParams);
  }

  debug(message: string, ...optionalParams: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      this.writeLog('debug', message, optionalParams);
    }
  }

  verbose(message: string, ...optionalParams: any[]): void {
    this.writeLog('debug', message, optionalParams);
  }

  fatal(message: string, ...optionalParams: any[]): void {
    this.writeLog('fatal', message, optionalParams);
  }

  private writeLog(
    level: LogLevel,
    message: string,
    optionalParams: any[],
  ): void {
    const entry: LogEntry = {
      level,
      message,
      context:
        this.context ||
        (typeof optionalParams[0] === 'string' ? optionalParams[0] : undefined),
      timestamp: new Date().toISOString(),
      traceId: this.traceId,
    };

    // Add extra data
    const data = optionalParams.find(
      (p) => typeof p === 'object' && p !== null,
    );
    if (data) {
      entry.data = data;
    }

    // Add stack trace for errors
    if (level === 'error' || level === 'fatal') {
      const error = optionalParams.find((p) => p instanceof Error);
      if (error) {
        entry.data = {
          ...entry.data,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        };
      }
    }

    // Print in JSON format in production
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // Print colored in development
      this.printColored(entry);
    }
  }

  private printColored(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    const color = colors[entry.level];

    const contextStr = entry.context ? `[${entry.context}]` : '';
    const traceStr = entry.traceId ? `[${entry.traceId.slice(0, 8)}]` : '';

    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} ${contextStr}${traceStr} ${entry.message}`,
    );

    if (entry.data) {
      console.log(`${color}Data:${reset}`, JSON.stringify(entry.data, null, 2));
    }
  }

  /**
   * Create child logger with context
   */
  child(context: string): LoggerService {
    const child = new LoggerService();
    child.setContext(context);
    if (this.traceId) {
      child.setTraceId(this.traceId);
    }
    return child;
  }
}
