/**
 * Cloud Cost & Resource Efficiency - Phase 14
 *
 * Identifies patterns that increase latency and operational cost.
 * In the cloud, time is literally money.
 *
 * @module cloud-cost-detection
 * @since 2.0.0
 */
export interface CostIssue {
    id: string;
    type: 'heavy-cold-start' | 'long-running' | 'select-star-abuse' | 'payload-bloat' | 'missing-cache-control' | 'zombie-dependency' | 'api-loop-inefficiency' | 'log-profligacy' | 'inefficient-regex';
    severity: 'critical' | 'high' | 'medium' | 'low';
    file: string;
    line: number;
    description: string;
    costImpact: string;
    estimatedSavings: string;
    confidenceScore: number;
    isCriticalModule?: boolean;
    hasHighTraffic?: boolean;
}
export interface CostResults {
    issues: CostIssue[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
    };
}
export declare class CloudCostDetection {
    private projectRoot;
    private criticalModules;
    private highTrafficFiles;
    constructor(projectRoot: string);
    /**
     * Run cloud cost detection
     */
    detect(apiPayloadData?: Map<string, string>, criticalModules?: string[], highTrafficFiles?: string[]): Promise<CostResults>;
    /**
     * Detect Zombie Dependencies: Unused dependencies in package.json
     */
    private detectZombieDependencies;
    /**
     * Apply Cost Impact Multiplier: Triple severity in Critical Modules with High Traffic
     */
    private applyCostImpactMultiplier;
    /**
     * Analyze a single file for cost issues
     */
    private analyzeFile;
    /**
     * Check if file is in Core Path
     */
    private isCorePath;
    /**
     * Detect Heavy Cold Starts: Huge dependencies in backend/lambda files
     */
    private detectHeavyColdStart;
    /**
     * Detect Long-running Functions: Sequential awaits that could be Promise.all()
     */
    private detectLongRunningFunction;
    /**
     * Detect Select Star Abuse: Queries without column specification
     */
    private detectSelectStarAbuse;
    /**
     * Detect Payload Bloat: API calls fetching giant objects for single property
     */
    private detectPayloadBloat;
    /**
     * Detect Log Profligacy: Excessive console.log or heavy object logs in production Core Path
     */
    private detectLogProfligacy;
    /**
     * Detect Inefficient Regex: Complex regex patterns with ReDoS risk
     */
    private detectInefficientRegex;
    /**
     * Detect API Loop Inefficiency: Duplicate API calls in loops without shared state/cache
     */
    private detectApiLoopInefficiency;
    /**
     * Detect Missing Cache-Control headers
     */
    private detectMissingCacheControl;
    /**
     * Calculate summary of issues
     */
    private calculateSummary;
    /**
     * Scan directory for files
     */
    private scanDirectory;
}
export default CloudCostDetection;
//# sourceMappingURL=cloud-cost-detection.d.ts.map