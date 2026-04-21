/**
 * Style Auditor - Style Violation Detection for Aegis QA
 *
 * This module scans component files to detect style violations including:
 * - Tailwind class duplicates and unnecessary arbitrary values
 * - Basic accessibility issues (missing alt attributes on images)
 * - Hardcoded styles that should use Tailwind classes
 *
 * Integrates with:
 * - ReportAggregator for centralized violation management
 * - ThermalController for hardware protection
 * - DomainMap for business context awareness
 *
 * @module style-auditor
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { Violation, FileMetadata, Severity, ViolationType } from '../types/audit.js';
import { ReportAggregator } from '../core/reporter.js';
import type { ThermalController } from '../core/thermal-controller.js';
import type { DomainMap } from '../types/domain.js';

/**
 * Style auditor configuration
 */
export interface StyleAuditorConfig {
  /** Root directory of the project to audit */
  projectRoot: string;

  /** Directory patterns to scan (default: components) */
  scanPatterns?: string[];

  /** File extensions to scan */
  fileExtensions?: string[];

  /** Domain map for business context */
  domainMap?: DomainMap;

  /** Thermal controller for hardware protection */
  thermalController?: ThermalController;

  /** Report aggregator for centralized violations */
  reporter?: ReportAggregator;

  /** Maximum files to process per batch */
  maxFilesPerBatch?: number;

  /** Cooldown between batches (ms) */
  batchCooldownMs?: number;

  /** Whether to enable auto-fix suggestions */
  enableAutoFix?: boolean;
}

/**
 * Tailwind class analysis result
 */
interface TailwindClassAnalysis {
  /** Duplicate classes found */
  duplicates: string[];

  /** Arbitrary values found */
  arbitraryValues: string[];

  /** Conflicting classes found */
  conflicts: string[];

  /** Total class count */
  totalClasses: number;
}

/**
 * Tailwind conflict groups
 * Classes in the same group conflict with each other
 */
