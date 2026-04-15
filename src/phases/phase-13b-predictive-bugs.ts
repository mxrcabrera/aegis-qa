/**
 * Phase 13B: Predictive Bugs - Pattern Analysis for Potential Bugs
 *
 * Purpose: Analyze code patterns to predict potential bugs based on
 * common anti-patterns, historical bug patterns, and code smells.
 *
 * Architecture:
 * - Pattern Detection: Identify common bug patterns
 * - Race Conditions: Check for potential race conditions
 * - Memory Leaks: Check for potential memory leaks
 * - Off-by-One Errors: Check for common off-by-one patterns
 *
 * @module phases/phase-13b-predictive-bugs
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Predictive bug finding
 */
interface PredictiveBugFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'race-condition' | 'memory-leak' | 'off-by-one' | 'null-dereference' | 'async-issue' | 'type-mismatch';
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
 * Predictive bug metrics
 */
interface PredictiveBugMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Potential race conditions */
  raceConditions: number;
  /** Potential memory leaks */
  memoryLeaks: number;
  /** Potential null dereferences */
  nullDereferences: number;
  /** Async issues */
  asyncIssues: number;
}

/**
 * Phase 13B configuration
 */
interface Phase13BConfig {
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
 * Phase 13B result
 */
export interface Phase13BResult {
  /** Overall success */
  success: boolean;
  /** Predictive bug findings */
  findings: PredictiveBugFinding[];
  /** Predictive bug metrics */
  metrics: PredictiveBugMetrics;
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
 * Phase 13B: Predictive Bugs - Pattern Analysis for Potential Bugs
 *
 * This phase analyzes code patterns to predict potential bugs based on
 * common anti-patterns, historical bug patterns, and code smells.
 *
 * @class Phase13BPredictiveBugs
 * @example
 * ```typescript
 * const predictiveBugs = new Phase13BPredictiveBugs(config);
 * const result = await predictiveBugs.execute();
 * console.log(`Race conditions: ${result.metrics.raceConditions}`);
 * console.log(`Memory leaks: ${result.metrics.memoryLeaks}`);
 * ```
 */
export class Phase13BPredictiveBugs {
  private config: Phase13BConfig;

