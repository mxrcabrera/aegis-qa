/**
 * Phase 3: Security - Vulnerability & Secret Detection
 *
 * Purpose: Identify vulnerabilities and data leaks, using BusinessProfile as a risk multiplier.
 * This is about precision - don't warn about console.log in tests, but scream if a secret
 * is found in the business core.
 *
 * Architecture:
 * - Secret Detection: Scan for API keys, tokens, credentials using regex and entropy
 * - Code Vulnerabilities: Injections (eval, innerHTML, SQL), Sensitive Data Leaks
 * - Security Multiplier: Context-aware severity escalation based on BusinessProfile
 * - Critical Module Detection: Escalate severity for findings in core business paths
 * - Domain-Based Escalation: Fintech/Health domains get automatic severity boost
 *
 * @module phases/phase-3-security
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
import { ReportAggregator } from '../core/reporter.js';

/**
 * Security finding
 */
interface SecurityFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'secret' | 'injection' | 'sensitive-data' | 'weak-security';
  /** Severity: low, medium, high, critical */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Description of the issue */
  description: string;
  /** Suggested fix */
  suggestion?: string;
  /** Whether this is in a critical module (from Phase 2) */
  inCriticalModule?: boolean;
  /** Original severity before multiplier */
  originalSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Phase 3 configuration
 */
interface Phase3Config {
  /** Project root directory */
  projectRoot: string;
  /** State persistence for storing results */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
  /** File filter for filtering files */
  fileFilter?: FileFilter;
  /** Ignore handler for filtering */
  ignoreHandler?: IgnoreHandler;
  /** Report aggregator for reporting violations */
  reportAggregator?: ReportAggregator;
}

/**
 * Phase 3 result
 */
export interface Phase3Result {
  /** Overall success */
  success: boolean;
  /** Security findings */
  findings: SecurityFinding[];
  /** Total critical findings */
  criticalFindings: number;
  /** Total high severity findings */
  highSeverityFindings: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 3: Security - Vulnerability & Secret Detection
 *
 * This phase identifies vulnerabilities and data leaks, using BusinessProfile
 * as a risk multiplier for context-aware severity escalation.
 *
 * @class Phase3Security
 * @example
 * ```typescript
 * const phase3 = new Phase3Security({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase3.execute();
 * ```
 */
export class Phase3Security {
  private config: Phase3Config;

  constructor(config: Phase3Config) {
    this.config = config;
  }

