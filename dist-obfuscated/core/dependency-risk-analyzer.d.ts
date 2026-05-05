/**
 * Dependency Risk Analyzer - Safe Level 4 Dynamic Risk Assessment
 *
 * Purpose: Calculate risk level for files based on depth, location context,
 * and importer context. This implements the Safe Level 4 dynamic risk
 * assessment to prevent catastrophic fixes in critical files.
 *
 * Risk Matrix:
 * - Critical (riskScore >= 100): /core or /server-actions imported by >3 core files
 * - High (riskScore >= 70): /core or /server-actions imported by 1-2 core files
 * - Medium (riskScore >= 40): /utils imported by >5 files
 * - Low (riskScore < 40): /ui or /components
 *
 * @module core/dependency-risk-analyzer
 * @since 1.1.0
 */
import { ASTAnalyzer } from './ast-analyzer.js';
/**
 * File location context
 */
type FileLocation = 'core' | 'server-actions' | 'utils' | 'ui' | 'components' | 'api' | 'middleware' | 'other';
/**
 * Risk level
 */
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
/**
 * Dependency risk assessment
 */
interface DependencyRisk {
    /** File path */
    filePath: string;
    /** Number of files importing this file */
    importCount: number;
    /** Calculated risk level */
    riskLevel: RiskLevel;
    /** Risk score (0-100+) */
    riskScore: number;
    /** Context information */
    context: {
        /** Location of the file */
        location: FileLocation;
        /** Paths of files importing this file */
        importers: string[];
        /** Locations of importers */
        importerContexts: FileLocation[];
        /** Distance from entry point */
        depth: number;
    };
    /** Recommended action */
    recommendedAction: 'allow-auto-fix' | 'dry-run-only' | 'manual-approval-required' | 'blocked';
}
/**
 * Dependency Risk Analyzer - Safe Level 4 Dynamic Risk Assessment
 *
 * This class calculates risk levels for files based on their location context
 * and the context of their importers to prevent catastrophic fixes.
 *
 * @class DependencyRiskAnalyzer
 */
export declare class DependencyRiskAnalyzer {
    private criticalPaths;
    private astAnalyzer;
    constructor(astAnalyzer?: ASTAnalyzer);
    /**
     * Analyzes file location based on path
     *
     * @private
     * @param filePath - File path to analyze
     * @returns FileLocation - Location context
     */
    private analyzeLocation;
    /**
     * Calculates risk level for a file based on its context and importers
     *
     * @param filePath - File path to analyze
     * @param importers - Array of file paths that import this file (optional if ASTAnalyzer is available)
     * @returns DependencyRisk - Risk assessment
     */
    calculateRisk(filePath: string, importers?: string[]): DependencyRisk;
    /**
     * Calculates depth of file from entry point
     *
     * @private
     * @param filePath - File path
     * @returns number - Depth level
     */
    private calculateDepth;
    /**
     * Checks if a file is safe for automatic fixes
     *
     * @param filePath - File path to check
     * @param importers - Array of file paths that import this file
     * @returns boolean - True if safe for auto-fix
     */
    isSafeForAutoFix(filePath: string, importers: string[]): boolean;
    /**
     * Checks if a file requires dry-run mode
     *
     * @param filePath - File path to check
     * @param importers - Array of file paths that import this file
     * @returns boolean - True if dry-run is required
     */
    requiresDryRun(filePath: string, importers: string[]): boolean;
    /**
     * Checks if a file is blocked from any fixes
     *
     * @param filePath - File path to check
     * @param importers - Array of file paths that import this file
     * @returns boolean - True if file is blocked
     */
    isBlocked(filePath: string, importers: string[]): boolean;
    /**
     * Gets risk assessment for multiple files
     *
     * @param files - Array of file paths
     * @param dependencyGraph - Map of file -> importers
     * @returns Map<string, DependencyRisk> - Risk assessments
     */
    assessMultipleRisks(files: string[], dependencyGraph: Map<string, string[]>): Map<string, DependencyRisk>;
    /**
     * Filters files that are safe for auto-fix
     *
     * @param files - Array of file paths
     * @param dependencyGraph - Map of file -> importers
     * @returns string[] - Files safe for auto-fix
     */
    getSafeFilesForAutoFix(files: string[], dependencyGraph: Map<string, string[]>): string[];
    /**
     * Filters files that require dry-run
     *
     * @param files - Array of file paths
     * @param dependencyGraph - Map of file -> importers
     * @returns string[] - Files requiring dry-run
     */
    getFilesRequiringDryRun(files: string[], dependencyGraph: Map<string, string[]>): string[];
    /**
     * Filters blocked files
     *
     * @param files - Array of file paths
     * @param dependencyGraph - Map of file -> importers
     * @returns string[] - Blocked files
     */
    getBlockedFiles(files: string[], dependencyGraph: Map<string, string[]>): string[];
}
export {};
//# sourceMappingURL=dependency-risk-analyzer.d.ts.map