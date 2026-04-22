// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 12: Resilience & Observability - Error Handling, Observability and Resilience
 *
 * Purpose: Analyze error handling patterns, observability implementation,
 * and resilience mechanisms to ensure robust and monitorable applications.
 *
 * Architecture:
 * - Error Handling: Check for proper error handling patterns
 * - Observability: Analyze logging, metrics, and tracing
 * - Resilience: Check for circuit breakers, retries, and fallbacks
 * - Monitoring: Verify proper monitoring and alerting setup
 *
 * @module phases/phase-12-resilience-obs
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Resilience/Observability finding
 */
interface ResilienceObsFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'error-handling' | 'logging-issue' | 'missing-metrics' | 'no-retry' | 'no-circuit-breaker' | 'monitoring-gap';
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
 * Resilience/Observability metrics
 */
interface ResilienceObsMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Error handling issues */
  errorHandlingIssues: number;
  /** Logging issues */
  loggingIssues: number;
  /** Missing metrics */
  missingMetrics: number;
  /** Resilience gaps */
  resilienceGaps: number;
}

/**
 * Phase 12 configuration
 */
interface Phase12Config {
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
 * Phase 12 result
 */
export interface Phase12Result {
  /** Overall success */
  success: boolean;
  /** Resilience/Observability findings */
  findings: ResilienceObsFinding[];
  /** Resilience/Observability metrics */
  metrics: ResilienceObsMetrics;
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
 * Phase 12: Resilience & Observability - Error Handling, Observability and Resilience
 *
 * This phase analyzes error handling patterns, observability implementation,
 * and resilience mechanisms to ensure robust and monitorable applications.
 *
 * @class Phase12ResilienceObs
 * @example
 * ```typescript
 * const resilienceObs = new Phase12ResilienceObs(config);
 * const result = await resilienceObs.execute();
 * console.log(`Error handling issues: ${result.metrics.errorHandlingIssues}`);
 * console.log(`Resilience gaps: ${result.metrics.resilienceGaps}`);
 * ```
 */
export class Phase12ResilienceObs {
  private config: Phase12Config;

