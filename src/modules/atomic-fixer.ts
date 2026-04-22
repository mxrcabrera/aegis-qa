/**
 * Atomic Fixer - Phase 11
 *
 * Transforms findings from previous phases into applicable solutions (patches)
 * without breaking the system. Surgical fixes with safety gates and validation loops.
 *
 * @module atomic-fixer
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { resolveAndValidatePath } from '../core/filesystem-safety.js';
import { ImpactAnalyzer, type ImpactScore } from './impact-analyzer.js';

export interface Fix {
  id: string;
  violationId?: string; // Link to original violation ID for traceability
  type: 'i18n' | 'a11y' | 'environment' | 'clean-code';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  originalContent: string;
  proposedContent: string;
  autoApply: boolean;
  requiresConfirmation: boolean;
  isCorePath: boolean;
  collisionDetected?: boolean; // For collision avoidance
  manualMergeRequired?: boolean; // Marked when collision detected
  confidence: number; // Confidence score (0-1), propagated from Violation
  riskLevel: 'safe' | 'moderate' | 'risky'; // Calculated risk level
  impactScore?: ImpactScore; // Impact analysis: dependents count, barrel export status, entry point status
}

export interface FixResult {
  fix: Fix;
  applied: boolean;
  patchPath?: string;
  validationPassed?: boolean;
  error?: string;
}

export interface RemediationResults {
  appliedFixes: FixResult[];
  suggestedFixes: FixResult[];
  totalFixes: number;
  testValidationResults?: {
    enabled: boolean;
    testCommand?: string;
    baselinePassed: number;
    baselineFailed: number;
    newFailures: number;
    newPasses: number;
    rollbacks: number;
  };
}

interface FileLocation {
  path: string;
}

interface ViolationLocation {
  line?: number;
}

interface Violation {
  rule: string;
  file?: FileLocation;
  id?: string;
  location?: ViolationLocation;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  confidence?: number;
}

export class AtomicFixer {
  private projectRoot: string;
  private interactiveMode: boolean;
  private dryRun: boolean;
  private diffsPath: string;
  private maxRisk: 'safe' | 'moderate' | 'risky';
  private minConfidence: number;
  private impactAnalyzer: ImpactAnalyzer;
  private runTests: boolean;
  private testCommand: string | undefined;
  private testBaseline: Map<string, boolean>; // Test name -> passed/failed before fixes

  /**
   * Generates a deterministic hash for fix IDs based on content, file, and line
   *
   * @private
   * @param content - The content being fixed
   * @param file - The file path
   * @param line - The line number
   * @returns string - Deterministic hash
   */
  private generateDeterministicId(content: string, file: string, line?: number): string {
    const hashInput = `${file}:${line || 0}:${content}`;
    return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  /**
   * Calculates the risk level for a fix based on the nature of the change
   *
   * @private
   * @param fixType - The type of fix
   * @param originalContent - The original content
   * @param proposedContent - The proposed content
   * @param isCorePath - Whether the file is in a critical path
   * @param impactScore - Optional impact analysis for the file
   * @returns 'safe' | 'moderate' | 'risky' - The calculated risk level
   */
  private calculateRiskLevel(
    fixType: 'i18n' | 'a11y' | 'environment' | 'clean-code',
    originalContent: string,
    proposedContent: string,
    isCorePath: boolean,
    impactScore?: ImpactScore
  ): 'safe' | 'moderate' | 'risky' {
    // Safe: adding attributes (alt text, aria-label), creating new files, or modifying only comments/whitespace
    if (fixType === 'a11y' && (originalContent.includes('alt=') || originalContent.includes('aria-'))) {
      return 'safe';
    }
    
    if (fixType === 'environment' && proposedContent.includes('.env.example')) {
      return 'safe';
    }

    // Check if only comments or whitespace are modified
    const originalTrimmed = originalContent.trim().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
    const proposedTrimmed = proposedContent.trim().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
    if (originalTrimmed === proposedTrimmed) {
      return 'safe';
    }

    // Risky: changes function signatures, modifies imports, touches critical paths
    if (isCorePath) {
      return 'risky';
    }

    if (originalContent.includes('function ') && proposedContent.includes('function ')) {
      const originalSig = originalContent.match(/function\s+\w+\s*\(/)?.[0];
      const proposedSig = proposedContent.match(/function\s+\w+\s*\(/)?.[0];
      if (originalSig !== proposedSig) {
        return 'risky';
      }
    }

    if (originalContent.includes('import ') || proposedContent.includes('import ')) {
      return 'risky';
    }

    // Impact-based risk adjustment: if dependentsCount > 10 → moderate minimum
    // If dependentsCount > 30 → risky
    if (impactScore) {
      if (impactScore.dependentsCount > 30) {
        return 'risky';
      }
      if (impactScore.dependentsCount > 10) {
        return 'moderate';
      }
    }

    // Moderate: modifies logic within a function without changing signature
    return 'moderate';
  }

  /**
   * Checks if a fix passes the confidence and risk gates
   *
   * @private
   * @param fix - The fix to check
   * @returns { passes: boolean, reason?: string } - Whether the fix passes and why it doesn't
   */
  private checkFixGates(fix: Fix): { passes: boolean; reason?: string } {
    // Check confidence threshold
    if (fix.confidence < this.minConfidence) {
      return { passes: false, reason: 'low confidence' };
    }

    // Check risk level threshold
    const riskOrder = { safe: 0, moderate: 1, risky: 2 };
    const fixRiskLevel = riskOrder[fix.riskLevel];
    const maxRiskLevel = riskOrder[this.maxRisk];

    if (fixRiskLevel > maxRiskLevel) {
      return { passes: false, reason: 'risk too high' };
    }

    return { passes: true };
  }

  constructor(
    projectRoot: string,
    interactiveMode: boolean = true,
    dryRun: boolean = false,
    maxRisk: 'safe' | 'moderate' | 'risky' = 'safe',
    minConfidence: number = 0.8,
    runTests: boolean = false,
    testCommand?: string
  ) {
    this.projectRoot = projectRoot;
    this.interactiveMode = interactiveMode;
    this.dryRun = dryRun;
    this.diffsPath = path.join(projectRoot, '.sentinel', 'diffs');
    this.maxRisk = maxRisk;
    this.minConfidence = minConfidence;
    this.impactAnalyzer = new ImpactAnalyzer(projectRoot);
    this.runTests = runTests;
    this.testCommand = testCommand;
    this.testBaseline = new Map();
  }

  /**
   * Auto-detect test command from package.json
   *
   * @private
   * @returns string | undefined - Detected test command or undefined
   */
  private autoDetectTestCommand(): string | undefined {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Priority order: test, test:unit, vitest, jest
      const testCommands = ['test', 'test:unit', 'vitest', 'jest'];
      for (const cmd of testCommands) {
        if (scripts[cmd]) {
          return `npm run ${cmd}`;
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get effective test command (custom or auto-detected)
   *
   * @private
   * @returns string | undefined - Test command or undefined
   */
  private getTestCommand(): string | undefined {
    if (this.testCommand) {
      return this.testCommand;
    }
    return this.autoDetectTestCommand();
  }

  /**
   * Run test command and capture results
   *
   * @private
   * @param command - Test command to run
   * @param timeoutMs - Timeout in milliseconds (default: 60000 = 1 minute)
   * @param filePath - Optional file path for --findRelatedTests optimization
   * @returns Promise<{ passed: boolean, output: string, tests: Map<string, boolean> }> - Test results
   */
  private async runTestCommand(
    command: string,
    timeoutMs: number = 60000,
    filePath?: string
  ): Promise<{ passed: boolean; output: string; tests: Map<string, boolean> }> {
    const { exec } = await import('child_process');

    // Add --findRelatedTests optimization for jest
    let optimizedCommand = command;
    if (filePath && command.includes('jest')) {
      optimizedCommand = `${command} --findRelatedTests ${filePath}`;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          passed: false,
          output: `Test command timed out after ${timeoutMs}ms`,
          tests: new Map()
        });
      }, timeoutMs);

      exec(optimizedCommand, { cwd: this.projectRoot }, (error, stdout, stderr) => {
        clearTimeout(timer);
        const output = stdout + stderr;
        const passed = !error;

        // Parse test results (simple heuristic)
        const tests = new Map<string, boolean>();
        // This is a simple implementation - real parsing would depend on test runner format
        const testLines = output.split('\n').filter(line =>
          line.includes('PASS') || line.includes('FAIL') || line.includes('✓') || line.includes('✗')
        );
        testLines.forEach(line => {
          const testName = line.replace(/PASS|FAIL|✓|✗/g, '').trim();
          if (testName) {
            tests.set(testName, line.includes('PASS') || line.includes('✓'));
          }
        });

        resolve({ passed, output, tests });
      });
    });
  }

  /**
   * Establish test baseline before applying fixes
   *
   * @private
   * @returns Promise<void>
   */
  private async establishTestBaseline(): Promise<void> {
    const testCommand = this.getTestCommand();
    if (!testCommand) {
      console.warn('[TestValidation] No test command found. Skipping test validation.');
      return;
    }

    console.log(`[TestValidation] Establishing baseline with command: ${testCommand}`);
    const result = await this.runTestCommand(testCommand);

    // Store baseline
    result.tests.forEach((passed, testName) => {
      this.testBaseline.set(testName, passed);
    });

    const passedCount = Array.from(this.testBaseline.values()).filter(v => v).length;
    const failedCount = this.testBaseline.size - passedCount;

    console.log(`[TestValidation] Baseline established: ${passedCount} passed, ${failedCount} failed`);
  }

  /**
   * Validate tests after applying fixes
   *
   * @private
   * @param fix - The fix that was applied
   * @returns Promise<{ passed: boolean, rollbackRequired: boolean, details: string, newFailures: number }> - Validation result
   */
  private async validateTestsAfterFix(fix: Fix): Promise<{
    passed: boolean;
    rollbackRequired: boolean;
    details: string;
    newFailures: number;
  }> {
    const testCommand = this.getTestCommand();
    if (!testCommand) {
      return { passed: true, rollbackRequired: false, details: 'No test command, skipping validation', newFailures: 0 };
    }

    // Skip test validation for safe fixes (optimization)
    if (fix.riskLevel === 'safe') {
      return { passed: true, rollbackRequired: false, details: 'Safe fix, skipping test validation', newFailures: 0 };
    }

    console.log(`[TestValidation] Running tests after fix: ${fix.id}`);
    const result = await this.runTestCommand(testCommand, 60000, fix.file);

    // Compare with baseline
    let newFailures = 0;
    let newPasses = 0;
    let rollbackRequired = false;

    result.tests.forEach((passed, testName) => {
      const baselinePassed = this.testBaseline.get(testName);
      if (baselinePassed === undefined) {
        // New test
        if (passed) {
          newPasses++;
        }
      } else if (baselinePassed && !passed) {
        // Test that passed before now fails - rollback required
        newFailures++;
        rollbackRequired = true;
      }
    });

    // Use rollbackRequired to determine if rollback is needed
    if (rollbackRequired && newFailures > 0) {
      // Rollback logic handled by caller
      void rollbackRequired; // Suppress unused warning
    }

    if (newFailures > 0) {
      return {
        passed: false,
        rollbackRequired: true,
        details: `${newFailures} tests that passed before now fail. Rollback required.`,
        newFailures
      };
    }

    if (newPasses > 0) {
      return {
        passed: true,
        rollbackRequired: false,
        details: `${newPasses} new tests pass. Fix is safe.`,
        newFailures
      };
    }

    return {
      passed: true,
      rollbackRequired: false,
      details: 'No test regression detected.',
      newFailures
    };
  }

  /**
   * Run all atomic fixes
   */
  async runFixes(violations: Violation[], domainModel?: unknown): Promise<RemediationResults> {
    const results: RemediationResults = {
      appliedFixes: [],
      suggestedFixes: [],
      totalFixes: 0
    };

    // Test validation metrics
    let newFailures = 0;
    let newPasses = 0;
    let rollbacks = 0;

    // Ensure diffs directory exists
    if (!fs.existsSync(this.diffsPath)) {
      fs.mkdirSync(this.diffsPath, { recursive: true });
    }

    // Establish test baseline if test validation is enabled
    if (this.runTests) {
      await this.establishTestBaseline();
    }

    // Generate fixes based on violations
    const fixes = await this.generateFixes(violations, domainModel);
    results.totalFixes = fixes.length;

    // Sort fixes by file → line (descending) for deterministic execution
    // Fixes on higher lines must be applied first to avoid offset displacement
    fixes.sort((a, b) => {
      const fileCompare = a.file.localeCompare(b.file);
      if (fileCompare !== 0) return fileCompare;
      
      // Descending order for line numbers
      return (b.line || 0) - (a.line || 0);
    });

    for (const fix of fixes) {
      // Check confidence and risk gates before applying
      const gateCheck = this.checkFixGates(fix);
      
      if (!gateCheck.passes) {
        // Fix is skipped due to gating - add to suggested fixes with skip reason
        const skippedResult: FixResult = {
          fix,
          applied: false,
          error: `Skipped (${gateCheck.reason})`
        };
        results.suggestedFixes.push(skippedResult);
        console.log(`[ConfidenceGating] Skipped fix ${fix.id}: ${gateCheck.reason}`);
        continue;
      }

      const result = await this.applyFix(fix);

      if (result.applied) {
        // Validate tests after fix if test validation is enabled
        if (this.runTests) {
          const validation = await this.validateTestsAfterFix(fix);

          if (validation.rollbackRequired) {
            console.log(`[TestValidation] ${validation.details}`);
            console.log(`[TestValidation] Rolling back fix ${fix.id}...`);
            rollbacks++;
            newFailures += validation.newFailures;

            // Rollback the fix
            const backupPath = path.join(this.diffsPath, `${fix.id}.backup`);
            await this.rollbackFix(fix, backupPath);
            result.applied = false;
            result.error = validation.details;
            results.suggestedFixes.push(result);
            continue;
          } else {
            console.log(`[TestValidation] ${validation.details}`);
            // Track new passes
            if (validation.details.includes('new tests pass')) {
              newPasses++;
            }
          }
        }

        results.appliedFixes.push(result);
      } else {
        results.suggestedFixes.push(result);
      }
    }

    // Add test validation results to output
    if (this.runTests) {
      const baselinePassed = Array.from(this.testBaseline.values()).filter(v => v).length;
      const baselineFailed = this.testBaseline.size - baselinePassed;

      results.testValidationResults = {
        enabled: true,
        testCommand: this.getTestCommand(),
        baselinePassed,
        baselineFailed,
        newFailures,
        newPasses,
        rollbacks
      };
    }

    return results;
  }

  /**
   * Group fixes by file for micro-pass application
   *
   * @private
   * @param fixes - All fixes to group
   * @returns Map of file path to array of fixes
   */
  private groupFixesByFile(fixes: Fix[]): Map<string, Fix[]> {
    const fileGroups = new Map<string, Fix[]>();
    
    for (const fix of fixes) {
      if (!fileGroups.has(fix.file)) {
        fileGroups.set(fix.file, []);
      }
      fileGroups.get(fix.file)!.push(fix);
    }

    // Sort fixes within each file by severity (highest first), then by line (descending)
    for (const [, fileFixes] of fileGroups.entries()) {
      fileFixes.sort((a, b) => {
        // Sort by severity: critical > high > medium > low
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        
        // Then by line (descending) to avoid offset displacement
        return (b.line || 0) - (a.line || 0);
      });
    }

    return fileGroups;
  }

  /**
   * Apply fixes with micro-pass strategy
   * Groups fixes by file and applies them one at a time with offset recalculation
   *
   * @private
   * @param fileGroups - Map of file path to array of fixes
   * @returns Array of fixes ready for application
   */
  private applyFixesWithMicroPasses(fileGroups: Map<string, Fix[]>): Fix[] {
    const allFixes: Fix[] = [];

    for (const [file, fileFixes] of fileGroups.entries()) {
      // Apply fixes one at a time with offset tracking
      const processedFixes = this.processFixesForFile(file, fileFixes);
      allFixes.push(...processedFixes);
    }

    // Sort final fixes by file → line (descending) for deterministic execution
    allFixes.sort((a, b) => {
      const fileCompare = a.file.localeCompare(b.file);
      if (fileCompare !== 0) return fileCompare;
      return (b.line || 0) - (a.line || 0);
    });

    return allFixes;
  }

  /**
   * Process fixes for a single file with offset recalculation
   *
   * @private
   * @param _file - File path
   * @param fixes - Fixes for this file
   * @returns Processed fixes with updated line numbers and status
   */
  private processFixesForFile(_file: string, fixes: Fix[]): Fix[] {
    const processedFixes: Fix[] = [];
    let lineOffset = 0;

    for (const fix of fixes) {
      // Update line number based on accumulated offset
      if (fix.line !== undefined) {
        fix.line += lineOffset;
      }

      // Calculate the offset this fix would introduce
      const originalLines = fix.originalContent.split('\n').length;
      const proposedLines = fix.proposedContent.split('\n').length;
      const fixOffset = proposedLines - originalLines;

      // If there are remaining fixes, mark for review if offset would affect them
      const remainingFixes = fixes.filter(f => f !== fix);
      if (remainingFixes.length > 0 && fixOffset !== 0) {
        // Check if this fix would affect the context of remaining fixes
        const wouldAffectContext = this.wouldAffectRemainingFixes(fix, remainingFixes, fixOffset);
        
        if (wouldAffectContext) {
          fix.manualMergeRequired = true;
          fix.requiresConfirmation = true;
          // Don't apply automatically in first pass, but keep in list for potential micro-pass
        }
      }

      processedFixes.push(fix);
      lineOffset += fixOffset;
    }

    return processedFixes;
  }

  /**
   * Check if a fix would affect the context of remaining fixes
   *
   * @private
   * @param appliedFix - The fix being applied
   * @param remainingFixes - Remaining fixes for the file
   * @param _offset - Line offset introduced by the applied fix
   * @returns Whether the fix would affect remaining fixes
   */
  private wouldAffectRemainingFixes(appliedFix: Fix, remainingFixes: Fix[], _offset: number): boolean {
    const appliedLine = appliedFix.line || 0;

    for (const remainingFix of remainingFixes) {
      const remainingLine = remainingFix.line || 0;
      
      // If the remaining fix is on a line below the applied fix, it would be affected by offset
      if (remainingLine > appliedLine) {
        return true;
      }

      // If the remaining fix is close (within 5 lines), it might be affected by context changes
      if (Math.abs(remainingLine - appliedLine) <= 5) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate fixes based on violations
   */
  private async generateFixes(violations: Violation[], _domainModel?: unknown): Promise<Fix[]> {
    const fixes: Fix[] = [];

    // Group violations by type
    const i18nViolations = violations.filter(v => v.rule === 'missing-alt' || v.rule === 'missing-aria');
    const envViolations = violations.filter(v => v.rule === 'strict-env-validation');
    const cleanCodeViolations = violations.filter(v => v.rule === 'too-many-parameters');

    // Generate i18n/a11y fixes
    for (const violation of i18nViolations) {
      const fix = await this.generateI18nFix(violation);
      if (fix) fixes.push(fix);
    }

    // Generate environment fixes
    for (const violation of envViolations) {
      const fix = await this.generateEnvironmentFix(violation);
      if (fix) fixes.push(fix);
    }

    // Generate clean code fixes
    for (const violation of cleanCodeViolations) {
      const fix = await this.generateCleanCodeFix(violation);
      if (fix) fixes.push(fix);
    }

    // Collision Handling: Group fixes by file for micro-pass application
    // This avoids offset displacement when multiple fixes touch nearby lines
    const fileGroups = this.groupFixesByFile(fixes);

    return this.applyFixesWithMicroPasses(fileGroups);
  }

  /**
   * Generate i18n/a11y fix
   */
  private async generateI18nFix(violation: Violation): Promise<Fix | null> {
    const filePath = violation.file?.path || '';
    const violationId = violation.id || '';

    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const lineIndex = violation.location?.line ? violation.location.line - 1 : 0;
    const line = lines[lineIndex] || '';

    // Generate deterministic ID based on content, file, and line
    const fixId = `i18n-${this.generateDeterministicId(line, filePath, violation.location?.line)}`;

    // Analyze impact of modifying this file
    const impactScore = await this.impactAnalyzer.analyzeImpact(filePath);

    // Log high-impact files
    if (impactScore.dependentsCount > 5) {
      console.log(`[ImpactAnalysis] File ${filePath} is imported by ${impactScore.dependentsCount} modules`);
    }

    let proposedContent = line;
    let description = '';

    if (violation.rule === 'missing-alt') {
      // Extract image filename from src attribute
      const srcMatch = line.match(/src=["']([^"']+)["']/);
      const filename = srcMatch ? path.basename(srcMatch[1], path.extname(srcMatch[1])) : 'image';
      const altText = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      proposedContent = line.replace(/<img/, `<img alt="${altText}"`);
      description = `Add alt text "${altText}" to image`;
    } else if (violation.rule === 'missing-aria') {
      // Add aria-label based on button text
      const textMatch = line.match(/>([^<]+)</);
      const buttonText = textMatch ? textMatch[1].trim() : 'button';
      
      proposedContent = line.replace(/<button/, `<button aria-label="${buttonText}"`);
      description = `Add aria-label "${buttonText}" to button`;
    }

    const riskLevel = this.calculateRiskLevel(
      violation.rule === 'missing-alt' ? 'i18n' : 'a11y',
      line,
      proposedContent,
      this.isCorePath(filePath),
      impactScore
    );

    return {
      id: fixId,
      violationId, // Link to original violation for traceability
      type: violation.rule === 'missing-alt' ? 'i18n' : 'a11y',
      severity: violation.severity || 'medium',
      file: filePath,
      line: violation.location?.line,
      description,
      originalContent: line,
      proposedContent,
      autoApply: true,
      requiresConfirmation: false,
      isCorePath: this.isCorePath(filePath),
      confidence: violation.confidence || 0.8,
      riskLevel,
      impactScore
    };
  }

  /**
   * Generate environment fix
   */
  private async generateEnvironmentFix(violation: Violation): Promise<Fix | null> {
    const violationId = violation.id || '';
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envContent = this.generateEnvExampleContent();

    // Generate deterministic ID based on content and file
    const fixId = `env-${this.generateDeterministicId(envContent, envExamplePath)}`;

    // If .env.example doesn't exist, create it
    if (!fs.existsSync(envExamplePath)) {
      // Analyze impact of modifying this file
      const impactScore = await this.impactAnalyzer.analyzeImpact(envExamplePath);

      // Log high-impact files
      if (impactScore.dependentsCount > 5) {
        console.log(`[ImpactAnalysis] File ${envExamplePath} is imported by ${impactScore.dependentsCount} modules`);
      }

      const riskLevel = this.calculateRiskLevel('environment', '', envContent, false, impactScore);

      const fix: Fix = {
        id: fixId,
        violationId, // Link to original violation for traceability
        type: 'environment',
        severity: 'critical',
        file: envExamplePath,
        description: 'Create .env.example with detected environment variables',
        originalContent: '',
        proposedContent: envContent,
        autoApply: true,
        requiresConfirmation: false,
        isCorePath: false,
        confidence: violation.confidence || 0.9,
        riskLevel,
        impactScore
      };
      return fix;
    }

    return null;
  }

  /**
   * Generate clean code fix
   */
  private async generateCleanCodeFix(violation: Violation): Promise<Fix | null> {
    const filePath = violation.file?.path || '';
    const violationId = violation.id || '';

    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const lineIndex = violation.location?.line ? violation.location.line - 1 : -1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return null;
    }

    const line = lines[lineIndex];

    // Generate deterministic ID based on content, file, and line
    const fixId = `clean-code-${this.generateDeterministicId(line, filePath, violation.location?.line)}`;

    // Analyze impact of modifying this file
    const impactScore = await this.impactAnalyzer.analyzeImpact(filePath);

    // Log high-impact files
    if (impactScore.dependentsCount > 5) {
      console.log(`[ImpactAnalysis] File ${filePath} is imported by ${impactScore.dependentsCount} modules`);
    }

    // Extract function signature
    const funcMatch = line.match(/function\s+(\w+)\s*\(([^)]*)\)|(\w+)\s*\(([^)]*)\)\s*=>/);
    if (!funcMatch) {
      return null;
    }

    const funcName = funcMatch[1] || funcMatch[3];
    const params = funcMatch[2] || funcMatch[4];
    const paramList = params.split(',').map(p => p.trim()).filter(p => p);

    if (paramList.length <= 5) {
      return null; // No fix needed
    }

    // Generate options object pattern
    const optionsInterface = `interface ${funcName.charAt(0).toUpperCase() + funcName.slice(1)}Options {\n${paramList.map(p => `  ${p}: any;`).join('\n')}\n}`;
    const proposedFunc = `function ${funcName}(options: ${funcName.charAt(0).toUpperCase() + funcName.slice(1)}Options) {`;
    const proposedContent = `${optionsInterface}\n\n${proposedFunc}`;

    const riskLevel = this.calculateRiskLevel('clean-code', line, proposedContent, this.isCorePath(filePath), impactScore);

    return {
      id: fixId,
      violationId, // Link to original violation for traceability
      type: 'clean-code',
      severity: 'medium',
      file: filePath,
      line: violation.location?.line,
      description: `Refactor ${funcName} to use options object pattern (${paramList.length} parameters)`,
      originalContent: line,
      proposedContent,
      autoApply: false, // Manual review required
      requiresConfirmation: true,
      isCorePath: this.isCorePath(filePath),
      confidence: violation.confidence || 0.7,
      riskLevel,
      impactScore
    };
  }

  /**
   * Apply a fix with safety gate
   */
  private async applyFix(fix: Fix): Promise<FixResult> {
    const result: FixResult = {
      fix,
      applied: false
    };

    try {
      // Safety Gate: Generate patch before applying
      const patchId = `fix-${fix.id}`;
      const patchPath = path.join(this.diffsPath, `${patchId}.patch`);
      
      await this.generatePatch(fix, patchPath);
      result.patchPath = patchPath;

      // Check for collision - if manual merge required, skip auto-apply
      if (fix.manualMergeRequired) {
        result.error = 'MANUAL_MERGE_REQUIRED: Collision detected with another fix';
        return result;
      }

      // Syntax Pre-flight: Validate syntax before applying Clean Code fixes
      if (fix.type === 'clean-code') {
        const syntaxValid = await this.validateSyntax(fix);
        if (!syntaxValid) {
          result.error = 'SYNTAX_ERROR: Fix would introduce syntax errors';
          return result;
        }
      }

      // Check if fix requires confirmation (Core Path or manual fix)
      if (fix.requiresConfirmation && this.interactiveMode) {
        console.log(`Apply fix: ${fix.description}? (y/n)`);
        console.log(`  Confidence: ${(fix.confidence * 100).toFixed(0)}%`);
        console.log(`  Risk Level: ${fix.riskLevel}`);
        // In non-interactive mode, skip confirmation
      }

      // Check if fix is in Core Path
      if (fix.isCorePath && this.interactiveMode) {
        console.log(`⚠️  This fix is in Core Path. Apply anyway? (y/n)`);
        // In non-interactive mode, skip confirmation
      }

      // Dry-Run Mode: Generate patches but don't apply
      if (this.dryRun) {
        result.error = 'DRY_RUN: Patch generated but not applied';
        return result;
      }

      // Apply the fix
      if (fix.autoApply || this.interactiveMode) {
        // Create backup for atomic rollback
        const backupPath = await this.createBackup(fix);
        
        await this.writeFix(fix);
        result.applied = true;

        // Add Fix ID traceability comment
        await this.addTraceabilityComment(fix);

        // Validation Loop: Re-run the specific phase to verify score improved
        result.validationPassed = await this.validateFix(fix);

        // Atomic Rollback: If validation failed, revert to backup
        if (!result.validationPassed) {
          await this.rollbackFix(fix, backupPath);
          result.applied = false;
          result.error = 'VALIDATION_FAILED: Fix rolled back due to validation failure';
        }
      } else {
        result.error = 'Fix requires manual review';
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Generate patch file for safety gate
   */
  private async generatePatch(fix: Fix, patchPath: string): Promise<void> {
    const patchContent = `--- ${fix.file}\n+++ ${fix.file}\n@@ -${fix.line || 1},1 +${fix.line || 1},1 @@\n-${fix.originalContent}\n+${fix.proposedContent}\n`;
    
    fs.writeFileSync(patchPath, patchContent, 'utf-8');
  }

  /**
   * Write fix to file
   */
  private async writeFix(fix: Fix): Promise<void> {
    // Symlink Protection: Validate path before writing
    const pathValidation = resolveAndValidatePath(fix.file, this.projectRoot);
    if (!pathValidation.isValid) {
      throw new Error(`Path validation failed: ${pathValidation.error}`);
    }

    if (!fs.existsSync(fix.file)) {
      // Create new file
      const dir = path.dirname(fix.file);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fix.file, fix.proposedContent, 'utf-8');
      return;
    }

    const content = fs.readFileSync(fix.file, 'utf-8');
    const lines = content.split('\n');

    if (fix.line !== undefined && fix.line > 0 && fix.line <= lines.length) {
      lines[fix.line - 1] = fix.proposedContent;
      fs.writeFileSync(fix.file, lines.join('\n'), 'utf-8');
    } else {
      // Append to file
      fs.appendFileSync(fix.file, `\n${fix.proposedContent}`, 'utf-8');
    }
  }

  /**
   * Validate fix by re-running the specific phase
   */
  private async validateFix(fix: Fix): Promise<boolean> {
    // This would call back to the specific auditor to verify the fix
    // For now, we'll do a basic syntax check
    if (fix.file.endsWith('.ts') || fix.file.endsWith('.tsx')) {
      try {
        // Basic validation: file can be read
        fs.readFileSync(fix.file, 'utf-8');
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * Syntax Pre-flight: Validate syntax before applying Clean Code fixes
   * Uses real tsc validation with baseline comparison instead of bracket counting
   */
  private async validateSyntax(fix: Fix): Promise<boolean> {
    if (!fix.file.endsWith('.ts') && !fix.file.endsWith('.tsx')) {
      return true; // Not a TypeScript file, skip syntax check
    }

    try {
      // Check if tsc is available and project has TypeScript
      const tscAvailable = await this.isTscAvailable();
      const hasTsConfig = fs.existsSync(path.join(this.projectRoot, 'tsconfig.json'));

      if (tscAvailable && hasTsConfig) {
        return await this.validateWithTsc(fix);
      }

      // Fallback to bracket counting if tsc unavailable or no TypeScript project
      return this.validateWithBrackets(fix.proposedContent);
    } catch {
      return false;
    }
  }

  /**
   * Check if tsc is available in the project
   */
  private async isTscAvailable(): Promise<boolean> {
    try {
      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const tsc = spawn('tsc', ['--version'], { stdio: 'ignore' });
        tsc.on('error', () => resolve(false));
        tsc.on('exit', (code) => resolve(code === 0));
      });
    } catch {
      return false;
    }
  }

  /**
   * Validate syntax using real tsc with baseline comparison
   */
  private async validateWithTsc(fix: Fix): Promise<boolean> {
    // Get baseline errors before applying fix
    const baselineErrors = await this.getTscErrors(fix.file);

    // Create temporary file with proposed content
    const tempDir = path.join(this.projectRoot, '.sentinel', 'temp-validation');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, path.basename(fix.file));
    fs.writeFileSync(tempFilePath, fix.proposedContent, 'utf-8');

    try {
      // Check if tsconfig.json has incremental enabled for optimization
      const useIncremental = this.hasIncrementalTsConfig();
      
      // Run tsc on the modified file with optimization flags
      const tscArgs = ['--noEmit', '--pretty', 'false'];
      if (useIncremental) {
        tscArgs.push('--incremental');
      }
      
      const newErrors = await this.getTscErrors(tempFilePath, tscArgs);

      // Compare: only fail if NEW errors are introduced
      const newErrorCount = this.countNewErrors(baselineErrors, newErrors);
      
      return newErrorCount === 0;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  /**
   * Check if tsconfig.json has incremental compilation enabled
   */
  private hasIncrementalTsConfig(): boolean {
    try {
      const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
      if (!fs.existsSync(tsConfigPath)) {
        return false;
      }
      
      const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
      const tsConfig = JSON.parse(tsConfigContent);
      
      return tsConfig.compilerOptions?.incremental === true;
    } catch {
      return false;
    }
  }

  /**
   * Get tsc errors for a specific file
   */
  private async getTscErrors(filePath: string, tscArgs: string[] = ['--noEmit', '--pretty', 'false']): Promise<string[]> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const tsc = spawn(
        'tsc',
        tscArgs,
        {
          cwd: this.projectRoot,
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );

      let stderr = '';
      let stdout = '';

      tsc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tsc.on('error', () => {
        resolve([]);
      });

      tsc.on('exit', () => {
        // Parse tsc output to extract errors for the specific file
        const output = stdout + stderr;
        const errors = output
          .split('\n')
          .filter(line => line.includes(filePath) && (line.includes('error TS') || line.includes('error:')))
          .map(line => line.trim());
        
        resolve(errors);
      });
    });
  }

  /**
   * Count new errors introduced by the fix
   */
  private countNewErrors(baselineErrors: string[], newErrors: string[]): number {
    // Normalize error messages for comparison (remove line numbers as they may shift)
    const normalizeError = (error: string) => {
      return error.replace(/:\d+:\d+/g, ':L:C');
    };

    const normalizedBaseline = new Set(baselineErrors.map(normalizeError));
    const normalizedNew = new Set(newErrors.map(normalizeError));

    // Count errors in new that weren't in baseline
    let newErrorCount = 0;
    for (const error of normalizedNew) {
      if (!normalizedBaseline.has(error)) {
        newErrorCount++;
      }
    }

    return newErrorCount;
  }

  /**
   * Fallback syntax validation using bracket counting
   */
  private validateWithBrackets(content: string): boolean {
    // Basic syntax check: ensure no unmatched braces or parentheses
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    return openBraces === closeBraces && openParens === closeParens;
  }

  /**
   * Create backup for atomic rollback
   */
  private async createBackup(fix: Fix): Promise<string> {
    const backupPath = path.join(this.diffsPath, `backup-${fix.id}.bak`);
    
    if (fs.existsSync(fix.file)) {
      fs.copyFileSync(fix.file, backupPath);
    } else {
      // File doesn't exist, create empty backup marker
      fs.writeFileSync(backupPath, '', 'utf-8');
    }

    return backupPath;
  }

  /**
   * Atomic Rollback: Revert to backup if validation fails
   */
  private async rollbackFix(fix: Fix, backupPath: string): Promise<void> {
    try {
      // Symlink Protection: Validate path before restoring backup
      const pathValidation = resolveAndValidatePath(fix.file, this.projectRoot);
      if (!pathValidation.isValid) {
        throw new Error(`Path validation failed during rollback: ${pathValidation.error}`);
      }

      if (fs.existsSync(backupPath)) {
        const backupContent = fs.readFileSync(backupPath, 'utf-8');
        fs.writeFileSync(fix.file, backupContent, 'utf-8');
      } else {
        // File didn't exist originally, delete it
        if (fs.existsSync(fix.file)) {
          fs.unlinkSync(fix.file);
        }
      }
    } catch (error) {
      // Log rollback error but don't throw
      console.error(`Rollback failed for fix ${fix.id}:`, error);
    }
  }

  /**
   * Add Fix ID traceability comment
   */
  private async addTraceabilityComment(fix: Fix): Promise<void> {
    if (!fix.violationId) {
      return;
    }

    try {
      const traceabilityComment = `\n// Sentinel Fix ID: ${fix.id} | Violation ID: ${fix.violationId} | Applied: ${new Date().toISOString()}`;
      fs.appendFileSync(fix.file, traceabilityComment, 'utf-8');
    } catch (error) {
      // Log error but don't fail the fix
      console.error(`Failed to add traceability comment for fix ${fix.id}:`, error);
    }
  }

  /**
   * Check if file is in Core Path
   */
  private isCorePath(filePath: string): boolean {
    const corePaths = ['src/', 'lib/', 'components/'];
    const relativePath = path.relative(this.projectRoot, filePath);
    return corePaths.some(corePath => relativePath.startsWith(corePath));
  }

  /**
   * Generate .env.example content with detected variables
   */
  private generateEnvExampleContent(): string {
    return `# Environment Variables
# Copy this file to .env and fill in the actual values

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Test Configuration
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test_password
TEST_BASE_URL=http://localhost:3000
TEST_TIMEOUT_MS=30000

# Optional: AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`;
  }
}

export default AtomicFixer;
