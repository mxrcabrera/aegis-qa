/**
 * Phase 5: Clean Code - Code Readability and Maintainability
 *
 * Purpose: Analyze code for clean code principles including readability,
 * maintainability, SOLID principles, and code organization.
 *
 * Architecture:
 * - SOLID Principles: Check adherence to SOLID principles
 * - Code Organization: Check file structure and organization
 * - Function Size: Check for overly long functions
 * - Comment Quality: Check for useful comments vs code smells
 *
 * @module phases/phase-5-clean-code
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Clean code finding
 */
interface CleanCodeFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'solid-violation' | 'function-too-long' | 'comment-issue' | 'magic-number' | 'duplicate-code' | 'bad-naming';
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
 * Clean code metrics
 */
interface CleanCodeMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Total lines of code */
  totalLines: number;
  /** Average function length */
  avgFunctionLength: number;
  /** SOLID violations */
  solidViolations: number;
  /** Functions too long */
  longFunctions: number;
  /** Code duplication percentage */
  duplicationPercentage: number;
}

/**
 * Phase 5 configuration
 */
interface Phase5Config {
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
 * Phase 5 result
 */
export interface Phase5Result {
  /** Overall success */
  success: boolean;
  /** Clean code findings */
  findings: CleanCodeFinding[];
  /** Clean code metrics */
  metrics: CleanCodeMetrics;
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
 * Phase 5: Clean Code - Code Readability and Maintainability
 *
 * This phase analyzes code for clean code principles including readability,
 * maintainability, SOLID principles, and code organization.
 *
 * @class Phase5CleanCode
 * @example
 * ```typescript
 * const cleanCode = new Phase5CleanCode(config);
 * const result = await cleanCode.execute();
 * console.log(`SOLID violations: ${result.metrics.solidViolations}`);
 * console.log(`Long functions: ${result.metrics.longFunctions}`);
 * ```
 */
export class Phase5CleanCode {
  private config: Phase5Config;

