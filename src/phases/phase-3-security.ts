/**
 * Phase 3: Security - Security Vulnerability and Best Practices Analysis
 *
 * Purpose: Analyze code for security vulnerabilities, authentication issues,
 * authorization problems, and adherence to security best practices.
 *
 * Architecture:
 * - Vulnerability Detection: OWASP Top 10 vulnerabilities
 * - Secret Detection: Hardcoded secrets and credentials
 * - Authentication/Authorization: Check auth implementation
 * - Input Validation: SQL injection, XSS, CSRF checks
 *
 * @module phases/phase-3-security
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Security finding
 */
interface SecurityFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'secret-exposed' | 'sql-injection' | 'xss-vulnerable' | 'auth-issue' | 'insecure-dependency' | 'input-validation';
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Description */
  description: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Security metrics
 */
interface SecurityMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Secrets exposed */
  secretsExposed: number;
  /** SQL injection vulnerabilities */
  sqlInjection: number;
  /** XSS vulnerabilities */
  xssVulnerabilities: number;
  /** Authentication issues */
  authIssues: number;
  /** Input validation issues */
  inputValidationIssues: number;
}

/**
 * Phase 3 configuration
 */
interface Phase3Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 3 result
 */
export interface Phase3Result {
  /** Overall success */
  success: boolean;
  /** Security findings */
  findings: SecurityFinding[];
  /** Security metrics */
  metrics: SecurityMetrics;
  /** Critical findings count */
  criticalFindings: number;
  /** High severity findings count */
  highSeverityFindings: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 3: Security - Security Vulnerability and Best Practices Analysis
 *
 * This phase analyzes code for security vulnerabilities, authentication issues,
 * authorization problems, and adherence to security best practices.
 *
 * @class Phase3Security
 * @example
 * ```typescript
 * const security = new Phase3Security(config);
 * const result = await security.execute();
 * console.log(`Secrets exposed: ${result.metrics.secretsExposed}`);
 * console.log(`SQL injection: ${result.metrics.sqlInjection}`);
 * ```
 */
export class Phase3Security {
  private config: Phase3Config;