const TAILWIND_CONFLICT_GROUPS: Record<string, string[]> = {
  padding: [
    'p-0',
    'p-1',
    'p-2',
    'p-3',
    'p-4',
    'p-5',
    'p-6',
    'p-8',
    'p-10',
    'p-12',
    'p-16',
    'p-20',
    'p-24',
    'p-32',
    'p-40',
    'p-48',
    'p-56',
    'p-64',
    'p-72',
    'p-80',
    'p-96',
    'px-0',
    'px-1',
    'px-2',
    'px-3',
    'px-4',
    'px-5',
    'px-6',
    'px-8',
    'px-10',
    'px-12',
    'px-16',
    'px-20',
    'px-24',
    'px-32',
    'px-40',
    'px-48',
    'px-56',
    'px-64',
    'px-72',
    'px-80',
    'px-96',
    'py-0',
    'py-1',
    'py-2',
    'py-3',
    'py-4',
    'py-5',
    'py-6',
    'py-8',
    'py-10',
    'py-12',
    'py-16',
    'py-20',
    'py-24',
    'py-32',
    'py-40',
    'py-48',
    'py-56',
    'py-64',
    'py-72',
    'py-80',
    'py-96',
    'pt-0',
    'pt-1',
    'pt-2',
    'pt-3',
    'pt-4',
    'pt-5',
    'pt-6',
    'pt-8',
    'pt-10',
    'pt-12',
    'pt-16',
    'pt-20',
    'pt-24',
    'pt-32',
    'pt-40',
    'pt-48',
    'pt-56',
    'pt-64',
    'pt-72',
    'pt-80',
    'pt-96',
    'pr-0',
    'pr-1',
    'pr-2',
    'pr-3',
    'pr-4',
    'pr-5',
    'pr-6',
    'pr-8',
    'pr-10',
    'pr-12',
    'pr-16',
    'pr-20',
    'pr-24',
    'pr-32',
    'pr-40',
    'pr-48',
    'pr-56',
    'pr-64',
    'pr-72',
    'pr-80',
    'pr-96',
    'pb-0',
    'pb-1',
    'pb-2',
    'pb-3',
    'pb-4',
    'pb-5',
    'pb-6',
    'pb-8',
    'pb-10',
    'pb-12',
    'pb-16',
    'pb-20',
    'pb-24',
    'pb-32',
    'pb-40',
    'pb-48',
    'pb-56',
    'pb-64',
    'pb-72',
    'pb-80',
    'pb-96',
    'pl-0',
    'pl-1',
    'pl-2',
    'pl-3',
    'pl-4',
    'pl-5',
    'pl-6',
    'pl-8',
    'pl-10',
    'pl-12',
    'pl-16',
    'pl-20',
    'pl-24',
    'pl-32',
    'pl-40',
    'pl-48',
    'pl-56',
    'pl-64',
    'pl-72',
    'pl-80',
    'pl-96',
  ],
  margin: [
    'm-0',
    'm-1',
    'm-2',
    'm-3',
    'm-4',
    'm-5',
    'm-6',
    'm-8',
    'm-10',
    'm-12',
    'm-16',
    'm-20',
    'm-24',
    'm-32',
    'm-40',
    'm-48',
    'm-56',
    'm-64',
    'm-72',
    'm-80',
    'm-96',
    'mx-0',
    'mx-1',
    'mx-2',
    'mx-3',
    'mx-4',
    'mx-5',
    'mx-6',
    'mx-8',
    'mx-10',
    'mx-12',
    'mx-16',
    'mx-20',
    'mx-24',
    'mx-32',
    'mx-40',
    'mx-48',
    'mx-56',
    'mx-64',
    'mx-72',
    'mx-80',
    'mx-96',
    'my-0',
    'my-1',
    'my-2',
    'my-3',
    'my-4',
    'my-5',
    'my-6',
    'my-8',
    'my-10',
    'my-12',
    'my-16',
    'my-20',
    'my-24',
    'my-32',
    'my-40',
    'my-48',
    'my-56',
    'my-64',
    'my-72',
    'my-80',
    'my-96',
    'mt-0',
    'mt-1',
    'mt-2',
    'mt-3',
    'mt-4',
    'mt-5',
    'mt-6',
    'mt-8',
    'mt-10',
    'mt-12',
    'mt-16',
    'mt-20',
    'mt-24',
    'mt-32',
    'mt-40',
    'mt-48',
    'mt-56',
    'mt-64',
    'mt-72',
    'mt-80',
    'mt-96',
    'mr-0',
    'mr-1',
    'mr-2',
    'mr-3',
    'mr-4',
    'mr-5',
    'mr-6',
    'mr-8',
    'mr-10',
    'mr-12',
    'mr-16',
    'mr-20',
    'mr-24',
    'mr-32',
    'mr-40',
    'mr-48',
    'mr-56',
    'mr-64',
    'mr-72',
    'mr-80',
    'mr-96',
    'mb-0',
    'mb-1',
    'mb-2',
    'mb-3',
    'mb-4',
    'mb-5',
    'mb-6',
    'mb-8',
    'mb-10',
    'mb-12',
    'mb-16',
    'mb-20',
    'mb-24',
    'mb-32',
    'mb-40',
    'mb-48',
    'mb-56',
    'mb-64',
    'mb-72',
    'mb-80',
    'mb-96',
    'ml-0',
    'ml-1',
    'ml-2',
    'ml-3',
    'ml-4',
    'ml-5',
    'ml-6',
    'ml-8',
    'ml-10',
    'ml-12',
    'ml-16',
    'ml-20',
    'ml-24',
    'ml-32',
    'ml-40',
    'ml-48',
    'ml-56',
    'ml-64',
    'ml-72',
    'ml-80',
    'ml-96',
  ],
  flexDirection: [
    'flex-row',
    'flex-row-reverse',
    'flex-col',
    'flex-col-reverse',
  ],
  textAlign: [
    'text-left',
    'text-center',
    'text-right',
    'text-justify',
  ],
  textColor: [
    'text-red-50',
    'text-red-100',
    'text-red-200',
    'text-red-300',
    'text-red-400',
    'text-red-500',
    'text-red-600',
    'text-red-700',
    'text-red-800',
    'text-red-900',
    'text-blue-50',
    'text-blue-100',
    'text-blue-200',
    'text-blue-300',
    'text-blue-400',
    'text-blue-500',
    'text-blue-600',
    'text-blue-700',
    'text-blue-800',
    'text-blue-900',
    'text-green-50',
    'text-green-100',
    'text-green-200',
    'text-green-300',
    'text-green-400',
    'text-green-500',
    'text-green-600',
    'text-green-700',
    'text-green-800',
    'text-green-900',
    'text-yellow-50',
    'text-yellow-100',
    'text-yellow-200',
    'text-yellow-300',
    'text-yellow-400',
    'text-yellow-500',
    'text-yellow-600',
    'text-yellow-700',
    'text-yellow-800',
    'text-yellow-900',
    'text-purple-50',
    'text-purple-100',
    'text-purple-200',
    'text-purple-300',
    'text-purple-400',
    'text-purple-500',
    'text-purple-600',
    'text-purple-700',
    'text-purple-800',
    'text-purple-900',
    'text-gray-50',
    'text-gray-100',
    'text-gray-200',
    'text-gray-300',
    'text-gray-400',
    'text-gray-500',
    'text-gray-600',
    'text-gray-700',
    'text-gray-800',
    'text-gray-900',
  ],
  backgroundColor: [
    'bg-red-50',
    'bg-red-100',
    'bg-red-200',
    'bg-red-300',
    'bg-red-400',
    'bg-red-500',
    'bg-red-600',
    'bg-red-700',
    'bg-red-800',
    'bg-red-900',
    'bg-blue-50',
    'bg-blue-100',
    'bg-blue-200',
    'bg-blue-300',
    'bg-blue-400',
    'bg-blue-500',
    'bg-blue-600',
    'bg-blue-700',
    'bg-blue-800',
    'bg-blue-900',
    'bg-green-50',
    'bg-green-100',
    'bg-green-200',
    'bg-green-300',
    'bg-green-400',
    'bg-green-500',
    'bg-green-600',
    'bg-green-700',
    'bg-green-800',
    'bg-green-900',
    'bg-yellow-50',
    'bg-yellow-100',
    'bg-yellow-200',
    'bg-yellow-300',
    'bg-yellow-400',
    'bg-yellow-500',
    'bg-yellow-600',
    'bg-yellow-700',
    'bg-yellow-800',
    'bg-yellow-900',
    'bg-purple-50',
    'bg-purple-100',
    'bg-purple-200',
    'bg-purple-300',
    'bg-purple-400',
    'bg-purple-500',
    'bg-purple-600',
    'bg-purple-700',
    'bg-purple-800',
    'bg-purple-900',
    'bg-gray-50',
    'bg-gray-100',
    'bg-gray-200',
    'bg-gray-300',
    'bg-gray-400',
    'bg-gray-500',
    'bg-gray-600',
    'bg-gray-700',
    'bg-gray-800',
    'bg-gray-900',
  ],
};

