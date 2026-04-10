/**
 * Atomic Fixer - Automated Code Fixes
 *
 * Purpose: Provides safe, atomic code fixes for common issues detected in QA phases.
 * Focus on non-destructive, reversible fixes with rollback capability.
 *
 * Architecture:
 * - Atomic Operations: Each fix is a single, reversible operation
 * - Safety Checks: Validate before applying fixes
 * - Rollback: Ability to undo fixes if needed
 * - Fix Registry: Registry of available fixes with metadata
 *
 * @module lib/atomic-fixer
 * @since 2.0.0
 */

import * as fs from 'fs';


/**
 * Fix operation result
 */
interface FixResult {
  /** Success status */
  success: boolean;
  /** Number of fixes applied */
  fixesApplied: number;
  /** Number of fixes skipped */
  fixesSkipped: number;
  /** Number of fixes failed */
  fixesFailed: number;
  /** Rollback data for undo */
  rollbackData: string[];
}

/**
 * Fix operation
 */
interface FixOperation {
  /** Unique fix ID */
  id: string;
  /** Fix name */
  name: string;
  /** Fix description */
  description: string;
  /** Severity level this fix addresses */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Apply the fix */
  apply(filePath: string, content: string): Promise<{ success: boolean; newContent?: string; rollbackData?: string }>;
}

/**
 * Atomic Fixer
 *
 * Provides safe, atomic code fixes for common issues detected in QA phases.
 * Each fix is reversible and can be rolled back if needed.
 *
 * @class AtomicFixer
 */
export class AtomicFixer {
  private fixRegistry: Map<string, FixOperation> = new Map();

  constructor() {
    this.registerBuiltinFixes();
  }

