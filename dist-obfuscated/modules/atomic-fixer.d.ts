/**
 * Atomic Fixer - Phase 11
 *
 * Transforms findings from previous phases into applicable solutions (patches)
 * without breaking the system. Surgical fixes with safety gates and validation loops.
 *
 * @module atomic-fixer
 * @since 2.0.0
 */
import { type ImpactScore } from './impact-analyzer.js';
export interface Fix {
    id: string;
    violationId?: string;
    type: 'i18n' | 'a11y' | 'environment' | 'clean-code';
    category: 'atomic' | 'refactoring';
    severity: 'critical' | 'high' | 'medium' | 'low';
    file: string;
    line?: number;
    description: string;
    originalContent: string;
    proposedContent: string;
    autoApply: boolean;
    requiresConfirmation: boolean;
    isCorePath: boolean;
    collisionDetected?: boolean;
    manualMergeRequired?: boolean;
    confidence: number;
    riskLevel: 'safe' | 'moderate' | 'risky';
    impactScore?: ImpactScore;
}
export interface FixResult {
    fix: Fix;
    applied: boolean;
    patchPath?: string;
    validationPassed?: boolean;
    error?: string;
}
export interface RemediationResults {
    atomicFixes: FixResult[];
    refactoringSuggestions: FixResult[];
    totalFixes: number;
    testValidationResults?: {
        enabled: boolean;
        testCommand?: string;
        baselinePassed: number;
        baselineFailed: number;
        newFailures: number;
        newPasses: number;
        rollbacks: number;
    };
}
interface FileLocation {
    path: string;
}
interface ViolationLocation {
    line?: number;
}
interface Violation {
    rule: string;
    file?: FileLocation;
    id?: string;
    location?: ViolationLocation;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    confidence?: number;
}
export declare class AtomicFixer {
    private projectRoot;
    private interactiveMode;
    private dryRun;
    private diffsPath;
    private maxRisk;
    private minConfidence;
    private impactAnalyzer;
    private runTests;
    private testCommand;
    private testBaseline;
    /**
     * Generates a deterministic hash for fix IDs based on content, file, and line
     *
     * @private
     * @param content - The content being fixed
     * @param file - The file path
     * @param line - The line number
     * @returns string - Deterministic hash
     */
    private generateDeterministicId;
    /**
     * Calculates the risk level for a fix based on the nature of the change
     *
     * @private
     * @param fixType - The type of fix
     * @param originalContent - The original content
     * @param proposedContent - The proposed content
     * @param isCorePath - Whether the file is in a critical path
     * @param impactScore - Optional impact analysis for the file
     * @returns 'safe' | 'moderate' | 'risky' - The calculated risk level
     */
    private calculateRiskLevel;
    /**
     * Checks if a fix passes the confidence and risk gates
     *
     * @private
     * @param fix - The fix to check
     * @returns { passes: boolean, reason?: string } - Whether the fix passes and why it doesn't
     */
    private checkFixGates;
    constructor(projectRoot: string, interactiveMode?: boolean, dryRun?: boolean, maxRisk?: 'safe' | 'moderate' | 'risky', minConfidence?: number, runTests?: boolean, testCommand?: string);
    /**
     * Auto-detect test command from package.json
     *
     * @private
     * @returns string | undefined - Detected test command or undefined
     */
    private autoDetectTestCommand;
    /**
     * Get effective test command (custom or auto-detected)
     *
     * @private
     * @returns string | undefined - Test command or undefined
     */
    private getTestCommand;
    /**
     * Run test command and capture results
     *
     * @private
     * @param command - Test command to run
     * @param timeoutMs - Timeout in milliseconds (default: 60000 = 1 minute)
     * @param filePath - Optional file path for --findRelatedTests optimization
     * @returns Promise<{ passed: boolean, output: string, tests: Map<string, boolean> }> - Test results
     */
    private runTestCommand;
    /**
     * Establish test baseline before applying fixes
     *
     * @private
     * @returns Promise<void>
     */
    private establishTestBaseline;
    /**
     * Validate tests after applying fixes
     *
     * @private
     * @param fix - The fix that was applied
     * @returns Promise<{ passed: boolean, rollbackRequired: boolean, details: string, newFailures: number }> - Validation result
     */
    private validateTestsAfterFix;
    /**
     * Run all atomic fixes
     */
    runFixes(violations: Violation[], domainModel?: unknown): Promise<RemediationResults>;
    /**
     * Group fixes by file for micro-pass application
     *
     * @private
     * @param fixes - All fixes to group
     * @returns Map of file path to array of fixes
     */
    private groupFixesByFile;
    /**
     * Apply fixes with micro-pass strategy
     * Groups fixes by file and applies them one at a time with offset recalculation
     *
     * @private
     * @param fileGroups - Map of file path to array of fixes
     * @returns Array of fixes ready for application
     */
    private applyFixesWithMicroPasses;
    /**
     * Process fixes for a single file with offset recalculation
     *
     * @private
     * @param _file - File path
     * @param fixes - Fixes for this file
     * @returns Processed fixes with updated line numbers and status
     */
    private processFixesForFile;
    /**
     * Check if a fix would affect the context of remaining fixes
     *
     * @private
     * @param appliedFix - The fix being applied
     * @param remainingFixes - Remaining fixes for the file
     * @param _offset - Line offset introduced by the applied fix
     * @returns Whether the fix would affect remaining fixes
     */
    private wouldAffectRemainingFixes;
    /**
     * Generate fixes based on violations
     */
    private generateFixes;
    /**
     * Generate i18n/a11y fix
     */
    private generateI18nFix;
    /**
     * Generate environment fix
     */
    private generateEnvironmentFix;
    /**
     * Generate clean code fix
     */
    private generateCleanCodeFix;
    /**
     * Apply a fix with safety gate
     */
    private applyFix;
    /**
     * Generate patch file for safety gate
     */
    private generatePatch;
    /**
     * Write fix to file
     */
    private writeFix;
    /**
     * Validate fix by re-running the specific phase
     */
    private validateFix;
    /**
     * Syntax Pre-flight: Validate syntax before applying Clean Code fixes
     * Uses real tsc validation with baseline comparison instead of bracket counting
     */
    private validateSyntax;
    /**
     * Check if tsc is available in the project
     */
    private isTscAvailable;
    /**
     * Validate syntax using real tsc with baseline comparison
     */
    private validateWithTsc;
    /**
     * Check if tsconfig.json has incremental compilation enabled
     */
    private hasIncrementalTsConfig;
    /**
     * Get tsc errors for a specific file
     */
    private getTscErrors;
    /**
     * Count new errors introduced by the fix
     */
    private countNewErrors;
    /**
     * Fallback syntax validation using bracket counting
     */
    private validateWithBrackets;
    /**
     * Create backup for atomic rollback
     */
    private createBackup;
    /**
     * Atomic Rollback: Revert to backup if validation fails
     */
    private rollbackFix;
    /**
     * Add Fix ID traceability comment
     */
    private addTraceabilityComment;
    /**
     * Check if file is in Core Path
     */
    private isCorePath;
    /**
     * Generate .env.example content with detected variables
     */
    private generateEnvExampleContent;
}
export default AtomicFixer;
//# sourceMappingURL=atomic-fixer.d.ts.map