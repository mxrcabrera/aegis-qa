/**
 * Predictive Bug Detection - Phase 13
 *
 * Identifies code patterns that are bug magnets based on senior development heuristics.
 * Automated intuition: "This will fail when the server takes >200ms".
 *
 * @module predictive-bug-detection
 * @since 2.0.0
 */
export interface PredictiveIssue {
    id: string;
    type: 'silent-killer' | 'race-condition' | 'implicit-nulls' | 'high-fragility' | 'state-mutation' | 'critical-risk' | 'performance-death-trap' | 'data-loss-risk' | 'architectural-fragility';
    severity: 'critical' | 'high' | 'medium' | 'low';
    file: string;
    line: number;
    description: string;
    intuition: string;
    isCorePath: boolean;
    confidenceScore: number;
    combo?: string;
}
export interface PredictiveResults {
    issues: PredictiveIssue[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
    };
}
export declare class PredictiveBugDetection {
    private projectRoot;
    private corePaths;
    constructor(projectRoot: string);
    /**
     * Run predictive bug detection
     */
    detect(dirtyDataZones?: string[], heavyComputationFiles?: string[]): Promise<PredictiveResults>;
    /**
     * Analyze a single file for predictive bugs
     */
    private analyzeFile;
    /**
     * Detect Silent Killer: try-catch with empty catch or only console.log
     */
    private detectSilentKiller;
    /**
     * Detect Race Condition Risk: await in .map() or mutating external variable
     */
    private detectRaceCondition;
    /**
     * Detect Implicit Nulls: deep property access without optional chaining
     */
    private detectImplicitNulls;
    /**
     * Detect Logic Heatmap: >3 levels of nesting
     */
    private detectHighFragility;
    /**
     * Detect State Mutation Warning: direct mutations in React
     */
    private detectStateMutation;
    /**
     * Detect Explosive Combos: Dangerous pattern combinations
     */
    private detectExplosiveCombos;
    /**
     * Check if catch block is in persistence layer (DB/API calls)
     */
    private isPersistenceLayer;
    /**
     * Calculate summary of issues
     */
    private calculateSummary;
    /**
     * Check if file is in Core Path
     */
    private isCorePath;
    /**
     * Get relative path from project root
     */
    private getRelativePath;
    /**
     * Scan directory for files
     */
    private scanDirectory;
}
export default PredictiveBugDetection;
//# sourceMappingURL=predictive-bug-detection.d.ts.map