// ─── Structured Logger (zero dependencies) ───────────────────────

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]:  'WARN',
  [LogLevel.INFO]:  'INFO',
  [LogLevel.HTTP]:  'HTTP',
  [LogLevel.DEBUG]: 'DEBUG',
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.ERROR]: '\x1b[31m',  // red
  [LogLevel.WARN]:  '\x1b[33m',  // yellow
  [LogLevel.INFO]:  '\x1b[36m',  // cyan
  [LogLevel.HTTP]:  '\x1b[35m',  // magenta
  [LogLevel.DEBUG]: '\x1b[37m',  // white
};
const RESET = '\x1b[0m';

export class Logger {
  private level: LogLevel;
  private service: string;
  private isDev: boolean;

  constructor(service: string, level?: LogLevel) {
    this.service = service;
    this.isDev = process.env.NODE_ENV === 'development';
    this.level = level ?? (this.isDev ? LogLevel.DEBUG : LogLevel.INFO);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (level > this.level) return;

    const ts = new Date().toISOString();
    const entry: Record<string, unknown> = {
      timestamp: ts,
      level: LEVEL_NAMES[level],
      service: this.service,
      message,
      ...meta,
    };

    const output = this.isDev
      ? `${LEVEL_COLORS[level]}[${LEVEL_NAMES[level]}]${RESET} ${ts} [${this.service}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`
      : JSON.stringify(entry);

    if (level === LogLevel.ERROR) process.stderr.write(output + '\n');
    else process.stdout.write(output + '\n');
  }

  error(message: string, meta?: Record<string, unknown>): void { this.write(LogLevel.ERROR, message, meta); }
  warn(message: string, meta?: Record<string, unknown>): void  { this.write(LogLevel.WARN, message, meta); }
  info(message: string, meta?: Record<string, unknown>): void  { this.write(LogLevel.INFO, message, meta); }
  http(message: string, meta?: Record<string, unknown>): void  { this.write(LogLevel.HTTP, message, meta); }
  debug(message: string, meta?: Record<string, unknown>): void { this.write(LogLevel.DEBUG, message, meta); }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}
