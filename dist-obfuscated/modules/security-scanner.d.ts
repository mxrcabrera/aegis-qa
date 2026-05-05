/**
 * Security Scanner - Security Violation Detection for Aegis QA
 *
 * This module scans project files to detect security violations including:
 * - Row Level Security (RLS) policy coverage
 * - Service Role Key abuse in client code
 * - Missing RLS policies on critical tables
 *
 * Integrates with:
 * - ReportAggregator for centralized violation management
 * - ThermalController for hardware protection
 * - DomainMap for business context and critical path awareness
 *
 * @module security-scanner
 * @since 1.0.0
 */
import { ReportAggregator } from '../core/reporter.js';
import type { ThermalController } from '../core/thermal-controller.js';
import type { DomainMap } from '../types/domain.js';
/**
 * Security scanner configuration
 */
export interface SecurityScannerConfig {
    /** Root directory of the project to scan */
    projectRoot: string;
    /** Directory patterns to scan (default: all source files) */
    scanPatterns?: string[];
    /** File extensions to scan */
    fileExtensions?: string[];
    /** Domain map for business context */
    domainMap?: DomainMap;
    /** Thermal controller for hardware protection */
    thermalController?: ThermalController;
    /** Report aggregator for centralized violations */
    reporter?: ReportAggregator;
    /** Maximum files to process per batch */
    maxFilesPerBatch?: number;
    /** Cooldown between batches (ms) */
    batchCooldownMs?: number;
    /** Whether to check database connection for RLS policies */
    checkDatabase?: boolean;
    /** Supabase URL (optional, for DB connection) */
    supabaseUrl?: string;
    /** Supabase service role key (optional, for DB connection) */
    supabaseServiceRoleKey?: string;
}
/**
 * RLS policy information
 */
interface RLSPolicy {
    /** Table name */
    tableName: string;
    /** Policy name */
    policyName: string;
    /** Policy type (SELECT, INSERT, UPDATE, DELETE, ALL) */
    policyType: string;
    /** Whether policy is enabled */
    enabled: boolean;
    /** Source file where policy was found */
    sourceFile: string;
}
/**
 * Service role key usage information
 */
interface ServiceRoleUsage {
    /** File where service role key was found */
    filePath: string;
    /** Line number */
    lineNumber: number;
    /** Context (variable name, function call, etc.) */
    context: string;
    /** Whether this is in a server action (safe) */
    isServerAction: boolean;
}
/**
 * SecurityScanner class
 *
 * Detects security violations in project files with hardware protection
 * and business context awareness.
 */
export declare class SecurityScanner {
    private config;
    private fileMetadataCache;
    private rlsPolicies;
    private serviceRoleUsages;
    /**
     * Creates a new SecurityScanner instance
     *
     * @param config - Configuration for security scanning
     */
    constructor(config: SecurityScannerConfig);
    /**
     * Runs security scan on the project
     *
     * This method scans project files for security violations, checks thermal
     * status before processing, and uses the ReportAggregator to centralize
     * violations. It also provides business context for violations.
     *
     * @returns Promise<number> - Number of violations found
     */
    scan(): Promise<number>;
    /**
     * Finds all files to scan
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private findFiles;
    /**
     * Creates batches of files for processing
     *
     * @private
     * @param files - Files to batch
     * @returns string[][] - Array of file batches
     */
    private createBatches;
    /**
     * Processes a batch of files
     *
     * @private
     * @param files - Files to process
     * @returns Promise<Violation[]> - Violations found
     */
    private processBatch;
    /**
     * Analyzes a single file for security violations
     *
     * @private
     * @param fullPath - Full path to file
     * @param relativePath - Relative path from project root
     * @returns Promise<Violation[]> - Violations found
     */
    private analyzeFile;
    /**
     * Scans SQL file for RLS policies
     *
     * @private
     * @param filePath - Path to SQL file
     */
    private scanRLSPolicies;
    /**
     * Checks for service role key usage
     *
     * @private
     * @param line - Line of code
     * @param lineNumber - Line number
     * @param metadata - File metadata
     * @param fullContent - Full file content for context
     * @returns Violation[] - Service role violations
     */
    private checkServiceRoleKey;
    /**
     * Checks if a file is a Server Action
     *
     * @private
     * @param content - File content
     * @returns boolean - True if file is a Server Action
     */
    private isServerAction;
    /**
     * Checks for missing RLS policies on critical tables
     *
     * @private
     * @returns Violation[] - Missing policy violations
     */
    private checkMissingRLSPolicies;
    /**
     * Gets list of critical tables from DomainMap
     *
     * @private
     * @returns string[] - Critical table names
     */
    private getCriticalTables;
    /**
     * Creates a violation object
     *
     * @private
     * @param type - Violation type
     * @param severity - Violation severity
     * @param lineNumber - Line number
     * @param metadata - File metadata
     * @param message - Detailed message
     * @param rule - Rule identifier
     * @param autoFixable - Whether violation is auto-fixable
     * @returns Violation - Created violation
     */
    private createViolation;
    /**
     * Adds business context to a violation message
     *
     * @private
     * @param message - Original message
     * @param metadata - File metadata
     * @returns string - Message with business context
     */
    private addBusinessContext;
    /**
     * Gets file metadata
     *
     * @private
     * @param fullPath - Full path to file
     * @param relativePath - Relative path from project root
     * @returns FileMetadata - File metadata
     */
    private getFileMetadata;
    /**
     * Checks if a file is in a critical path
     *
     * @private
     * @param relativePath - Relative path from project root
     * @returns boolean - True if in critical path
     */
    private isInCriticalPath;
    /**
     * Gets the name of the critical path for a file
     *
     * @private
     * @param relativePath - Relative path from project root
     * @returns string | undefined - Critical path name
     */
    private getCriticalPathName;
    /**
     * Clears the file metadata cache
     */
    clearCache(): void;
    /**
     * Gets detected RLS policies
     *
     * @returns Map<string, RLSPolicy[]> - RLS policies by table
     */
    getRLSPolicies(): Map<string, RLSPolicy[]>;
    /**
     * Gets detected service role key usages
     *
     * @returns ServiceRoleUsage[] - Service role key usages
     */
    getServiceRoleUsages(): ServiceRoleUsage[];
}
export {};
//# sourceMappingURL=security-scanner.d.ts.map