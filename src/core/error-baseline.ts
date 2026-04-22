/**
 * ErrorBaseline - Pre-flight Check and Inherited Error Management
 *
 * Purpose: Run tsc --noEmit before fixes to establish a baseline of
 * existing errors. This prevents Aegis from being blamed for errors
 * that already existed before the fixes were applied.
 *
 * @module core/error-baseline
 * @since 1.1.0
 */

import { execSafe } from './command-sanitizer.js';
import { RetryHelper } from './retry-helper.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Project type
 */
export type ProjectType = 'typescript' | 'javascript' | 'mixed';

/**
 * TypeScript error from tsc --noEmit
 */
export interface TSCError {
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** Error code */
  code: string;
  /** Error message */
  message: string;
}

/**
 * Error baseline data
 */
export interface ErrorBaselineData {
  /** Timestamp when baseline was created */
  timestamp: Date;
  /** Total error count */
  totalErrors: number;
  /** Errors by file (file -> error count) */
  errorsByFile: Map<string, number>;
  /** Detailed error list */
  errors: TSCError[];
  /** Hash of the baseline for integrity check */
  hash: string;
  /** Source of the baseline (tsc or ast-fallback) */
  source?: string;
}

/**
 * ErrorBaseline - Pre-flight check and inherited error management
 *
 * This class runs tsc --noEmit before applying fixes to establish a baseline
 * of existing errors, then compares post-fix results to only report new errors.
 *
 * @class ErrorBaseline
 */
export class ErrorBaseline {
  private projectRoot: string;
  private baseline: ErrorBaselineData | null = null;
  private baselineFile: string;
  private projectType: ProjectType;

  constructor(projectRoot: string, projectType: ProjectType = 'typescript') {
    this.projectRoot = projectRoot;
    this.baselineFile = path.join(projectRoot, '.aegis-baseline.json');
    this.projectType = projectType;
  }

  /**
   * Runs tsc --noEmit to establish baseline
   *
   * @returns Promise<ErrorBaselineData> - Baseline data
   */
  async establishBaseline(): Promise<ErrorBaselineData> {
    // Skip TSC baseline for JavaScript projects
    if (this.projectType === 'javascript') {
      console.log('[ErrorBaseline] JavaScript project detected - skipping TSC baseline');
      const baseline: ErrorBaselineData = {
        timestamp: new Date(),
        totalErrors: 0,
        errorsByFile: new Map(),
        errors: [],
        hash: this.generateHash([]),
        source: 'skipped-javascript',
      };
      return baseline;
    }

    console.log('[ErrorBaseline] Running pre-flight check: tsc --noEmit...');

    const retryHelper = new RetryHelper();
    const result = await retryHelper.executeWithRetry(
      async () => {
        const { stderr } = await execSafe('npx', ['tsc', '--noEmit'], {
          cwd: this.projectRoot,
          env: { ...process.env },
        });

        const errors = this.parseTSCOutput(stderr);
        const errorsByFile = this.groupErrorsByFile(errors);
        const hash = this.generateHash(errors);

        const baseline: ErrorBaselineData = {
          timestamp: new Date(),
          totalErrors: errors.length,
          errorsByFile,
          errors,
          hash,
          source: 'tsc',
        };

        return baseline;
      },
      { maxRetries: 3, initialBackoffMs: 2000 }
    );

    if (result.success && result.result !== undefined) {
      this.baseline = result.result;
      await this.saveBaseline(result.result);

      if (result.result.errors.length > 0) {
        console.log(`[ErrorBaseline] Baseline established: ${result.result.errors.length} inherited errors`);
        console.log('[ErrorBaseline] These errors will not be attributed to Aegis fixes');
      } else {
        console.log('[ErrorBaseline] Baseline established: No inherited errors');
      }

      return result.result;
    }

    // Fallback: Use AST parser if tsc fails
    console.warn('[ErrorBaseline] tsc failed after retries, falling back to AST parser...');
    console.warn(`[ErrorBaseline] Error: ${result.error?.message}`);
    return this.establishBaselineWithASTParser();
  }