  /**
   * Executes Phase 3: Security
   *
   * @returns Promise<Phase3Result> - Security analysis result
   */
  async execute(): Promise<Phase3Result> {
    const startTime = Date.now();
    console.log('­ƒöÆ Phase 3: Security - Vulnerability & Secret Detection\n');

    try {
      // Get BusinessProfile from Phase 2 for context
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const criticalModules = businessProfile?.criticalModules || [];
      const domain = businessProfile?.domain || 'General';

      console.log(`­ƒÄ» Context: Domain = ${domain}, Critical Modules = ${criticalModules.length}\n`);

      // Scan for files to analyze
      const files = await this.scanFiles();

      if (files.length === 0) {
        console.log('ÔÜá´©Å  No files found for security analysis\n');
        
        const result: Phase3Result = {
          success: true,
          findings: [],
          criticalFindings: 0,
          highSeverityFindings: 0,
          executionTimeMs: Date.now() - startTime,
        };

        // Save results
        await this.config.statePersistence.storeAnalysisResults(3, result, this.config.currentState);
        await this.writePartialReport(result, domain, criticalModules.length);
        await this.config.statePersistence.saveState(this.config.currentState);

        return result;
      }

      console.log(`­ƒôé Analyzing ${files.length} files for security vulnerabilities...\n`);

      const findings: SecurityFinding[] = [];

      // Core security analysis
      for (const file of files) {
        const fileFindings = await this.analyzeFile(file, criticalModules, domain);
        findings.push(...fileFindings);
      }

      // Apply security multiplier
      const escalatedFindings = this.applySecurityMultiplier(findings, domain);

      // Run security sub-phases with unique auditorName
      await this.runSubPhase3B_AI_API_Security(); // security:ai-api
      await this.runSubPhase3C_SecureDevMethodology(); // security:secure-dev
      await this.runSubPhase3E_BaaSPlatformSecurity(); // security:rls
      await this.runSubPhase3F_WebhookSecurity(); // security:webhook
      await this.runSubPhase3G_DataPrivacyPII(); // security:privacy

      const criticalFindings = escalatedFindings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = escalatedFindings.filter(f => f.severity === 'high').length;

      const result: Phase3Result = {
        success: true,
        findings: escalatedFindings,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs: Date.now() - startTime,
      };

      // Severity Lockdown: Set highRiskBlocker flag if CRITICAL findings exist
      if (criticalFindings > 0) {
        this.config.currentState.highRiskBlocker = true;
        console.log(`­ƒÜ¿ High Risk Blocker: CRITICAL security findings detected. Commit blocking enabled.`);
      }

      // Cross-Phase Alerting: Inject security summary into ContextStore
      const securitySummary = {
        criticalFindings,
        highSeverityFindings,
        sqlInjectionFindings: escalatedFindings.filter(f => f.type === 'injection' && f.description.toLowerCase().includes('sql')).length,
        secretFindings: escalatedFindings.filter(f => f.type === 'secret').length,
      };

      if (!this.config.currentState.contextStore) {
        this.config.currentState.contextStore = {};
      }
      this.config.currentState.contextStore.securitySummary = securitySummary;

      console.log(`­ƒôè Security Summary injected into ContextStore for cross-phase alerting`);

      // Save results
      await this.config.statePersistence.storeAnalysisResults(3, result, this.config.currentState);
      
      // Write partial report
      await this.writePartialReport(result, domain, criticalModules.length);
      
      // Atomic state sync
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`Ô£à Phase 3 Complete`);
      console.log(`  ­ƒöì Total findings: ${escalatedFindings.length}`);
      console.log(`  ­ƒÜ¿ Critical findings: ${criticalFindings}`);
      console.log(`  ÔÜá´©Å  High severity findings: ${highSeverityFindings}\n`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ÔØî Phase 3 failed: ${errorMessage}\n`);

      const result: Phase3Result = {
        success: false,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Scans for files to analyze
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async scanFiles(): Promise<string[]> {
    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });

    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx',
      'app/**/*.ts',
      'app/**/*.tsx',
      'lib/**/*.ts',
      'lib/**/*.js',
      'services/**/*.ts',
      'services/**/*.js',
      'api/**/*.ts',
      'api/**/*.js',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const { glob } = await import('glob');
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      for (const file of files) {
        // Skip ignored files
        if (ignoreHandler.shouldIgnore(file)) {
          continue;
        }

        // Check file filter
        const filterResult = fileFilter.shouldAnalyzeFile(file);
        if (filterResult.shouldAnalyze) {
          allFiles.push(file);
        }
      }
    }

    // Remove duplicates
    return Array.from(new Set(allFiles));
  }

  /**
   * Analyzes a single file for security vulnerabilities
   *
   * @private
   * @param filePath - File path
   * @param criticalModules - Critical modules from Phase 2
   * @param domain - Business domain
   * @returns Promise<SecurityFinding[]> - Security findings
   */
  private async analyzeFile(filePath: string, criticalModules: string[], domain: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileHash = this.computeHash(content);

      // Check if file is in critical module
      const inCriticalModule = criticalModules.includes(filePath);

      // Skip test files for console.log warnings (precision)
      const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('/test/') || filePath.includes('/tests/');

      // 1. Secret Detection
      const secretFindings = this.detectSecrets(filePath, content, fileHash, inCriticalModule);
      findings.push(...secretFindings);

      // 2. Injection Detection
      const injectionFindings = this.detectInjections(filePath, content, fileHash, inCriticalModule);
      findings.push(...injectionFindings);

      // 3. Sensitive Data Leak Detection (skip for test files)
      if (!isTestFile) {
        const leakFindings = this.detectSensitiveDataLeaks(filePath, content, fileHash, inCriticalModule, domain);
        findings.push(...leakFindings);
      }

      return findings;
    } catch (error) {
      console.warn(`ÔÜá´©Å  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Computes SHA-1 hash of file content
   *
   * @private
   * @param content - File content
   * @returns string - SHA-1 hash
   */
  private computeHash(content: string): string {
    return crypto.createHash('sha1').update(content).digest('hex');
  }

  /**
   * Generates unique ID for a finding
   *
   * @private
   * @param fileHash - SHA-1 hash of file content
   * @param line - Line number
   * @param type - Finding type
   * @returns string - Unique ID
   */
  private generateFindingId(fileHash: string, line: number | undefined, type: string): string {
    const lineStr = line !== undefined ? line.toString() : '0';
    return `${fileHash.substring(0, 8)}-${lineStr}-${type}`;
  }

  /**
   * Sanitizes a secret by masking it
   *
   * @private
   * @param secret - Secret to sanitize
   * @returns string - Sanitized secret
   */
  private sanitizeSecret(secret: string): string {
    if (secret.length <= 8) {
      return '****';
    }
    const start = secret.substring(0, 8);
    const end = secret.substring(secret.length - 4);
    return `${start}****${end}`;
  }

  /**
   * Detects secrets (API keys, tokens, credentials)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param lines - File lines
   * @param fileHash - File hash
   * @param inCriticalModule - Whether file is in critical module
   * @param domain - Business domain
   * @returns SecurityFinding[] - Secret findings
   */
  private detectSecrets(
    filePath: string,
    content: string,
    fileHash: string,
    inCriticalModule: boolean
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Secret patterns (regex)
    const secretPatterns = [
      // AWS keys
      {
        pattern: /AKIA[0-9A-Z]{16}/g,
        name: 'AWS Access Key',
        severity: 'critical' as const,
      },
      // Stripe keys
      {
        pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
        name: 'Stripe Live Secret Key',
        severity: 'critical' as const,
      },
      {
        pattern: /sk_test_[0-9a-zA-Z]{24,}/g,
        name: 'Stripe Test Secret Key',
        severity: 'high' as const,
      },
      // Firebase
      {
        pattern: /AIza[0-9A-Za-z_-]{35}/g,
        name: 'Firebase API Key',
        severity: 'high' as const,
      },
      // GitHub tokens
      {
        pattern: /ghp_[a-zA-Z0-9]{36}/g,
        name: 'GitHub Personal Access Token',
        severity: 'critical' as const,
      },
      // Generic API keys (high entropy)
      {
        pattern: /[a-zA-Z0-9]{32,}/g,
        name: 'Potential API Key',
        severity: 'medium' as const,
        entropyCheck: true,
      },
    ];

    for (const { pattern, name, severity, entropyCheck } of secretPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const secret = match[0];
        
        // Skip if entropy check is enabled and entropy is low
        if (entropyCheck && this.calculateEntropy(secret) < 3.5) {
          continue;
        }

        const lineNumber = content.slice(0, match.index).split('\n').length;

        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'secret'),
          type: 'secret',
          severity,
          filePath,
          line: lineNumber,
          description: `${name} detected: ${this.sanitizeSecret(secret)}`,
          suggestion: 'Remove secrets from code and use environment variables or secret management.',
          inCriticalModule,
          originalSeverity: severity,
        });
      }
    }

