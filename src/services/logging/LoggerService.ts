/**
 * Logger Service
 * Centralized logging with environment-aware levels.
 * In production: errors and warnings are reported to Sentry;
 * info calls add breadcrumbs visible in Sentry crash reports.
 *
 * Usage:
 * logger.debug('[Service] Message') - Development only
 * logger.info('[Service] Message') - Normal operations (breadcrumb in Sentry)
 * logger.warn('[Service] Message') - Warning conditions (reported to Sentry)
 * logger.error('[Service] Message', error) - Error with stack trace (reported to Sentry)
 */

import * as Sentry from '@sentry/react-native';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  error?: Error;
}

class LoggerService {
  private isDevelopment = __DEV__;
  private logHistory: LogEntry[] = [];
  private maxHistory = 100;

  debug(message: string, error?: Error): void {
    if (this.isDevelopment) {
      console.log(message);
      if (error) console.log(error);
    }
    this.recordLog('debug', message, error);
  }

  info(message: string, error?: Error): void {
    if (this.isDevelopment) console.log(message);
    this.recordLog('info', message, error);
    Sentry.addBreadcrumb({ level: 'info', message, category: 'app' });
  }

  warn(message: string, error?: Error): void {
    console.warn(message);
    if (error) console.warn(error);
    this.recordLog('warn', message, error);
    Sentry.captureMessage(message, 'warning');
  }

  error(message: string, error?: Error): void {
    console.error(message);
    if (error) console.error(error);
    this.recordLog('error', message, error);
    if (error) {
      Sentry.captureException(error, { extra: { message } });
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }

  private recordLog(level: LogLevel, message: string, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      error,
    };

    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistory) {
      this.logHistory.shift();
    }
  }

  getHistory(limit: number = 50): LogEntry[] {
    return this.logHistory.slice(-limit);
  }

  clearHistory(): void {
    this.logHistory = [];
  }
}

export const logger = new LoggerService();
