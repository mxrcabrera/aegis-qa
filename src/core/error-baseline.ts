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

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

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

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.baselineFile = path.join(projectRoot, '.aegis-baseline.json');
  }

  /**
   * Runs tsc --noEmit to establish baseline
   *
   * @returns Promise<ErrorBaselineData> - Baseline data
   */
  async establishBaseline(): Promise<ErrorBaselineData> {
    console.log('[ErrorBaseline] Running pre-flight check: tsc --noEmit...');
    
    try {
      const { stderr } = await execAsync('npx tsc --noEmit', {
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
      };

      this.baseline = baseline;
      await this.saveBaseline(baseline);

      if (errors.length > 0) {
        console.log(`[ErrorBaseline] Baseline established: ${errors.length} inherited errors`);
        console.log('[ErrorBaseline] These errors will not be attributed to Aegis fixes');
      } else {
        console.log('[ErrorBaseline] Baseline established: No inherited errors');
      }

      return baseline;
    } catch (error) {
      console.warn('[ErrorBaseline] Failed to run tsc --noEmit, assuming no baseline');
      console.warn('[ErrorBaseline] Error:', error instanceof Error ? error.message : String(error));
      
      // Return empty baseline if tsc fails
      const emptyBaseline: ErrorBaselineData = {
        timestamp: new Date(),
        totalErrors: 0,
        errorsByFile: new Map(),
        errors: [],
        hash: 'empty',
      };
      
      this.baseline = emptyBaseline;
      return emptyBaseline;
    }
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
      const match = line.match(/^([^\(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
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
    } catch (error) {
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
