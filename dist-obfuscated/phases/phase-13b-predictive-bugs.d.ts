/**
 * Phase 13: Predictive Bugs
 *
 * Purpose: Analyzes code patterns to predict potential bugs before they occur.
 * Uses the PredictiveBugDetection class to identify high-risk code areas.
 *
 * Architecture:
 * - Pattern Analysis: Identifies bug-prone code patterns
 * - Risk Scoring: Assigns risk scores to code sections
 * - Prediction: Predicts likelihood of bugs in new code
 * - Integration with lib/predictive-bug-detection.ts
 *
 * @module phases/phase-13-predictive-bugs
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
import { type BugPrediction } from '../lib/predictive-bug-detection.js';
/**
 * Phase 13 result
 */
export interface Phase13Result {
    /** Overall success */
    success: boolean;
    /** Bug predictions */
    predictions: BugPrediction[];
    /** Total high risk predictions */
    highRiskCount: number;
    /** Total medium risk predictions */
    mediumRiskCount: number;
    /** Files analyzed */
    filesAnalyzed: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 13 configuration
 */
interface Phase13Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** File filter for filtering files */
    fileFilter?: FileFilter;
    /** Ignore handler for filtering */
    ignoreHandler?: IgnoreHandler;
}
/**
 * Phase 13: Predictive Bugs
 *
 * Analyzes code patterns to predict potential bugs before they occur.
 * Uses the PredictiveBugDetection class to identify high-risk code areas.
 *
 * @class Phase13PredictiveBugs
 */
export declare class Phase13PredictiveBugs {
    private config;
    private predictiveBugDetection;
    constructor(config: Phase13Config);
    /**
     * Executes Phase 13: Predictive Bugs
     *
     * @returns Promise<Phase13Result> - Predictive bugs analysis result
     */
    execute(): Promise<Phase13Result>;
    /**
     * Scans for source files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private scanSourceFiles;
    /**
     * Writes partial report for Phase 13
     *
     * @private
     * @param result - Phase 13 result
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-13b-predictive-bugs.d.ts.map