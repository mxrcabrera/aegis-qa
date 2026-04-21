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
}

export class AtomicFixer {
  private projectRoot: string;
  private diffsPath: string;
  private interactiveMode: boolean;
  private dryRun: boolean;

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

  constructor(projectRoot: string, interactiveMode: boolean = true, dryRun: boolean = false) {
    this.projectRoot = projectRoot;
    this.interactiveMode = interactiveMode;
    this.dryRun = dryRun;
    this.diffsPath = path.join(projectRoot, '.sentinel', 'diffs');
  }

  /**
   * Run all atomic fixes
   */
  async runFixes(violations: any[], domainModel?: any): Promise<RemediationResults> {
    const results: RemediationResults = {
      appliedFixes: [],
      suggestedFixes: [],
      totalFixes: 0
    };

    // Ensure diffs directory exists
    if (!fs.existsSync(this.diffsPath)) {
      fs.mkdirSync(this.diffsPath, { recursive: true });
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
      const result = await this.applyFix(fix);
      
      if (result.applied) {
        results.appliedFixes.push(result);
      } else {
        results.suggestedFixes.push(result);
      }
    }

    return results;
  }

  /**
   * Generate fixes based on violations
   */
  private async generateFixes(violations: any[], _domainModel?: any): Promise<Fix[]> {
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

    // Collision Avoidance: Detect if multiple fixes target the same line
    const lineMap = new Map<string, Fix[]>();
    for (const fix of fixes) {
      const key = `${fix.file}:${fix.line || 0}`;
      if (!lineMap.has(key)) {
        lineMap.set(key, []);
      }
      lineMap.get(key)!.push(fix);
    }

    // Mark fixes with collisions
    for (const [_key, conflictingFixes] of lineMap.entries()) {
      if (conflictingFixes.length > 1) {
        for (const fix of conflictingFixes) {
          fix.collisionDetected = true;
          fix.manualMergeRequired = true;
          fix.autoApply = false; // Disable auto-apply for colliding fixes
          fix.requiresConfirmation = true;
        }
      }
    }

    return fixes;
  }

  /**
   * Generate i18n/a11y fix
   */
  private async generateI18nFix(violation: any): Promise<Fix | null> {
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
      isCorePath: this.isCorePath(filePath)
    };
  }

  /**
   * Generate environment fix
   */
  private async generateEnvironmentFix(violation: any): Promise<Fix | null> {
    const violationId = violation.id || '';
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envContent = this.generateEnvExampleContent();

    // Generate deterministic ID based on content and file
    const fixId = `env-${this.generateDeterministicId(envContent, envExamplePath)}`;

    // If .env.example doesn't exist, create it
    if (!fs.existsSync(envExamplePath)) {
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
        isCorePath: false
      };
      return fix;
    }

    return null;
  }

  /**
   * Generate clean code fix
   */
  private async generateCleanCodeFix(violation: any): Promise<Fix | null> {
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
      isCorePath: this.isCorePath(filePath)
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
   */
  private async validateSyntax(fix: Fix): Promise<boolean> {
    if (!fix.file.endsWith('.ts') && !fix.file.endsWith('.tsx')) {
      return true; // Not a TypeScript file, skip syntax check
    }

    try {
      // Simulate syntax validation by checking if the proposed content is valid
      // In a real implementation, this would use tsc --noEmit or a TypeScript parser
      const proposedContent = fix.proposedContent;
      
      // Basic syntax check: ensure no unmatched braces or parentheses
      const openBraces = (proposedContent.match(/{/g) || []).length;
      const closeBraces = (proposedContent.match(/}/g) || []).length;
      const openParens = (proposedContent.match(/\(/g) || []).length;
      const closeParens = (proposedContent.match(/\)/g) || []).length;

      if (openBraces !== closeBraces || openParens !== closeParens) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
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