    return findings;
  }

  /**
   * Calculates Shannon entropy of a string
   *
   * @private
   * @param str - String to analyze
   * @returns number - Entropy value
   */
  private calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies: Record<string, number> = {};

    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
      const p = frequencies[char] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Detects injection vulnerabilities
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param lines - File lines
   * @param fileHash - File hash
   * @param inCriticalModule - Whether file is in critical module
   * @param domain - Business domain
   * @returns SecurityFinding[] - Injection findings
   */
  private detectInjections(
    filePath: string,
    content: string,
    fileHash: string,
    inCriticalModule: boolean
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // eval() usage
    const evalPattern = /\beval\s*\(/g;
    let match: RegExpExecArray | null;
    while ((match = evalPattern.exec(content)) !== null) {
      const lineNumber = content.slice(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'injection-eval'),
        type: 'injection',
        severity: 'high',
        filePath,
        line: lineNumber,
        description: 'Use of eval() detected - potential code injection vulnerability',
        suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() or template literals.',
        inCriticalModule,
        originalSeverity: 'high',
      });
    }

    // innerHTML usage
    const innerHTMLPattern = /\.innerHTML\s*=/g;
    while ((match = innerHTMLPattern.exec(content)) !== null) {
      const lineNumber = content.slice(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'injection-innerhtml'),
        type: 'injection',
        severity: 'medium',
        filePath,
        line: lineNumber,
        description: 'Use of innerHTML detected - potential XSS vulnerability',
        suggestion: 'Use textContent or sanitize input before using innerHTML.',
        inCriticalModule,
        originalSeverity: 'medium',
      });
    }

    // Manual SQL query construction
    const sqlPatterns = [
      /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
      /INSERT\s+INTO\s+.*\s+VALUES\s*\(/gi,
      /UPDATE\s+.*\s+SET\s+.*\s+WHERE\s+.*\+/gi,
    ];

    for (const pattern of sqlPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.slice(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'injection-sql'),
          type: 'injection',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Manual SQL query construction detected - potential SQL injection',
          suggestion: 'Use parameterized queries or ORM to prevent SQL injection.',
          inCriticalModule,
          originalSeverity: 'high',
        });
      }
    }

    return findings;
  }

  /**
   * Detects sensitive data leaks (PII in console.log)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param lines - File lines
   * @param fileHash - File hash
   * @param inCriticalModule - Whether file is in critical module
   * @param domain - Business domain
   * @returns SecurityFinding[] - Sensitive data leak findings
   */
  private detectSensitiveDataLeaks(
    filePath: string,
    content: string,
    fileHash: string,
    inCriticalModule: boolean,
    domain: string
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // console.log with potential PII
    const consoleLogPattern = /console\.(log|warn|error|info|debug)\s*\(([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = consoleLogPattern.exec(content)) !== null) {
      const args = match[2];
      const lineNumber = content.slice(0, match.index).split('\n').length;

      // Check for potential PII patterns
      const piiPatterns = [
        { pattern: /password/i, name: 'password' },
        { pattern: /email/i, name: 'email' },
        { pattern: /token/i, name: 'token' },
        { pattern: /secret/i, name: 'secret' },
        { pattern: /credit.*card/i, name: 'credit card' },
        { pattern: /ssn/i, name: 'SSN' },
        { pattern: /api[_-]?key/i, name: 'API key' },
      ];

      for (const { pattern, name } of piiPatterns) {
        if (pattern.test(args)) {
          findings.push({
            id: this.generateFindingId(fileHash, lineNumber, 'sensitive-data'),
            type: 'sensitive-data',
            severity: domain === 'Fintech' || domain === 'Health' ? 'high' : 'medium',
            filePath,
            line: lineNumber,
            description: `Potential ${name} leak in console.log`,
            suggestion: 'Remove console.log statements with sensitive data before production deployment.',
            inCriticalModule,
            originalSeverity: domain === 'Fintech' || domain === 'Health' ? 'high' : 'medium',
          });
          break; // Only report once per console.log
        }
      }
    }

    return findings;
  }

  /**
   * Applies security multiplier based on BusinessProfile
   *
   * @private
   * @param findings - Original findings
   * @param criticalModules - Critical modules from Phase 2
   * @param domain - Business domain
   * @returns SecurityFinding[] - Escalated findings
   */
  private applySecurityMultiplier(
    findings: SecurityFinding[],
    domain: string
  ): SecurityFinding[] {
    const escalatedFindings: SecurityFinding[] = [];

    for (const finding of findings) {
      let severity = finding.severity;
      const escalationReasons: string[] = [];

      // Escalate if in critical module
      if (finding.inCriticalModule && severity !== 'critical') {
        severity = 'critical';
        escalationReasons.push('Critical Module');
      }

      // Escalate if domain is Fintech or Health
      if ((domain === 'Fintech' || domain === 'Health') && severity !== 'critical') {
        const severityOrder = ['low', 'medium', 'high', 'critical'];
        const currentIndex = severityOrder.indexOf(severity);
        if (currentIndex < severityOrder.length - 1) {
          severity = severityOrder[currentIndex + 1] as any;
          escalationReasons.push(`Domain: ${domain}`);
        }
      }

      escalatedFindings.push({
        ...finding,
        severity,
        description: escalationReasons.length > 0
          ? `${finding.description} [ESCALATED: ${escalationReasons.join(', ')}]`
          : finding.description,
      });
    }

    return escalatedFindings;
  }

  /**
   * Sub-phase 3B: AI API Security
   * Analyzes AI API integrations for security vulnerabilities
   *
   * @private
   */
  private async runSubPhase3B_AI_API_Security(): Promise<void> {
    const auditorName = 'security:ai-api';
    
    // Skip if no AI API usage detected
    const hasAIUsage = await this.detectAIUsage();
    if (!hasAIUsage) {
      return; // Silent skip
    }

    console.log('  ­ƒö³ Sub-phase 3B: AI API Security...');

    try {
      const sourceFiles = await this.scanFiles();
      const findings: SecurityFinding[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const fileHash = this.computeHash(content);

        // Check for prompt injection vulnerabilities
        const promptInjectionPatterns = /prompt\s*[:=]\s*.*\$\{.*\}/gi;
        let match: RegExpExecArray | null;
        while ((match = promptInjectionPatterns.exec(content)) !== null) {
          const lineNumber = content.slice(0, match.index).split('\n').length;
          findings.push({
            id: this.generateFindingId(fileHash, lineNumber, 'ai-prompt-injection'),
            type: 'injection',
            severity: 'high',
            filePath: file,
            line: lineNumber,
            description: 'Potential prompt injection vulnerability detected',
            suggestion: 'Use proper prompt sanitization and validation to prevent prompt injection attacks',
          });
        }

        // Check for exposed AI API keys
        const aiKeyPatterns = [
          /sk-ant-[a-zA-Z0-9_-]{95}/g, // Anthropic
          /sk-[a-zA-Z0-9]{48}/g, // OpenAI
        ];

        for (const pattern of aiKeyPatterns) {
          while ((match = pattern.exec(content)) !== null) {
            const lineNumber = content.slice(0, match.index).split('\n').length;
            findings.push({
              id: this.generateFindingId(fileHash, lineNumber, 'ai-key-exposure'),
              type: 'secret',
              severity: 'critical',
              filePath: file,
              line: lineNumber,
              description: `AI API key detected: ${this.sanitizeSecret(match[0])}`,
              suggestion: 'Remove API keys from code and use environment variables or secret management',
            });
          }
        }
      }

      // Report findings to ReportAggregator
      if (this.config.reportAggregator && findings.length > 0) {
        for (const finding of findings) {
          this.config.reportAggregator.addViolation(auditorName, {
            id: finding.id,
            type: 'security',
            severity: finding.severity,
            file: {
              path: finding.filePath,
              extension: path.extname(finding.filePath).slice(1),
              lineCount: 0,
              inCriticalPath: false,
            },
            location: { line: finding.line || 1, column: 0 },
            message: finding.description,
            rule: auditorName,
            autoFixable: false,
            confidence: 0.8,
          });
        }
      }

      console.log(`    Found ${findings.length} AI API security issues`);
    } catch (error) {
      console.warn(`    AI API security check failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Sub-phase 3C: Secure Development Methodology
   * Checks for secure development practices
   *
   * @private
   */
  private async runSubPhase3C_SecureDevMethodology(): Promise<void> {
    const auditorName = 'security:secure-dev';

    console.log('  ­ƒö³ Sub-phase 3C: Secure Development Methodology...');

    try {
      const sourceFiles = await this.scanFiles();
      const findings: SecurityFinding[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const fileHash = this.computeHash(content);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for hardcoded credentials
          const credentialPatterns = [
            /password\s*[:=]\s*["'][^"']{6,}["']/gi,
            /api[_-]?key\s*[:=]\s*["'][^"']{20,}["']/gi,
          ];

          for (const pattern of credentialPatterns) {
            if (pattern.test(line)) {
              findings.push({
                id: this.generateFindingId(fileHash, index + 1, 'hardcoded-credential'),
                type: 'secret',
                severity: 'high',
                filePath: file,
                line: index + 1,
                description: 'Hardcoded credential detected',
                suggestion: 'Use environment variables or secret management for credentials',
              });
            }
          }

          // Check for debug statements in production code
          if (line.includes('debugger') && !file.includes('.test.') && !file.includes('.spec.')) {
            findings.push({
              id: this.generateFindingId(fileHash, index + 1, 'debugger-statement'),
              type: 'weak-security',
              severity: 'low',
              filePath: file,
              line: index + 1,
              description: 'Debugger statement found in production code',
              suggestion: 'Remove debugger statements before production deployment',
            });
          }
        });
      }

      // Report findings to ReportAggregator
      if (this.config.reportAggregator && findings.length > 0) {
        for (const finding of findings) {
          this.config.reportAggregator.addViolation(auditorName, {
            id: finding.id,
            type: 'security',
            severity: finding.severity,
            file: {
              path: finding.filePath,
              extension: path.extname(finding.filePath).slice(1),
              lineCount: 0,
              inCriticalPath: false,
            },
            location: { line: finding.line || 1, column: 0 },
            message: finding.description,
            rule: auditorName,
            autoFixable: false,
            confidence: 0.7,
          });
        }
      }

      console.log(`    Found ${findings.length} secure development issues`);
    } catch (error) {
      console.warn(`    Secure development methodology check failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Sub-phase 3E: BaaS/RLS Platform Security
   * Validates Row Level Security policies for Supabase
   *
   * @private
   */
  private async runSubPhase3E_BaaSPlatformSecurity(): Promise<void> {
    const auditorName = 'security:rls';

    // Skip if no Supabase project detected
    const hasSupabase = await this.detectSupabaseProject();
    if (!hasSupabase) {
      return; // Silent skip
    }

    console.log('  ­ƒö³ Sub-phase 3E: BaaS/RLS Platform Security...');

    try {
      const findings: SecurityFinding[] = [];
      const sqlFiles = await this.findSQLFiles();

      for (const filePath of sqlFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const fileHash = this.computeHash(content);
          const tables = this.extractTables(content);

          tables.forEach((tableName) => {
            const hasRLS = content.includes(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`);
            const hasPolicies = content.includes(`CREATE POLICY`) && content.includes(`ON ${tableName}`);

            if (!hasRLS) {
              findings.push({
                id: this.generateFindingId(fileHash, undefined, 'missing-rls'),
                type: 'weak-security',
                severity: 'critical',
                filePath,
                description: `Table '${tableName}' does not have Row Level Security enabled`,
                suggestion: 'Enable RLS on this table and create appropriate policies to restrict access based on user identity',
              });
            } else if (!hasPolicies) {
              findings.push({
                id: this.generateFindingId(fileHash, undefined, 'rls-no-policies'),
                type: 'weak-security',
                severity: 'high',
                filePath,
                description: `Table '${tableName}' has RLS enabled but no policies defined`,
                suggestion: 'Create RLS policies to define access rules. Without policies, all access is denied by default',
              });
            }
          });
        } catch {
          console.warn(`    Failed to analyze ${filePath}`);
        }
      }

      // Report findings to ReportAggregator
      if (this.config.reportAggregator && findings.length > 0) {
        for (const finding of findings) {
          this.config.reportAggregator.addViolation(auditorName, {
            id: finding.id,
            type: 'security',
            severity: finding.severity,
            file: {
              path: finding.filePath,
              extension: path.extname(finding.filePath).slice(1),
              lineCount: 0,
              inCriticalPath: false,
            },
            location: { line: 1, column: 0 },
            message: finding.description,
            rule: auditorName,
            autoFixable: false,
            confidence: 0.9,
          });
        }
      }

      console.log(`    Found ${findings.length} RLS security issues`);
    } catch (error) {
      console.warn(`    BaaS/RLS security check failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Sub-phase 3F: Webhook Security
   * Analyzes webhook implementations for security vulnerabilities
   *
   * @private
   */
  private async runSubPhase3F_WebhookSecurity(): Promise<void> {
    const auditorName = 'security:webhook';

    // Skip if no webhooks detected
    const hasWebhooks = await this.detectWebhooks();
    if (!hasWebhooks) {
      return; // Silent skip
    }

    console.log('  ­ƒö³ Sub-phase 3F: Webhook Security...');

    try {
      const sourceFiles = await this.scanFiles();
      const findings: SecurityFinding[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const fileHash = this.computeHash(content);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for missing webhook signature verification
          if (line.includes('webhook') && !line.includes('verify') && !line.includes('signature')) {
            findings.push({
              id: this.generateFindingId(fileHash, index + 1, 'webhook-no-verification'),
              type: 'weak-security',
              severity: 'high',
              filePath: file,
              line: index + 1,
              description: 'Webhook endpoint without signature verification',
              suggestion: 'Implement webhook signature verification to prevent unauthorized requests',
            });
          }

          // Check for plain HTTP webhooks
          if (line.includes('webhook') && line.includes('http://')) {
            findings.push({
              id: this.generateFindingId(fileHash, index + 1, 'webhook-insecure-http'),
              type: 'weak-security',
              severity: 'critical',
              filePath: file,
              line: index + 1,
              description: 'Webhook endpoint using insecure HTTP protocol',
              suggestion: 'Use HTTPS for all webhook endpoints to ensure data encryption in transit',
            });
          }
        });
      }

      // Report findings to ReportAggregator
      if (this.config.reportAggregator && findings.length > 0) {
        for (const finding of findings) {
          this.config.reportAggregator.addViolation(auditorName, {
            id: finding.id,
            type: 'security',
            severity: finding.severity,
            file: {
              path: finding.filePath,
              extension: path.extname(finding.filePath).slice(1),
              lineCount: 0,
              inCriticalPath: false,
            },
            location: { line: finding.line || 1, column: 0 },
            message: finding.description,
            rule: auditorName,
            autoFixable: false,
            confidence: 0.8,
          });
        }
      }

      console.log(`    Found ${findings.length} webhook security issues`);
    } catch (error) {
      console.warn(`    Webhook security check failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Sub-phase 3G: Data Privacy PII
   * Analyzes PII handling for privacy compliance
   *
   * @private
   */
  private async runSubPhase3G_DataPrivacyPII(): Promise<void> {
    const auditorName = 'security:privacy';

    console.log('  ­ƒö³ Sub-phase 3G: Data Privacy PII...');

    try {
      const sourceFiles = await this.scanFiles();
      const findings: SecurityFinding[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const fileHash = this.computeHash(content);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for PII in logs
          const piiPatterns = [
            { pattern: /console\.log.*email/gi, name: 'email' },
            { pattern: /console\.log.*ssn/gi, name: 'SSN' },
            { pattern: /console\.log.*credit.*card/gi, name: 'credit card' },
            { pattern: /console\.log.*password/gi, name: 'password' },
          ];

          for (const { pattern, name } of piiPatterns) {
            if (pattern.test(line)) {
              findings.push({
                id: this.generateFindingId(fileHash, index + 1, 'pii-in-logs'),
                type: 'sensitive-data',
                severity: 'high',
                filePath: file,
                line: index + 1,
                description: `Potential ${name} leak in console.log`,
                suggestion: 'Remove PII from logs and use proper logging with sanitization',
              });
            }
          }

          // Check for unencrypted PII storage
          if (line.includes('password') && (line.includes('plaintext') || line.includes('plain'))) {
            findings.push({
              id: this.generateFindingId(fileHash, index + 1, 'unencrypted-pii'),
              type: 'weak-security',
              severity: 'critical',
              filePath: file,
              line: index + 1,
              description: 'Password stored in plaintext',
              suggestion: 'Use proper password hashing (bcrypt, argon2) for password storage',
            });
          }
        });
      }

      // Report findings to ReportAggregator
      if (this.config.reportAggregator && findings.length > 0) {
        for (const finding of findings) {
          this.config.reportAggregator.addViolation(auditorName, {
            id: finding.id,
            type: 'security',
            severity: finding.severity,
            file: {
              path: finding.filePath,
              extension: path.extname(finding.filePath).slice(1),
              lineCount: 0,
              inCriticalPath: false,
            },
            location: { line: finding.line || 1, column: 0 },
            message: finding.description,
            rule: auditorName,
            autoFixable: false,
            confidence: 0.8,
          });
        }
      }

      console.log(`    Found ${findings.length} PII privacy issues`);
    } catch (error) {
      console.warn(`    Data privacy PII check failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Detects if the project uses AI APIs
   *
   * @private
   * @returns Promise<boolean> - True if AI API usage detected
   */
  private async detectAIUsage(): Promise<boolean> {
    try {
      const sourceFiles = await this.scanFiles();
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (/openai|anthropic|cohere|huggingface|ollama/i.test(content)) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Detects if the project uses Supabase
   *
   * @private
   * @returns Promise<boolean> - True if Supabase project detected
   */
  private async detectSupabaseProject(): Promise<boolean> {
    try {
      const supabasePath = path.join(this.config.projectRoot, 'supabase');
      return fs.existsSync(supabasePath);
    } catch {
      return false;
    }
  }

  /**
   * Detects if the project uses webhooks
   *
   * @private
   * @returns Promise<boolean> - True if webhooks detected
   */
  private async detectWebhooks(): Promise<boolean> {
    try {
      const sourceFiles = await this.scanFiles();
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (/webhook/i.test(content)) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Finds SQL files in the project
   *
   * @private
   * @returns Promise<string[]> - Array of SQL file paths
   */
  private async findSQLFiles(): Promise<string[]> {
    const { glob } = await import('glob');
    const files = await glob('**/*.sql', {
      cwd: this.config.projectRoot,
      absolute: true,
    });
    return files;
  }

  /**
   * Extracts table names from SQL content
   *
   * @private
   * @param content - SQL content
   * @returns string[] - Array of table names
   */
  private extractTables(content: string): string[] {
    const tables: string[] = [];
    const createTableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let match;

    while ((match = createTableRegex.exec(content)) !== null) {
      tables.push(match[1]);
    }

    return tables;
  }

  /**
   * Writes partial report for Phase 3
   *
   * @private
   * @param result - Phase 3 result
   * @param domain - Business domain
   * @param criticalModulesCount - Number of critical modules
   */
  private async writePartialReport(result: Phase3Result, domain: string, criticalModulesCount: number): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, SecurityFinding[]>();
      for (const finding of result.findings) {
        if (!findingsByType.has(finding.type)) {
          findingsByType.set(finding.type, []);
        }
        findingsByType.get(finding.type)!.push(finding);
      }

      let findingsContent = '';
      for (const [type, findings] of findingsByType) {
        findingsContent += `
### ${type.charAt(0).toUpperCase() + type.slice(1)} (${findings.length})
`;
        for (const finding of findings) {
          findingsContent += `- [${finding.id}] **${finding.severity.toUpperCase()}** ${finding.filePath}`;
          if (finding.line) {
            findingsContent += `:${finding.line}`;
          }
          findingsContent += `\n  - ${finding.description}\n`;
        }
      }

      const reportContent = `
## Phase 3: Security - Ô£à PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms
- **Context Domain:** ${domain}
- **Critical Modules:** ${criticalModulesCount}

### Security Summary
- **Total Findings:** ${result.findings.length}
- **Critical Findings:** ${result.criticalFindings}
- **High Severity Findings:** ${result.highSeverityFindings}

### Findings by Type
${findingsContent || 'No security vulnerabilities detected.'}

---

`;

      // Append to partial report
      if (fs.existsSync(reportPath)) {
        fs.appendFileSync(reportPath, reportContent, 'utf-8');
      } else {
        // Create new partial report with header
        const header = `# Aegis QA - Partial Report
Generated: ${timestamp}

`;
        fs.writeFileSync(reportPath, header + reportContent, 'utf-8');
      }

      console.log(`­ƒôØ Partial report written: ${reportPath}`);
    } catch (error) {
      console.warn('ÔÜá´©Å  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}
