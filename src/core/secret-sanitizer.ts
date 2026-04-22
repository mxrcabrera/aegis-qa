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
export class SecretSanitizer {
  private config: SanitizerConfig;
  private patterns: RegExp[];
  private replacements: Map<string, string>;

  constructor(config?: Partial<SanitizerConfig>) {
    this.config = {
      sanitizeLogs: true,
      sanitizeReports: true,
      allowedPatterns: ['TEST_API_KEY', 'MOCK_SECRET', 'DEMO_KEY'],
      logLevel: 'warn',
      complianceMode: false,
      ...config,
    };

    this.replacements = new Map();
    this.patterns = this.buildPatterns();
  }

  /**
   * Builds regex patterns for sensitive data detection
   *
   * @private
   * @returns RegExp[] - Array of regex patterns
   */
  private buildPatterns(): RegExp[] {
    const patterns: RegExp[] = [
      // API Keys (generic)
      /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?key|private[_-]?key)[:\s=]+[a-zA-Z0-9_-]{20,}/gi,

      // Stripe Keys
      /sk_[a-zA-Z0-9]{20,}/gi,
      /pk_[a-zA-Z0-9]{20,}/gi,

      // JWT Tokens
      /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/gi,

      // Database URLs
      new RegExp('(?:postgres|mysql|mongodb|redis|mssql|sqlite)://[^\\s@]+:[^\\s@]+@[^\\s]+', 'gi'),

      // Emails
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,

      // Phone numbers (international format)
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi,

      // Credit cards (basic pattern)
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi,

      // AWS Access Keys
      /AKIA[0-9A-Z]{16}/gi,

      // AWS Secret Keys
      /[a-zA-Z0-9/+]{40}/gi,

      // Environment variables in code
      /process\.env\.[A-Z_]+/gi,

      // GitHub Personal Access Tokens
      /ghp_[a-zA-Z0-9]{36}/gi,
      /gho_[a-zA-Z0-9]{36}/gi,
      /ghu_[a-zA-Z0-9]{36}/gi,

      // Slack Tokens
      /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{32}/gi,

      // Google API Keys
      /AIza[a-zA-Z0-9_-]{35}/gi,

      // Local file patterns (.env, .env.local, etc.)
      /[a-zA-Z0-9_-]+=(?:[a-zA-Z0-9_-]{20,}|[a-zA-Z0-9_/@:.-]+)/gi,
      
      // Common environment variable names with values
      /(?:DATABASE_URL|API_KEY|SECRET_KEY|PRIVATE_KEY|ACCESS_KEY|AWS_SECRET|STRIPE_SECRET|JWT_SECRET|REDIS_URL|MONGODB_URI|POSTGRES_PASSWORD|MYSQL_PASSWORD|ADMIN_PASSWORD|AUTH_TOKEN|SESSION_SECRET|COOKIE_SECRET|ENCRYPTION_KEY)[:\s=]+[^\s]+/gi,
      
      // Local file paths with sensitive data
      new RegExp('(?:\\.env|\\.env\\.local|\\.env\\.development|\\.env\\.production|config/secrets\\.json|secrets\\.yml|\\.secrets)', 'gi'),
      
      // Base64 encoded data (potentially secrets)
      /[A-Za-z0-9+/]{40,}={0,2}/gi,
    ];

    // Compliance mode: add aggressive patterns
    if (this.config.complianceMode) {
      patterns.push(
        // IP addresses
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        // IPv6
        /\[?[0-9a-fA-F:]+\]?/g,
        // URLs with potential PII
        new RegExp('https?://[^\\s]+', 'gi'),
        // File paths with user data
        new RegExp('/home/[^/]+', 'gi'),
        new RegExp('/users/[^/]+', 'gi'),
        // Localhost with ports
        /localhost:[0-9]{1,5}/gi,
        /127\.0\.0\.1:[0-9]{1,5}/gi,
      );
    }

