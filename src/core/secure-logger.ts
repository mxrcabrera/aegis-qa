/**
 * Secure Logger - Structured Logging with Security Levels
 *
 * Purpose: Provides structured logging with security levels to ensure sensitive
 * information is properly handled and logged at appropriate levels.
 *
 * @module core/secure-logger
 * @since 1.0.0
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export enum SecurityLevel {
  PUBLIC = 0,      // Safe for public display
  INTERNAL = 1,    // Internal use only
  SENSITIVE = 2,   // Contains sensitive information
  SECRET = 3,      // Contains secrets
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  securityLevel: SecurityLevel;
  message: string;
  context?: Record<string, unknown>;
  module?: string;
  phase?: number;
}

interface LoggerConfig {
  minLogLevel: LogLevel;
  maxSecurityLevel: SecurityLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath?: string;
}

/**
 * Secure Logger with security levels
 */
export class SecureLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private static instance: SecureLogger;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLogLevel: LogLevel.INFO,
      maxSecurityLevel: SecurityLevel.INTERNAL,
      enableConsole: true,
      enableFile: false,
      ...config,
    };
  }

  /**
   * Gets singleton instance
   */
  static getInstance(config?: Partial<LoggerConfig>): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger(config);
    }
    return SecureLogger.instance;
  }

  /**
   * Logs a message at the specified level
   */
  private log(
    level: LogLevel,
    securityLevel: SecurityLevel,
    message: string,
    context?: Record<string, any>,
    module?: string,
    phase?: number
  ): void {
    // Check if level is enabled
    if (level < this.config.minLogLevel) {
      return;
    }

    // Check if security level is allowed
    if (securityLevel > this.config.maxSecurityLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      securityLevel,
      message,
      context,
      module,
      phase,
    };

    this.logs.push(entry);

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // File output
    if (this.config.enableFile && this.config.logFilePath) {
      this.logToFile(entry);
    }
  }

  /**
   * Logs to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const levelStr = LogLevel[entry.level];
    const securityStr = SecurityLevel[entry.securityLevel];
    const prefix = `[${entry.timestamp}] [${levelStr}] [${securityStr}]`;
    
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const moduleStr = entry.module ? ` [${entry.module}]` : '';
    const phaseStr = entry.phase !== undefined ? ` [Phase ${entry.phase}]` : '';

    const message = `${prefix}${moduleStr}${phaseStr} ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message);
        break;
    }
  }

  /**
   * Logs to file
   */
  private async logToFile(entry: LogEntry): Promise<void> {
    if (!this.config.logFilePath) {
      return;
    }

    try {
      const fs = await import('fs');
      const logLine = JSON.stringify(entry) + '\n';
      await fs.promises.appendFile(this.config.logFilePath, logLine, 'utf-8');
    } catch {
      // Silently fail to avoid infinite loops
    }
  }

  /**
   * Debug level logging (public)
   */
  debug(message: string, context?: Record<string, any>, module?: string, phase?: number): void {
    this.log(LogLevel.DEBUG, SecurityLevel.PUBLIC, message, context, module, phase);
  }

  /**
   * Debug level logging (internal)
   */
  debugInternal(message: string, context?: Record<string, any>, module?: string, phase?: number): void {
    this.log(LogLevel.DEBUG, SecurityLevel.INTERNAL, message, context, module, phase);
  }

  /**
   * Info level logging (public)
   */
  info(message: string, context?: Record<string, any>, module?: string, phase?: number): void {
    this.log(LogLevel.INFO, SecurityLevel.PUBLIC, message, context, module, phase);
  }

  /**
   * Info level logging (internal)
   */
  infoInternal(message: string, context?: Record<string, any>, module?: string, phase?: number): void {
    this.log(LogLevel.INFO, SecurityLevel.INTERNAL, message, context, module, phase);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, any>, module?: string, phase?: number): void {
    this.log(LogLevel.WARN, SecurityLevel.INTERNAL, message, context, module, phase);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: Record<string, any>, module?: string, phase?: number): void {
    this.log(LogLevel.ERROR, SecurityLevel.INTERNAL, message, context, module, phase);
  }

  /**
   * Critical level logging
   */
  critical(message: string, context?: Record<string, any>, module?: string, phase?: number): void {
    this.log(LogLevel.CRITICAL, SecurityLevel.INTERNAL, message, context, module, phase);
  }

  /**
   * Gets all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Gets logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gets logs filtered by security level
   */
  getLogsBySecurityLevel(securityLevel: SecurityLevel): LogEntry[] {
    return this.logs.filter(log => log.securityLevel === securityLevel);
  }

  /**
   * Gets logs filtered by phase
   */
  getLogsByPhase(phase: number): LogEntry[] {
    return this.logs.filter(log => log.phase === phase);
  }

  /**
   * Clears all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Sets the minimum log level
   */
  setMinLogLevel(level: LogLevel): void {
    this.config.minLogLevel = level;
  }

  /**
   * Sets the maximum security level
   */
  setMaxSecurityLevel(level: SecurityLevel): void {
    this.config.maxSecurityLevel = level;
  }

  /**
   * Exports logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exports logs filtered by security level
   */
  exportLogsBySecurityLevel(securityLevel: SecurityLevel): string {
    const filtered = this.logs.filter(log => log.securityLevel <= securityLevel);
    return JSON.stringify(filtered, null, 2);
  }
}

/**
 * Creates a secure logger instance
 */
export function createSecureLogger(config?: Partial<LoggerConfig>): SecureLogger {
  return SecureLogger.getInstance(config);
}
