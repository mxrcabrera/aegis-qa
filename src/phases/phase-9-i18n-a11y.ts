/**
 * Phase 9: Internationalization & Accessibility (i18n & a11y)
 *
 * Purpose: Detect access barriers and localization problems before they affect real users.
 * Focus on i18n (localization) and a11y (accessibility) issues.
 *
 * Architecture:
 * - i18n: Hardcoded Strings, hardcoded date/currency/number formats
 * - a11y: Missing alt tags, aria-labels, incorrect semantic roles
 * - Critical Module Scaling: Form handling in Core Path = higher severity
 *
 * @module phases/phase-9-i18n-a11y
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
import { runWithFileTimeout, createTimeoutViolation } from '../core/file-timeout.js';

/**
 * i18n & a11y finding
 */
interface I18nA11yFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'hardcoded-string' | 'hardcoded-format' | 'missing-alt' | 'missing-aria' | 'incorrect-role' | 'i18n-a11y-issue';
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
}

/**
 * Phase 9 configuration
 */
interface Phase9Config {
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
}

/**
 * Phase 9 result
 */
export interface Phase9Result {
  /** Overall success */
  success: boolean;
  /** i18n & a11y findings */
  findings: I18nA11yFinding[];
  /** Total critical findings */
  criticalFindings: number;
  /** Total high severity findings */
  highSeverityFindings: number;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 9: Internationalization & Accessibility (i18n & a11y)
 *
 * This phase detects access barriers and localization problems before they affect real users.
 * Focuses on i18n (localization) and a11y (accessibility) issues.
 *
 * @class Phase9I18nA11y
 * @example
 * ```typescript
 * const phase9 = new Phase9I18nA11y({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase9.execute();
 * ```
 */
export class Phase9I18nA11y {
  private config: Phase9Config;

  constructor(config: Phase9Config) {
    this.config = config;
  }

