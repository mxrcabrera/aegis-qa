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

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: this.projectRoot,
      });
      return stdout.trim().length === 0;
    } catch (error) {
      console.warn('[GitCheckpointManager] Failed to check repository status:', error);
      return false;
    }
  }

  /**
   * Gets current branch name
   *
   * @private
   * @returns Promise<string> - Current branch name
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectRoot,
      });
      return stdout.trim();
    } catch (error) {
      console.warn('[GitCheckpointManager] Failed to get current branch:', error);
      return 'unknown';
    }
  }

  /**
   * Gets current commit hash
   *
   * @private
   * @returns Promise<string> - Current commit hash
   */
  private async getCurrentCommit(): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', {
        cwd: this.projectRoot,
      });
      return stdout.trim();
    } catch (error) {
      console.warn('[GitCheckpointManager] Failed to get current commit:', error);
      return 'unknown';
    }
  }

  /**
   * Creates a git checkpoint before applying fixes
   *
   * @param tagName - Optional custom tag name (default: aegis-pre-fix)
   * @returns Promise<GitCheckpoint> - Checkpoint information
   */
  async createCheckpoint(tagName: string = 'aegis-pre-fix'): Promise<GitCheckpoint> {
    console.log('[GitCheckpointManager] Creating git checkpoint...');
    
    // Check if repository is clean
    const isClean = await this.isRepositoryClean();
    
    if (!isClean) {
      console.warn('[GitCheckpointManager] Repository has uncommitted changes');
      console.warn('[GitCheckpointManager] Committing changes before creating checkpoint...');
      
      // Stage all changes
      try {
        await execAsync('git add -A', { cwd: this.projectRoot });
        
        // Create commit
        const timestamp = new Date().toISOString();
        await execAsync(
          `git commit -m "aegis-checkpoint: ${timestamp}"`,
          { cwd: this.projectRoot }
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
      // Delete existing tag if it exists
      await execAsync(`git tag -d ${tagName} 2>nul || exit 0`, {
        cwd: this.projectRoot,
      });
      
      // Create new tag
      await execAsync(`git tag ${tagName}`, { cwd: this.projectRoot });
      
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

    this.currentCheckpoint = checkpoint;
    return checkpoint;
  }

  /**
   * Rollbacks to a specific checkpoint
   *
   * @param checkpoint - Checkpoint to rollback to
   * @returns Promise<void>
   */
  async rollback(checkpoint: GitCheckpoint): Promise<void> {
    console.log(`[GitCheckpointManager] Rolling back to checkpoint: ${checkpoint.tagName} (${checkpoint.commitHash})`);
    
    try {
      // Hard reset to checkpoint commit
      await execAsync(`git reset --hard ${checkpoint.commitHash}`, {
        cwd: this.projectRoot,
      });
      
      console.log(`[GitCheckpointManager] Successfully rolled back to ${checkpoint.commitHash}`);
    } catch (error) {
      console.error('[GitCheckpointManager] Failed to rollback:', error);
      throw new Error(`Failed to rollback to checkpoint: ${checkpoint.commitHash}`);
    }
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
    try {
      const { stdout } = await execAsync(`git tag -l ${tagName}`, {
        cwd: this.projectRoot,
      });
      return stdout.trim() === tagName;
    } catch (error) {
      return false;
    }
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
      await execAsync(`git tag -d ${tagName}`, { cwd: this.projectRoot });
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
      await execAsync('git rev-parse --git-dir', { cwd: this.projectRoot });
      return true;
    } catch (error) {
      return false;
    }
  }
}
