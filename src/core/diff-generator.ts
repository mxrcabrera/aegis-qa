/**
 * DiffGenerator - Unified Diff Generation for Dry-Run Mode
 *
 * Purpose: Generate unified diff files (.patch) for proposed fixes
 * when running in dry-run mode. This allows users to review changes
 * before applying them to the codebase.
 *
 * @module core/diff-generator
 * @since 1.1.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * File diff information
 */
interface FileDiff {
  /** Original file path */
  filePath: string;
  /** Original content */
  originalContent: string;
  /** Modified content */
  modifiedContent: string;
  /** Diff in unified format */
  unifiedDiff: string;
}

/**
 * Diff generation result
 */
interface DiffResult {
  /** Total number of files with diffs */
  totalFiles: number;
  /** Total number of lines changed */
  totalLinesChanged: number;
  /** Array of file diffs */
  diffs: FileDiff[];
  /** Path to the generated patch file */
  patchFilePath: string;
}

/**
 * DiffGenerator - Unified diff generation for dry-run mode
 *
 * This class generates unified diff files for proposed fixes,
 * allowing users to review changes before applying them.
 *
 * @class DiffGenerator
 */
export class DiffGenerator {
  private patchesDir: string;

  constructor(projectRoot: string) {
    this.patchesDir = path.join(projectRoot, 'aegis-patches');
  }

  /**
   * Ensures the patches directory exists
   *
   * @private
   * @returns Promise<void>
   */
  private async ensurePatchesDir(): Promise<void> {
    try {
      await fs.promises.mkdir(this.patchesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Generates a unified diff between two strings
   *
   * @private
   * @param original - Original content
   * @param modified - Modified content
   * @param filePath - File path for the diff header
   * @returns string - Unified diff string
   */
  private generateUnifiedDiff(original: string, modified: string, filePath: string): string {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const diff: string[] = [];
    diff.push(`--- a/${filePath}`);
    diff.push(`+++ b/${filePath}`);
    
    let i = 0;
    let j = 0;
    
    while (i < originalLines.length || j < modifiedLines.length) {
      // Find next difference
      while (i < originalLines.length && j < modifiedLines.length && originalLines[i] === modifiedLines[j]) {
        i++;
        j++;
      }
      
      // Count deletions
      let deletions = 0;
      let tempI = i;
      while (tempI < originalLines.length && (j >= modifiedLines.length || originalLines[tempI] !== modifiedLines[j])) {
        deletions++;
        tempI++;
      }
      
      // Count additions
      let additions = 0;
      let tempJ = j;
      while (tempJ < modifiedLines.length && (i >= originalLines.length || originalLines[i] !== modifiedLines[tempJ])) {
        additions++;
        tempJ++;
      }
      
      if (deletions > 0 || additions > 0) {
        const contextStart = Math.max(0, Math.min(i, j) - 3);
        
        const contextLinesOriginal = originalLines.slice(contextStart, i).length;
        const contextLinesModified = modifiedLines.slice(contextStart, j).length;
        
        diff.push(`@@ -${contextStart + 1},${contextLinesOriginal} +${contextStart + 1},${contextLinesModified} @@`);
        
        // Context before
        for (let k = contextStart; k < i; k++) {
          diff.push(` ${originalLines[k]}`);
        }
        
        // Deletions
        for (let k = i; k < i + deletions; k++) {
          diff.push(`-${originalLines[k]}`);
        }
        
        // Additions
        for (let k = j; k < j + additions; k++) {
          diff.push(`+${modifiedLines[k]}`);
        }
        
        // Context after
        for (let k = i + deletions; k < Math.min(originalLines.length, i + deletions + 3); k++) {
          diff.push(` ${originalLines[k]}`);
        }
        
        i += deletions;
        j += additions;
      } else {
        i++;
        j++;
      }
    }
    
    return diff.join('\n');
  }

  /**
   * Generates a diff for a single file
   *
   * @param filePath - File path (relative to project root)
   * @param originalContent - Original file content
   * @param modifiedContent - Modified file content
   * @returns FileDiff - File diff information
   */
  generateFileDiff(filePath: string, originalContent: string, modifiedContent: string): FileDiff {
    const unifiedDiff = this.generateUnifiedDiff(originalContent, modifiedContent, filePath);
    
    return {
      filePath,
      originalContent,
      modifiedContent,
      unifiedDiff,
    };
  }

  /**
   * Generates a combined patch file from multiple file diffs
   *
   * @param diffs - Array of file diffs
   * @param patchFileName - Name of the patch file (default: proposal.patch)
   * @returns Promise<DiffResult> - Diff generation result
   */
  async generatePatchFile(diffs: FileDiff[], patchFileName: string = 'proposal.patch'): Promise<DiffResult> {
    await this.ensurePatchesDir();
    
    const patchFilePath = path.join(this.patchesDir, patchFileName);
    
    let totalLinesChanged = 0;
    const patchContent: string[] = [];
    
    for (const diff of diffs) {
      if (diff.unifiedDiff.trim().length > 0) {
        patchContent.push(diff.unifiedDiff);
        // Count lines changed (additions + deletions)
        const additions = (diff.unifiedDiff.match(/^\+/gm) || []).length;
        const deletions = (diff.unifiedDiff.match(/^-/gm) || []).length;
        totalLinesChanged += additions + deletions;
      }
    }
    
    // Add header
    const header = [
      `# Aegis QA - Proposed Fixes`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total files: ${diffs.length}`,
      `# Total lines changed: ${totalLinesChanged}`,
      `#`,
      `# To apply these patches, run:`,
      `#   git apply ${patchFileName}`,
      `#`,
      '',
    ];
    
    const fullContent = header.concat(patchContent).join('\n');
    
    await fs.promises.writeFile(patchFilePath, fullContent, 'utf-8');
    
    console.log(`[DiffGenerator] Patch file generated: ${patchFilePath}`);
    console.log(`[DiffGenerator] Total files: ${diffs.length}`);
    console.log(`[DiffGenerator] Total lines changed: ${totalLinesChanged}`);
    
    return {
      totalFiles: diffs.length,
      totalLinesChanged,
      diffs,
      patchFilePath,
    };
  }

  /**
   * Gets the patches directory path
   *
   * @returns string - Path to patches directory
   */
  getPatchesDir(): string {
    return this.patchesDir;
  }

  /**
   * Clears all patches from the patches directory
   *
   * @returns Promise<void>
   */
  async clearPatches(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.patchesDir);
      
      for (const file of files) {
        if (file.endsWith('.patch')) {
          const filePath = path.join(this.patchesDir, file);
          await fs.promises.unlink(filePath);
        }
      }
      
      console.log(`[DiffGenerator] Cleared all patches from ${this.patchesDir}`);
    } catch (error) {
      console.warn('[DiffGenerator] Failed to clear patches:', error);
    }
  }

  /**
   * Lists all patch files in the patches directory
   *
   * @returns Promise<string[]> - Array of patch file names
   */
  async listPatches(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.patchesDir);
      return files.filter(file => file.endsWith('.patch'));
    } catch (error) {
      return [];
    }
  }
}