  /**
   * Establishes baseline using AST parser as fallback when tsc fails
   *
   * @private
   * @returns Promise<ErrorBaselineData> - Baseline data from AST parsing
   */
  private async establishBaselineWithASTParser(): Promise<ErrorBaselineData> {
    console.log('[ErrorBaseline] Using AST parser fallback...');
    console.warn('[Security] AST parser is less accurate than tsc, applying validation filters...');

    try {
      const tsFiles = await this.findTypeScriptFiles();
      const errors: TSCError[] = [];

      for (const file of tsFiles) {
        try {
          const fileErrors = await this.parseFileWithAST(file);
          // Filter out low-confidence errors to prevent false positives
          const highConfidenceErrors = this.filterHighConfidenceErrors(fileErrors);
          errors.push(...highConfidenceErrors);
        } catch (error) {
          console.warn(`[ErrorBaseline] Failed to parse ${file} with AST:`, error);
        }
      }

      const errorsByFile = this.groupErrorsByFile(errors);
      const hash = this.generateHash(errors);

      const baseline: ErrorBaselineData = {
        timestamp: new Date(),
        totalErrors: errors.length,
        errorsByFile,
        errors,
        hash,
        source: 'ast-fallback', // Mark as AST fallback source
      };

      this.baseline = baseline;
      await this.saveBaseline(baseline);

      console.log(`[Security] AST parser baseline established: ${errors.length} high-confidence errors`);
      console.log('[Security] AST parser errors marked as fallback source for audit');

      return baseline;
    } catch (error) {
      console.warn('[ErrorBaseline] AST parser fallback failed, returning empty baseline');
      console.warn('[ErrorBaseline] Error:', error instanceof Error ? error.message : String(error));

      // Return empty baseline if all methods fail
      const emptyBaseline: ErrorBaselineData = {
        timestamp: new Date(),
        totalErrors: 0,
        errorsByFile: new Map(),
        errors: [],
        hash: 'empty',
        source: 'empty',
      };

      this.baseline = emptyBaseline;
      return emptyBaseline;
    }
  }

  /**
   * Filters AST-detected errors to keep only high-confidence ones
   * This prevents false positives from the less accurate AST parser
   *
   * @private
   * @param errors - Errors from AST parser
   * @returns TSCError[] - Filtered high-confidence errors
   */
  private filterHighConfidenceErrors(errors: TSCError[]): TSCError[] {
    return errors.filter(error => {
      // Filter 1: Must have a valid error code
      if (!error.code || error.code.length === 0) {
        return false;
      }

      // Filter 2: Must have a line number
      if (!error.line || error.line <= 0) {
        return false;
      }

      // Filter 3: Exclude certain error codes that are prone to false positives in AST
      const lowConfidenceCodes = [
        '2304', // Cannot find name (common in AST due to limited context)
        '2307', // Cannot find module (common in AST due to limited context)
        '2339', // Property does not exist (common in AST due to limited context)
      ];

      if (lowConfidenceCodes.includes(error.code)) {
        return false;
      }

      // Filter 4: Keep only syntax errors and type errors that are likely accurate
      const highConfidenceCodePrefixes = [
        '1003', // Syntax error
        '1005', // Unterminated string
        '1009', // Trailing comma
        '1010', // Invalid character
        '1011', // Unexpected token
        '1012', // Unterminated comment
        '1013', // Invalid number
        '1014', // Missing right parenthesis
        '1015', // Invalid escape sequence
        '1016', // Required parameters
        '1038', // Duplicate identifier
        '1046', // Duplicate identifier
        '1068', // Unexpected token
        '1070', // Left side of assignment
        '1117', // Blum blum shub
        '1164', // Expected expression
        '1188', // Invalid tuple
        '1192', // Invalid tuple
        '1206', // Tuple expected
        '1227', // Parameter type
        '1240', // Interface
        '1241', // Method
        '1242', // Type
        '1243', // Interface
        '1246', // Interface
        '1259', // Module
        '1268', // Class
        '1278', // Missing
        '1280', // Namespace
        '1308', // Async
        '1329', // Unknown
        '1338', // Super
        '1343', // Switch
        '1345', // Expression
        '1355', // Expression
        '1360', // Expression
        '1408', // Invalid
        '1410', // Backtick
        '1411', // Backtick
        '1439', // Invalid
        '1440', // Invalid
        '1442', // Invalid
        '1500', // Parameter
        '17004', // Cannot use
        '17010', // Cannot use
        '17011', // Cannot use
      ];

      // Keep errors with high-confidence code prefixes
      if (highConfidenceCodePrefixes.some(prefix => error.code.startsWith(prefix))) {
        return true;
      }

      // Filter 5: Exclude errors in node_modules or test files
      if (error.file && (error.file.includes('node_modules') || error.file.includes('.test.') || error.file.includes('.spec.'))) {
        return false;
      }

      // Default: exclude to prevent false positives
      return false;
    });
  }

  /**
   * Finds all TypeScript files in the project
   *
   * @private
   * @returns Promise<string[]> - Array of TypeScript file paths
   */
  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx'];

