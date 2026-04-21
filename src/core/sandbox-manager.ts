/**
 * Sandbox Manager - Isolated Environment for Safe Fix Execution
 *
 * Purpose: Creates an isolated sandbox environment to apply fixes safely
 * before applying them to the main project, preventing corruption.
 *
 * Architecture:
 * - Copies project to .aegis-tmp/ respecting .gitignore
 * - Uses git archive if repo git, or rsync as fallback
 * - Generates unified patch after fixes
 * - Cleans up sandbox after execution
 *
 * @module core/sandbox-manager
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  /** Project root directory */
  projectRoot: string;
  /** Whether to enable sandbox mode */
  enabled: boolean;
  /** Whether running in CI mode (auto-confirm large repos) */
  isCI?: boolean;
  /** Sandbox directory path (auto-generated if not provided) */
  sandboxDir?: string;
  /** Patches directory path (auto-generated if not provided) */
  patchesDir?: string;
}

/**
 * Sandbox result
 */
export interface SandboxResult {
  /** Whether sandbox was active */
  active: boolean;
  /** Sandbox directory path */
  sandboxDir: string;
  /** Patch file path (if generated) */
  patchPath?: string;
  /** Original project root */
  originalProjectRoot: string;
}

/**
 * Sandbox Manager - Isolated fix execution environment
 *
 * @class SandboxManager
 */
export class SandboxManager {
  private config: Required<SandboxConfig>;
  private sandboxDir: string;
  private patchesDir: string;
  private isActive: boolean = false;
  private originalProjectRoot: string;

  constructor(config: SandboxConfig) {
    this.originalProjectRoot = config.projectRoot;
    this.config = {
      projectRoot: config.projectRoot,
      enabled: config.enabled ?? false,
      isCI: config.isCI ?? false,
      sandboxDir: config.sandboxDir ?? path.join(config.projectRoot, '.aegis-tmp'),
      patchesDir: config.patchesDir ?? path.join(config.projectRoot, '.sentinel', 'patches'),
    };
    this.sandboxDir = this.config.sandboxDir;
    this.patchesDir = this.config.patchesDir;
  }

