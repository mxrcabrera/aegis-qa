/**
 * Phase 3F: Webhook & Integration Security
 *
 * Purpose: Analyze webhook and integration security including signature verification,
 * idempotency of retries, timeout configurations, and secure data handling.
 *
 * Architecture:
 * - Signature Verification: Check for proper webhook signature verification
 * - Idempotency: Verify retry mechanisms are idempotent
 * - Timeout Configuration: Check for appropriate timeout settings
 * - Secure Data Handling: Verify sensitive data is handled securely in integrations
 *
 * @module phases/phase-3f-webhook-security
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';

interface WebhookSecurityFinding {
  id: string;
  type: 'missing-signature-verification' | 'missing-idempotency' | 'insecure-timeout' | 'exposed-webhook-secret' | 'missing-retry-logic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath: string;
  line?: number;
  description: string;
  suggestion?: string;
  integrationType?: 'stripe' | 'github' | 'slack' | 'custom';
}

interface WebhookSecurityMetrics {
  totalFiles: number;
  missingSignatureVerification: number;
  missingIdempotency: number;
  insecureTimeouts: number;
  exposedWebhookSecrets: number;
  missingRetryLogic: number;
}

interface Phase3FConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
}

export interface Phase3FResult {
  success: boolean;
  findings: WebhookSecurityFinding[];
  metrics: WebhookSecurityMetrics;
  criticalFindings: number;
  highSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class Phase3FWebhookSecurity {
  private config: Phase3FConfig;

  constructor(config: Phase3FConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<Phase3FResult> {
    const startTime = Date.now();
    console.log('INFO Phase 3F: Webhook & Integration Security\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Analyzing webhook and integration security...\n');
      
      const findings: WebhookSecurityFinding[] = [];

      // 1. Check for signature verification in webhook handlers
      console.log('INFO Checking for webhook signature verification...');
      findings.push(...await this.checkSignatureVerification());

      // 2. Check for idempotency in integration handlers
      console.log('INFO Checking for idempotency in integrations...');
      findings.push(...await this.checkIdempotency());

      // 3. Check timeout configurations
      console.log('INFO Checking timeout configurations...');
      findings.push(...await this.checkTimeoutConfigurations());

      // 4. Check for exposed webhook secrets
      console.log('INFO Checking for exposed webhook secrets...');
      findings.push(...await this.checkExposedWebhookSecrets());

      // 5. Check for retry logic
      console.log('INFO Checking for retry logic...');
      findings.push(...await this.checkRetryLogic());

      console.log(`INFO Total findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Missing signature verification: ${metrics.missingSignatureVerification}`);
      console.log(`INFO Missing idempotency: ${metrics.missingIdempotency}`);
      console.log(`INFO Insecure timeouts: ${metrics.insecureTimeouts}`);
      console.log(`INFO Exposed webhook secrets: ${metrics.exposedWebhookSecrets}\n`);

      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase3FResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 3F Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase3FResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          missingSignatureVerification: 0,
          missingIdempotency: 0,
          insecureTimeouts: 0,
          exposedWebhookSecrets: 0,
          missingRetryLogic: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 3F:', sanitizedError);
      return result;
    }
  }

  private async checkSignatureVerification(): Promise<WebhookSecurityFinding[]> {
    const findings: WebhookSecurityFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lowerContent = content.toLowerCase();

        // Detect webhook handlers
        const webhookPatterns = [
          'webhook',
          'stripe.webhooks',
          'github.webhook',
          'webhook.',
          'POST /webhook',
          'POST /api/webhook',
        ];

        let isWebhookHandler = false;
        webhookPatterns.forEach((pattern) => {
          if (lowerContent.includes(pattern.toLowerCase())) {
            isWebhookHandler = true;
          }
        });

        if (isWebhookHandler) {
          const integrationType = this.detectIntegrationType(content);

          // Check for signature verification
          const hasSignatureCheck =
            content.includes('verify') ||
            content.includes('signature') ||
            content.includes('hmac') ||
            content.includes('svix') ||
            content.includes('stripe.webhooks.constructEvent');

          if (!hasSignatureCheck) {
            findings.push({
              id: `missing-signature-${Date.now()}-${Math.random()}`,
              type: 'missing-signature-verification',
              severity: 'critical',
              filePath,
              description: `Webhook handler without signature verification detected (${integrationType || 'custom'})`,
              suggestion: 'Always verify webhook signatures using HMAC or provider-specific signature verification to prevent spoofing attacks',
              integrationType: integrationType ?? 'custom',
            });
          }
        }
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkIdempotency(): Promise<WebhookSecurityFinding[]> {
    const findings: WebhookSecurityFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Detect webhook or integration handlers
          const isIntegrationHandler = 
            line.toLowerCase().includes('webhook') ||
            line.toLowerCase().includes('stripe') ||
            line.toLowerCase().includes('payment') ||
            line.toLowerCase().includes('callback');

          if (isIntegrationHandler) {
            const integrationType = this.detectIntegrationType(content);
            const hasIdempotency = 
              content.includes('idempotency') || 
              content.includes('idempotent') ||
              content.includes('idempotency_key') ||
              content.includes('Idempotency-Key');

            if (!hasIdempotency) {
              findings.push({
                id: `missing-idempotency-${Date.now()}-${Math.random()}`,
                type: 'missing-idempotency',
                severity: 'high',
                filePath,
                line: index + 1,
                description: `Integration handler without idempotency (${integrationType || 'custom'})`,
                suggestion: 'Implement idempotency using idempotency keys to prevent duplicate processing from retries',
                integrationType: integrationType ?? 'custom',
              });
            }
          }
        });
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkTimeoutConfigurations(): Promise<WebhookSecurityFinding[]> {
    const findings: WebhookSecurityFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for timeout configurations
          const timeoutPatterns = [
            /timeout:\s*\d+/,
            /timeout\s*=\s*\d+/,
            /setTimeout/,
            /fetch\s*\([^,]+,\s*\{/,
            /axios\.get\s*\([^,]+,\s*\{/,
          ];

          timeoutPatterns.forEach((pattern) => {
            if (pattern.test(line)) {
              const timeoutMatch = line.match(/\d+/);
              if (timeoutMatch) {
                const timeoutValue = parseInt(timeoutMatch[0]);
                
                // Check for excessively long timeouts (> 5 minutes)
                if (timeoutValue > 300000) {
                  findings.push({
                    id: `insecure-timeout-${Date.now()}-${Math.random()}`,
                    type: 'insecure-timeout',
                    severity: 'medium',
                    filePath,
                    line: index + 1,
                    description: `Excessively long timeout configured: ${timeoutValue}ms (${(timeoutValue / 1000).toFixed(1)}s)`,
                    suggestion: 'Use shorter timeouts (30-60s) with proper retry logic instead of very long timeouts',
                  });
                }

                // Check for very short timeouts (< 1 second) that may cause failures
                if (timeoutValue < 1000 && line.includes('fetch')) {
                  findings.push({
                    id: `insecure-timeout-${Date.now()}-${Math.random()}`,
                    type: 'insecure-timeout',
                    severity: 'low',
                    filePath,
                    line: index + 1,
                    description: `Very short timeout may cause failures: ${timeoutValue}ms`,
                    suggestion: 'Increase timeout to at least 5-10 seconds for external API calls',
                  });
                }
              }
            }
          });
        });
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkExposedWebhookSecrets(): Promise<WebhookSecurityFinding[]> {
    const findings: WebhookSecurityFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // Check if file is client-side
        const isClientSide = filePath.includes('/app/') || filePath.includes('/pages/') || filePath.includes('/components/');

        lines.forEach((line, index) => {
          // Check for webhook secrets
          const webhookSecretPatterns = [
            /webhook[_-]?secret\s*=\s*['"`][^'"`]{8,}['"`]/,
            /stripe[_-]?webhook[_-]?secret\s*=\s*['"`][^'"`]{8,}['"`]/,
            /webhook_secret\s*=\s*['"`][^'"`]{8,}['"`]/,
            /whsec_[a-zA-Z0-9]{32,}/,
            /whsec_/,
          ];

          webhookSecretPatterns.forEach((pattern) => {
            if (pattern.test(line)) {
              findings.push({
                id: `exposed-webhook-secret-${Date.now()}-${Math.random()}`,
                type: 'exposed-webhook-secret',
                severity: isClientSide ? 'critical' : 'high',
                filePath,
                line: index + 1,
                description: `Webhook secret exposed in ${isClientSide ? 'client-side code' : 'source code'}`,
                suggestion: isClientSide
                  ? 'Move webhook secret to server-side. Never expose webhook secrets in client code.'
                  : 'Use environment variables or secret management. Never commit webhook secrets to source code.',
              });
            }
          });
        });
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkRetryLogic(): Promise<WebhookSecurityFinding[]> {
    const findings: WebhookSecurityFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Detect webhook or integration handlers
        const hasWebhook = content.toLowerCase().includes('webhook');
        const hasIntegration = 
          content.toLowerCase().includes('stripe') ||
          content.toLowerCase().includes('payment') ||
          content.toLowerCase().includes('api');

        if (hasWebhook || hasIntegration) {
          const hasRetryLogic = 
            content.includes('retry') ||
            content.includes('exponential') ||
            content.includes('backoff') ||
            content.includes('retries:');

          if (!hasRetryLogic) {
            findings.push({
              id: `missing-retry-${Date.now()}-${Math.random()}`,
              type: 'missing-retry-logic',
              severity: 'medium',
              filePath,
              description: 'Integration handler without retry logic detected',
              suggestion: 'Implement retry logic with exponential backoff for handling transient failures',
            });
          }
        }
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private detectIntegrationType(content: string): 'stripe' | 'github' | 'slack' | 'custom' | null {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('stripe') || lowerContent.includes('payment_intent')) return 'stripe';
    if (lowerContent.includes('github') || lowerContent.includes('repository')) return 'github';
    if (lowerContent.includes('slack') || lowerContent.includes('webhook.slack.com')) return 'slack';

    return 'custom';
  }

  private findSourceFiles(): string[] {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const sourceFiles: string[] = [];

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
            sourceFiles.push(fullPath);
          }
        }
      } catch (error: unknown) {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return sourceFiles;
  }

  private calculateMetrics(findings: WebhookSecurityFinding[]): WebhookSecurityMetrics {
    return {
      totalFiles: findings.length > 0 ? new Set(findings.map((f) => f.filePath)).size : 0,
      missingSignatureVerification: findings.filter((f) => f.type === 'missing-signature-verification').length,
      missingIdempotency: findings.filter((f) => f.type === 'missing-idempotency').length,
      insecureTimeouts: findings.filter((f) => f.type === 'insecure-timeout').length,
      exposedWebhookSecrets: findings.filter((f) => f.type === 'exposed-webhook-secret').length,
      missingRetryLogic: findings.filter((f) => f.type === 'missing-retry-logic').length,
    };
  }
}