  constructor(config: Phase3Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 3: Security
   *
   * @returns Promise<Phase3Result> - Security analysis result
   */
  async execute(): Promise<Phase3Result> {
    const startTime = Date.now();
    console.log('INFO Phase 3: Security - Security Vulnerability and Best Practices Analysis\n');

    try {
      // Thermal check before starting
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      // Get source files
      console.log('INFO Finding source files...');
      const sourceFiles = this.getSourceFiles(this.config.projectRoot);
      console.log(`INFO Source files found: ${sourceFiles.length}\n`);

      // Analyze security
      console.log('INFO Analyzing security vulnerabilities...');
      const findings = await this.analyzeSecurity(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Secrets exposed: ${metrics.secretsExposed}`);
      console.log(`INFO SQL injection: ${metrics.sqlInjection}`);
      console.log(`INFO XSS vulnerabilities: ${metrics.xssVulnerabilities}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase3Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 3 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase3Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          secretsExposed: 0,
          sqlInjection: 0,
          xssVulnerabilities: 0,
          authIssues: 0,
          inputValidationIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 3:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets source files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Source file paths
   */
  private getSourceFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.env', '.env.local', '.env.development', '.env.production'];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip node_modules and .aegis directories
            if (item.name !== 'node_modules' && item.name !== '.aegis' && item.name !== '.git') {
              searchDir(fullPath);
            }
          } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes security for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<SecurityFinding[]> - Security findings
   */
  private async analyzeSecurity(sourceFiles: string[]): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    for (const filePath of sourceFiles) {
      try {
        // Validate path
        if (!validatePath(filePath, this.config.projectRoot)) {
          console.warn(`Invalid path: ${filePath}`);
          continue;
        }

        const stats = fs.statSync(filePath);
        
        // Validate file size (max 10MB)
        if (!validateFileSize(stats.size, 10)) {
          console.warn(`File too large: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Censor potential secrets
        const sanitizedContent = censorSecrets(content);
        
        const fileFindings = this.analyzeFileForSecurity(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for security issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns SecurityFinding[] - Findings from file
   */
  private analyzeFileForSecurity(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check for exposed secrets
    findings.push(...this.checkExposedSecrets(filePath, content));

    // Check for SQL injection vulnerabilities
    findings.push(...this.checkSQLInjection(filePath, content));

    // Check for XSS vulnerabilities
    findings.push(...this.checkXSS(filePath, content));

    // Check for authentication issues
    findings.push(...this.checkAuthentication(filePath, content));

    // Check for input validation
    findings.push(...this.checkInputValidation(filePath, content));

    return findings;
  }

  /**
   * Checks for exposed secrets
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns SecurityFinding[] - Secret exposure findings
   */
  private checkExposedSecrets(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Common secret patterns
    const secretPatterns = [
      { pattern: /api[_-]?key\s*=\s*['"]([^'"]+)['"]/gi, name: 'API Key' },
      { pattern: /secret[_-]?key\s*=\s*['"]([^'"]+)['"]/gi, name: 'Secret Key' },
      { pattern: /password\s*=\s*['"]([^'"]+)['"]/gi, name: 'Password' },
      { pattern: /token\s*=\s*['"]([^'"]+)['"]/gi, name: 'Token' },
      { pattern: /aws[_-]?access[_-]?key\s*=\s*['"]([^'"]+)['"]/gi, name: 'AWS Access Key' },
      { pattern: /aws[_-]?secret[_-]?key\s*=\s*['"]([^'"]+)['"]/gi, name: 'AWS Secret Key' },
      { pattern: /database[_-]?url\s*=\s*['"]([^'"]+)['"]/gi, name: 'Database URL' },
      { pattern: /private[_-]?key\s*=\s*['"]([^'"]+)['"]/gi, name: 'Private Key' },
    ];

    for (const { pattern, name } of secretPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'secret-exposed'),
          type: 'secret-exposed',
          severity: 'critical',
          filePath,
          line: lineNumber,
          description: `${name} exposed in code`,
          suggestion: 'Move secret to environment variables or secret management system',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for SQL injection vulnerabilities
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns SecurityFinding[] - SQL injection findings
   */
  private checkSQLInjection(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check for direct SQL query concatenation
    const sqlPatterns = [
      /SELECT\s+\*\s+FROM\s+\w+\s+WHERE\s+[^;]+["']\s*\+\s*/gi,
      /INSERT\s+INTO\s+\w+\s+VALUES\s*\([^)]*\)\s*["']\s*\+\s*/gi,
      /UPDATE\s+\w+\s+SET\s+[^;]+["']\s*\+\s*/gi,
      /DELETE\s+FROM\s+\w+\s+WHERE\s+[^;]+["']\s*\+\s*/gi,
    ];

    for (const pattern of sqlPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'sql-injection'),
          type: 'sql-injection',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Potential SQL injection vulnerability detected',
          suggestion: 'Use parameterized queries or prepared statements',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for XSS vulnerabilities
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns SecurityFinding[] - XSS findings
   */
  private checkXSS(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check for dangerouslySetInnerHTML without sanitization
    const xssPatterns = [
      /dangerouslySetInnerHTML\s*=\s*\{\s*\{[^}]*\}\s*\}/gi,
      /innerHTML\s*=\s*[^;]+/gi,
    ];

    for (const pattern of xssPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'xss-vulnerable'),
          type: 'xss-vulnerable',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Potential XSS vulnerability detected',
          suggestion: 'Use DOMPurify or similar sanitization library',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for authentication issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns SecurityFinding[] - Authentication findings
   */
  private checkAuthentication(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check for hardcoded credentials
    const authPatterns = [
      /username\s*=\s*['"]admin['"]/gi,
      /password\s*=\s*['"]admin['"]/gi,
      /username\s*=\s*['"]root['"]/gi,
      /password\s*=\s*['"]root['"]/gi,
    ];

    for (const pattern of authPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'auth-issue'),
          type: 'auth-issue',
          severity: 'critical',
          filePath,
          line: lineNumber,
          description: 'Hardcoded credentials detected',
          suggestion: 'Use environment variables or secure credential storage',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for input validation
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns SecurityFinding[] - Input validation findings
   */
  private checkInputValidation(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check for request body usage without validation
    const requestPattern = /req\.body\./gi;
    let match;
    while ((match = requestPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Check if validation is present in nearby context
      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(content.length, match.index + 200);
      const context = content.substring(contextStart, contextEnd);
      
      if (!context.includes('validate') && !context.includes('zod') && !context.includes('joi')) {
        findings.push({
          id: this.generateFindingId(filePath, 'input-validation'),
          type: 'input-validation',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Request body used without validation',
          suggestion: 'Add input validation using zod, joi, or similar',
        });
      }
    }

    return findings;
  }

  /**
   * Calculates security metrics
   *
   * @private
   * @param findings - Security findings
   * @returns SecurityMetrics - Calculated metrics
   */
  private calculateMetrics(findings: SecurityFinding[]): SecurityMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      secretsExposed: findings.filter(f => f.type === 'secret-exposed').length,
      sqlInjection: findings.filter(f => f.type === 'sql-injection').length,
      xssVulnerabilities: findings.filter(f => f.type === 'xss-vulnerable').length,
      authIssues: findings.filter(f => f.type === 'auth-issue').length,
      inputValidationIssues: findings.filter(f => f.type === 'input-validation').length,
    };
  }

  /**
   * Generates unique finding ID
   *
   * @private
   * @param filePath - File path
   * @param type - Finding type
   * @returns string - Unique ID
   */
  private generateFindingId(filePath: string, type: string): string {
    const hash = path.basename(filePath);
    return `${type}-${hash}-${Date.now()}`;
  }
}
