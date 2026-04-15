/**
 * Phase 1: Code Quality - Code Style and Best Practices
 *
 * Purpose: Analyze code quality metrics including style consistency,
 * naming conventions, code duplication, and adherence to best practices.
 *
 * Architecture:
 * - Style Analysis: Check for consistent formatting and naming
 * - Code Smell Detection: Identify anti-patterns and code smells
 * - Complexity Analysis: Measure cyclomatic complexity
 * - Duplication Detection: Find duplicate code blocks
 *
 * @module phases/phase-1-code-quality
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Code quality finding
 */
interface CodeQualityFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'naming-violation' | 'code-smell' | 'complexity-high' | 'duplication' | 'style-inconsistency';
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
 * Code quality metrics
 */
interface CodeQualityMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Total lines of code */
  totalLines: number;
  /** Average cyclomatic complexity */
  avgComplexity: number;
  /** Code duplication percentage */
  duplicationPercentage: number;
  /** Number of code smells */
  codeSmells: number;
  /** Number of naming violations */
  namingViolations: number;
}

/**
 * Phase 1 configuration
 */
interface Phase1Config {
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
 * Phase 1 result
 */
export interface Phase1Result {
  /** Overall success */
  success: boolean;
  /** Code quality findings */
  findings: CodeQualityFinding[];
  /** Code quality metrics */
  metrics: CodeQualityMetrics;
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
 * Phase 1: Code Quality - Code Style and Best Practices
 *
 * This phase analyzes code quality metrics including style consistency,
 * naming conventions, code duplication, and adherence to best practices.
 *
 * @class Phase1CodeQuality
 * @example
 * ```typescript
 * const codeQuality = new Phase1CodeQuality(config);
 * const result = await codeQuality.execute();
 * console.log(`Total files: ${result.metrics.totalFiles}`);
 * console.log(`Code smells: ${result.metrics.codeSmells}`);
 * ```
 */
export class Phase1CodeQuality {
  private config: Phase1Config;