/**
 * StyleAuditor class
 *
 * Detects style violations in component files with hardware protection
 * and business context awareness.
 */
export class StyleAuditor {
  private config: Required<Omit<StyleAuditorConfig, 'domainMap' | 'thermalController' | 'reporter'>> & {
    domainMap?: DomainMap;
    thermalController?: ThermalController;
    reporter?: ReportAggregator;
  };
  private fileMetadataCache: Map<string, FileMetadata> = new Map();

  /**
   * Creates a new StyleAuditor instance
   *
   * @param config - Configuration for style auditing
   */
  constructor(config: StyleAuditorConfig) {
    this.config = {
      projectRoot: config.projectRoot,
      scanPatterns: config.scanPatterns || ['**/*.{tsx,jsx,ts,js}'],
      fileExtensions: config.fileExtensions || ['.tsx', '.jsx', '.ts', '.js'],
      domainMap: config.domainMap,
      thermalController: config.thermalController,
      reporter: config.reporter,
      maxFilesPerBatch: config.maxFilesPerBatch || 20,
      batchCooldownMs: config.batchCooldownMs || 3000,
      enableAutoFix: config.enableAutoFix ?? false,
    };
  }

  /**
   * Runs style audit on the project
   *
   * This method scans component files for style violations, checks thermal
   * status before processing, and uses the ReportAggregator to centralize
   * violations. It also provides business context for violations.
   *
   * @returns Promise<number> - Number of violations found
   */
  async audit(): Promise<number> {
    console.log('[StyleAuditor] Starting style audit...');

    // Check thermal status before processing
    if (this.config.thermalController) {
      const tempReading = await this.config.thermalController.checkTemperature();
      if (!tempReading.isSafe) {
        console.warn(
          `[StyleAuditor] GPU temperature unsafe (${tempReading.current}°C), applying cooldown`
        );
        await this.config.thermalController.applyCooldown(this.config.batchCooldownMs);
      }
    }

    // Find all files to scan
    const files = await this.findFiles();
    console.log(`[StyleAuditor] Found ${files.length} files to scan`);

    // Process files in batches
    const fileBatches = this.createBatches(files);
    let totalViolations = 0;

    for (const batch of fileBatches) {
      const violations = await this.processBatch(batch);
      totalViolations += violations.length;

      // Add violations to reporter
      if (this.config.reporter) {
        this.config.reporter.addViolations('style-auditor', violations);
      }

      // Apply cooldown between batches
      if (this.config.thermalController && batch !== fileBatches[fileBatches.length - 1]) {
        await this.config.thermalController.applyCooldown(this.config.batchCooldownMs);
      }
    }

    console.log(`[StyleAuditor] Audit complete: ${totalViolations} violations found`);
    return totalViolations;
  }

