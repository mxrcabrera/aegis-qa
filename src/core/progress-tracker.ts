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
export class ProgressTracker {
  private config: Required<ProgressTrackerConfig>;
  private currentProgress: ProgressItem | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isDisposed: boolean = false;

  constructor(config: ProgressTrackerConfig = {}) {
    this.config = {
      updateInterval: config.updateInterval || 100,
      showETA: config.showETA ?? true,
      showPercentage: config.showPercentage ?? true,
      showElapsedTime: config.showElapsedTime ?? true,
    };
  }

  /**
   * Starts tracking a new progress item
   *
   * @param name - Item name
   * @param total - Total items to process
   */
  startProgress(name: string, total: number): void {
    if (this.isDisposed) {
      console.warn('[ProgressTracker] Attempted to start progress on disposed tracker');
      return;
    }

    // Clean up any existing progress to prevent memory leaks
    this.cleanup();

    this.currentProgress = {
      name,
      total,
      current: 0,
      startTime: Date.now(),
    };

    console.log(`[${name}] Starting... (0/${total})`);
  }

  /**
   * Cleans up resources to prevent memory leaks
   *
   * @private
   */
  private cleanup(): void {
    this.stopUpdates();
    this.currentProgress = null;
  }

  /**
   * Disposes the progress tracker and cleans up all resources
   */
  dispose(): void {
    this.cleanup();
    this.isDisposed = true;
  }

  /**
   * Updates progress
   *
   * @param current - Current progress
   * @param itemName - Optional item name for current item
   */
  updateProgress(current: number, itemName?: string): void {
    if (!this.currentProgress) {
      return;
    }

    this.currentProgress.current = current;
    this.currentProgress.estimatedCompletion = this.calculateETA();

    this.renderProgress(itemName);
  }

  /**
   * Increments progress by 1
   *
   * @param itemName - Optional item name for current item
   */
  incrementProgress(itemName?: string): void {
    if (!this.currentProgress) {
      return;
    }

    this.currentProgress.current++;
    this.currentProgress.estimatedCompletion = this.calculateETA();

    this.renderProgress(itemName);
  }

  /**
   * Completes the current progress tracking
   */
  completeProgress(): void {
    if (!this.currentProgress) {
      return;
    }

    const elapsed = Date.now() - this.currentProgress.startTime;
    const elapsedSec = (elapsed / 1000).toFixed(2);

    console.log(`[${this.currentProgress.name}] Completed in ${elapsedSec}s (${this.currentProgress.total}/${this.currentProgress.total})`);

    this.stopUpdates();
    this.currentProgress = null;
  }

  /**
   * Stops automatic updates
   *
   * @private
   */
  private stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Calculates ETA
   *
   * @private
   * @returns number - Estimated completion time in milliseconds
   */
  private calculateETA(): number {
    if (!this.currentProgress || this.currentProgress.current === 0) {
      return 0;
    }

    const elapsed = Date.now() - this.currentProgress.startTime;
    const rate = this.currentProgress.current / elapsed;
    const remaining = this.currentProgress.total - this.currentProgress.current;

    if (rate === 0) {
      return 0;
    }

    return remaining / rate;
  }

  /**
   * Renders progress bar
   *
   * @private
   * @param itemName - Optional item name for current item
   */
  private renderProgress(itemName?: string): void {
    if (!this.currentProgress) {
      return;
    }

    const { name, total, current, startTime, estimatedCompletion } = this.currentProgress;
    const percentage = (current / total) * 100;
    const barWidth = 40;
    const filled = Math.floor((percentage / 100) * barWidth);
    const empty = barWidth - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    let output = `\r[${name}] [${bar}]`;

    if (this.config.showPercentage) {
      output += ` ${percentage.toFixed(1)}%`;
    }

    output += ` (${current}/${total})`;

    if (itemName) {
      output += ` - ${itemName}`;
    }

    if (this.config.showElapsedTime) {
      const elapsed = Date.now() - startTime;
      const elapsedSec = (elapsed / 1000).toFixed(1);
      output += ` [${elapsedSec}s`;
    }

    if (this.config.showETA && estimatedCompletion && estimatedCompletion > 0) {
      const etaSec = (estimatedCompletion / 1000).toFixed(1);
      output += ` ETA: ${etaSec}s`;
    }

    process.stdout.write(output);
  }

  /**
   * Creates a phase progress tracker
   *
   * @static
   * @param phaseName - Phase name
   * @param fileCount - Number of files to process
   * @returns PhaseProgressTracker - Phase progress tracker
   */
  static createPhaseTracker(phaseName: string, fileCount: number): PhaseProgressTracker {
    return new PhaseProgressTracker(phaseName, fileCount);
  }
}

/**
 * Phase-specific progress tracker
 *
 * @class PhaseProgressTracker
 */
export class PhaseProgressTracker {
  private phaseName: string;
  private totalFiles: number;
  private processedFiles: number = 0;
  private startTime: number;
  private tracker: ProgressTracker;
  private isDisposed: boolean = false;

  constructor(phaseName: string, totalFiles: number) {
    this.phaseName = phaseName;
    this.totalFiles = totalFiles;
    this.startTime = Date.now();
    this.tracker = new ProgressTracker();
    this.tracker.startProgress(this.phaseName, this.totalFiles);
  }

  /**
   * Updates progress for a file
   *
   * @param fileName - Name of the file being processed
   */
  updateFile(fileName: string): void {
    if (this.isDisposed) {
      return;
    }
    this.processedFiles++;
    this.tracker.incrementProgress(fileName);
  }

  /**
   * Completes the phase progress tracking
   */
  complete(): void {
    if (this.isDisposed) {
      return;
    }
    this.tracker.completeProgress();
  }

  /**
   * Disposes the phase progress tracker and cleans up all resources
   */
  dispose(): void {
    this.tracker.dispose();
    this.isDisposed = true;
  }

  /**
   * Gets the elapsed time
   *
   * @returns number - Elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Gets the current progress percentage
   *
   * @returns number - Progress percentage (0-100)
   */
  getProgress(): number {
    return (this.processedFiles / this.totalFiles) * 100;
  }
}
