/**
 * Phase 7: UX & Accessibility - User Experience and Accessibility Analysis
 *
 * Purpose: Analyze user experience patterns and accessibility compliance
 * including WCAG guidelines, keyboard navigation, and responsive design.
 *
 * Architecture:
 * - WCAG Compliance: Check for WCAG 2.1 AA compliance
 * - Keyboard Navigation: Verify keyboard accessibility
 * - Responsive Design: Check for responsive breakpoints
 * - Loading States: Check for proper loading indicators
 *
 * @module phases/phase-7-ux-accessibility
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * UX/Accessibility finding
 */
interface UXAccessibilityFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'wcag-violation' | 'keyboard-access' | 'responsive-issue' | 'loading-state' | 'error-handling' | 'form-accessibility';
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
 * UX/Accessibility metrics
 */
interface UXAccessibilityMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** WCAG violations */
  wcagViolations: number;
  /** Keyboard accessibility issues */
  keyboardIssues: number;
  /** Responsive design issues */
  responsiveIssues: number;
  /** Form accessibility issues */
  formIssues: number;
}

/**
 * Phase 7 configuration
 */
interface Phase7Config {
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
 * Phase 7 result
 */
export interface Phase7Result {
  /** Overall success */
  success: boolean;
  /** UX/Accessibility findings */
  findings: UXAccessibilityFinding[];
  /** UX/Accessibility metrics */
  metrics: UXAccessibilityMetrics;
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
 * Phase 7: UX & Accessibility - User Experience and Accessibility Analysis
 *
 * This phase analyzes user experience patterns and accessibility compliance
 * including WCAG guidelines, keyboard navigation, and responsive design.
 *
 * @class Phase7UXAccessibility
 * @example
 * ```typescript
 * const uxAccessibility = new Phase7UXAccessibility(config);
 * const result = await uxAccessibility.execute();
 * console.log(`WCAG violations: ${result.metrics.wcagViolations}`);
 * console.log(`Keyboard issues: ${result.metrics.keyboardIssues}`);
 * ```
 */
export class Phase7UXAccessibility {
  private config: Phase7Config;