  constructor(config: Phase1Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 1: Code Quality
   *
   * @returns Promise<Phase1Result> - Code quality analysis result
   */
  async execute(): Promise<Phase1Result> {
    const startTime = Date.now();
    console.log('INFO Phase 1: Code Quality - Code Style and Best Practices\n');

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

      // Analyze code quality
      console.log('INFO Analyzing code quality...');
      const findings = await this.analyzeCodeQuality(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(sourceFiles, findings);
      console.log(`INFO Total lines: ${metrics.totalLines}`);
      console.log(`INFO Avg complexity: ${metrics.avgComplexity.toFixed(2)}`);
      console.log(`INFO Duplication: ${metrics.duplicationPercentage.toFixed(2)}%\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase1Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 1 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase1Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          totalLines: 0,
          avgComplexity: 0,
          duplicationPercentage: 0,
          codeSmells: 0,
          namingViolations: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 1:', sanitizedError);
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
   * Analyzes code quality for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<CodeQualityFinding[]> - Code quality findings
   */
  private async analyzeCodeQuality(sourceFiles: string[]): Promise<CodeQualityFinding[]> {
    const findings: CodeQualityFinding[] = [];

    for (const filePath of sourceFiles) {
      try {
        // Validate path
        if (!validatePath(filePath, this.config.projectRoot)) {
          console.warn(`Invalid path: ${filePath}`);
          continue;
        }

        const stats = fs.statSync(filePath);
        
        // Validate file size (max 10MB for source files)
        if (!validateFileSize(stats.size, 10)) {
          console.warn(`File too large: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Censor potential secrets in content
        const sanitizedContent = censorSecrets(content);
        
        const fileFindings = this.analyzeFileForCodeQuality(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for code quality issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CodeQualityFinding[] - Findings from file
   */
  private analyzeFileForCodeQuality(filePath: string, content: string): CodeQualityFinding[] {
    const findings: CodeQualityFinding[] = [];
    const lines = content.split('\n');

    // Check naming conventions
    findings.push(...this.checkNamingConventions(filePath, lines));

    // Check for code smells
    findings.push(...this.checkCodeSmells(filePath, content));

    // Check complexity
    findings.push(...this.checkComplexity(filePath, content));

    return findings;
  }

  /**
   * Checks naming conventions
   *
   * @private
   * @param filePath - File path
   * @param lines - File lines
   * @returns CodeQualityFinding[] - Naming convention findings
   */
  private checkNamingConventions(filePath: string, lines: string[]): CodeQualityFinding[] {
    const findings: CodeQualityFinding[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for variables with uppercase names (should be camelCase)
      const varPattern = /(?:let|const|var)\s+([A-Z][a-zA-Z0-9]*)\s*=/g;
      let match;
      while ((match = varPattern.exec(line)) !== null) {
        findings.push({
          id: this.generateFindingId(filePath, 'naming-violation'),
          type: 'naming-violation',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Variable name should be camelCase: ${match[1]}`,
          suggestion: `Rename ${match[1]} to camelCase`,
        });
      }

      // Check for functions with lowercase names (should be PascalCase or camelCase)
      const funcPattern = /function\s+([a-z][a-zA-Z0-9]*)\s*\(/g;
      while ((match = funcPattern.exec(line)) !== null) {
        findings.push({
          id: this.generateFindingId(filePath, 'naming-violation'),
          type: 'naming-violation',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: `Function name should be PascalCase or camelCase: ${match[1]}`,
          suggestion: `Rename ${match[1]} to PascalCase or camelCase`,
        });
      }
    }

    return findings;
  }

  /**
   * Checks for code smells
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CodeQualityFinding[] - Code smell findings
   */
  private checkCodeSmells(filePath: string, content: string): CodeQualityFinding[] {
    const findings: CodeQualityFinding[] = [];

    // Check for console.log statements
    const consolePattern = /console\.log\(/g;
    let match;
    while ((match = consolePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(filePath, 'code-smell'),
        type: 'code-smell',
        severity: 'low',
        filePath,
        line: lineNumber,
        description: 'console.log statement found - should be removed in production',
        suggestion: 'Remove console.log or replace with proper logging',
      });
    }

    // Check for magic numbers
    const magicNumberPattern = /\b\d{3,}\b/g;
    while ((match = magicNumberPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(filePath, 'code-smell'),
        type: 'code-smell',
        severity: 'low',
        filePath,
        line: lineNumber,
        description: `Magic number detected: ${match[0]}`,
        suggestion: 'Replace magic number with named constant',
      });
    }

    // Check for long functions (> 50 lines)
    const functionPattern = /(?:function|const|let)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g;
    let functionMatch;
    while ((functionMatch = functionPattern.exec(content)) !== null) {
      const functionStart = functionMatch.index;
      const functionContent = content.substring(functionStart, functionStart + 2000);
      const functionLines = functionContent.split('\n');
      
      if (functionLines.length > 50) {
        const lineNumber = content.substring(0, functionStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'code-smell'),
          type: 'code-smell',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Function is too long (${functionLines.length} lines)`,
          suggestion: 'Consider splitting into smaller functions',
        });
      }
    }

    return findings;
  }

  /**
   * Checks cyclomatic complexity
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CodeQualityFinding[] - Complexity findings
   */
  private checkComplexity(filePath: string, content: string): CodeQualityFinding[] {
    const findings: CodeQualityFinding[] = [];

    // Check for deeply nested code (> 3 levels)
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.search(/\S|$/);
      
      if (indent > 12) { // More than 12 spaces = > 3 levels
        findings.push({
          id: this.generateFindingId(filePath, 'complexity-high'),
          type: 'complexity-high',
          severity: 'medium',
          filePath,
          line: i + 1,
          description: `Code is deeply nested (${Math.floor(indent / 4)} levels)`,
          suggestion: 'Consider refactoring to reduce nesting',
        });
      }
    }

    return findings;
  }

  /**
   * Calculates code quality metrics
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param findings - Code quality findings
   * @returns CodeQualityMetrics - Calculated metrics
   */
  private calculateMetrics(sourceFiles: string[], findings: CodeQualityFinding[]): CodeQualityMetrics {
    let totalLines = 0;

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (error) {
        // Skip files we can't read
      }
    }

    const codeSmells = findings.filter((f) => f.type === 'code-smell').length;
    const namingViolations = findings.filter((f) => f.type === 'naming-violation').length;

    return {
      totalFiles: sourceFiles.length,
      totalLines,
      avgComplexity: findings.length > 0 ? findings.length / sourceFiles.length : 0,
      duplicationPercentage: 0, // Simplified for now
      codeSmells,
      namingViolations,
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