  /**
   * Creates sandbox environment
   *
   * @returns Promise<SandboxResult> - Sandbox result with paths
   */
  async create(): Promise<SandboxResult> {
    if (!this.config.enabled) {
      console.log('[Sandbox] Sandbox mode disabled, using direct execution');
      return {
        active: false,
        sandboxDir: this.originalProjectRoot,
        originalProjectRoot: this.originalProjectRoot,
      };
    }

    console.log('[Sandbox] Creating sandbox environment...');

    try {
      // Check if repo is git
      const isGitRepo = await this.isGitRepository();

      // Calculate repo size
      const repoSize = await this.calculateRepoSize();
      const sizeGB = repoSize / (1024 * 1024 * 1024);

      // Warn if repo is large (> 5GB)
      if (sizeGB > 5) {
        if (this.config.isCI) {
          console.log(`[Sandbox] Large repo detected (${sizeGB.toFixed(2)}GB). Proceeding in CI mode.`);
        } else {
          console.warn(`[Sandbox] WARNING: Large repo detected (${sizeGB.toFixed(2)}GB).`);
          console.warn('[Sandbox] Sandbox will use significant disk space.');
          console.warn('[Sandbox] Type "yes" to continue, or abort to run without sandbox.');
          // In interactive mode, this would require user input
          // For now, we proceed with the warning logged
        }
      }

      // Determine sandbox directory
      if (sizeGB > 2) {
        // Use system temp dir for large repos
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        this.sandboxDir = path.join(tempDir, `aegis-tmp-${timestamp}`);
        console.log(`[Sandbox] Large repo detected, using system temp: ${this.sandboxDir}`);
      }

      // Clean up existing sandbox if it exists
      if (fs.existsSync(this.sandboxDir)) {
        await this.cleanup();
      }

      // Create sandbox directory
      fs.mkdirSync(this.sandboxDir, { recursive: true });

      // Create patches directory
      fs.mkdirSync(this.patchesDir, { recursive: true });

      // Copy project to sandbox
      if (isGitRepo) {
        await this.copyWithGitArchive();
      } else {
        await this.copyWithRsync();
      }

      this.isActive = true;
      console.log(`[Sandbox] Sandbox created at ${this.sandboxDir}`);

      return {
        active: true,
        sandboxDir: this.sandboxDir,
        originalProjectRoot: this.originalProjectRoot,
      };
    } catch (error) {
      console.error('[Sandbox] Failed to create sandbox:', error);
      throw new Error(`[Sandbox] Failed to create sandbox: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks if directory is a git repository
   *
   * @private
   * @returns Promise<boolean> - Whether it's a git repository
   */
  private async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', {
        cwd: this.originalProjectRoot,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculates repository size in bytes
   *
   * @private
   * @returns Promise<number> - Size in bytes
   */
  private async calculateRepoSize(): Promise<number> {
    try {
      const { stdout } = await execAsync('du -sb .', {
        cwd: this.originalProjectRoot,
      });
      const sizeMatch = stdout.match(/^(\d+)/);
      return sizeMatch ? parseInt(sizeMatch[1], 10) : 0;
    } catch {
      // Fallback: estimate by counting files
      return this.estimateSizeByFileCount();
    }
  }

  /**
   * Estimates size by counting files (fallback)
   *
   * @private
   * @returns number - Estimated size in bytes
   */
  private estimateSizeByFileCount(): number {
    let totalSize = 0;
    const countFiles = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          countFiles(fullPath);
        } else {
          try {
            const stats = fs.statSync(fullPath);
            totalSize += stats.size;
          } catch {
            // Skip files that can't be read
          }
        }
      }
    };
    countFiles(this.originalProjectRoot);
    return totalSize;
  }

  /**
   * Copies project using git archive (respects .gitignore)
   *
   * @private
   * @returns Promise<void>
   */
  private async copyWithGitArchive(): Promise<void> {
    console.log('[Sandbox] Copying project using git archive...');
    try {
      const archivePath = path.join(this.sandboxDir, 'archive.tar');
      await execAsync(`git archive HEAD -o ${archivePath}`, {
        cwd: this.originalProjectRoot,
      });

      await execAsync(`tar -xf ${archivePath} -C ${this.sandboxDir}`, {
        cwd: this.sandboxDir,
      });

      // Remove archive file
      fs.unlinkSync(archivePath);

      console.log('[Sandbox] Project copied using git archive');
    } catch (error) {
      console.warn('[Sandbox] git archive failed, falling back to rsync');
      await this.copyWithRsync();
    }
  }

  /**
   * Copies project using rsync (fallback)
   *
   * @private
   * @returns Promise<void>
   */
  private async copyWithRsync(): Promise<void> {
    console.log('[Sandbox] Copying project using rsync...');

    try {
      // Check if .gitignore exists
      const gitignorePath = path.join(this.originalProjectRoot, '.gitignore');
      const excludeArgs = fs.existsSync(gitignorePath)
        ? '--exclude-from=.gitignore'
        : '--exclude=node_modules --exclude=.git --exclude=dist --exclude=build';

      await execAsync(
        `rsync -av --progress ${excludeArgs} ${this.originalProjectRoot}/ ${this.sandboxDir}/`,
        {
          cwd: this.originalProjectRoot,
        }
      );

      console.log('[Sandbox] Project copied using rsync');
    } catch (error) {
      console.warn('[Sandbox] rsync failed, falling back to manual copy');
      await this.copyManual();
    }
  }

  /**
   * Copies project manually (last resort)
   *
   * @private
   * @returns Promise<void>
   */
  private async copyManual(): Promise<void> {
    console.log('[Sandbox] Copying project manually...');

    const entries = await fs.promises.readdir(this.originalProjectRoot, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(this.originalProjectRoot, entry.name);
      const destPath = path.join(this.sandboxDir, entry.name);

      // Skip certain directories
      if (['.git', '.aegis-tmp', '.aegis-sandbox', 'node_modules', 'dist', 'build'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    console.log('[Sandbox] Project copied manually');
  }

  /**
   * Copies a directory recursively
   *
   * @private
   * @param src - Source directory
   * @param dest - Destination directory
   * @returns Promise<void>
   */
  private async copyDirectoryRecursive(src: string, dest: string): Promise<void> {
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Generates unified patch between original and sandbox
   *
   * @returns Promise<string | undefined> - Path to patch file if generated
   */
  async generatePatch(): Promise<string | undefined> {
    if (!this.isActive) {
      return undefined;
    }

    console.log('[Sandbox] Generating unified patch...');

    try {
      const timestamp = Date.now();
      const patchFile = path.join(this.patchesDir, `aegis-fixes-${timestamp}.patch`);

      // Generate patch using diff
      await execAsync(
        `diff -ruN ${this.originalProjectRoot} ${this.sandboxDir} > ${patchFile} || true`,
        {
          cwd: this.originalProjectRoot,
        }
      );

      // Check if patch has content
      const stats = fs.statSync(patchFile);
      if (stats.size === 0) {
        fs.unlinkSync(patchFile);
        console.log('[Sandbox] No changes detected, patch file removed');
        return undefined;
      }

      console.log(`[Sandbox] Patch generated: ${patchFile}`);
      console.log('[Sandbox] To apply: git apply .sentinel/patches/aegis-fixes-{timestamp}.patch');

      return patchFile;
    } catch (error) {
      console.error('[Sandbox] Failed to generate patch:', error);
      return undefined;
    }
  }

  /**
   * Cleans up sandbox directory
   *
   * @returns Promise<void>
   */
  async cleanup(): Promise<void> {
    if (!fs.existsSync(this.sandboxDir)) {
      return;
    }

    console.log('[Sandbox] Cleaning up sandbox...');

    try {
      fs.rmSync(this.sandboxDir, { recursive: true, force: true });
      this.isActive = false;
      console.log('[Sandbox] Sandbox cleaned up successfully');
    } catch (error) {
      console.error('[Sandbox] Failed to cleanup sandbox:', error);
      // Don't throw, just log
    }
  }

  /**
   * Gets sandbox status
   *
   * @returns SandboxResult - Current sandbox status
   */
  getStatus(): SandboxResult {
    return {
      active: this.isActive,
      sandboxDir: this.sandboxDir,
      originalProjectRoot: this.originalProjectRoot,
    };
  }

  /**
   * Gets the sandbox directory path
   *
   * @returns string - Sandbox directory path
   */
  getSandboxDir(): string {
    return this.sandboxDir;
  }

  /**
   * Gets the original project root
   *
   * @returns string - Original project root
   */
  getOriginalProjectRoot(): string {
    return this.originalProjectRoot;
  }
}
