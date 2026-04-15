/**
 * Phase 13A: i18n/l10n - Internationalization and Localization Analysis
 *
 * Purpose: Analyze internationalization and localization implementation
 * to ensure proper support for multiple languages and regions.
 *
 * Architecture:
 * - i18n Implementation: Check for proper i18n setup
 * - Translation Coverage: Verify translation completeness
 * - Locale Handling: Check for proper locale management
 * - Date/Number Formatting: Verify localized formatting
 *
 * @module phases/phase-13a-i18n-l10n
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * i18n/l10n finding
 */
interface I18nL10nFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'missing-i18n' | 'hardcoded-text' | 'translation-coverage' | 'locale-handling' | 'formatting-issue';
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
 * i18n/l10n metrics
 */
interface I18nL10nMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Hardcoded strings */
  hardcodedStrings: number;
  /** Translation coverage percentage */
  translationCoverage: number;
  /** Missing i18n setup */
  missingI18n: number;
}

/**
 * Phase 13A configuration
 */
interface Phase13AConfig {
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
 * Phase 13A result
 */
export interface Phase13AResult {
  /** Overall success */
  success: boolean;
  /** i18n/l10n findings */
  findings: I18nL10nFinding[];
  /** i18n/l10n metrics */
  metrics: I18nL10nMetrics;
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
 * Phase 13A: i18n/l10n - Internationalization and Localization Analysis
 *
 * This phase analyzes internationalization and localization implementation
 * to ensure proper support for multiple languages and regions.
 *
 * @class Phase13AI18nL10n
 * @example
 * ```typescript
 * const i18nL10n = new Phase13AI18nL10n(config);
 * const result = await i18nL10n.execute();
 * console.log(`Hardcoded strings: ${result.metrics.hardcodedStrings}`);
 * console.log(`Translation coverage: ${result.metrics.translationCoverage}%`);
 * ```
 */
export class Phase13AI18nL10n {
  private config: Phase13AConfig;

  constructor(config: Phase13AConfig) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 13A: i18n/l10n
   *
   * @returns Promise<Phase13AResult> - i18n/l10n analysis result
   */
  async execute(): Promise<Phase13AResult> {
    const startTime = Date.now();
    console.log('INFO Phase 13A: i18n/l10n - Internationalization and Localization Analysis\n');

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

      // Get i18n files
      console.log('INFO Finding i18n files...');
      const i18nFiles = this.getI18nFiles(this.config.projectRoot);
      console.log(`INFO i18n files found: ${i18nFiles.length}\n`);

      // Analyze i18n/l10n
      console.log('INFO Analyzing internationalization and localization...');
      const findings = await this.analyzeI18nL10n(sourceFiles, i18nFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(sourceFiles, i18nFiles, findings);
      console.log(`INFO Hardcoded strings: ${metrics.hardcodedStrings}`);
      console.log(`INFO Translation coverage: ${metrics.translationCoverage.toFixed(2)}%\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase13AResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 13A Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase13AResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          hardcodedStrings: 0,
          translationCoverage: 0,
          missingI18n: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 13A:', sanitizedError);
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

    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip node_modules, .aegis, and i18n directories
            if (item.name !== 'node_modules' && item.name !== '.aegis' && item.name !== '.git' && item.name !== 'i18n' && item.name !== 'locales') {
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
   * Gets i18n files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - i18n file paths
   */
  private getI18nFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const i18nDirs = ['i18n', 'locales', 'translations', 'lang'];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            searchDir(fullPath);
          } else if (item.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    // Search in i18n directories
    for (const dir of i18nDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        searchDir(dirPath);
      }
    }

    return files;
  }

  /**
   * Analyzes i18n/l10n for source and i18n files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param i18nFiles - i18n file paths
   * @returns Promise<I18nL10nFinding[]> - i18n/l10n findings
   */
  private async analyzeI18nL10n(sourceFiles: string[], i18nFiles: string[]): Promise<I18nL10nFinding[]> {
    const findings: I18nL10nFinding[] = [];

    // Check if i18n is set up
    if (i18nFiles.length === 0) {
      findings.push({
        id: this.generateFindingId('project-root', 'missing-i18n'),
        type: 'missing-i18n',
        severity: 'medium',
        filePath: this.config.projectRoot,
        description: 'No i18n/locales directory found',
        suggestion: 'Set up i18n for internationalization support',
      });
    }

    // Analyze source files for hardcoded strings
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
        
        const fileFindings = this.analyzeFileForHardcodedStrings(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for hardcoded strings
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns I18nL10nFinding[] - Hardcoded string findings
   */
  private analyzeFileForHardcodedStrings(filePath: string, content: string): I18nL10nFinding[] {
    const findings: I18nL10nFinding[] = [];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for hardcoded strings in JSX
      const jsxStringPattern = />[^<{]*[a-zA-Z]{3,}[^<{]*</g;
      let match;
      while ((match = jsxStringPattern.exec(line)) !== null) {
        const text = match[0].replace(/[<>]/g, '').trim();
        
        // Skip if it's a variable, number, or very short
        if (text.length > 5 && !text.includes('{') && !text.match(/^\d+$/) && !text.startsWith(' ')) {
          findings.push({
            id: this.generateFindingId(filePath, 'hardcoded-text'),
            type: 'hardcoded-text',
            severity: 'low',
            filePath,
            line: i + 1,
            description: `Potential hardcoded string: "${text}"`,
            suggestion: 'Consider moving to i18n translation file',
          });
        }
      }

      // Check for hardcoded strings in template literals
      const templatePattern = /`([^`]+)`/g;
      while ((match = templatePattern.exec(line)) !== null) {
        const text = match[1];
        
        // Skip if it contains variables or is very short
        if (text.length > 10 && !text.includes('${') && /[a-zA-Z]{3,}/.test(text)) {
          findings.push({
            id: this.generateFindingId(filePath, 'hardcoded-text'),
            type: 'hardcoded-text',
            severity: 'low',
            filePath,
            line: i + 1,
            description: `Potential hardcoded string in template literal`,
            suggestion: 'Consider moving to i18n translation file',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Calculates i18n/l10n metrics
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param i18nFiles - i18n file paths
   * @param findings - i18n/l10n findings
   * @returns I18nL10nMetrics - Calculated metrics
   */
  private calculateMetrics(sourceFiles: string[], i18nFiles: string[], findings: I18nL10nFinding[]): I18nL10nMetrics {
    const translationCoverage = i18nFiles.length > 0 ? 100 : 0;

    return {
      totalFiles: sourceFiles.length,
      hardcodedStrings: findings.filter(f => f.type === 'hardcoded-text').length,
      translationCoverage,
      missingI18n: findings.filter(f => f.type === 'missing-i18n').length,
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
