/**
 * Cloud Cost Detection
 *
 * Purpose: Analyzes infrastructure code to detect potential cost issues and optimization opportunities.
 * Focus on resource usage, scaling configurations, and cost-efficient patterns.
 *
 * Architecture:
 * - Resource Analysis: Identifies resource-intensive code patterns
 * - Cost Scoring: Assigns cost impact scores to infrastructure configurations
 * - Optimization Suggestions: Provides cost optimization recommendations
 * - Cloud Provider Detection: Detects AWS, GCP, Azure patterns
 *
 * @module lib/cloud-cost-detection
 * @since 2.0.0
 */
/**
 * Cost detection result
 */
export interface CostDetection {
    /** File path */
    filePath: string;
    /** Line number */
    line?: number;
    /** Cost issue type */
    costType: string;
    /** Cost impact score (0-1) */
    impactScore: number;
    /** Estimated monthly cost impact */
    estimatedCost?: number;
    /** Description */
    description: string;
    /** Suggestion */
    suggestion?: string;
}
/**
 * Cost pattern rule
 */
interface CostPatternRule {
    /** Rule name */
    name: string;
    /** Pattern to match (regex) */
    pattern: RegExp;
    /** Cost type */
    costType: string;
    /** Base impact score */
    baseImpactScore: number;
    /** Estimated monthly cost multiplier */
    costMultiplier?: number;
    /** Description */
    description: string;
    /** Suggestion */
    suggestion: string;
}
/**
 * Cloud Cost Detection
 *
 * Analyzes infrastructure code to detect potential cost issues and optimization opportunities.
 * Focuses on resource usage, scaling configurations, and cost-efficient patterns.
 *
 * @class CloudCostDetection
 */
export declare class CloudCostDetection {
    private patternRules;
    constructor();
    /**
     * Registers builtin cost pattern rules
     *
     * @private
     */
    private registerBuiltinPatterns;
    /**
     * Analyzes a file for cost issues
     *
     * @param filePath - File path
     * @returns Promise<CostDetection[]> - Array of cost detections
     */
    analyzeFile(filePath: string): Promise<CostDetection[]>;
    /**
     * Analyzes multiple files for cost issues
     *
     * @param filePaths - Array of file paths
     * @returns Promise<CostDetection[]> - Array of cost detections
     */
    analyzeFiles(filePaths: string[]): Promise<CostDetection[]>;
    /**
     * Registers a custom cost pattern rule
     *
     * @param rule - Cost pattern rule to register
     */
    registerPattern(rule: CostPatternRule): void;
    /**
     * Gets all registered pattern rules
     *
     * @returns CostPatternRule[] - Array of pattern rules
     */
    getPatterns(): CostPatternRule[];
    /**
     * Generates a summary report of cost detections
     *
     * @param detections - Array of cost detections
     * @returns string - Summary report
     */
    generateSummary(detections: CostDetection[]): string;
    /**
     * Scans for infrastructure files
     *
     * @param projectRoot - Project root directory
     * @returns Promise<string[]> - Array of infrastructure file paths
     */
    scanInfrastructureFiles(projectRoot: string): Promise<string[]>;
}
export {};
//# sourceMappingURL=cloud-cost-detection.d.ts.map