  /**
   * Finds all files to scan
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async findFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.config.scanPatterns) {
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
      });
      allFiles.push(...files);
    }

    // Sort for deterministic execution
    return allFiles.sort();
  }

  /**
   * Creates batches of files for processing
   *
   * @private
   * @param files - Files to batch
   * @returns string[][] - Array of file batches
   */
  private createBatches(files: string[]): string[][] {
    const batches: string[][] = [];
    const batchSize = this.config.maxFilesPerBatch;

    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Processes a batch of files
   *
   * @private
   * @param files - Files to process
   * @returns Promise<Violation[]> - Violations found
   */
  private async processBatch(files: string[]): Promise<Violation[]> {
    const violations: Violation[] = [];

    for (const file of files) {
      const fullPath = path.join(this.config.projectRoot, file);

      // Check thermal status before each file
      if (this.config.thermalController) {
        const tempReading = await this.config.thermalController.checkTemperature();
        if (!tempReading.isSafe) {
          console.warn(
            `[StyleAuditor] GPU temperature unsafe before file ${file}, applying cooldown`
          );
          await this.config.thermalController.applyCooldown(1000);
        }
      }

      const fileViolations = await this.analyzeFile(fullPath, file);
      violations.push(...fileViolations);
    }

    return violations;
  }

  /**
   * Analyzes a single file for style violations
   *
   * @private
   * @param fullPath - Full path to the file
   * @param relativePath - Relative path to the file
   * @returns Promise<Violation[]> - Violations found in the file
   */
  private async analyzeFile(fullPath: string, relativePath: string): Promise<Violation[]> {
    const violations: Violation[] = [];

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Get file metadata
      const metadata = this.getFileMetadata(fullPath, relativePath);

      // Analyze each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for Tailwind class violations
        const classViolations = this.checkTailwindClasses(line, lineNumber, metadata);
        violations.push(...classViolations);

        // Check for accessibility issues
        const a11yViolations = this.checkAccessibility(line, lineNumber, metadata);
        violations.push(...a11yViolations);

        // Check for Next.js optimization issues
        const nextJsViolations = this.checkNextJsOptimizations(line, lineNumber, metadata);
        violations.push(...nextJsViolations);

        // Check for hardcoded styles
        const styleViolations = this.checkHardcodedStyles(line, lineNumber, metadata);
        violations.push(...styleViolations);
      }
    } catch (error) {
      console.warn(`[StyleAuditor] Failed to analyze file: ${relativePath}`);
    }

