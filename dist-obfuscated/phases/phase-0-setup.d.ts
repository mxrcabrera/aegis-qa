/**
 * Phase 0: Setup - Hotel Check-in
 *
 * Purpose: Initial validation and setup before starting the QA process.
 * This is the "check-in" phase - if the project doesn't have a reservation
 * (required files) or the client is "crazy" (syntax errors), they don't enter.
 *
 * Architecture:
 * - Dependencies: Check node_modules existence and lockfile consistency
 * - Critical Files: Detect tsconfig.json, .gitignore, package.json
 * - Syntax Check: Quick scan for basic syntax errors
 * - Hardware Lock: Run self-diagnostic to determine session limits
 *
 * @module phases/phase-0-setup
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * Setup phase configuration
 */
interface Phase0Config {
    /** Project root directory */
    projectRoot: string;
    /** Thermal controller for hardware lock */
    thermalController: ThermalController;
    /** State persistence for saving setup results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** File filter for syntax check */
    fileFilter?: FileFilter;
    /** Ignore handler for filtering */
    ignoreHandler?: IgnoreHandler;
}
/**
 * Dependency check result
 */
interface DependencyCheckResult {
    /** Whether dependencies are valid */
    valid: boolean;
    /** Whether node_modules exists */
    hasNodeModules: boolean;
    /** Lockfile type (npm, yarn, pnpm, bun) */
    lockfileType?: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'none';
    /** Warnings */
    warnings: string[];
}
/**
 * Critical files check result
 */
interface CriticalFilesResult {
    /** Whether all critical files exist */
    complete: boolean;
    /** Missing files */
    missing: string[];
    /** Present files */
    present: string[];
}
/**
 * Syntax check result
 */
interface SyntaxCheckResult {
    /** Whether syntax is valid */
    valid: boolean;
    /** Files with syntax errors */
    errorFiles: {
        path: string;
        error: string;
    }[];
    /** Files checked */
    filesChecked: number;
}
/**
 * Hardware lock result
 */
interface HardwareLockResult {
    /** Whether hardware check passed */
    passed: boolean;
    /** Temperature rise rate */
    temperatureRiseRate: number;
    /** Whether thresholds were adjusted */
    thresholdsAdjusted: boolean;
    /** Hardware profile */
    hardwareProfile: {
        hasGPU: boolean;
        gpuModel?: string;
        gpuVRAM?: number;
        cpuCores: number;
        ramTotal: number;
    };
    /** Recommended batch size based on hardware */
    recommendedBatchSize?: number;
    /** Recommended cooldown based on hardware */
    recommendedCooldown?: number;
}
/**
 * Complete Phase 0 result
 */
export interface Phase0Result {
    /** Overall success */
    success: boolean;
    /** Dependency check */
    dependencies: DependencyCheckResult;
    /** Critical files check */
    criticalFiles: CriticalFilesResult;
    /** Syntax check */
    syntax: SyntaxCheckResult;
    /** Hardware lock */
    hardware: HardwareLockResult;
    /** Total execution time */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 0: Setup - Hotel Check-in
 *
 * This phase performs initial validation before starting the QA process.
 * If any critical check fails, the process stops immediately.
 *
 * @class Phase0Setup
 * @example
 * ```typescript
 * const phase0 = new Phase0Setup({
 *   projectRoot: '/path/to/project',
 *   thermalController: new ThermalController(),
 * });
 * const result = await phase0.execute();
 * if (!result.success) {
 *   console.error('Setup failed:', result.error);
 *   process.exit(1);
 * }
 * ```
 */
export declare class Phase0Setup {
    private config;
    constructor(config: Phase0Config);
    /**
     * Executes Phase 0: Setup
     *
     * @returns Promise<Phase0Result> - Setup result
     */
    execute(): Promise<Phase0Result>;
    /**
     * Writes partial report for Phase 0
     *
     * @private
     * @param setupResults - Setup phase results
     */
    private writePartialReport;
    /**
     * Checks dependencies (node_modules and lockfile)
     *
     * @private
     * @returns Promise<DependencyCheckResult>
     */
    private checkDependencies;
    /**
     * Detects lockfile type
     *
     * @private
     * @param projectRoot - Project root directory
     * @returns Lockfile type
     */
    private detectLockfileType;
    /**
     * Checks lockfile consistency (basic check)
     *
     * @private
     * @param _lockfileType - Lockfile type (unused in basic check)
     * @param projectRoot - Project root directory
     * @returns Promise<boolean> - Whether lockfile is consistent
     */
    private checkLockfileConsistency;
    /**
     * Checks for critical files
     *
     * @private
     * @returns CriticalFilesResult
     */
    private checkCriticalFiles;
    /**
     * Detects project type based on configuration files
     *
     * @private
     * @returns Project type: 'typescript' | 'javascript' | 'mixed'
     */
    private detectProjectType;
    /**
     * Performs syntax check on project files
     *
     * @private
     * @returns Promise<SyntaxCheckResult>
     */
    private checkSyntax;
    /**
     * Fallback basic syntax check when tsc is not available
     *
     * @private
     * @returns Promise<SyntaxCheckResult>
     */
    private basicSyntaxCheckFallback;
    /**
     * Basic syntax check (simplified)
     *
     * @private
     * @param content - File content
     * @returns boolean - Whether syntax is valid
     */
    private basicSyntaxCheck;
    /**
     * Runs hardware diagnostic and locks hardware limits
     *
     * @private
     * @returns Promise<HardwareLockResult>
     */
    private checkHardware;
}
export {};
//# sourceMappingURL=phase-0-setup.d.ts.map