    return patterns;
  }

  /**
   * Sanitizes text by redacting sensitive patterns
   *
   * @param text - Text to sanitize
   * @returns string - Sanitized text
   */
  sanitize(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let sanitized = text;

    for (const pattern of this.patterns) {
      sanitized = sanitized.replace(pattern, (match) => {
        // Check if pattern is allowed
        for (const allowed of this.config.allowedPatterns) {
          if (match.includes(allowed)) {
            return match;
          }
        }

        // Generate unique placeholder for this match
        if (!this.replacements.has(match)) {
          const placeholder = `[REDACTED_${this.replacements.size}]`;
          this.replacements.set(match, placeholder);
        }
        return this.replacements.get(match)!;
      });
    }

    return sanitized;
  }

  /**
   * Sanitizes a report and adds security footer
   *
   * @param report - Report content to sanitize
   * @returns string - Sanitized report with security footer
   */
  sanitizeReport(report: string): string {
    if (!this.config.sanitizeReports) {
      return report;
    }

    // Sanitize the entire report
    const sanitized = this.sanitize(report);

    // Add security footer
    const footer = `
---

**SECURITY NOTICE:** This report has been automatically sanitized for GDPR/CCPA/SOC2 compliance.
- **${this.replacements.size}** sensitive patterns redacted
- Original values are not logged or stored
- Contact security team if you need to review original data
- Sanitization mode: ${this.config.complianceMode ? 'COMPLIANCE (aggressive)' : 'STANDARD'}
`;

    return sanitized + footer;
  }

  /**
   * Sanitizes a log message
   *
   * @param message - Log message to sanitize
   * @returns string | null - Sanitized log message or null if filtered
   */
  sanitizeLog(message: string): string | null {
    if (!this.config.sanitizeLogs) {
      return message;
    }

    // Apply sanitization
    const sanitized = this.sanitize(message);

    // Apply log level filtering
    if (this.config.logLevel === 'error') {
      // Only show error/warning level logs
      if (!sanitized.toLowerCase().includes('error') && 
          !sanitized.toLowerCase().includes('warning') &&
          !sanitized.toLowerCase().includes('critical')) {
        return null; // Skip this log
      }
    }

    return sanitized;
  }

  /**
   * Gets the count of redacted patterns
   *
   * @returns number - Number of patterns redacted
   */
  getRedactedCount(): number {
    return this.replacements.size;
  }

  /**
   * Clears the replacement map (for testing or between reports)
   */
  clearReplacements(): void {
    this.replacements.clear();
  }

  /**
   * Updates configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<SanitizerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.patterns = this.buildPatterns();
  }

  /**
   * Gets current configuration
   *
   * @returns SanitizerConfig - Current configuration
   */
  getConfig(): SanitizerConfig {
    return { ...this.config };
  }

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
  } {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const originalLength = errorMessage.length;

    this.clearReplacements(); // Clear previous replacements for fresh scan
    const sanitized = this.sanitize(errorMessage);
    const sanitizedLength = sanitized.length;
    const redactedCount = this.getRedactedCount();

    // Audit logging for secret detection
    if (redactedCount > 0) {
      console.log(`[Security Audit] ${redactedCount} potential secrets detected and redacted in error message`);
      if (context) {
        console.log(`[Security Audit] Context: ${context}`);
      }
      console.log(`[Security Audit] Original length: ${originalLength}, Sanitized length: ${sanitizedLength}`);
    }

    return {
      message: sanitized,
      originalLength,
      sanitizedLength,
      redactedCount,
    };
  }

  /**
   * Creates a safe error object with sanitized message
   *
   * @param error - Original error
   * @param context - Additional context for audit
   * @returns Error - Safe error with sanitized message
   */
  createSafeError(error: Error | string, context?: string): Error {
    const sanitization = this.sanitizeError(error, context);

    if (error instanceof Error) {
      const safeError = new Error(sanitization.message);
      safeError.name = error.name;
      safeError.stack = error.stack ? this.sanitize(error.stack) : undefined;
      return safeError;
    }

    return new Error(sanitization.message);
  }

  /**
   * Static middleware for global console.log sanitization
   *
   * @param message - Message to sanitize
   * @returns string - Sanitized message
   */
  static logMiddleware(message: string): string {
    const sanitizer = new SecretSanitizer();
    return sanitizer.sanitize(message);
  }

  /**
   * Installs global console.log middleware
   * This will sanitize all console.log, console.error, console.warn output
   *
   * @static
   */
  static installGlobalMiddleware(): void {
    const sanitizer = new SecretSanitizer();

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args: any[]) => {
      const sanitized = args.map(arg => 
        typeof arg === 'string' ? sanitizer.sanitizeLog(arg) : arg
      ).filter(arg => arg !== null);
      originalLog(...sanitized);
    };

    console.error = (...args: any[]) => {
      const sanitized = args.map(arg => 
        typeof arg === 'string' ? sanitizer.sanitizeLog(arg) : arg
      ).filter(arg => arg !== null);
      originalError(...sanitized);
    };

    console.warn = (...args: any[]) => {
      const sanitized = args.map(arg => 
        typeof arg === 'string' ? sanitizer.sanitizeLog(arg) : arg
      ).filter(arg => arg !== null);
      originalWarn(...sanitized);
    };

    console.info = (...args: any[]) => {
      const sanitized = args.map(arg => 
        typeof arg === 'string' ? sanitizer.sanitizeLog(arg) : arg
      ).filter(arg => arg !== null);
      originalInfo(...sanitized);
    };

    console.log('[SecretSanitizer] Global middleware installed');
  }
}
