/**
 * GitCheckpointManager - Git-based Checkpointing for Safe Rollback
 *
 * Purpose: Create automatic git checkpoints before applying fixes,
 * and provide rollback capability if fixes break the build.
 *
 * This ensures that any destructive changes can be safely reverted
 * if the post-fix validation (tsc --noEmit) fails.
 *
 * @module core/git-checkpoint-manager
 * @since 1.1.0
 */

import { execSafe } from './command-sanitizer.js';
import { RetryHelper } from './retry-helper.js';
import { FileIntegrityChecker } from './file-integrity-checker.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Git checkpoint information
 */
interface GitCheckpoint {
  /** Commit hash of the checkpoint */
  commitHash: string;
  /** Tag name (e.g., aegis-pre-fix) */
  tagName: string;
  /** Timestamp when checkpoint was created */
  timestamp: Date;
  /** Whether the repository was clean at checkpoint time */
  wasClean: boolean;
  /** Branch name at checkpoint time */
  branchName: string;
  /** Stash name (level 3 fallback) */
  stashName?: string;
  /** Directory snapshot path (level 4 fallback) */
  snapshotPath?: string;
}

/**
 * GitCheckpointManager - Git-based checkpointing and rollback
 *
 * This class provides automatic checkpointing before applying fixes
 * and rollback capability if validation fails.
 *
 * @class GitCheckpointManager
 * @example
 * ```typescript
 * const checkpointManager = new GitCheckpointManager('/path/to/project');
 * const checkpoint = await checkpointManager.createCheckpoint();
 * // ... apply fixes ...
 * const isValid = await validateWithTsc();
 * if (!isValid) {
 *   await checkpointManager.rollback(checkpoint);
 * }
 * ```
 */
export class GitCheckpointManager {
  private projectRoot: string;
  private currentCheckpoint: GitCheckpoint | null = null;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Checks if the git repository is clean (no uncommitted changes)
   *
   * @returns Promise<boolean> - True if repository is clean
   */
  async isRepositoryClean(): Promise<boolean> {
    const retryHelper = new RetryHelper();
    const result = await retryHelper.executeWithRetry(
      async () => {
        const { stdout } = await execSafe('git', ['status', '--porcelain'], {
          cwd: this.projectRoot,
        });
        return stdout.trim().length === 0;
      },
      { maxRetries: 3, initialBackoffMs: 1000 }
    );

    if (result.success && result.result !== undefined) {
      return result.result;
    }

    console.warn('[GitCheckpointManager] Failed to check repository status after retries:', result.error);
    return false;
  }

  /**
   * Gets current branch name
   *
   * @private
   * @returns Promise<string> - Current branch name
   */
  private async getCurrentBranch(): Promise<string> {
    const retryHelper = new RetryHelper();
    const result = await retryHelper.executeWithRetry(
      async () => {
        const { stdout } = await execSafe('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
          cwd: this.projectRoot,
        });
        return stdout.trim();
      },
      { maxRetries: 3, initialBackoffMs: 1000 }
    );

    if (result.success && result.result !== undefined) {
      return result.result;
    }

