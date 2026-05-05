/**
 * SecretSanitizer - GDPR/Privacy Compliance for Logs and Reports
 *
 * Purpose: Sanitize sensitive data (API keys, emails, PII) from logs and reports
 * to ensure compliance with GDPR, CCPA, SOC2, and other privacy regulations.
 *
 * This class uses regex patterns to detect and redact sensitive information
 * before it is written to logs or reports.
 *
 * @module core/secret-sanitizer
 * @since 1.1.0
 */
/**
 * Sanitizer configuration
 */
interface SanitizerConfig {
    /** Whether to sanitize logs */
    sanitizeLogs: boolean;
    /** Whether to sanitize reports */
    sanitizeReports: boolean;
    /** Patterns that are allowed (not redacted) */
    allowedPatterns: string[];
    /** Log level for reduced PII exposure */
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    /** Whether to enable compliance mode (aggressive sanitization) */
    complianceMode: boolean;
}
/**
 * SecretSanitizer - GDPR/Privacy compliance for logs and reports
 *
 * This class provides automatic sanitization of sensitive data from logs
 * and reports using regex pattern matching.
 *
 * @class SecretSanitizer
 * @example
 * ```typescript
 * const sanitizer = new SecretSanitizer();
 * const sanitized = sanitizer.sanitize('API key: sk_1234567890abcdef');
 * console.log(sanitized); // 'API key: [REDACTED_0]'
 * ```
 */
export declare class SecretSanitizer {
    private config;
    private patterns;
    private replacements;
    constructor(config?: Partial<SanitizerConfig>);
    /**
     * Builds regex patterns for sensitive data detection
     *
     * @private
     * @returns RegExp[] - Array of regex patterns
     */
    private buildPatterns;
    /**
     * Sanitizes text by redacting sensitive patterns
     *
     * @param text - Text to sanitize
     * @returns string - Sanitized text
     */
    sanitize(text: string): string;
    /**
     * Sanitizes a report and adds security footer
     *
     * @param report - Report content to sanitize
     * @returns string - Sanitized report with security footer
     */
    sanitizeReport(report: string): string;
    /**
     * Sanitizes a log message
     *
     * @param message - Log message to sanitize
     * @returns string | null - Sanitized log message or null if filtered
     */
    sanitizeLog(message: string): string | null;
    /**
     * Gets the count of redacted patterns
     *
     * @returns number - Number of patterns redacted
     */
    getRedactedCount(): number;
    /**
     * Clears the replacement map (for testing or between reports)
     */
    clearReplacements(): void;
    /**
     * Updates configuration
     *
     * @param config - Partial configuration to update
     */
    updateConfig(config: Partial<SanitizerConfig>): void;
    /**
     * Gets current configuration
     *
     * @returns SanitizerConfig - Current configuration
     */
    getConfig(): SanitizerConfig;
    /**
     * Sanitizes an error message with audit logging
     *
     * @param error - Error to sanitize
     * @param context - Additional context for audit
     * @returns { message: string; originalLength: number; sanitizedLength: number; redactedCount: number } - Sanitization result
     */
    sanitizeError(error: Error | string, context?: string): {
        message: string;
        originalLength: number;
        sanitizedLength: number;
        redactedCount: number;
    };
    /**
     * Creates a safe error object with sanitized message
     *
     * @param error - Original error
     * @param context - Additional context for audit
     * @returns Error - Safe error with sanitized message
     */
    createSafeError(error: Error | string, context?: string): Error;
    /**
     * Static middleware for global console.log sanitization
     *
     * @param message - Message to sanitize
     * @returns string - Sanitized message
     */
    static logMiddleware(message: string): string;
    /**
     * Installs global console.log middleware
     * This will sanitize all console.log, console.error, console.warn output
     *
     * @static
     */
    static installGlobalMiddleware(): void;
}
export {};
//# sourceMappingURL=secret-sanitizer.d.ts.map