  /**
   * Executes Phase 9: Internationalization & Accessibility
   *
   * @returns Promise<Phase9Result> - i18n & a11y analysis result
   */
  async execute(): Promise<Phase9Result> {
    const startTime = Date.now();
    console.log('­ƒîì Phase 9: Internationalization & Accessibility (i18n & a11y)\n');

    try {
      // Get BusinessProfile from Phase 2 for domain context and Critical Modules
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const criticalModules = businessProfile?.corePaths || [];
      const domain = businessProfile?.domain || 'General';
      const isFintech = domain === 'Fintech';

      console.log(`­ƒÄ» Domain Context: ${domain}${isFintech ? ' (Fintech - Strict Mode for Formats)' : ''}\n`);
      console.log(`­ƒÄ» Context: ${criticalModules.length} Critical Modules from Phase 2\n`);

      // Scan for UI files
      const files = await this.scanUIFiles();

      if (files.length === 0) {
        console.log('ÔÜá´©Å  No UI files found for analysis\n');
        
        const result: Phase9Result = {
          success: true,
          findings: [],
          criticalFindings: 0,
          highSeverityFindings: 0,
          filesAnalyzed: 0,
          executionTimeMs: Date.now() - startTime,
        };

        await this.config.statePersistence.storeAnalysisResults(9, result, this.config.currentState);
        await this.writePartialReport(result);
        await this.config.statePersistence.saveState(this.config.currentState);

        return result;
      }

      console.log(`­ƒôé Analyzing ${files.length} UI files...\n`);

      const findings: I18nA11yFinding[] = [];
      
      // Language Consistency Check: Track overall i18n usage
      let filesWithI18n = 0;
      const filesWithoutI18n: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const hasI18n = /t\(|useTranslation|formatMessage|trans\(/.test(content);
        
        if (hasI18n) {
          filesWithI18n++;
        } else {
          filesWithoutI18n.push(file);
        }

        // Apply per-file timeout to prevent hangs on large files
        const timeoutResult = await runWithFileTimeout(
          () => this.analyzeFile(file, criticalModules, isFintech),
          file,
          { timeoutMs: 60000 }
        );

        if (timeoutResult.success && timeoutResult.result) {
          findings.push(...timeoutResult.result);
        } else if (timeoutResult.isTimeout) {
          // Add timeout violation
          const timeoutViolation = createTimeoutViolation(file, 60000);
          findings.push({
            id: timeoutViolation.id,
            type: 'i18n-a11y-issue',
            severity: 'low',
            filePath: file,
            description: timeoutViolation.message,
            suggestion: 'File may be too large or complex to analyze. Consider splitting it into smaller files.',
          });
        }
      }

      // Language Consistency: If 80%+ use i18n, mark files without i18n as inconsistent
      const i18nUsagePercentage = files.length > 0 ? (filesWithI18n / files.length) * 100 : 0;
      if (i18nUsagePercentage >= 80) {
        for (const fileWithoutI18n of filesWithoutI18n) {
          const fileHash = this.computeHash(fs.readFileSync(fileWithoutI18n, 'utf-8'));
          findings.push({
            id: this.generateFindingId(fileHash, undefined, 'hardcoded-string'),
            type: 'hardcoded-string',
            severity: 'medium',
            filePath: fileWithoutI18n,
            description: `Inconsistent Localization: ${i18nUsagePercentage.toFixed(0)}% of repo uses t() but this file doesn't`,
            suggestion: `The team has established i18n discipline (${i18nUsagePercentage.toFixed(0)}% coverage). Use translation function (t()) to maintain consistency across the codebase.`,
          });
        }
      }

      const criticalFindings = findings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter(f => f.severity === 'high').length;

      const result: Phase9Result = {
        success: true,
        findings,
        criticalFindings,
        highSeverityFindings,
        filesAnalyzed: files.length,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(9, result, this.config.currentState);
      await this.writePartialReport(result);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`Ô£à Phase 9 Complete`);
      console.log(`  ­ƒöì Total findings: ${findings.length}`);
      console.log(`  ­ƒÜ¿ Critical findings: ${criticalFindings}`);
      console.log(`  ÔÜá´©Å  High severity findings: ${highSeverityFindings}\n`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ÔØî Phase 9 failed: ${errorMessage}\n`);

      const result: Phase9Result = {
        success: false,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        filesAnalyzed: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Scans for UI files
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async scanUIFiles(): Promise<string[]> {
    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });

    const patterns = [
      'src/**/*.tsx',
      'src/**/*.jsx',
      'src/**/*.vue',
      'src/**/*.svelte',
      'app/**/*.tsx',
      'app/**/*.jsx',
      'pages/**/*.tsx',
      'pages/**/*.jsx',
      'components/**/*.tsx',
      'components/**/*.jsx',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const { glob } = await import('glob');
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      for (const file of files) {
        if (ignoreHandler.shouldIgnore(file)) {
          continue;
        }

        // Skip test files, mocks, seeds
        if (file.includes('/test/') || 
            file.includes('/tests/') ||
            file.includes('/mocks/') || 
            file.includes('/mock/') ||
            file.includes('seed.') ||
            file.endsWith('.test.ts') ||
            file.endsWith('.test.js') ||
            file.endsWith('.spec.ts') ||
            file.endsWith('.spec.js')) {
          continue;
        }

        const filterResult = fileFilter.shouldAnalyzeFile(file);
        if (filterResult.shouldAnalyze) {
          allFiles.push(file);
        }
      }
    }

    return Array.from(new Set(allFiles));
  }

  /**
   * Analyzes a single file for i18n & a11y issues
   *
   * @private
   * @param filePath - File path
   * @param criticalModules - Critical modules from Phase 2
   * @param isFintech - Whether domain is Fintech
   * @returns Promise<I18nA11yFinding[]> - i18n & a11y findings
   */
  private async analyzeFile(filePath: string, criticalModules: string[], isFintech: boolean): Promise<I18nA11yFinding[]> {
    const findings: I18nA11yFinding[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileHash = this.computeHash(content);
      const isCriticalModule = criticalModules.includes(filePath);
      const isReactFile = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');

      // 1. i18n: Hardcoded Strings
      const i18nFindings = this.analyzeI18n(filePath, content, fileHash, isFintech);
      findings.push(...i18nFindings);

      // 2. a11y: Accessibility issues
      if (isReactFile) {
        const a11yFindings = this.analyzeA11y(filePath, content, fileHash, isCriticalModule, isFintech);
        findings.push(...a11yFindings);
      }

      return findings;
    } catch (error) {
      console.warn(`ÔÜá´©Å  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Analyzes i18n issues (Hardcoded Strings, hardcoded formats)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @param isFintech - Whether domain is Fintech
   * @returns I18nA11yFinding[] - i18n findings
   */
  private analyzeI18n(filePath: string, content: string, fileHash: string, isFintech: boolean): I18nA11yFinding[] {
    const findings: I18nA11yFinding[] = [];

    // Check if file uses i18n (t(), useTranslation, etc.)
    const hasI18n = /t\(|useTranslation|formatMessage|trans\(/.test(content);

    // Hardcoded Strings: Look for string literals in JSX that are not using t()
    // Pattern: > "text" or > 'text' without t() call
    const jsxStringPattern = />([^<{]*[a-zA-Z]{3,}[^<{]*)</g;
    let jsxStringMatch: RegExpExecArray | null;
    while ((jsxStringMatch = jsxStringPattern.exec(content)) !== null) {
      const matchIndex = jsxStringMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;
      const text = jsxStringMatch[1].trim();

      // Exclude Technical Strings: IDs, CSS/Tailwind classes, icon names, file paths, console.log values
      const isTechnicalString = 
        // IDs (looks like id="..." or className="...")
        /id=|className=|class=/.test(text) ||
        // CSS/Tailwind classes (contains hyphens, numbers, or common Tailwind prefixes)
        /^[\w-]+$/.test(text) && /-/.test(text) ||
        // Icon names (lucide-react, heroicons, etc.)
        text.includes('icon') || text.includes('Icon') ||
        // File paths
        text.includes('/') || text.includes('\\') || text.includes('.') ||
        // console.log values
        text.includes('console') ||
        // Short technical strings
        text.length < 3 ||
        // Numbers only
        /^\d+$/.test(text) ||
        // Already wrapped in t() or has JSX expressions
        text.includes('{') || text.includes('t(');

      if (isTechnicalString) {
        continue;
      }

      // Check if there's a t() call nearby (within 50 chars)
      const beforeText = content.slice(Math.max(0, matchIndex - 50), matchIndex);
      const hasT = /t\(/.test(beforeText);

      if (!hasT && !hasI18n) {
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'hardcoded-string'),
          type: 'hardcoded-string',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: `Hardcoded string detected: "${text.substring(0, 30)}..."`,
          suggestion: 'Use a translation function (e.g., t()) to support internationalization. Hardcoded strings make localization difficult.',
        });
      }
    }

    // Hardcoded date/currency/number formats
    const datePattern = /toLocaleString|toLocaleDateString|toLocaleTimeString|toLocaleDateString\(['"`]en-US['"`]\)/g;
    let dateMatch: RegExpExecArray | null;
    while ((dateMatch = datePattern.exec(content)) !== null) {
      const matchIndex = dateMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;
      
      // Intl/DateTime Bridge: If Fintech, elevate to HIGH
      const severity = isFintech ? 'high' : 'low';
      
      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'hardcoded-format'),
        type: 'hardcoded-format',
        severity,
        filePath,
        line: lineNumber,
        description: isFintech
          ? `­ƒÜ¿ HIGH: Hardcoded locale in Fintech domain - regional format is a legal requirement`
          : 'Hardcoded locale detected in date/number formatting',
        suggestion: isFintech
          ? 'Fintech requires strict regional formatting compliance. Use Intl or a localization library. Hardcoded formats violate legal requirements for financial data presentation.'
          : 'Use Intl or a localization library to support multiple locales. Hardcoded locales prevent proper internationalization.',
      });
    }

    // Hardcoded currency symbols ($, €, £, ¥) in Fintech
    if (isFintech) {
      const currencyPattern = /[$€£¥]\s*\d+|\d+\s*[$€£¥]/g;
      let currencyMatch: RegExpExecArray | null;
      while ((currencyMatch = currencyPattern.exec(content)) !== null) {
        const matchIndex = currencyMatch.index;
        const lineNumber = content.slice(0, matchIndex).split('\n').length;

        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'hardcoded-format'),
          type: 'hardcoded-format',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: `­ƒÜ¿ HIGH: Hardcoded currency format in Fintech domain - regional format is a legal requirement`,
          suggestion: 'Fintech requires strict regional formatting compliance. Use Intl.NumberFormat with proper locale. Hardded currency symbols violate legal requirements for financial data presentation.',
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes a11y issues (missing alt tags, aria-labels, incorrect semantic roles)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @param isCriticalModule - Whether file is in Critical Module
   * @param isFintech - Whether domain is Fintech
   * @returns I18nA11yFinding[] - a11y findings
   */
  private analyzeA11y(filePath: string, content: string, fileHash: string, isCriticalModule: boolean, _isFintech: boolean): I18nA11yFinding[] {
    const findings: I18nA11yFinding[] = [];
    const handlesForms = /<form|<input|<select|<textarea|onSubmit|onChange/.test(content);

    // Missing alt tags on images
    const imgPattern = /<img\s+[^>]*>/g;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgPattern.exec(content)) !== null) {
      const matchIndex = imgMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;
      const imgTag = imgMatch[0];

      // Check if alt attribute exists
      const hasAlt = /alt\s*=/i.test(imgTag);

      if (!hasAlt) {
        const severity = isCriticalModule && handlesForms ? 'high' : 'medium';
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'missing-alt'),
          type: 'missing-alt',
          severity,
          filePath,
          line: lineNumber,
          description: isCriticalModule
            ? 'Missing alt attribute on image in Critical Module'
            : 'Missing alt attribute on image',
          suggestion: isCriticalModule
            ? 'This is in the Critical Path and handles user input. Add alt attributes to all images for screen reader accessibility.'
            : 'Add alt attributes to all images to provide text alternatives for screen readers.',
        });
      }
    }

    // Missing aria-labels on interactive elements
    const interactivePattern = /<(button|input|a|textarea|select)\s+[^>]*>/g;
    let interactiveMatch: RegExpExecArray | null;
    while ((interactiveMatch = interactivePattern.exec(content)) !== null) {
      const matchIndex = interactiveMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;
      const tag = interactiveMatch[0];
      const tagName = interactiveMatch[1];

      // Check if there's text content inside the tag
      const afterTag = content.slice(matchIndex + tag.length, matchIndex + tag.length + 100);
      const hasTextContent = /[^<]+/.test(afterTag) && !afterTag.trim().startsWith('<');

      // Check if aria-label exists
      const hasAriaLabel = /aria-label\s*=/i.test(tag);
      const hasAriaLabelledby = /aria-labelledby\s*=/i.test(tag);

      // Buttons without text or aria-label
      if (tagName === 'button' && !hasTextContent && !hasAriaLabel && !hasAriaLabelledby) {
        const severity = isCriticalModule && handlesForms ? 'high' : 'medium';
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'missing-aria'),
          type: 'missing-aria',
          severity,
          filePath,
          line: lineNumber,
          description: isCriticalModule
            ? 'Button without text content or aria-label in Critical Module'
            : 'Button without text content or aria-label',
          suggestion: isCriticalModule
            ? 'This is in the Critical Path and handles user input. Add aria-label or text content to buttons for screen reader accessibility.'
            : 'Add aria-label or text content to buttons to make them accessible to screen readers.',
        });
      }

      // Inputs without aria-label or label element
      if (tagName === 'input' && !hasAriaLabel && !hasAriaLabelledby) {
        // Check if there's a label element associated
        const beforeTag = content.slice(Math.max(0, matchIndex - 200), matchIndex);
        const hasLabelElement = /<label\s+[^>]*for\s*=/.test(beforeTag);

        if (!hasLabelElement) {
          const severity = isCriticalModule && handlesForms ? 'high' : 'medium';
          findings.push({
            id: this.generateFindingId(fileHash, lineNumber, 'missing-aria'),
            type: 'missing-aria',
            severity,
            filePath,
            line: lineNumber,
            description: isCriticalModule
              ? 'Input without aria-label or associated label in Critical Module'
              : 'Input without aria-label or associated label',
            suggestion: isCriticalModule
              ? 'This is in the Critical Path and handles user input. Add aria-label or associate with a label element for accessibility.'
              : 'Add aria-label or associate input with a label element for accessibility.',
          });
        }
      }
    }