  constructor(config: Phase7Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 7: UX & Accessibility
   *
   * @returns Promise<Phase7Result> - UX/Accessibility analysis result
   */
  async execute(): Promise<Phase7Result> {
    const startTime = Date.now();
    console.log('INFO Phase 7: UX & Accessibility - User Experience and Accessibility Analysis\n');

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

      // Analyze UX/Accessibility
      console.log('INFO Analyzing UX and accessibility...');
      const findings = await this.analyzeUXAccessibility(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO WCAG violations: ${metrics.wcagViolations}`);
      console.log(`INFO Keyboard issues: ${metrics.keyboardIssues}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase7Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 7 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase7Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          wcagViolations: 0,
          keyboardIssues: 0,
          responsiveIssues: 0,
          formIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 7:', sanitizedError);
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

    const extensions = ['.tsx', '.jsx', '.ts', '.js', '.css', '.scss'];
    
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
      } catch {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes UX/Accessibility for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<UXAccessibilityFinding[]> - UX/Accessibility findings
   */
  private async analyzeUXAccessibility(sourceFiles: string[]): Promise<UXAccessibilityFinding[]> {
    const findings: UXAccessibilityFinding[] = [];

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
        
        const fileFindings = this.analyzeFileForUXAccessibility(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for UX/Accessibility issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UXAccessibilityFinding[] - Findings from file
   */
  private analyzeFileForUXAccessibility(filePath: string, content: string): UXAccessibilityFinding[] {
    const findings: UXAccessibilityFinding[] = [];

    // Check for WCAG violations
    findings.push(...this.checkWCAGCompliance(filePath, content));

    // Check for keyboard accessibility
    findings.push(...this.checkKeyboardAccessibility(filePath, content));

    // Check for responsive design
    findings.push(...this.checkResponsiveDesign(filePath, content));

    // Check for loading states
    findings.push(...this.checkLoadingStates(filePath, content));

    // Check for form accessibility
    findings.push(...this.checkFormAccessibility(filePath, content));

    return findings;
  }

  /**
   * Checks for WCAG compliance violations
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UXAccessibilityFinding[] - WCAG violation findings
   */
  private checkWCAGCompliance(filePath: string, content: string): UXAccessibilityFinding[] {
    const findings: UXAccessibilityFinding[] = [];

    // Check for color contrast issues (simplified)
    const colorPattern = /(?:color|backgroundColor)\s*:\s*#[0-9a-fA-F]{3,6}/gi;
    let match;
    while ((match = colorPattern.exec(content)) !== null) {
      const color = match[0];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Check for low contrast colors (simplified check)
      if (color.includes('#fff') || color.includes('#FFF')) {
        findings.push({
          id: this.generateFindingId(filePath, 'wcag-violation'),
          type: 'wcag-violation',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Color may have insufficient contrast for WCAG compliance',
          suggestion: 'Verify color contrast meets WCAG 2.1 AA standards (4.5:1 for normal text)',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for keyboard accessibility issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UXAccessibilityFinding[] - Keyboard accessibility findings
   */
  private checkKeyboardAccessibility(filePath: string, content: string): UXAccessibilityFinding[] {
    const findings: UXAccessibilityFinding[] = [];

    // Check for onClick handlers without keyboard support
    const onClickPattern = /onClick=\{[^}]*\}/gi;
    let match;
    while ((match = onClickPattern.exec(content)) !== null) {
      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(content.length, match.index + 200);
      const context = content.substring(contextStart, contextEnd);

      if (!context.includes('onKeyDown') && !context.includes('onKeyPress') && !context.includes('tabIndex')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'keyboard-access'),
          type: 'keyboard-access',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'onClick handler without keyboard support',
          suggestion: 'Add onKeyDown/onKeyPress handler and tabIndex for keyboard accessibility',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for responsive design issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UXAccessibilityFinding[] - Responsive design findings
   */
  private checkResponsiveDesign(filePath: string, content: string): UXAccessibilityFinding[] {
    const findings: UXAccessibilityFinding[] = [];

    // Check for fixed widths in CSS
    if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
      const fixedWidthPattern = /width:\s*\d+px/gi;
      let match;
      while ((match = fixedWidthPattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'responsive-issue'),
          type: 'responsive-issue',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Fixed pixel width may not be responsive',
          suggestion: 'Consider using relative units (%, em, rem) or max-width for responsive design',
        });
      }
    }

    // Check for viewport meta tag in HTML files
    if (filePath.endsWith('.html') || filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      if (!content.includes('viewport') && !content.includes('meta name="viewport"')) {
        findings.push({
          id: this.generateFindingId(filePath, 'responsive-issue'),
          type: 'responsive-issue',
          severity: 'high',
          filePath,
          description: 'Missing viewport meta tag for responsive design',
          suggestion: 'Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for loading states
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UXAccessibilityFinding[] - Loading state findings
   */
  private checkLoadingStates(filePath: string, content: string): UXAccessibilityFinding[] {
    const findings: UXAccessibilityFinding[] = [];

    // Check for async operations without loading states
    const asyncPattern = /await\s+\w+/g;
    let match;
    while ((match = asyncPattern.exec(content)) !== null) {
      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(content.length, match.index + 300);
      const context = content.substring(contextStart, contextEnd);

      if (!context.includes('loading') && !context.includes('isLoading') && !context.includes('spinner')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'loading-state'),
          type: 'loading-state',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: 'Async operation may not have loading state indicator',
          suggestion: 'Consider adding loading state for better UX',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for form accessibility
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UXAccessibilityFinding[] - Form accessibility findings
   */
  private checkFormAccessibility(filePath: string, content: string): UXAccessibilityFinding[] {
    const findings: UXAccessibilityFinding[] = [];

    // Check for inputs without labels
    const inputPattern = /<input[^>]*>/gi;
    let match;
    while ((match = inputPattern.exec(content)) !== null) {
      const inputTag = match[0];
      
      if (!inputTag.includes('aria-label') && !inputTag.includes('placeholder')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'form-accessibility'),
          type: 'form-accessibility',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Input field missing label or aria-label',
          suggestion: 'Add label element or aria-label for form accessibility',
        });
      }
    }

    // Check for forms without submit buttons
    const formPattern = /<form[^>]*>/gi;
    while ((match = formPattern.exec(content)) !== null) {
      const formStart = match.index;
      const formEnd = this.findClosingTag(content, 'form', formStart);
      const formContent = content.substring(formStart, formEnd);

      if (!formContent.includes('type="submit"') && !formContent.includes('type=\'submit\'')) {
        const lineNumber = content.substring(0, formStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'form-accessibility'),
          type: 'form-accessibility',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Form may be missing submit button',
          suggestion: 'Add submit button for form accessibility',
        });
      }
    }

    return findings;
  }

  /**
   * Finds closing tag
   *
   * @private
   * @param content - Content to search
   * @param tagName - Tag name
   * @param startIndex - Start index
   * @returns number - Index of closing tag
   */
  private findClosingTag(content: string, tagName: string, startIndex: number): number {
    const closingPattern = new RegExp(`</${tagName}>`, 'gi');
    const match = closingPattern.exec(content.substring(startIndex));
    return match ? startIndex + match.index + match[0].length : content.length;
  }

  /**
   * Calculates UX/Accessibility metrics
   *
   * @private
   * @param findings - UX/Accessibility findings
   * @returns UXAccessibilityMetrics - Calculated metrics
   */
  private calculateMetrics(findings: UXAccessibilityFinding[]): UXAccessibilityMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      wcagViolations: findings.filter(f => f.type === 'wcag-violation').length,
      keyboardIssues: findings.filter(f => f.type === 'keyboard-access').length,
      responsiveIssues: findings.filter(f => f.type === 'responsive-issue').length,
      formIssues: findings.filter(f => f.type === 'form-accessibility').length,
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