    console.warn('[GitCheckpointManager] Failed to get current branch after retries:', result.error);
    return 'unknown';
  }

  /**
   * Gets current commit hash
   *
   * @private
   * @returns Promise<string> - Current commit hash
   */
  private async getCurrentCommit(): Promise<string> {
    const retryHelper = new RetryHelper();
    const result = await retryHelper.executeWithRetry(
      async () => {
        const { stdout } = await execSafe('git', ['rev-parse', 'HEAD'], {
          cwd: this.projectRoot,
        });
        return stdout.trim();
      },
      { maxRetries: 3, initialBackoffMs: 1000 }
    );

    if (result.success && result.result !== undefined) {
      return result.result;
    }

    console.warn('[GitCheckpointManager] Failed to get current commit after retries:', result.error);
    return 'unknown';
  }

  /**
   * Creates a git checkpoint before applying fixes
   *
   * @param tagName - Optional custom tag name (default: aegis-pre-fix)
   * @param enableMultiLevel - Whether to enable multi-level rollback (default: true)
   * @returns Promise<GitCheckpoint> - Checkpoint information
   */
  async createCheckpoint(tagName: string = 'aegis-pre-fix', enableMultiLevel: boolean = true): Promise<GitCheckpoint> {
    console.log('[GitCheckpointManager] Creating git checkpoint (multi-level rollback enabled)...');
    
    // Check if repository is clean
    const isClean = await this.isRepositoryClean();
    
    if (!isClean) {
      console.warn('[GitCheckpointManager] Repository has uncommitted changes');
      console.warn('[GitCheckpointManager] Committing changes before creating checkpoint...');

      const retryHelper = new RetryHelper();

      // Stage all changes
      try {
        await retryHelper.executeWithRetry(
          async () => {
            await execSafe('git', ['add', '-A'], { cwd: this.projectRoot });
          },
          { maxRetries: 3, initialBackoffMs: 1000 }
        );

        // Create commit
        const timestamp = new Date().toISOString();
        await retryHelper.executeWithRetry(
          async () => {
            await execSafe(
              'git',
              ['commit', '-m', `aegis-checkpoint: ${timestamp}`],
              { cwd: this.projectRoot }
            );
          },
          { maxRetries: 3, initialBackoffMs: 1000 }
        );

        console.log('[GitCheckpointManager] Committed uncommitted changes');
      } catch (error) {
        console.error('[GitCheckpointManager] Failed to commit changes:', error);
        throw new Error('Cannot create checkpoint: failed to commit uncommitted changes');
      }
    }

    // Get current commit hash
    const commitHash = await this.getCurrentCommit();
    const branchName = await this.getCurrentBranch();

    // Create tag
    try {
      const retryHelper = new RetryHelper();

      // Delete existing tag if it exists
      try {
        await retryHelper.executeWithRetry(
          async () => {
            await execSafe('git', ['tag', '-d', tagName], { cwd: this.projectRoot });
          },
          { maxRetries: 2, initialBackoffMs: 500 }
        );
      } catch {
        // Tag doesn't exist, ignore error
      }

      // Create new tag
      await retryHelper.executeWithRetry(
        async () => {
          await execSafe('git', ['tag', tagName], { cwd: this.projectRoot });
        },
        { maxRetries: 3, initialBackoffMs: 1000 }
      );

      console.log(`[GitCheckpointManager] Created checkpoint: ${tagName} (${commitHash})`);
    } catch (error) {
      console.warn('[GitCheckpointManager] Failed to create tag, using commit hash instead:', error);
    }

    const checkpoint: GitCheckpoint = {
      commitHash,
      tagName,
      timestamp: new Date(),
      wasClean: isClean,
      branchName,
    };

    // Level 3: Create git stash as fallback
    if (enableMultiLevel) {
      try {
        const stashName = await this.createStash();
        checkpoint.stashName = stashName;
        console.log(`[GitCheckpointManager] Level 3 fallback: Created stash ${stashName}`);
      } catch (error) {
        console.warn('[GitCheckpointManager] Failed to create stash (Level 3 fallback):', error);
      }

      // Level 4: Create directory snapshot as final fallback
      try {
        const snapshotPath = await this.createDirectorySnapshot();
        checkpoint.snapshotPath = snapshotPath;
        console.log(`[GitCheckpointManager] Level 4 fallback: Created directory snapshot ${snapshotPath}`);
      } catch (error) {
        console.warn('[GitCheckpointManager] Failed to create directory snapshot (Level 4 fallback):', error);
      }
    }

    this.currentCheckpoint = checkpoint;
    return checkpoint;
  }

  /**
   * Creates a git stash as fallback (Level 3)
   *
   * @private
   * @returns Promise<string> - Stash name
   */
  private async createStash(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stashName = `aegis-rollback-${timestamp}`;
    
    const retryHelper = new RetryHelper();
    await retryHelper.executeWithRetry(
      async () => {
        await execSafe('git', ['stash', 'push', '-m', stashName, '-u'], { cwd: this.projectRoot });
      },
      { maxRetries: 3, initialBackoffMs: 1000 }
    );

    return stashName;
  }

  /**
   * Creates a directory snapshot as fallback (Level 4)
   *
   * @private
   * @returns Promise<string> - Snapshot directory path
   */
  private async createDirectorySnapshot(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotDir = path.join(this.projectRoot, '.aegis-cache', 'snapshots', timestamp);
    
    // Create snapshot directory
    fs.mkdirSync(snapshotDir, { recursive: true });

    // Create snapshot using FileIntegrityChecker
    const snapshot = await FileIntegrityChecker.createSnapshot(this.projectRoot);
    
    // Store snapshot metadata
    const metadataPath = path.join(snapshotDir, 'snapshot-metadata.json');
    const metadata = {
      timestamp: new Date().toISOString(),
      snapshot: Object.fromEntries(snapshot),
      projectRoot: this.projectRoot,
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    return snapshotDir;
  }

  /**
   * Rollbacks to a specific checkpoint with multi-level fallback
   *
   * @param checkpoint - Checkpoint to rollback to
   * @returns Promise<{ success: boolean; level: string; error?: string }>
   */
  async rollback(checkpoint: GitCheckpoint): Promise<{ success: boolean; level: string; error?: string }> {
    console.log(`[GitCheckpointManager] Starting multi-level rollback to checkpoint: ${checkpoint.tagName} (${checkpoint.commitHash})`);

    // Level 1: Git reset to checkpoint commit
    console.log('[GitCheckpointManager] Level 1: Attempting git reset to checkpoint commit...');
    try {
      const retryHelper = new RetryHelper();
      const result = await retryHelper.executeWithRetry(
        async () => {
          await execSafe('git', ['reset', '--hard', checkpoint.commitHash], {
            cwd: this.projectRoot,
          });
        },
        { maxRetries: 3, initialBackoffMs: 1000 }
      );

      if (result.success) {
        console.log(`[GitCheckpointManager] Level 1 SUCCESS: Rolled back to ${checkpoint.commitHash}`);
        return { success: true, level: 'git-reset' };
      } else {
        throw new Error(String(result.error));
      }
    } catch (error) {
      console.error('[GitCheckpointManager] Level 1 FAILED:', error);
    }

    // Level 2: Git stash pop (if stash exists)
    if (checkpoint.stashName) {
      console.log('[GitCheckpointManager] Level 2: Attempting git stash pop...');
      try {
        const retryHelper = new RetryHelper();
        const result = await retryHelper.executeWithRetry(
          async () => {
            await execSafe('git', ['stash', 'pop'], { cwd: this.projectRoot });
          },
          { maxRetries: 3, initialBackoffMs: 1000 }
        );

        if (result.success) {
          console.log('[GitCheckpointManager] Level 2 SUCCESS: Restored from stash');
          return { success: true, level: 'git-stash' };
        } else {
          throw new Error(String(result.error));
        }
      } catch (error) {
        console.error('[GitCheckpointManager] Level 2 FAILED:', error);
      }
    }

    // Level 3: Directory snapshot restore (if snapshot exists)
    if (checkpoint.snapshotPath) {
      console.log('[GitCheckpointManager] Level 3: Attempting directory snapshot restore...');
      try {
        await this.restoreFromSnapshot(checkpoint.snapshotPath);
        console.log('[GitCheckpointManager] Level 3 SUCCESS: Restored from directory snapshot');
        return { success: true, level: 'directory-snapshot' };
      } catch (error) {
        console.error('[GitCheckpointManager] Level 3 FAILED:', error);
      }
    }

    // All levels failed
    const error = 'All rollback levels failed. Manual intervention required.';
    console.error('[GitCheckpointManager]', error);
    return { success: false, level: 'none', error };
  }

  /**
   * Restores project from directory snapshot
   *
   * @private
   * @param snapshotPath - Path to snapshot directory
   * @returns Promise<void>
   */
  private async restoreFromSnapshot(snapshotPath: string): Promise<void> {
    const metadataPath = path.join(snapshotPath, 'snapshot-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Snapshot metadata not found');
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    // Verify project root matches
    if (metadata.projectRoot !== this.projectRoot) {
      throw new Error('Snapshot project root mismatch');
    }

    // Restore files from snapshot
    const snapshot = new Map<string, unknown>(Object.entries(metadata.snapshot));
    
    for (const [filePath, checksum] of snapshot.entries()) {
      const fullPath = path.join(this.projectRoot, filePath);
      
      if (fs.existsSync(fullPath)) {
        const currentChecksum = await FileIntegrityChecker.calculateChecksum(fullPath);
        if (currentChecksum.checksum === checksum.checksum) {
          continue; // File unchanged, skip
        }
      }
      
      // Restore file from snapshot
      const snapshotFilePath = path.join(snapshotPath, filePath);
      if (fs.existsSync(snapshotFilePath)) {
        fs.copyFileSync(snapshotFilePath, fullPath);
      }
    }

    console.log('[GitCheckpointManager] Restored files from snapshot');
  }

  /**
   * Rollbacks to the last checkpoint
   *
   * @returns Promise<void>
   */
  async rollbackToLastCheckpoint(): Promise<void> {
    if (!this.currentCheckpoint) {
      throw new Error('No checkpoint available for rollback');
    }
    
    await this.rollback(this.currentCheckpoint);
  }

  /**
   * Checks if a checkpoint exists
   *
   * @param tagName - Tag name to check
   * @returns Promise<boolean> - True if checkpoint exists
   */
  async checkpointExists(tagName: string): Promise<boolean> {
    const retryHelper = new RetryHelper();
    const result = await retryHelper.executeWithRetry(
      async () => {
        const { stdout } = await execSafe('git', ['tag', '-l', tagName], {
          cwd: this.projectRoot,
        });
        return stdout.trim() === tagName;
      },
      { maxRetries: 3, initialBackoffMs: 1000 }
    );

    if (result.success && result.result !== undefined) {
      return result.result;
    }

    return false;
  }

  /**
   * Gets the current checkpoint
   *
   * @returns GitCheckpoint | null - Current checkpoint or null
   */
  getCurrentCheckpoint(): GitCheckpoint | null {
    return this.currentCheckpoint;
  }

  /**
   * Clears the current checkpoint reference
   */
  clearCheckpoint(): void {
    this.currentCheckpoint = null;
  }

  /**
   * Deletes a checkpoint tag
   *
   * @param tagName - Tag name to delete
   * @returns Promise<void>
   */
  async deleteCheckpoint(tagName: string): Promise<void> {
    try {
      await execSafe('git', ['tag', '-d', tagName], { cwd: this.projectRoot });
      console.log(`[GitCheckpointManager] Deleted checkpoint: ${tagName}`);
    } catch (error) {
      console.warn(`[GitCheckpointManager] Failed to delete checkpoint ${tagName}:`, error);
    }
  }

  /**
   * Validates that the repository is in a git repository
   *
   * @returns Promise<boolean> - True if in a git repository
   */
  async isInGitRepository(): Promise<boolean> {
    try {
      await execSafe('git', ['rev-parse', '--git-dir'], { cwd: this.projectRoot });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a checkpoint with stash before Phase 16 (Fix Strategy Generation)
   * This is the primary checkpoint method for the hardening flow.
   *
   * @param requireConfirmation - Whether to require user confirmation if there are uncommitted changes
   * @returns Promise<{ success: boolean; stashRef?: string; error?: string }>
   */
  async createCheckpointBeforeFixes(requireConfirmation: boolean = true): Promise<{ success: boolean; stashRef?: string; error?: string }> {
    console.log('[GitCheckpointManager] Creating checkpoint before fixes...');

    // Check if in git repository
    const isGitRepo = await this.isInGitRepository();
    if (!isGitRepo) {
      const error = 'Not in a git repository. Cannot create safety checkpoint.';
      console.error('[GitCheckpointManager]', error);
      return { success: false, error };
    }

    // Check if repository is clean
    const isClean = await this.isRepositoryClean();
    if (!isClean) {
      console.warn('[GitCheckpointManager] Repository has uncommitted changes');
      if (requireConfirmation) {
        console.warn('[GitCheckpointManager] Uncommitted changes detected.');
        console.warn('[GitCheckpointManager] Continuing will create a stash to preserve your changes.');
        console.warn('[GitCheckpointManager] Type "yes" to continue, or abort to commit your changes first.');
        // In non-interactive mode, we proceed with the stash
        // In interactive mode, this would require user input (handled by caller)
      }
    }

    // Create stash with descriptive name
    const timestamp = new Date().toISOString();
    const stashMessage = `aegis-qa-checkpoint-${timestamp}`;
    let stashRef: string | undefined;

    try {
      const retryHelper = new RetryHelper();
      const result = await retryHelper.executeWithRetry(
        async () => {
          // Use --no-verify to bypass git hooks that could execute arbitrary code
          await execSafe('git', ['stash', 'push', '--no-verify', '-m', stashMessage, '-u'], {
            cwd: this.projectRoot,
          });
        },
        { maxRetries: 3, initialBackoffMs: 1000 }
      );

      if (result.success) {
        // Get the stash reference
        const stashListResult = await retryHelper.executeWithRetry(
          async () => {
            const { stdout } = await execSafe('git', ['stash', 'list'], { cwd: this.projectRoot });
            return stdout.trim();
          },
          { maxRetries: 3, initialBackoffMs: 1000 }
        );

        if (stashListResult.success && stashListResult.result) {
          const stashLines = stashListResult.result.split('\n');
          const latestStash = stashLines[0];
          // Extract stash ref (e.g., "stash@{0}")
          const stashRefMatch = latestStash.match(/stash@\{\d+\}/);
          if (stashRefMatch) {
            stashRef = stashRefMatch[0];
          }
        }

        console.log(`[GitCheckpointManager] Checkpoint created: ${stashRef} (${stashMessage})`);
        console.log(`[GitCheckpointManager] To revert all fixes: git stash pop`);
      } else {
        throw new Error(String(result.error));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[GitCheckpointManager] Failed to create stash:', errorMessage);
      return { success: false, error: errorMessage };
    }

    return { success: true, stashRef };
  }

  /**
   * Restores from stash (for catastrophic failure recovery)
   * Uses git stash apply + git stash drop to avoid hooks
   *
   * @param stashRef - Stash reference to restore (e.g., "stash@{0}")
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async restoreFromStash(stashRef: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[GitCheckpointManager] Attempting to restore from stash: ${stashRef}`);

    try {
      const retryHelper = new RetryHelper();

      // Use git stash apply instead of pop to avoid triggering hooks
      const applyResult = await retryHelper.executeWithRetry(
        async () => {
          await execSafe('git', ['stash', 'apply', stashRef], { cwd: this.projectRoot });
        },
        { maxRetries: 3, initialBackoffMs: 1000 }
      );

      if (!applyResult.success) {
        throw new Error(String(applyResult.error));
      }

      // Drop the stash after successful apply
      const dropResult = await retryHelper.executeWithRetry(
        async () => {
          await execSafe('git', ['stash', 'drop', stashRef], { cwd: this.projectRoot });
        },
        { maxRetries: 3, initialBackoffMs: 1000 }
      );

      if (!dropResult.success) {
        console.warn('[GitCheckpointManager] Failed to drop stash after apply:', dropResult.error);
      }

      console.log(`[GitCheckpointManager] Successfully restored from stash: ${stashRef}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[GitCheckpointManager] Failed to restore from stash:', errorMessage);
      console.error(`[GitCheckpointManager] Manual recovery required: git stash pop ${stashRef}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets the latest stash reference
   *
   * @returns Promise<string | null> - Latest stash reference or null
   */
  async getLatestStashRef(): Promise<string | null> {
    try {
      const retryHelper = new RetryHelper();
      const result = await retryHelper.executeWithRetry(
        async () => {
          const { stdout } = await execSafe('git', ['stash', 'list'], { cwd: this.projectRoot });
          return stdout.trim();
        },
        { maxRetries: 3, initialBackoffMs: 1000 }
      );

      if (result.success && result.result) {
        const stashLines = result.result.split('\n');
        if (stashLines.length > 0) {
          const latestStash = stashLines[0];
          const stashRefMatch = latestStash.match(/stash@\{\d+\}/);
          if (stashRefMatch) {
            return stashRefMatch[0];
          }
        }
      }
      return null;
    } catch (error) {
      console.warn('[GitCheckpointManager] Failed to get latest stash ref:', error);
      return null;
    }
  }
}