    return violations;
  }

  /**
   * Checks if a line contains dynamic Tailwind class generation
   *
   * This method detects template literals and other patterns where Tailwind
   * classes are generated dynamically, which should be ignored to avoid
   * false positives.
   *
   * @private
   * @param line - Line of code to check
   * @returns boolean - True if line contains dynamic Tailwind generation
   */
  private isDynamicTailwind(line: string): boolean {
    // Check for template literals with className
    if (line.includes('className={`') || line.includes("className={`")) {
      return true;
    }

    // Check for className with variable interpolation
    if (line.match(/className\s*=\s*\{.*\$\{.*\}.*\}/)) {
      return true;
    }

    // Check for className with function calls
    if (line.match(/className\s*=\s*\{.*\w+\(.*\).*\}/)) {
      return true;
    }

    // Check for className with ternary operators
    if (line.match(/className\s*=\s*\{.*\?.*:.*/)) {
      return true;
    }

    return false;
  }

  /**
   * Checks Tailwind classes for violations
   *
   * @private
   * @param line - Line of code
   * @param lineNumber - Line number
   * @param metadata - File metadata
   * @returns Violation[] - Tailwind class violations
   */
  private checkTailwindClasses(line: string, lineNumber: number, metadata: FileMetadata): Violation[] {
    const violations: Violation[] = [];

    // Smart Ignoring: Skip template literals with dynamic Tailwind generation
    if (this.isDynamicTailwind(line)) {
      return violations;
    }

    // Find className attributes
    const classNameMatch = line.match(/className\s*=\s*["']([^"']+)["']/);
    if (!classNameMatch) {
      return violations;
    }

    const classes = classNameMatch[1].split(/\s+/).filter((c) => c.length > 0);
    const analysis = this.analyzeTailwindClasses(classes);

    // Check for duplicate classes
    for (const duplicate of analysis.duplicates) {
      const violation = this.createViolation(
        'style',
        'medium',
        lineNumber,
        metadata,
        `Duplicate Tailwind class: "${duplicate}". Remove duplicates to maintain clean class lists.`,
        `Duplicate class "${duplicate}" detected in className`,
        'tailwind-duplicate-classes',
        true
      );

      // Add business context
      violation.message = this.addBusinessContext(violation.message, metadata);
      violations.push(violation);
    }

    // Check for unnecessary arbitrary values
    for (const arbitrary of analysis.arbitraryValues) {
      const violation = this.createViolation(
        'style',
        'low',
        lineNumber,
        metadata,
        `Arbitrary Tailwind value: "${arbitrary}". Consider using standard Tailwind classes for better maintainability.`,
        `Arbitrary value "${arbitrary}" in className`,
        'tailwind-arbitrary-values',
        true
      );

      // Add business context
      violation.message = this.addBusinessContext(violation.message, metadata);
      violations.push(violation);
    }

    // Check for conflicting classes
    for (const conflict of analysis.conflicts) {
      const violation = this.createViolation(
        'style',
        'high',
        lineNumber,
        metadata,
        `Conflicting Tailwind class: "${conflict}". Multiple classes from the same group (padding, margin, colors, etc.) detected. Only one should be used.`,
        `Conflicting class "${conflict}" in className`,
        'tailwind-conflicting-classes',
        true
      );

      // Add business context
      violation.message = this.addBusinessContext(violation.message, metadata);
      violations.push(violation);
    }

    return violations;
  }

  /**
   * Analyzes Tailwind classes for duplicates, arbitrary values, and conflicts
   *
   * @private
   * @param classes - Array of Tailwind classes
   * @returns TailwindClassAnalysis - Analysis result
   */
  private analyzeTailwindClasses(classes: string[]): TailwindClassAnalysis {
    const duplicates: string[] = [];
    const arbitraryValues: string[] = [];
    const conflicts: string[] = [];
    const classCount = new Map<string, number>();

    for (const cls of classes) {
      // Count occurrences
      classCount.set(cls, (classCount.get(cls) || 0) + 1);

      // Check for arbitrary values (e.g., w-[500px], h-[300px])
      if (/\[.*\]/.test(cls)) {
        arbitraryValues.push(cls);
      }
    }

    // Find duplicates
    for (const [cls, count] of classCount.entries()) {
      if (count > 1) {
        duplicates.push(cls);
      }
    }

    // Find conflicts
    for (const groupClasses of Object.values(TAILWIND_CONFLICT_GROUPS)) {
      const matchedClasses = classes.filter((cls) => groupClasses.includes(cls));
      if (matchedClasses.length > 1) {
        conflicts.push(...matchedClasses);
      }
    }

    return {
      duplicates,
      arbitraryValues,
      conflicts,
      totalClasses: classes.length,
    };
  }

  /**
   * Checks for accessibility issues
   *
   * @private
   * @param line - Line of code
   * @param lineNumber - Line number
   * @param metadata - File metadata
   * @returns Violation[] - Accessibility violations
   */
  private checkAccessibility(line: string, lineNumber: number, metadata: FileMetadata): Violation[] {
    const violations: Violation[] = [];

    // Check for img tags without alt attribute
    const imgMatch = line.match(/<img\s+(?!.*alt\s*=)/);
    if (imgMatch) {
      const violation = this.createViolation(
        'accessibility',
        'high',
        lineNumber,
        metadata,
        'Image element missing alt attribute. Alt text is essential for screen readers and SEO.',
        'Missing alt attribute on <img> tag',
        'a11y-img-alt',
        true
      );

      // Add business context
      violation.message = this.addBusinessContext(violation.message, metadata);
      violations.push(violation);
    }

    return violations;
  }

  /**
   * Checks for Next.js optimization issues
   *
   * @private
   * @param line - Line of code
   * @param lineNumber - Line number
   * @param metadata - File metadata
   * @returns Violation[] - Next.js optimization violations
   */
  private checkNextJsOptimizations(line: string, lineNumber: number, metadata: FileMetadata): Violation[] {
    const violations: Violation[] = [];

    // Check for native <img> tags (should use next/image)
    const nativeImgMatch = line.match(/<img\s+/);
    if (nativeImgMatch) {
      // Check severity based on critical path
      const severity: Severity = metadata.inCriticalPath ? 'high' : 'medium';
      const violation = this.createViolation(
        'performance',
        severity,
        lineNumber,
        metadata,
        'Native <img> tag detected. Use next/image for automatic optimization, lazy loading, and better LCP scores.',
        'Replace <img> with <Image from next/image>',
        'nextjs-use-next-image',
        true
      );

      // Add business context
      violation.message = this.addBusinessContext(violation.message, metadata);
      violations.push(violation);
    }

    return violations;
  }

  /**
   * Checks for hardcoded styles
   *
   * @private
   * @param line - Line of code
   * @param lineNumber - Line number
   * @param metadata - File metadata
   * @returns Violation[] - Hardcoded style violations
   */
  private checkHardcodedStyles(line: string, lineNumber: number, metadata: FileMetadata): Violation[] {
    const violations: Violation[] = [];

    // Check for inline styles
    const inlineStyleMatch = line.match(/style\s*=\s*\{\s*\{/);
    if (inlineStyleMatch) {
      const violation = this.createViolation(
        'style',
        'medium',
        lineNumber,
        metadata,
        'Inline style detected. Use Tailwind classes for better maintainability and consistency.',
        'Inline style={{...}} detected',
        'no-inline-styles',
        true
      );

      // Add business context
      violation.message = this.addBusinessContext(violation.message, metadata);
      violations.push(violation);
    }

    // Check for hardcoded colors (hex, rgb, rgba) outside of className
    const colorPatterns = [/#([0-9a-fA-F]{3}){1,2}\b/, /rgb\s*\(/, /rgba\s*\(/];
    for (const pattern of colorPatterns) {
      const match = line.match(pattern);
      if (match && !line.includes('className') && !line.includes('tailwind')) {
        const violation = this.createViolation(
          'style',
          'low',
          lineNumber,
          metadata,
          'Hardcoded color detected. Use Tailwind color classes (bg-red-500, text-blue-600, etc.) for consistency.',
          `Hardcoded color: ${match[0]}`,
          'no-hardcoded-colors',
          true
        );

        // Add business context
        violation.message = this.addBusinessContext(violation.message, metadata);
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Creates a violation object
   *
   * @private
   * @param type - Violation type
   * @param severity - Severity level
   * @param lineNumber - Line number
   * @param metadata - File metadata
   * @param message - Violation message
   * @param suggestion - Suggested fix
   * @param rule - Rule identifier
   * @param autoFixable - Whether auto-fix is available
   * @returns Violation - Violation object
   */
  private createViolation(
    type: ViolationType,
    severity: Severity,
    lineNumber: number,
    metadata: FileMetadata,
    message: string,
    suggestion: string,
    rule: string,
    autoFixable: boolean
  ): Violation {
    const id = `${metadata.path}:${lineNumber}:${rule}`;

    return {
      id,
      type,
      severity,
      file: metadata,
      location: {
        line: lineNumber,
        column: 1,
      },
      message,
      suggestion,
      rule,
      autoFixable,
      confidence: 0.9,
    };
  }

  /**
   * Adds business context to a violation message
   *
   * @private
   * @param message - Original message
   * @param metadata - File metadata
   * @returns string - Message with business context
   */
  private addBusinessContext(message: string, metadata: FileMetadata): string {
    if (!metadata.inCriticalPath) {
      return message;
    }

    const criticalPath = metadata.criticalPathName || 'critical path';
    return `${message} (Impact: This file is in the ${criticalPath} critical path - fixing this improves user experience in core business flows.)`;
  }

  /**
   * Gets file metadata
   *
   * @private
   * @param fullPath - Full file path
   * @param relativePath - Relative file path
   * @returns FileMetadata - File metadata
   */
  private getFileMetadata(fullPath: string, relativePath: string): FileMetadata {
    if (this.fileMetadataCache.has(relativePath)) {
      return this.fileMetadataCache.get(relativePath)!;
    }

    const stats = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lineCount = content.split('\n').length;

    // Check if file is in critical path
    const inCriticalPath = this.isInCriticalPath(relativePath);
    const criticalPathName = this.getCriticalPathName(relativePath);

    const metadata: FileMetadata = {
      path: relativePath,
      extension: path.extname(relativePath),
      lineCount,
      inCriticalPath,
      criticalPathName,
      lastModified: stats.mtime,
    };

    this.fileMetadataCache.set(relativePath, metadata);
    return metadata;
  }

  /**
   * Checks if a file is in a critical path
   *
   * @private
   * @param relativePath - Relative file path
   * @returns boolean - Whether file is in critical path
   */
  private isInCriticalPath(relativePath: string): boolean {
    if (!this.config.domainMap || !this.config.domainMap.criticalPaths) {
      return false;
    }

    const pathLower = relativePath.toLowerCase();

    for (const criticalPath of this.config.domainMap.criticalPaths) {
      for (const entity of criticalPath.entities) {
        if (pathLower.includes(entity.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Gets the critical path name for a file
   *
   * @private
   * @param relativePath - Relative file path
   * @returns string | undefined - Critical path name
   */
  private getCriticalPathName(relativePath: string): string | undefined {
    if (!this.config.domainMap || !this.config.domainMap.criticalPaths) {
      return undefined;
    }

    const pathLower = relativePath.toLowerCase();

    for (const criticalPath of this.config.domainMap.criticalPaths) {
      for (const entity of criticalPath.entities) {
        if (pathLower.includes(entity.toLowerCase())) {
          return criticalPath.name;
        }
      }
    }

    return undefined;
  }

  /**
   * Clears the file metadata cache
   */
  clearCache(): void {
    this.fileMetadataCache.clear();
  }
}
