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
export declare class GitCheckpointManager {
    private projectRoot;
    private currentCheckpoint;
    constructor(projectRoot: string);
    /**
     * Checks if the git repository is clean (no uncommitted changes)
     *
     * @returns Promise<boolean> - True if repository is clean
     */
    isRepositoryClean(): Promise<boolean>;
    /**
     * Gets current branch name
     *
     * @private
     * @returns Promise<string> - Current branch name
     */
    private getCurrentBranch;
    /**
     * Gets current commit hash
     *
     * @private
     * @returns Promise<string> - Current commit hash
     */
    private getCurrentCommit;
    /**
     * Creates a git checkpoint before applying fixes
     *
     * @param tagName - Optional custom tag name (default: aegis-pre-fix)
     * @param enableMultiLevel - Whether to enable multi-level rollback (default: true)
     * @returns Promise<GitCheckpoint> - Checkpoint information
     */
    createCheckpoint(tagName?: string, enableMultiLevel?: boolean): Promise<GitCheckpoint>;
    /**
     * Creates a git stash as fallback (Level 3)
     *
     * @private
     * @returns Promise<string> - Stash name
     */
    private createStash;
    /**
     * Creates a directory snapshot as fallback (Level 4)
     *
     * @private
     * @returns Promise<string> - Snapshot directory path
     */
    private createDirectorySnapshot;
    /**
     * Rollbacks to a specific checkpoint with multi-level fallback
     *
     * @param checkpoint - Checkpoint to rollback to
     * @returns Promise<{ success: boolean; level: string; error?: string }>
     */
    rollback(checkpoint: GitCheckpoint): Promise<{
        success: boolean;
        level: string;
        error?: string;
    }>;
    /**
     * Restores project from directory snapshot
     *
     * @private
     * @param snapshotPath - Path to snapshot directory
     * @returns Promise<void>
     */
    private restoreFromSnapshot;
    /**
     * Rollbacks to the last checkpoint
     *
     * @returns Promise<void>
     */
    rollbackToLastCheckpoint(): Promise<void>;
    /**
     * Checks if a checkpoint exists
     *
     * @param tagName - Tag name to check
     * @returns Promise<boolean> - True if checkpoint exists
     */
    checkpointExists(tagName: string): Promise<boolean>;
    /**
     * Gets the current checkpoint
     *
     * @returns GitCheckpoint | null - Current checkpoint or null
     */
    getCurrentCheckpoint(): GitCheckpoint | null;
    /**
     * Clears the current checkpoint reference
     */
    clearCheckpoint(): void;
    /**
     * Deletes a checkpoint tag
     *
     * @param tagName - Tag name to delete
     * @returns Promise<void>
     */
    deleteCheckpoint(tagName: string): Promise<void>;
    /**
     * Validates that the repository is in a git repository
     *
     * @returns Promise<boolean> - True if in a git repository
     */
    isInGitRepository(): Promise<boolean>;
    /**
     * Creates a checkpoint with stash before Phase 16 (Fix Strategy Generation)
     * This is the primary checkpoint method for the hardening flow.
     *
     * @param requireConfirmation - Whether to require user confirmation if there are uncommitted changes
     * @returns Promise<{ success: boolean; stashRef?: string; error?: string }>
     */
    createCheckpointBeforeFixes(requireConfirmation?: boolean): Promise<{
        success: boolean;
        stashRef?: string;
        error?: string;
    }>;
    /**
     * Restores from stash (for catastrophic failure recovery)
     * Uses git stash apply + git stash drop to avoid hooks
     *
     * @param stashRef - Stash reference to restore (e.g., "stash@{0}")
     * @returns Promise<{ success: boolean; error?: string }>
     */
    restoreFromStash(stashRef: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Gets the latest stash reference
     *
     * @returns Promise<string | null> - Latest stash reference or null
     */
    getLatestStashRef(): Promise<string | null>;
}
export {};
//# sourceMappingURL=git-checkpoint-manager.d.ts.map