    // Incorrect semantic roles: div with onClick should be button
    // Semantic Depth Check: Check if div/span with onClick has tabIndex or role="button"
    const divOnClickPattern = /<(div|span)\s+[^>]*onClick/g;
    let divOnClickMatch: RegExpExecArray | null;
    while ((divOnClickMatch = divOnClickPattern.exec(content)) !== null) {
      const matchIndex = divOnClickMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;
      const tag = divOnClickMatch[0];

      // Check if it has tabIndex or role="button"
      const hasTabIndex = /tabIndex\s*=/i.test(tag);
      const hasButtonRole = /role\s*=\s*["']button["']/i.test(tag);

      // Semantic Depth Check: If no tabIndex or button role in Critical Module, elevate to HIGH
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let description = `${divOnClickMatch[1]} with onClick detected - should be button`;
      let suggestion = 'Use button element instead of div/span with onClick for proper accessibility and semantics.';

      if (isCriticalModule && !hasTabIndex && !hasButtonRole) {
        severity = 'high';
        description = `­ƒÜ¿ HIGH: ${divOnClickMatch[1]} with onClick in Critical Module without tabIndex or role="button" - invisible to keyboards and screen readers`;
        suggestion = 'This is in the Critical Path and handles user input. The element has onClick but lacks tabIndex or role="button", making it invisible to keyboards and screen readers. Add tabIndex={0} and role="button" immediately, or use a button element.';
      }

      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'incorrect-role'),
        type: 'incorrect-role',
        severity,
        filePath,
        line: lineNumber,
        description,
        suggestion,
      });
    }

    return findings;
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
   * Writes partial report for Phase 9
   *
   * @private
   * @param result - Phase 9 result
   */
  private async writePartialReport(result: Phase9Result): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, I18nA11yFinding[]>();
      for (const finding of result.findings) {
        if (!findingsByType.has(finding.type)) {
          findingsByType.set(finding.type, []);
        }
        findingsByType.get(finding.type)!.push(finding);
      }

      let findingsContent = '';
      for (const [type, findings] of findingsByType) {
        findingsContent += `
### ${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')} (${findings.length})
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
## Phase 9: Internationalization & Accessibility (i18n & a11y) - Ô£à PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms

### i18n & a11y Summary
- **Total Findings:** ${result.findings.length}
- **Critical Findings:** ${result.criticalFindings}
- **High Severity Findings:** ${result.highSeverityFindings}

### Findings by Type
${findingsContent || 'No i18n & a11y issues detected.'}

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