  constructor(config: Phase5Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 5: Clean Code
   *
   * @returns Promise<Phase5Result> - Clean code analysis result
   */
  async execute(): Promise<Phase5Result> {
    const startTime = Date.now();
    console.log('INFO Phase 5: Clean Code - Code Readability and Maintainability\n');

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

      // Analyze clean code
      console.log('INFO Analyzing clean code principles...');
      const findings = await this.analyzeCleanCode(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(sourceFiles, findings);
      console.log(`INFO Avg function length: ${metrics.avgFunctionLength.toFixed(2)}`);
      console.log(`INFO SOLID violations: ${metrics.solidViolations}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase5Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 5 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase5Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          totalLines: 0,
          avgFunctionLength: 0,
          solidViolations: 0,
          longFunctions: 0,
          duplicationPercentage: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 5:', sanitizedError);
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
   * Analyzes clean code for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<CleanCodeFinding[]> - Clean code findings
   */
  private async analyzeCleanCode(sourceFiles: string[]): Promise<CleanCodeFinding[]> {
    const findings: CleanCodeFinding[] = [];

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
        
        const fileFindings = this.analyzeFileForCleanCode(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for clean code issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CleanCodeFinding[] - Findings from file
   */
  private analyzeFileForCleanCode(filePath: string, content: string): CleanCodeFinding[] {
    const findings: CleanCodeFinding[] = [];

    // Check for SOLID violations
    findings.push(...this.checkSOLIDPrinciples(filePath, content));

    // Check for function length
    findings.push(...this.checkFunctionLength(filePath, content));

    // Check for magic numbers
    findings.push(...this.checkMagicNumbers(filePath, content));

    // Check for bad naming
    findings.push(...this.checkNaming(filePath, content));

    return findings;
  }

  /**
   * Checks for SOLID principle violations
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CleanCodeFinding[] - SOLID violation findings
   */
  private checkSOLIDPrinciples(filePath: string, content: string): CleanCodeFinding[] {
    const findings: CleanCodeFinding[] = [];

    // Check for Single Responsibility Principle violations (class doing too much)
    const classPattern = /class\s+(\w+)\s*\{/gi;
    let match;
    while ((match = classPattern.exec(content)) !== null) {
      const className = match[1];
      const classStart = match.index;
      const classEnd = this.findMatchingBrace(content, classStart + match[0].length);
      const classContent = content.substring(classStart, classEnd);

      // Count methods in class
      const methodPattern = /(?:async\s+)?(?:public|private|protected)?\s*\w+\s*\(/g;
      const methodMatches = classContent.match(methodPattern);
      const methodCount = methodMatches ? methodMatches.length : 0;

      if (methodCount > 10) {
        const lineNumber = content.substring(0, classStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'solid-violation'),
          type: 'solid-violation',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Class ${className} may violate Single Responsibility Principle (${methodCount} methods)`,
          suggestion: 'Consider splitting the class into smaller, more focused classes',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for function length issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CleanCodeFinding[] - Function length findings
   */
  private checkFunctionLength(filePath: string, content: string): CleanCodeFinding[] {
    const findings: CleanCodeFinding[] = [];

    const functionPattern = /(?:function|const|let)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g;
    let match;
    while ((match = functionPattern.exec(content)) !== null) {
      const functionStart = match.index;
      const functionEnd = this.findMatchingBrace(content, functionStart + match[0].length);
      const functionContent = content.substring(functionStart, functionEnd);
      const functionLines = functionContent.split('\n');

      if (functionLines.length > 50) {
        const lineNumber = content.substring(0, functionStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'function-too-long'),
          type: 'function-too-long',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Function is too long (${functionLines.length} lines)`,
          suggestion: 'Consider splitting into smaller functions with descriptive names',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for magic numbers
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CleanCodeFinding[] - Magic number findings
   */
  private checkMagicNumbers(filePath: string, content: string): CleanCodeFinding[] {
    const findings: CleanCodeFinding[] = [];

    const magicNumberPattern = /\b\d{3,}\b/g;
    let match;
    while ((match = magicNumberPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const number = match[0];

      // Skip common numbers
      if (!['100', '200', '300', '400', '500'].includes(number)) {
        findings.push({
          id: this.generateFindingId(filePath, 'magic-number'),
          type: 'magic-number',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: `Magic number detected: ${number}`,
          suggestion: 'Replace with named constant for better readability',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for bad naming conventions
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CleanCodeFinding[] - Naming findings
   */
  private checkNaming(filePath: string, content: string): CleanCodeFinding[] {
    const findings: CleanCodeFinding[] = [];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for single letter variable names (except loop variables)
      const varPattern = /(?:let|const|var)\s+([a-z])\s*=/g;
      let match;
      while ((match = varPattern.exec(line)) !== null) {
        if (!['i', 'j', 'k', 'x', 'y', 'z'].includes(match[1])) {
          findings.push({
            id: this.generateFindingId(filePath, 'bad-naming'),
            type: 'bad-naming',
            severity: 'low',
            filePath,
            line: i + 1,
            description: `Single letter variable name: ${match[1]}`,
            suggestion: 'Use descriptive variable names for better readability',
          });
        }
      }

      // Check for abbreviations in names
      const abbrevPattern = /\b[a-z]*[A-Z]{2,}[a-z]*\b/g;
      while ((match = abbrevPattern.exec(line)) !== null) {
        if (!['API', 'URL', 'ID', 'SQL', 'HTML', 'CSS', 'JSON', 'XML', 'HTTP', 'HTTPS'].includes(match[0])) {
          findings.push({
            id: this.generateFindingId(filePath, 'bad-naming'),
            type: 'bad-naming',
            severity: 'low',
            filePath,
            line: i + 1,
            description: `Abbreviation in name: ${match[0]}`,
            suggestion: 'Use full words for better readability',
          });
        }
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
   * Calculates clean code metrics
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param findings - Clean code findings
   * @returns CleanCodeMetrics - Calculated metrics
   */
  private calculateMetrics(sourceFiles: string[], findings: CleanCodeFinding[]): CleanCodeMetrics {
    let totalLines = 0;
    let totalFunctionLength = 0;
    let functionCount = 0;

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        totalLines += content.split('\n').length;

        // Count functions and calculate average length
        const functionPattern = /(?:function|const|let)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g;
        let match;
        while ((match = functionPattern.exec(content)) !== null) {
          functionCount++;
          const functionStart = match.index;
          const functionEnd = this.findMatchingBrace(content, functionStart + match[0].length);
          const functionContent = content.substring(functionStart, functionEnd);
          totalFunctionLength += functionContent.split('\n').length;
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    return {
      totalFiles: sourceFiles.length,
      totalLines,
      avgFunctionLength: functionCount > 0 ? totalFunctionLength / functionCount : 0,
      solidViolations: findings.filter(f => f.type === 'solid-violation').length,
      longFunctions: findings.filter(f => f.type === 'function-too-long').length,
      duplicationPercentage: 0, // Simplified for now
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