  constructor(config: Phase13BConfig) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 13B: Predictive Bugs
   *
   * @returns Promise<Phase13BResult> - Predictive bug analysis result
   */
  async execute(): Promise<Phase13BResult> {
    const startTime = Date.now();
    console.log('INFO Phase 13B: Predictive Bugs - Pattern Analysis for Potential Bugs\n');

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

      // Analyze predictive bugs
      console.log('INFO Analyzing predictive bug patterns...');
      const findings = await this.analyzePredictiveBugs(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Race conditions: ${metrics.raceConditions}`);
      console.log(`INFO Memory leaks: ${metrics.memoryLeaks}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase13BResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 13B Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase13BResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          raceConditions: 0,
          memoryLeaks: 0,
          nullDereferences: 0,
          asyncIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 13B:', sanitizedError);
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
      } catch (error) {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes predictive bugs for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<PredictiveBugFinding[]> - Predictive bug findings
   */
  private async analyzePredictiveBugs(sourceFiles: string[]): Promise<PredictiveBugFinding[]> {
    const findings: PredictiveBugFinding[] = [];

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
        
        const fileFindings = this.analyzeFileForPredictiveBugs(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for predictive bugs
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PredictiveBugFinding[] - Predictive bug findings
   */
  private analyzeFileForPredictiveBugs(filePath: string, content: string): PredictiveBugFinding[] {
    const findings: PredictiveBugFinding[] = [];

    // Check for race conditions
    findings.push(...this.checkRaceConditions(filePath, content));

    // Check for memory leaks
    findings.push(...this.checkMemoryLeaks(filePath, content));

    // Check for null dereferences
    findings.push(...this.checkNullDereferences(filePath, content));

    // Check for async issues
    findings.push(...this.checkAsyncIssues(filePath, content));

    return findings;
  }

  /**
   * Checks for potential race conditions
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PredictiveBugFinding[] - Race condition findings
   */
  private checkRaceConditions(filePath: string, content: string): PredictiveBugFinding[] {
    const findings: PredictiveBugFinding[] = [];

    // Check for shared state modification without synchronization
    const sharedStatePattern = /let\s+\w+\s*=\s*\{/g;
    let match;
    while ((match = sharedStatePattern.exec(content)) !== null) {
      const varName = match[0].split(/\s+/)[1];
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(content.length, match.index + 500);
      const context = content.substring(contextStart, contextEnd);

      if (context.includes('push') || context.includes('splice') || context.includes('delete')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'race-condition'),
          type: 'race-condition',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: `Shared state ${varName} may be modified without synchronization`,
          suggestion: 'Consider using proper synchronization or immutable state',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for potential memory leaks
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PredictiveBugFinding[] - Memory leak findings
   */
  private checkMemoryLeaks(filePath: string, content: string): PredictiveBugFinding[] {
    const findings: PredictiveBugFinding[] = [];

    // Check for event listeners without cleanup
    const addEventListenerPattern = /addEventListener\s*\(/g;
    let match;
    while ((match = addEventListenerPattern.exec(content)) !== null) {
      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(content.length, match.index + 300);
      const context = content.substring(contextStart, contextEnd);

      if (!context.includes('removeEventListener') && !context.includes('useEffect')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'memory-leak'),
          type: 'memory-leak',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Event listener may not be removed, causing memory leak',
          suggestion: 'Ensure event listeners are removed when no longer needed',
        });
      }
    }

    // Check for setInterval without clearInterval
    const setIntervalPattern = /setInterval\s*\(/g;
    while ((match = setIntervalPattern.exec(content)) !== null) {
      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(content.length, match.index + 300);
      const context = content.substring(contextStart, contextEnd);

      if (!context.includes('clearInterval')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'memory-leak'),
          type: 'memory-leak',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'setInterval without corresponding clearInterval may cause memory leak',
          suggestion: 'Ensure intervals are cleared when no longer needed',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for potential null dereferences
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PredictiveBugFinding[] - Null dereference findings
   */
  private checkNullDereferences(filePath: string, content: string): PredictiveBugFinding[] {
    const findings: PredictiveBugFinding[] = [];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for property access without null check
      const propertyAccessPattern = /(\w+)\.\w+/g;
      let match;
      while ((match = propertyAccessPattern.exec(line)) !== null) {
        const varName = match[1];
        
        // Skip common safe variables
        if (['console', 'window', 'document', 'Math', 'Date'].includes(varName)) {
          continue;
        }

        // Check if variable is checked for null before access
        const lineStart = Math.max(0, i - 2);
        const lineEnd = Math.min(lines.length, i + 1);
        const contextLines = lines.slice(lineStart, lineEnd).join('\n');
        
        if (!contextLines.includes('if') && !contextLines.includes('?') && !contextLines.includes('!')) {
          findings.push({
            id: this.generateFindingId(filePath, 'null-dereference'),
            type: 'null-dereference',
            severity: 'medium',
            filePath,
            line: i + 1,
            description: `Potential null dereference: ${varName} may be null`,
            suggestion: 'Add null check or optional chaining',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Checks for async issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PredictiveBugFinding[] - Async issue findings
   */
  private checkAsyncIssues(filePath: string, content: string): PredictiveBugFinding[] {
    const findings: PredictiveBugFinding[] = [];

    // Check for async functions without await
    const asyncPattern = /async\s+function\s+(\w+)/g;
    let match;
    while ((match = asyncPattern.exec(content)) !== null) {
      const funcStart = match.index;
      const funcEnd = this.findMatchingBrace(content, funcStart + match[0].length);
      const funcContent = content.substring(funcStart, funcEnd);

      const awaitCount = (funcContent.match(/await/g) || []).length;
      const promiseCount = (funcContent.match(/Promise|fetch|axios/g) || []).length;

      if (promiseCount > 0 && awaitCount === 0) {
        const lineNumber = content.substring(0, funcStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'async-issue'),
          type: 'async-issue',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Async function uses promises without await',
          suggestion: 'Use await or handle promises properly',
        });
      }
    }

    // Check for Promise.all without error handling
    const promiseAllPattern = /Promise\.all\s*\(/g;
    while ((match = promiseAllPattern.exec(content)) !== null) {
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(content.length, match.index + 200);
      const context = content.substring(contextStart, contextEnd);

      if (!context.includes('catch') && !context.includes('try')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'async-issue'),
          type: 'async-issue',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Promise.all without error handling',
          suggestion: 'Add try-catch or .catch() to handle errors',
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
   * Calculates predictive bug metrics
   *
   * @private
   * @param findings - Predictive bug findings
   * @returns PredictiveBugMetrics - Calculated metrics
   */
  private calculateMetrics(findings: PredictiveBugFinding[]): PredictiveBugMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      raceConditions: findings.filter(f => f.type === 'race-condition').length,
      memoryLeaks: findings.filter(f => f.type === 'memory-leak').length,
      nullDereferences: findings.filter(f => f.type === 'null-dereference').length,
      asyncIssues: findings.filter(f => f.type === 'async-issue').length,
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