    const scanDir = async (dir: string): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and .git
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.aegis-cache') {
            await scanDir(fullPath);
          }
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    try {
      await scanDir(this.projectRoot);
    } catch (error) {
      console.warn('[ErrorBaseline] Failed to scan TypeScript files:', error);
    }

    return files;
  }

  /**
   * Parses a TypeScript file using simple AST-like parsing
   *
   * @private
   * @param filePath - Path to the TypeScript file
   * @returns Promise<TSCError[]> - Array of potential errors
   */
  private async parseFileWithAST(filePath: string): Promise<TSCError[]> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Simple heuristic-based error detection
    const potentialErrors: TSCError[] = [];

    // Check for common TypeScript errors
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for unused variables (heuristic)
      if (/const\s+\w+\s*=\s*.+/.test(line) && !line.includes('//')) {
        // This is a very basic heuristic, real AST parsing would be more accurate
        // For now, we'll skip this to avoid false positives
      }

      // Check for missing return types (heuristic)
      if (/function\s+\w+\s*\([^)]*\)\s*\{/.test(line) && !line.includes(':')) {
        potentialErrors.push({
          file: filePath,
          line: lineNumber,
          column: 0,
          code: 'TS7020',
          message: 'Missing return type annotation (AST heuristic)',
        });
      }

      // Check for any type assertions that might indicate issues
      if (/as\s+\w+/.test(line)) {
        // Type assertion found - might indicate type issues
        potentialErrors.push({
          file: filePath,
          line: lineNumber,
          column: 0,
          code: 'TS9000',
          message: 'Type assertion detected (AST heuristic - review manually)',
        });
      }
    });

    return potentialErrors;
  }

  /**
   * Parses tsc --noEmit output to extract errors
   *
   * @private
   * @param output - tsc stderr output
   * @returns TSCError[] - Array of parsed errors
   */
  private parseTSCOutput(output: string): TSCError[] {
    const errors: TSCError[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Match tsc error format: file.ts(line,col): error TSXXXX: message
      const match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          code: match[4],
          message: match[5],
        });
      }
    }

    return errors;
  }

  /**
   * Groups errors by file
   *
   * @private
   * @param errors - Array of errors
   * @returns Map<string, number> - Map of file -> error count
   */
  private groupErrorsByFile(errors: TSCError[]): Map<string, number> {
    const errorsByFile = new Map<string, number>();

    for (const error of errors) {
      const count = errorsByFile.get(error.file) || 0;
      errorsByFile.set(error.file, count + 1);
    }

    return errorsByFile;
  }

  /**
   * Generates hash of errors for integrity check
   *
   * @private
   * @param errors - Array of errors
   * @returns string - Hash string
   */
  private generateHash(errors: TSCError[]): string {
    const errorString = JSON.stringify(errors);
    let hash = 0;
    for (let i = 0; i < errorString.length; i++) {
      const char = errorString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Saves baseline to file
   *
   * @private
   * @param baseline - Baseline data
   * @returns Promise<void>
   */
  private async saveBaseline(baseline: ErrorBaselineData): Promise<void> {
    try {
      const data = {
        timestamp: baseline.timestamp.toISOString(),
        totalErrors: baseline.totalErrors,
        errorsByFile: Array.from(baseline.errorsByFile.entries()),
        errors: baseline.errors,
        hash: baseline.hash,
      };

      await fs.promises.writeFile(
        this.baselineFile,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      console.log(`[ErrorBaseline] Baseline saved to ${this.baselineFile}`);
    } catch (error) {
      console.warn('[ErrorBaseline] Failed to save baseline file:', error);
    }
  }

  /**
   * Loads baseline from file
   *
   * @returns Promise<ErrorBaselineData | null> - Loaded baseline or null
   */
  async loadBaseline(): Promise<ErrorBaselineData | null> {
    try {
      const content = await fs.promises.readFile(this.baselineFile, 'utf-8');
      const data = JSON.parse(content);

      const baseline: ErrorBaselineData = {
        timestamp: new Date(data.timestamp),
        totalErrors: data.totalErrors,
        errorsByFile: new Map(data.errorsByFile),
        errors: data.errors,
        hash: data.hash,
      };

      this.baseline = baseline;
      return baseline;
    } catch {
      console.warn('[ErrorBaseline] No baseline file found, will establish new baseline');
      return null;
    }
  }

  /**
   * Compares current errors with baseline to find new errors
   *
   * @param currentErrors - Current errors from tsc --noEmit
   * @returns TSCError[] - New errors (not in baseline)
   */
  compareWithBaseline(currentErrors: TSCError[]): TSCError[] {
    if (!this.baseline) {
      console.warn('[ErrorBaseline] No baseline available, all errors considered new');
      return currentErrors;
    }

    const baselineErrors = this.baseline.errors;
    const baselineErrorSet = new Set(
      baselineErrors.map(e => `${e.file}:${e.line}:${e.column}:${e.code}`)
    );

    const newErrors: TSCError[] = [];

    for (const error of currentErrors) {
      const errorKey = `${error.file}:${error.line}:${error.column}:${error.code}`;
      if (!baselineErrorSet.has(errorKey)) {
        newErrors.push(error);
      }
    }

    return newErrors;
  }

  /**
   * Gets current baseline
   *
   * @returns ErrorBaselineData | null - Current baseline or null
   */
  getBaseline(): ErrorBaselineData | null {
    return this.baseline;
  }

  /**
   * Clears baseline
   */
  clearBaseline(): void {
    this.baseline = null;
  }

  /**
   * Deletes baseline file
   *
   * @returns Promise<void>
   */
  async deleteBaselineFile(): Promise<void> {
    try {
      await fs.promises.unlink(this.baselineFile);
      console.log('[ErrorBaseline] Baseline file deleted');
    } catch (error) {
      console.warn('[ErrorBaseline] Failed to delete baseline file:', error);
    }
  }
}