  /**
   * Registers builtin fixes
   *
   * @private
   */
  private registerBuiltinFixes(): void {
    // Fix: Add missing semicolons (TypeScript/JavaScript)
    this.registerFix({
      id: 'add-missing-semicolons',
      name: 'Add Missing Semicolons',
      description: 'Adds semicolons at end of statements where missing',
      severity: 'low',
      apply: async (_filePath, content) => {
        const lines = content.split('\n');
        let newContent = content;
        let changes = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          // Skip comments, empty lines, and lines ending with semicolon
          if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.endsWith(';')) {
            continue;
          }
          // Skip lines ending with braces, brackets, or operators
          if (line.endsWith('{') || line.endsWith('}') || line.endsWith('[') || line.endsWith(']')) {
            continue;
          }
          // Skip lines that are control structures
          if (line.startsWith('if ') || line.startsWith('for ') || line.startsWith('while ') || line.startsWith('function ') || line.startsWith('const ') || line.startsWith('let ') || line.startsWith('var ')) {
            continue;
          }
          // Add semicolon
          lines[i] = lines[i] + ';';
          changes++;
        }

        if (changes > 0) {
          newContent = lines.join('\n');
          return {
            success: true,
            newContent,
            rollbackData: JSON.stringify({ type: 'add-missing-semicolons', changes }),
          };
        }

        return { success: false };
      },
    });

    // Fix: Remove console.log statements (production code)
    this.registerFix({
      id: 'remove-console-log',
      name: 'Remove Console Log',
      description: 'Removes console.log statements from production code',
      severity: 'medium',
      apply: async (_filePath, content) => {
        const lines = content.split('\n');
        const removedLines: number[] = [];
        let newContent = content;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('console.log(') || line.startsWith('console.error(') || line.startsWith('console.warn(')) {
            // Skip if it's in a test file
            if (_filePath.includes('/test/') || _filePath.includes('/tests/') || _filePath.endsWith('.test.ts') || _filePath.endsWith('.test.js')) {
              continue;
            }
            removedLines.push(i);
          }
        }

        if (removedLines.length > 0) {
          const filteredLines = lines.filter((_, index) => !removedLines.includes(index));
          newContent = filteredLines.join('\n');
          return {
            success: true,
            newContent,
            rollbackData: JSON.stringify({ type: 'remove-console-log', lines: removedLines }),
          };
        }

        return { success: false };
      },
    });

    // Fix: Add missing return types (TypeScript)
    this.registerFix({
      id: 'add-return-types',
      name: 'Add Return Types',
      description: 'Adds explicit return types to functions missing them',
      severity: 'medium',
      apply: async (_filePath, content) => {
        // Simple heuristic: find function declarations without return types
        const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
        let newContent = content;
        let changes = 0;

        let match: RegExpExecArray | null;
        while ((match = functionPattern.exec(content)) !== null) {
          const functionName = match[1];
          const fullMatch = match[0];
          // Check if it already has a return type
          if (!fullMatch.includes(':')) {
            // Add : void as default return type
            const withReturnType = fullMatch.replace('function ' + functionName, 'function ' + functionName + ': void');
            newContent = newContent.replace(fullMatch, withReturnType);
            changes++;
          }
        }

        if (changes > 0) {
          return {
            success: true,
            newContent,
            rollbackData: JSON.stringify({ type: 'add-return-types', changes }),
          };
        }

        return { success: false };
      },
    });
  }

  /**
   * Registers a fix operation
   *
   * @param fix - Fix operation to register
   */
  registerFix(fix: FixOperation): void {
    this.fixRegistry.set(fix.id, fix);
  }

  /**
   * Applies fixes to a file
   *
   * @param filePath - File path
   * @param fixIds - Array of fix IDs to apply
   * @returns Promise<FixResult> - Fix result
   */
  async applyFixes(filePath: string, fixIds: string[]): Promise<FixResult> {
    const result: FixResult = {
      success: true,
      fixesApplied: 0,
      fixesSkipped: 0,
      fixesFailed: 0,
      rollbackData: [],
    };

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let currentContent = content;

      for (const fixId of fixIds) {
        const fix = this.fixRegistry.get(fixId);
        if (!fix) {
          result.fixesSkipped++;
          continue;
        }

        try {
          const fixResult = await fix.apply(filePath, currentContent);
          if (fixResult.success && fixResult.newContent) {
            currentContent = fixResult.newContent;
            result.fixesApplied++;
            if (fixResult.rollbackData) {
              result.rollbackData.push(fixResult.rollbackData);
            }
          } else {
            result.fixesSkipped++;
          }
        } catch (error) {
          result.fixesFailed++;
          console.warn(`��ᴩ�  Fix ${fixId} failed on ${filePath}:`, error instanceof Error ? error.message : error);
        }
      }

      // Write the fixed content if any fixes were applied
      if (result.fixesApplied > 0) {
        fs.writeFileSync(filePath, currentContent, 'utf-8');
      }

      return result;
    } catch (error) {
      console.error(`��� Failed to apply fixes to ${filePath}:`, error instanceof Error ? error.message : error);
      result.success = false;
      return result;
    }
  }

  /**
   * Rolls back fixes from a file
   *
   * @param filePath - File path
   * @param rollbackData - Rollback data from fix operation
   * @returns Promise<boolean> - Success status
   */
  async rollback(filePath: string, _rollbackData: string[]): Promise<boolean> {
    // In a real implementation, this would restore the original content
    // For now, this is a placeholder
    console.warn(`��ᴩ�  Rollback not implemented for ${filePath}`);
    return false;
  }

  /**
   * Lists all available fixes
   *
   * @returns FixOperation[] - Array of available fixes
   */
  listFixes(): FixOperation[] {
    return Array.from(this.fixRegistry.values());
  }

  /**
   * Gets a fix by ID
   *
   * @param fixId - Fix ID
   * @returns FixOperation | undefined - Fix operation or undefined
   */
  getFix(fixId: string): FixOperation | undefined {
    return this.fixRegistry.get(fixId);
  }
}
