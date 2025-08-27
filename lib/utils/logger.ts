/**
 * Logger Utility for CheatCal AI Enhancement System
 *
 * Simple logging utility with levels and formatting for development and production.
 *
 * @version CheatCal Phase 3.0
 * @author CheatCal AI Enhancement System
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColors: boolean;
}

class Logger {
  private config: LoggerConfig = {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    enableTimestamp: true,
    enableColors: typeof window === 'undefined', // Colors in Node.js only
  };

  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
  };

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    let formattedMessage = message;

    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString();
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }

    if (this.config.enableColors && typeof window === 'undefined') {
      formattedMessage = `${this.colors[level]}[${level.toUpperCase()}]\x1b[0m ${formattedMessage}`;
    } else {
      formattedMessage = `[${level.toUpperCase()}] ${formattedMessage}`;
    }

    return formattedMessage;
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage('debug', message, ...args);
    console.log(formatted, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.formatMessage('info', message, ...args);
    console.info(formatted, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;

    const formatted = this.formatMessage('warn', message, ...args);
    console.warn(formatted, ...args);
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (!this.shouldLog('error')) return;

    const formatted = this.formatMessage('error', message, ...args);

    if (error instanceof Error) {
      console.error(formatted, error, ...args);
    } else if (error) {
      console.error(formatted, error, ...args);
    } else {
      console.error(formatted, ...args);
    }
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export logger class for custom instances
export { Logger };

// Export types
export type { LogLevel, LoggerConfig };
