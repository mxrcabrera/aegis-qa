/**
 * Secure Logger - Structured Logging with Security Levels
 *
 * Purpose: Provides structured logging with security levels to ensure sensitive
 * information is properly handled and logged at appropriate levels.
 *
 * @module core/secure-logger
 * @since 1.0.0
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4
}
export declare enum SecurityLevel {
    PUBLIC = 0,// Safe for public display
    INTERNAL = 1,// Internal use only
    SENSITIVE = 2,// Contains sensitive information
    SECRET = 3
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
export declare class SecureLogger {
    private config;
    private logs;
    private static instance;
    constructor(config?: Partial<LoggerConfig>);
    /**
     * Gets singleton instance
     */
    static getInstance(config?: Partial<LoggerConfig>): SecureLogger;
    /**
     * Logs a message at the specified level
     */
    private log;
    /**
     * Logs to console with appropriate formatting
     */
    private logToConsole;
    /**
     * Logs to file
     */
    private logToFile;
    /**
     * Debug level logging (public)
     */
    debug(message: string, context?: Record<string, unknown>, module?: string, phase?: number): void;
    /**
     * Debug level logging (internal)
     */
    debugInternal(message: string, context?: Record<string, unknown>, module?: string, phase?: number): void;
    /**
     * Info level logging (public)
     */
    info(message: string, context?: Record<string, unknown>, module?: string, phase?: number): void;
    /**
     * Info level logging (internal)
     */
    infoInternal(message: string, context?: Record<string, unknown>, module?: string, phase?: number): void;
    /**
     * Warning level logging
     */
    warn(message: string, context?: Record<string, unknown>, module?: string, phase?: number): void;
    /**
     * Error level logging
     */
    error(message: string, context?: Record<string, unknown>, module?: string, phase?: number): void;
    /**
     * Critical level logging
     */
    critical(message: string, context?: Record<string, unknown>, module?: string, phase?: number): void;
    getLogs(): LogEntry[];
    /**
     * Gets logs filtered by level
     */
    getLogsByLevel(level: LogLevel): LogEntry[];
    /**
     * Gets logs filtered by security level
     */
    getLogsBySecurityLevel(securityLevel: SecurityLevel): LogEntry[];
    /**
     * Gets logs filtered by phase
     */
    getLogsByPhase(phase: number): LogEntry[];
    /**
     * Clears all logs
     */
    clearLogs(): void;
    /**
     * Sets the minimum log level
     */
    setMinLogLevel(level: LogLevel): void;
    /**
     * Sets the maximum security level
     */
    setMaxSecurityLevel(level: SecurityLevel): void;
    /**
     * Exports logs as JSON
     */
    exportLogs(): string;
    /**
     * Exports logs filtered by security level
     */
    exportLogsBySecurityLevel(securityLevel: SecurityLevel): string;
}
/**
 * Creates a secure logger instance
 */
export declare function createSecureLogger(config?: Partial<LoggerConfig>): SecureLogger;
export {};
//# sourceMappingURL=secure-logger.d.ts.map