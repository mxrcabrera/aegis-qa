/**
 * Unit Tests for SecretSanitizer
 * 
 * Tests GDPR/CCPA/SOC2 compliance features:
 * - Secret detection and redaction
 * - Log sanitization
 * - Report sanitization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SecretSanitizer } from '../src/core/secret-sanitizer.js';

describe('SecretSanitizer', () => {
  let sanitizer: SecretSanitizer;

  beforeEach(() => {
    sanitizer = new SecretSanitizer();
  });

  afterEach(() => {
    sanitizer.clearReplacements();
  });

  describe('Secret Detection and Redaction', () => {
    it('should redact Stripe API keys', () => {
      const text = 'API_KEY=sk-1234567890abcdef1234567890ab';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).not.toContain('sk-1234567890abcdef1234567890ab');
    });

    it('should redact JWT tokens', () => {
      const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should redact database connection strings', () => {
      const text = 'DATABASE_URL=postgresql://user:password@localhost:5432/db';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
    });

    it('should redact email addresses', () => {
      const text = 'Contact: user@example.com';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).not.toContain('user@example.com');
    });

    it('should redact AWS access keys', () => {
      const text = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
    });

    it('should redact multiple secrets in one text', () => {
      const text = 'API_KEY=sk-1234567890abcdef\nEMAIL=user@example.com\nAWS_KEY=AKIAIOSFODNN7EXAMPLE';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).toContain('[REDACTED_1]');
      expect(sanitized).toContain('[REDACTED_2]');
      expect(sanitizer.getRedactedCount()).toBe(3);
    });

    it('should preserve non-secret text', () => {
      const text = 'Configuration file\nAPI_KEY=sk-1234567890abcdef\nEnd of file';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('Configuration file');
      expect(sanitized).toContain('End of file');
    });

    it('should not redact allowed patterns', () => {
      const text = 'Using TEST_API_KEY for testing';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('TEST_API_KEY');
      expect(sanitized).not.toContain('[REDACTED');
    });
  });

  describe('Log Sanitization', () => {
    it('should sanitize log messages', () => {
      const logMessage = 'User logged in with API key sk-1234567890abcdef';
      const sanitized = sanitizer.sanitizeLog(logMessage);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).not.toContain('sk-1234567890abcdef');
    });

    it('should handle empty log messages', () => {
      const sanitized = sanitizer.sanitizeLog('');
      expect(sanitized).toBe('');
    });

    it('should handle log messages without secrets', () => {
      const logMessage = 'User logged in successfully';
      const sanitized = sanitizer.sanitizeLog(logMessage);
      expect(sanitized).toBe(logMessage);
    });

    it('should filter logs based on log level when set to error', () => {
      sanitizer.updateConfig({ logLevel: 'error' });
      const infoLog = 'User logged in';
      const errorLog = 'Error occurred: API key sk-1234567890abcdef';
      
      const sanitizedInfo = sanitizer.sanitizeLog(infoLog);
      const sanitizedError = sanitizer.sanitizeLog(errorLog);
      
      expect(sanitizedInfo).toBeNull();
      expect(sanitizedError).toContain('[REDACTED_0]');
    });

    it('should return null for filtered logs', () => {
      sanitizer.updateConfig({ logLevel: 'error' });
      const sanitized = sanitizer.sanitizeLog('Info message');
      expect(sanitized).toBeNull();
    });
  });

  describe('Report Sanitization', () => {
    it('should sanitize report content', () => {
      const report = `
# QA Report

## Findings
- API key found: sk-1234567890abcdef
- Contact: user@example.com
      `.trim();
      
      const sanitized = sanitizer.sanitizeReport(report);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).toContain('[REDACTED_1]');
      expect(sanitized).not.toContain('sk-1234567890abcdef');
    });

    it('should preserve report structure', () => {
      const report = `
# QA Report

## Findings
- API key found: sk-1234567890abcdef
      `.trim();
      
      const sanitized = sanitizer.sanitizeReport(report);
      expect(sanitized).toContain('# QA Report');
      expect(sanitized).toContain('## Findings');
    });

    it('should add security footer', () => {
      const report = '# QA Report';
      const sanitized = sanitizer.sanitizeReport(report);
      expect(sanitized).toContain('SECURITY NOTICE');
      expect(sanitized).toContain('GDPR/CCPA/SOC2');
    });

    it('should handle empty reports', () => {
      const sanitized = sanitizer.sanitizeReport('');
      expect(sanitized).toContain('SECURITY NOTICE');
    });

    it('should show redaction count in footer', () => {
      const report = 'API_KEY=sk-1234567890abcdef\nEMAIL=user@example.com';
      const sanitized = sanitizer.sanitizeReport(report);
      expect(sanitized).toContain('2 sensitive patterns redacted');
    });
  });

  describe('Compliance Mode', () => {
    it('should redact IP addresses in compliance mode', () => {
      sanitizer.updateConfig({ complianceMode: true });
      const text = 'Server IP: 192.168.1.1';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).not.toContain('192.168.1.1');
    });

    it('should redact URLs in compliance mode', () => {
      sanitizer.updateConfig({ complianceMode: true });
      const text = 'Visit https://example.com for more info';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
    });

    it('should redact file paths in compliance mode', () => {
      sanitizer.updateConfig({ complianceMode: true });
      const text = 'Config at /home/user/.env';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
    });
  });

  describe('Configuration', () => {
    it('should allow updating configuration', () => {
      sanitizer.updateConfig({ logLevel: 'error', complianceMode: true });
      const config = sanitizer.getConfig();
      expect(config.logLevel).toBe('error');
      expect(config.complianceMode).toBe(true);
    });

    it('should allow disabling log sanitization', () => {
      sanitizer.updateConfig({ sanitizeLogs: false });
      const logMessage = 'API key: sk-1234567890abcdef';
      const sanitized = sanitizer.sanitizeLog(logMessage);
      expect(sanitized).toBe(logMessage);
    });

    it('should allow disabling report sanitization', () => {
      sanitizer.updateConfig({ sanitizeReports: false });
      const report = 'API key: sk-1234567890abcdef';
      const sanitized = sanitizer.sanitizeReport(report);
      expect(sanitized).toBe(report);
      expect(sanitized).not.toContain('SECURITY NOTICE');
    });
  });

  describe('Replacement Management', () => {
    it('should track redaction count', () => {
      sanitizer.sanitize('API_KEY=sk-1234567890abcdef');
      sanitizer.sanitize('EMAIL=user@example.com');
      expect(sanitizer.getRedactedCount()).toBe(2);
    });

    it('should clear replacements', () => {
      sanitizer.sanitize('API_KEY=sk-1234567890abcdef');
      expect(sanitizer.getRedactedCount()).toBe(1);
      sanitizer.clearReplacements();
      expect(sanitizer.getRedactedCount()).toBe(0);
    });

    it('should use consistent replacements for same secret', () => {
      const text1 = 'API_KEY=sk-1234567890abcdef';
      const text2 = 'Using API_KEY=sk-1234567890abcdef again';
      
      sanitizer.sanitize(text1);
      const sanitized2 = sanitizer.sanitize(text2);
      
      expect(sanitized2).toContain('[REDACTED_0]');
      expect(sanitized2).not.toContain('[REDACTED_1]');
    });
  });

  describe('Static Methods', () => {
    it('should provide static log middleware', () => {
      const message = 'API key: sk-1234567890abcdef';
      const sanitized = SecretSanitizer.logMiddleware(message);
      expect(sanitized).toContain('[REDACTED_0]');
    });

    it('should install global middleware', () => {
      expect(() => {
        SecretSanitizer.installGlobalMiddleware();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input', () => {
      const sanitized = sanitizer.sanitize(null as any);
      expect(sanitized).toBeNull();
    });

    it('should handle undefined input', () => {
      const sanitized = sanitizer.sanitize(undefined as any);
      expect(sanitized).toBeUndefined();
    });

    it('should handle non-string input', () => {
      const sanitized = sanitizer.sanitize(123 as any);
      expect(sanitized).toBe(123);
    });

    it('should handle very long text', () => {
      const longText = 'API_KEY=sk-1234567890abcdef\n'.repeat(1000);
      const sanitized = sanitizer.sanitize(longText);
      expect(sanitized).toContain('[REDACTED_0]');
    });

    it('should handle unicode characters', () => {
      const text = 'API_KEY=sk-1234567890abcdef 用户名 🚀';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toContain('[REDACTED_0]');
      expect(sanitized).toContain('用户名');
      expect(sanitized).toContain('🚀');
    });

    it('should handle empty string', () => {
      const sanitized = sanitizer.sanitize('');
      expect(sanitized).toBe('');
    });

    it('should handle text with no secrets', () => {
      const text = 'This is just a normal message';
      const sanitized = sanitizer.sanitize(text);
      expect(sanitized).toBe(text);
      expect(sanitizer.getRedactedCount()).toBe(0);
    });
  });
});
