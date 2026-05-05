/**
 * ErrorBaseline - Pre-flight Check and Inherited Error Management
 *
 * Purpose: Run tsc --noEmit before fixes to establish a baseline of
 * existing errors. This prevents Aegis from being blamed for errors
 * that already existed before the fixes were applied.
 *
 * @module core/error-baseline
 * @since 1.1.0
 */
/**
 * Project type
 */
export type ProjectType = 'typescript' | 'javascript' | 'mixed';
/**
 * TypeScript error from tsc --noEmit
 */
export interface TSCError {
    /** File path */
    file: string;
    /** Line number */
    line: number;
    /** Column number */
    column: number;
    /** Error code */
    code: string;
    /** Error message */
    message: string;
}
/**
 * Error baseline data
 */
export interface ErrorBaselineData {
    /** Timestamp when baseline was created */
    timestamp: Date;
    /** Total error count */
    totalErrors: number;
    /** Errors by file (file -> error count) */
    errorsByFile: Map<string, number>;
    /** Detailed error list */
    errors: TSCError[];
    /** Hash of the baseline for integrity check */
    hash: string;
    /** Source of the baseline (tsc or ast-fallback) */
    source?: string;
}
/**
 * ErrorBaseline - Pre-flight check and inherited error management
 *
 * This class runs tsc --noEmit before applying fixes to establish a baseline
 * of existing errors, then compares post-fix results to only report new errors.
 *
 * @class ErrorBaseline
 */
export declare class ErrorBaseline {
    private projectRoot;
    private baseline;
    private baselineFile;
    private projectType;
    constructor(projectRoot: string, projectType?: ProjectType);
    /**
     * Runs tsc --noEmit to establish baseline
     *
     * @returns Promise<ErrorBaselineData> - Baseline data
     */
    establishBaseline(): Promise<ErrorBaselineData>;
    /**
     * Establishes baseline using AST parser as fallback when tsc fails
     *
     * @private
     * @returns Promise<ErrorBaselineData> - Baseline data from AST parsing
     */
    private establishBaselineWithASTParser;
    /**
     * Filters AST-detected errors to keep only high-confidence ones
     * This prevents false positives from the less accurate AST parser
     *
     * @private
     * @param errors - Errors from AST parser
     * @returns TSCError[] - Filtered high-confidence errors
     */
    private filterHighConfidenceErrors;
    /**
     * Finds all TypeScript files in the project
     *
     * @private
     * @returns Promise<string[]> - Array of TypeScript file paths
     */
    private findTypeScriptFiles;
    /**
     * Parses a TypeScript file using simple AST-like parsing
     *
     * @private
     * @param filePath - Path to the TypeScript file
     * @returns Promise<TSCError[]> - Array of potential errors
     */
    private parseFileWithAST;
    /**
     * Parses tsc --noEmit output to extract errors
     *
     * @private
     * @param output - tsc stderr output
     * @returns TSCError[] - Array of parsed errors
     */
    private parseTSCOutput;
    /**
     * Groups errors by file
     *
     * @private
     * @param errors - Array of errors
     * @returns Map<string, number> - Map of file -> error count
     */
    private groupErrorsByFile;
    /**
     * Generates hash of errors for integrity check
     *
     * @private
     * @param errors - Array of errors
     * @returns string - Hash string
     */
    private generateHash;
    /**
     * Saves baseline to file
     *
     * @private
     * @param baseline - Baseline data
     * @returns Promise<void>
     */
    private saveBaseline;
    /**
     * Loads baseline from file
     *
     * @returns Promise<ErrorBaselineData | null> - Loaded baseline or null
     */
    loadBaseline(): Promise<ErrorBaselineData | null>;
    /**
     * Compares current errors with baseline to find new errors
     *
     * @param currentErrors - Current errors from tsc --noEmit
     * @returns TSCError[] - New errors (not in baseline)
     */
    compareWithBaseline(currentErrors: TSCError[]): TSCError[];
    /**
     * Gets current baseline
     *
     * @returns ErrorBaselineData | null - Current baseline or null
     */
    getBaseline(): ErrorBaselineData | null;
    /**
     * Clears baseline
     */
    clearBaseline(): void;
    /**
     * Deletes baseline file
     *
     * @returns Promise<void>
     */
    deleteBaselineFile(): Promise<void>;
}
//# sourceMappingURL=error-baseline.d.ts.map