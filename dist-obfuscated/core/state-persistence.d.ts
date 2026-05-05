/**
 * StatePersistence - Black Box for Progress Tracking
 *
 * Purpose: Save and restore execution state to enable resume capability after
 * interruptions (SIGINT, thermal shutdown, system crash). This is the "black box"
 * that records everything Aegis QA has analyzed so far.
 *
 * Architecture:
 * - Saves state after each phase or every 50 files
 * - Stores phase progress, file progress, and thermal logs
 * - Enables "aegis resume" to continue exactly where execution stopped
 * - Survives SIGINT (Ctrl+C) and thermal shutdown
 *
 * @module core/state-persistence
 * @since 2.0.0
 */
/**
 * Phase execution state
 */
interface PhaseState {
    /** Phase number */
    phase: number;
    /** Phase name */
    phaseName: string;
    /** Whether phase completed */
    completed: boolean;
    /** Findings count from this phase */
    findingsCount: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
}
/**
 * File processing state
 */
interface FileState {
    /** File path */
    filePath: string;
    /** Whether file was processed */
    processed: boolean;
    /** Processing timestamp */
    timestamp: string;
    /** Any errors during processing */
    error?: string;
}
/**
 * Thermal log entry
 */
interface ThermalLogEntry {
    /** Timestamp */
    timestamp: string;
    /** GPU temperature in Celsius (if available) */
    gpuTemp?: number;
    /** CPU usage percentage */
    cpuUsage: number;
    /** RAM usage percentage */
    ramUsage: number;
    /** Event type */
    event: 'check' | 'cooldown' | 'critical' | 'warning';
    /** Message */
    message?: string;
}
/**
 * Complete execution state
 */
export interface ExecutionState {
    /** Project root directory */
    projectRoot: string;
    /** Current phase number */
    currentPhase: number;
    /** Total phases */
    totalPhases: number;
    /** Phase states */
    phases: PhaseState[];
    /** File states */
    files: FileState[];
    /** Thermal logs */
    thermalLogs: ThermalLogEntry[];
    /** Total findings so far */
    totalFindings: number;
    /** Execution start timestamp */
    startTime: string;
    /** Last save timestamp */
    lastSaveTime: string;
    /** Whether execution was interrupted */
    interrupted: boolean;
    /** Interruption reason */
    interruptionReason?: string;
    /** Analysis results cache (shared context between phases) */
    analysisResults?: Record<string, unknown>;
    /** Project type detected: typescript | javascript | mixed */
    projectType?: 'typescript' | 'javascript' | 'mixed';
    /** High risk blocker flag - if true, commits should be blocked */
    highRiskBlocker?: boolean;
    /** Context store for cross-phase communication */
    contextStore?: Record<string, unknown>;
    /** Ready for audit flag - if true, report is ready for audit */
    readyForAudit?: boolean;
    /** Git stash reference for checkpoint (e.g., "stash@{0}") */
    gitCheckpointStashRef?: string;
    /** SHA-256 checksum for integrity validation */
    _checksum?: string;
}
/**
 * StatePersistence - Progress tracking and resume capability
 *
 * This class manages the "black box" that records all execution state,
 * enabling Aegis QA to resume exactly where it left off after any interruption.
 *
 * @class StatePersistence
 * @example
 * ```typescript
 * const persistence = new StatePersistence('/path/to/project');
 * await persistence.saveState(state);
 * const restored = await persistence.loadState();
 * ```
 */