  constructor(config: Phase12Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 12: Resilience & Observability
   *
   * @returns Promise<Phase12Result> - Resilience/Observability analysis result
   */
  async execute(): Promise<Phase12Result> {
    const startTime = Date.now();
    console.log('INFO Phase 12: Resilience & Observability - Error Handling, Observability and Resilience\n');

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

      // Analyze Resilience & Observability
      console.log('INFO Analyzing resilience and observability...');
      const findings = await this.analyzeResilienceObs(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Error handling issues: ${metrics.errorHandlingIssues}`);
      console.log(`INFO Resilience gaps: ${metrics.resilienceGaps}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase12Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 12 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase12Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          errorHandlingIssues: 0,
          loggingIssues: 0,
          missingMetrics: 0,
          resilienceGaps: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 12:', sanitizedError);
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

    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
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
      } catch (error: unknown) {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes Resilience & Observability for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<ResilienceObsFinding[]> - Resilience/Observability findings
   */
  private async analyzeResilienceObs(sourceFiles: string[]): Promise<ResilienceObsFinding[]> {
    const findings: ResilienceObsFinding[] = [];

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
        
        const fileFindings = this.analyzeFileForResilienceObs(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for Resilience & Observability issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns ResilienceObsFinding[] - Findings from file
   */
  private analyzeFileForResilienceObs(filePath: string, content: string): ResilienceObsFinding[] {
    const findings: ResilienceObsFinding[] = [];

    // Check for error handling
    findings.push(...this.checkErrorHandling(filePath, content));

    // Check for logging
    findings.push(...this.checkLogging(filePath, content));

    // Check for resilience patterns
    findings.push(...this.checkResiliencePatterns(filePath, content));

    return findings;
  }

  /**
   * Checks for error handling issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns ResilienceObsFinding[] - Error handling findings
   */
  private checkErrorHandling(filePath: string, content: string): ResilienceObsFinding[] {
    const findings: ResilienceObsFinding[] = [];

    // Check for try-catch blocks without proper error handling
    const tryPattern = /try\s*\{[^}]*\}\s*catch\s*\([^)]*\)\s*\{/g;
    let match;
    while ((match = tryPattern.exec(content)) !== null) {
      const catchStart = match.index + match[0].length;
      const catchEnd = this.findMatchingBrace(content, catchStart);
      const catchContent = content.substring(catchStart, catchEnd);

      // Check if catch block is empty or only has console.error
      if (catchContent.trim().length < 50 || (catchContent.includes('console.error') && catchContent.trim().length < 100)) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'error-handling'),
          type: 'error-handling',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Catch block may have insufficient error handling',
          suggestion: 'Add proper error handling, logging, or user feedback in catch block',
        });
      }
    }

    // Check for async functions without error handling
    const asyncPattern = /async\s+function\s+(\w+)/g;
    while ((match = asyncPattern.exec(content)) !== null) {
      const funcStart = match.index;
      const funcEnd = this.findMatchingBrace(content, funcStart + match[0].length);
      const funcContent = content.substring(funcStart, funcEnd);

      if (!funcContent.includes('try') && (funcContent.includes('await') || funcContent.includes('fetch'))) {
        const lineNumber = content.substring(0, funcStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'error-handling'),
          type: 'error-handling',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Async function without error handling',
          suggestion: 'Add try-catch block to handle potential errors',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for logging issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns ResilienceObsFinding[] - Logging findings
   */
  private checkLogging(filePath: string, content: string): ResilienceObsFinding[] {
    const findings: ResilienceObsFinding[] = [];

    // Check for missing logging in critical functions
    const criticalPatterns = ['fetch', 'axios', 'database', 'db.', 'query'];
    const hasLogging = /logger\.|console\.log\(/.test(content);

    if (criticalPatterns.some(pattern => content.includes(pattern)) && !hasLogging) {
      findings.push({
        id: this.generateFindingId(filePath, 'logging-issue'),
        type: 'logging-issue',
        severity: 'medium',
        filePath,
        description: 'Critical operations may lack proper logging',
        suggestion: 'Add structured logging for critical operations',
      });
    }

    // Check for console.log in production code
    const consoleLogPattern = /console\.log\(/g;
    let match: RegExpExecArray | null;
    while ((match = consoleLogPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(filePath, 'logging-issue'),
        type: 'logging-issue',
        severity: 'low',
        filePath,
        line: lineNumber,
        description: 'console.log used instead of proper logger',
        suggestion: 'Use structured logging library (winston, pino, etc.)',
      });
    }

    return findings;
  }

  /**
   * Checks for resilience patterns
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns ResilienceObsFinding[] - Resilience findings
   */
  private checkResiliencePatterns(filePath: string, content: string): ResilienceObsFinding[] {
    const findings: ResilienceObsFinding[] = [];

    // Check for external API calls without retry logic
    const apiPattern = /(?:fetch|axios)\s*\(/g;
    let apiMatch: RegExpExecArray | null;
    while ((apiMatch = apiPattern.exec(content)) !== null) {
      const contextStart = Math.max(0, apiMatch.index - 100);
      const contextEnd = Math.min(content.length, apiMatch.index + 300);
      const context = content.substring(contextStart, contextEnd);

      if (!context.includes('retry') && !context.includes('circuit') && !context.includes('fallback')) {
        const lineNumber = content.substring(0, apiMatch.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'no-retry'),
          type: 'no-retry',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'External API call may benefit from retry logic',
          suggestion: 'Consider adding retry logic with exponential backoff',
        });
      }
    }

    // Check for database operations without transaction handling
    const dbPattern = /(?:db\.|database\.|query\(|execute\()/g;
    let dbMatch: RegExpExecArray | null;
    while ((dbMatch = dbPattern.exec(content)) !== null) {
      const contextStart = Math.max(0, dbMatch.index - 100);
      const contextEnd = Math.min(content.length, dbMatch.index + 300);
      const context = content.substring(contextStart, contextEnd);

      if (!context.includes('transaction') && !context.includes('begin')) {
        const lineNumber = content.substring(0, dbMatch.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'monitoring-gap'),
          type: 'monitoring-gap',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: 'Database operation may benefit from transaction handling',
          suggestion: 'Consider using transactions for complex operations',
        });
      }
    }

    return findings;
  }

  /**
   * Finds matching closing brace
   *
   * @private
   * @param content - Content to search
   * @param startIndex - Start index
   * @returns number - Index of closing brace
   */
  private findMatchingBrace(content: string, startIndex: number): number {
    let braceCount = 0;
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }
    return content.length;
  }

  /**
   * Calculates Resilience/Observability metrics
   *
   * @private
   * @param findings - Resilience/Observability findings
   * @returns ResilienceObsMetrics - Calculated metrics
   */
  private calculateMetrics(findings: ResilienceObsFinding[]): ResilienceObsMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      errorHandlingIssues: findings.filter(f => f.type === 'error-handling').length,
      loggingIssues: findings.filter(f => f.type === 'logging-issue').length,
      missingMetrics: findings.filter(f => f.type === 'missing-metrics').length,
      resilienceGaps: findings.filter(f => f.type === 'no-retry' || f.type === 'no-circuit-breaker').length,
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













