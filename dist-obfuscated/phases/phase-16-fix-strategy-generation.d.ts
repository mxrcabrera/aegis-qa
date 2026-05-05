/**
 * Phase 16: Fix Strategy Generation - Intelligent Fix Strategy Planning
 *
 * Purpose: Generate intelligent fix strategies for identified issues,
 * implementing Dependency Blast Radius to protect "High-Traffic" files
 * with Safe Level 4 protection.
 *
 * Architecture:
 * - Dependency Analysis: Analyze file dependencies and impact
 * - Blast Radius Calculation: Calculate impact radius for fixes
 * - Safe Level Classification: Classify files by safety level (1-4)
 * - Fix Prioritization: Prioritize fixes by impact and safety
 *
 * @module phases/phase-16-fix-strategy-generation
 * @since 1.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * File safety level
 */
declare enum SafetyLevel {
    SAFE_LEVEL_1 = 1,// Low risk, can fix directly
    SAFE_LEVEL_2 = 2,// Medium risk, needs review
    SAFE_LEVEL_3 = 3,// High risk, needs careful review
    SAFE_LEVEL_4 = 4
}
/**
 * Finding for fix strategy
 */
interface Finding {
    /** Finding ID */
    id: string;
    /** File path */
    filePath: string;
    /** Suggested fix */
    suggestion?: string;
}
/**
 * Fix strategy
 */
export interface FixStrategy {
    /** Finding ID */
    findingId: string;
    /** File to fix */
    filePath: string;
    /** Safety level */
    safetyLevel: SafetyLevel;
    /** Recommended approach */
    approach: 'direct' | 'careful' | 'manual' | 'skip';
    /** Risk assessment */
    risk: 'low' | 'medium' | 'high' | 'critical';
    /** Suggested fix */
    suggestedFix: string;
    /** Blast radius */
    blastRadius: number;
}
/**
 * Phase 16 configuration
 */
interface Phase16Config {
    /** Project root directory */
    projectRoot: string;
    /** Thermal controller for hardware protection */
    thermalController: ThermalController;
    /** State persistence for resume capability */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** Findings from previous phases */
    findings: Finding[];
}
/**
 * Phase 16 result
 */
export interface Phase16Result {
    /** Overall success */
    success: boolean;
    /** Fix strategies */
    strategies: FixStrategy[];
    /** High-traffic files protected */
    highTrafficFilesProtected: number;
    /** Safe Level 4 files */
    safeLevel4Files: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 16: Fix Strategy Generation - Intelligent Fix Strategy Planning
 *
 * This phase generates intelligent fix strategies for identified issues,
 * implementing Dependency Blast Radius to protect "High-Traffic" files
 * with Safe Level 4 protection.
 *
 * @class Phase16FixStrategyGeneration
 * @example
 * ```typescript
 * const fixStrategyGeneration = new Phase16FixStrategyGeneration(config);
 * const result = await fixStrategyGeneration.execute();
 * console.log(`Strategies generated: ${result.strategies.length}`);
 * console.log(`High-traffic files protected: ${result.highTrafficFilesProtected}`);
 * ```
 */
export declare class Phase16FixStrategyGeneration {
    private config;
    constructor(config: Phase16Config);
    /**
     * Executes Phase 16: Fix Strategy Generation
     *
     * @returns Promise<Phase16Result> - Fix strategy generation result
     */
    execute(): Promise<Phase16Result>;
    /**
     * Gets source files from project
     *
     * @private
     * @param projectRoot - Project root directory
     * @returns string[] - Source file paths
     */
    private getSourceFiles;
    /**
     * Analyzes file dependencies
     *
     * @private
     * @param sourceFiles - Source file paths
     * @returns Promise<FileDependencyInfo[]> - File dependency information
     */
    private analyzeFileDependencies;
    /**
     * Extracts imports from file
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @returns string[] - Imported file paths
     */
    private extractImports;
    /**
     * Extracts exports from file
     *
     * @private
     * @param filePath - File path
     * @returns number - Export count
     */
    private countExports;
    /**
     * Generates fix strategies
     *
     * @private
     * @param fileDependencies - File dependency information
     * @returns FixStrategy[] - Fix strategies
     */
    private generateFixStrategies;
    /**
     * Determines fix approach based on safety level
     *
     * @private
     * @param fileDep - File dependency info
     * @returns Fix approach
     */
    private determineApproach;
    /**
     * Determines risk based on safety level
     *
     * @private
     * @param fileDep - File dependency info
     * @returns Risk level
     */
    private determineRisk;
}
export {};
//# sourceMappingURL=phase-16-fix-strategy-generation.d.ts.map