export declare class StatePersistence {
    private projectRoot;
    private stateFilePath;
    private saveInterval;
    private fileCount;
    private maxBackups;
    private backupDir;
    constructor(projectRoot: string);
    /**
     * Generates SHA-256 checksum of content
     *
     * @private
     * @param content - Content to hash
     * @returns string - SHA-256 hash in hex format
     */
    private generateChecksum;
    /**
     * Validates JSON by attempting to parse it
     *
     * @private
     * @param jsonString - JSON string to validate
     * @returns boolean - True if valid JSON
     */
    private isValidJSON;
    /**
     * Creates a backup of the current state file
     *
     * @private
     * @returns Promise<void>
     */
    private createBackup;
    /**
     * Attempts to restore from the latest backup
     *
     * @private
     * @returns Promise<ExecutionState | null> - Restored state or null
     */
    private restoreFromBackup;
    /**
     * Saves execution state to disk
     *
     * This method writes the current execution state to the state file.
     * Called after each phase completion or every N files processed.
     *
     * ACID Properties:
     * - Atomic: Writes to .tmp file, validates, then renames
     * - Consistent: Validates JSON before committing
     * - Isolated: No concurrent writes (single writer)
     * - Durable: Checksum validation on load
     *
     * @param state - Current execution state
     * @returns Promise<void>
     *
     * @example
     * ```typescript
     * await persistence.saveState({
     *   projectRoot: '/path/to/project',
     *   currentPhase: 5,
     *   totalPhases: 20,
     *   phases: [...],
     *   files: [...],
     *   thermalLogs: [...],
     *   totalFindings: 42,
     *   startTime: new Date().toISOString(),
     *   lastSaveTime: new Date().toISOString(),
     *   interrupted: false,
     * });
     * ```
     */
    saveState(state: ExecutionState): Promise<void>;
    /**
     * Loads execution state from disk
     *
     * This method reads the saved state file if it exists.
     * Returns null if no state file exists or if validation fails.
     *
     * ACID Properties:
     * - Validates checksum on load
     * - Attempts to restore from backup if checksum mismatch or truncation
     *
     * @returns Promise<ExecutionState | null> - Restored state or null
     *
     * @example
     * ```typescript
     * const state = await persistence.loadState();
     * if (state) {
     *   console.log(`Resuming from phase ${state.currentPhase}`);
     * } else {
     *   console.log('No saved state found, starting fresh');
     * }
     * ```
     */
    loadState(): Promise<ExecutionState | null>;
    /**
     * Checks if a saved state exists
     *
     * @returns boolean - Whether state file exists
     */
    hasState(): boolean;
    /**
     * Deletes saved state
     *
     * Call this after successful completion to clean up.
     *
     * @returns Promise<void>
     */
    clearState(): Promise<void>;
    /**
     * Records file processing progress
     *
     * Call this after processing each file. Automatically saves state
     * every N files (configurable via saveInterval).
     *
     * @param filePath - Path to processed file
     * @param processed - Whether processing succeeded
     * @param error - Error message if processing failed
     * @param currentState - Current execution state
     * @returns Promise<void>
     *
     * @example
     * ```typescript
     * await persistence.recordFile('/path/to/file.ts', true, undefined, currentState);
     * ```
     */
    recordFile(filePath: string, processed: boolean, error: string | undefined, currentState: ExecutionState): Promise<void>;
    /**
     * Records phase completion
     *
     * Call this after completing each phase.
     *
     * @param phaseNumber - Phase number
     * @param phaseName - Phase name
     * @param completed - Whether phase completed successfully
     * @param findingsCount - Number of findings from this phase
     * @param executionTimeMs - Execution time in milliseconds
     * @param currentState - Current execution state
     * @returns Promise<void>
     *
     * @example
     * ```typescript
     * await persistence.recordPhase(2, 'Business Logic', true, 15, 5000, currentState);
     * ```
     */
    recordPhase(phaseNumber: number, phaseName: string, completed: boolean, findingsCount: number, executionTimeMs: number, currentState: ExecutionState): Promise<void>;
    /**
     * Records thermal event
     *
     * Call this to log thermal events for debugging and analysis.
     *
     * @param gpuTemp - GPU temperature in Celsius (if available)
     * @param cpuUsage - CPU usage percentage
     * @param ramUsage - RAM usage percentage
     * @param event - Event type
     * @param message - Optional message
     * @param currentState - Current execution state
     * @returns Promise<void>
     *
     * @example
     * ```typescript
     * await persistence.recordThermalEvent(65, 45, 60, 'warning', 'Temperature elevated', currentState);
     * ```
     */
    recordThermalEvent(gpuTemp: number | undefined, cpuUsage: number, ramUsage: number, event: 'check' | 'cooldown' | 'critical' | 'warning', message: string | undefined, currentState: ExecutionState): Promise<void>;
    /**
     * Marks execution as interrupted
     *
     * Call this when handling SIGINT or thermal shutdown.
     *
     * @param reason - Reason for interruption
     * @param currentState - Current execution state
     * @returns Promise<void>
     *
     * @example
     * ```typescript
     * await persistence.markInterrupted('SIGINT received', currentState);
     * ```
     */
    markInterrupted(reason: string, currentState: ExecutionState): Promise<void>;
    /**
     * Creates initial execution state
     *
     * Call this at the start of execution to initialize state.
     *
     * @param totalPhases - Total number of phases
     * @returns ExecutionState - Initial state
     *
     * @example
     * ```typescript
     * const initialState = persistence.createInitialState(20);
     * ```
     */
    createInitialState(totalPhases: number): ExecutionState;
    /**
     * Sets the save interval (number of files between saves)
     *
     * @param interval - Save interval in files
     */
    setSaveInterval(interval: number): void;
    /**
     * Stores analysis results for a specific phase
     *
     * @param phase - Phase number
     * @param results - Analysis results object
     * @param currentState - Current execution state
     * @returns Promise<void>
     *
     * @example
     * ```typescript
     * await persistence.storeAnalysisResults(1, { fileScores: [...], totalFindings: 42 }, currentState);
     * ```
     */
    storeAnalysisResults(phase: number, results: unknown, currentState: ExecutionState): Promise<void>;
    /**
     * Retrieves analysis results for a specific phase
     *
     * @param phase - Phase number
     * @param currentState - Current execution state
     * @returns Analysis results or null
     *
     * @example
     * ```typescript
     * const results = await persistence.getAnalysisResults(1, currentState);
     * if (results) {
     *   console.log('Phase 1 results:', results);
     * }
     * ```
     */
    getAnalysisResults(phase: number, currentState: ExecutionState): unknown | null;
    /**
     * Stores file hash cache for Phase 1
     *
     * @param filePath - File path
     * @param hash - SHA-1 hash of file content
     * @param score - Quality score
     * @param currentState - Current execution state
     * @returns Promise<void>
     */
    storeFileHash(filePath: string, hash: string, score: number, currentState: ExecutionState): Promise<void>;
    /**
     * Gets file hash from cache
     *
     * @param filePath - File path
     * @param currentState - Current execution state
     * @returns File hash info or null
     */
    getFileHash(filePath: string, currentState: ExecutionState): {
        hash: string;
        score: number;
        timestamp: string;
    } | null;
}
export {};
//# sourceMappingURL=state-persistence.d.ts.map