/**
 * Predictive Bug Detection
 *
 * Purpose: Analyzes code patterns to predict potential bugs before they occur.
 * Uses historical data and pattern matching to identify high-risk code areas.
 *
 * Architecture:
 * - Pattern Analysis: Identifies bug-prone code patterns
 * - Historical Data: Uses past bug reports to train detection
 * - Risk Scoring: Assigns risk scores to code sections
 * - Prediction: Predicts likelihood of bugs in new code
 *
 * @module lib/predictive-bug-detection
 * @since 2.0.0
 */
/**
 * Bug prediction result
 */
export interface BugPrediction {
    /** File path */
    filePath: string;
    /** Line number */
    line?: number;
    /** Predicted bug type */
    bugType: string;
    /** Risk score (0-1) */
    riskScore: number;
    /** Confidence level */
    confidence: 'low' | 'medium' | 'high';
    /** Description */
    description: string;
    /** Suggestion */
    suggestion?: string;
}
/**
 * Pattern rule
 */
interface PatternRule {
    /** Rule name */
    name: string;
    /** Pattern to match (regex) */
    pattern: RegExp;
    /** Bug type */
    bugType: string;
    /** Base risk score */
    baseRiskScore: number;
    /** Description */
    description: string;
    /** Suggestion */
    suggestion: string;
}
/**
 * Predictive Bug Detection
 *
 * Analyzes code patterns to predict potential bugs before they occur.
 * Uses pattern matching and risk scoring to identify high-risk code areas.
 *
 * @class PredictiveBugDetection
 */
export declare class PredictiveBugDetection {
    private patternRules;
    constructor();
    /**
     * Registers builtin bug-prone patterns
     *
     * @private
     */
    private registerBuiltinPatterns;
    /**
     * Analyzes a file for bug-prone patterns
     *
     * @param filePath - File path
     * @returns Promise<BugPrediction[]> - Array of bug predictions
     */
    analyzeFile(filePath: string): Promise<BugPrediction[]>;
    /**
     * Analyzes multiple files for bug-prone patterns
     *
     * @param filePaths - Array of file paths
     * @returns Promise<BugPrediction[]> - Array of bug predictions
     */
    analyzeFiles(filePaths: string[]): Promise<BugPrediction[]>;
    /**
     * Gets context around a match
     *
     * @private
     * @param content - File content
     * @param matchIndex - Match index
     * @param contextSize - Context size in characters
     * @returns string - Context string
     */
    private getContext;
    /**
     * Calculates confidence level based on context
     *
     * @private
     * @param context - Context string
     * @param rule - Pattern rule
     * @returns 'low' | 'medium' | 'high' - Confidence level
     */
    private calculateConfidence;
    /**
     * Registers a custom pattern rule
     *
     * @param rule - Pattern rule to register
     */
    registerPattern(rule: PatternRule): void;
    /**
     * Gets all registered pattern rules
     *
     * @returns PatternRule[] - Array of pattern rules
     */
    getPatterns(): PatternRule[];
    /**
     * Generates a summary report of bug predictions
     *
     * @param predictions - Array of bug predictions
     * @returns string - Summary report
     */
    generateSummary(predictions: BugPrediction[]): string;
}
export {};
//# sourceMappingURL=predictive-bug-detection.d.ts.map