/**
 * Progress Tracker - Real Progress Tracking
 *
 * Purpose: Provides real progress tracking for phases, showing actual
 * progress instead of fake progress bars.
 *
 * @module core/progress-tracker
 * @since 2.0.0
 */
/**
 * Progress item
 */
export interface ProgressItem {
    /** Item name or description */
    name: string;
    /** Total items to process */
    total: number;
    /** Current progress */
    current: number;
    /** Start timestamp */
    startTime: number;
    /** Estimated completion time */
    estimatedCompletion?: number;
}
/**
 * Progress tracker configuration
 */
export interface ProgressTrackerConfig {
    /** Update interval in milliseconds (default: 100ms) */
    updateInterval?: number;
    /** Whether to show ETA */
    showETA?: boolean;
    /** Whether to show percentage */
    showPercentage?: boolean;
    /** Whether to show elapsed time */
    showElapsedTime?: boolean;
}
/**
 * Progress Tracker - Real progress tracking
 *
 * @class ProgressTracker
 */
export declare class ProgressTracker {
    private config;
    private currentProgress;
    private updateInterval;
    private isDisposed;
    constructor(config?: ProgressTrackerConfig);
    /**
     * Starts tracking a new progress item
     *
     * @param name - Item name
     * @param total - Total items to process
     */
    startProgress(name: string, total: number): void;
    /**
     * Cleans up resources to prevent memory leaks
     *
     * @private
     */
    private cleanup;
    /**
     * Disposes the progress tracker and cleans up all resources
     */
    dispose(): void;
    /**
     * Updates progress
     *
     * @param current - Current progress
     * @param itemName - Optional item name for current item
     */
    updateProgress(current: number, itemName?: string): void;
    /**
     * Increments progress by 1
     *
     * @param itemName - Optional item name for current item
     */
    incrementProgress(itemName?: string): void;
    /**
     * Completes the current progress tracking
     */
    completeProgress(): void;
    /**
     * Stops automatic updates
     *
     * @private
     */
    private stopUpdates;
    /**
     * Calculates ETA
     *
     * @private
     * @returns number - Estimated completion time in milliseconds
     */
    private calculateETA;
    /**
     * Renders progress bar
     *
     * @private
     * @param itemName - Optional item name for current item
     */
    private renderProgress;
    /**
     * Creates a phase progress tracker
     *
     * @static
     * @param phaseName - Phase name
     * @param fileCount - Number of files to process
     * @returns PhaseProgressTracker - Phase progress tracker
     */
    static createPhaseTracker(phaseName: string, fileCount: number): PhaseProgressTracker;
}
/**
 * Phase-specific progress tracker
 *
 * @class PhaseProgressTracker
 */
export declare class PhaseProgressTracker {
    private phaseName;
    private totalFiles;
    private processedFiles;
    private startTime;
    private tracker;
    private isDisposed;
    constructor(phaseName: string, totalFiles: number);
    /**
     * Updates progress for a file
     *
     * @param fileName - Name of the file being processed
     */
    updateFile(fileName: string): void;
    /**
     * Completes the phase progress tracking
     */
    complete(): void;
    /**
     * Disposes the phase progress tracker and cleans up all resources
     */
    dispose(): void;
    /**
     * Gets the elapsed time
     *
     * @returns number - Elapsed time in milliseconds
     */
    getElapsedTime(): number;
    /**
     * Gets the current progress percentage
     *
     * @returns number - Progress percentage (0-100)
     */
    getProgress(): number;
}
//# sourceMappingURL=progress-tracker.d.ts.map