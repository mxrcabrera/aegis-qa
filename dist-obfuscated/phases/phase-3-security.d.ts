/**
 * Phase 3: Security - Vulnerability & Secret Detection
 *
 * Purpose: Identify vulnerabilities and data leaks, using BusinessProfile as a risk multiplier.
 * This is about precision - don't warn about console.log in tests, but scream if a secret
 * is found in the business core.
 *
 * Architecture:
 * - Secret Detection: Scan for API keys, tokens, credentials using regex and entropy
 * - Code Vulnerabilities: Injections (eval, innerHTML, SQL), Sensitive Data Leaks
 * - Security Multiplier: Context-aware severity escalation based on BusinessProfile
 * - Critical Module Detection: Escalate severity for findings in core business paths
 * - Domain-Based Escalation: Fintech/Health domains get automatic severity boost
 *
 * @module phases/phase-3-security
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
import { ReportAggregator } from '../core/reporter.js';
/**
 * Security finding
 */
interface SecurityFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'secret' | 'injection' | 'sensitive-data' | 'weak-security';
    /** Severity: low, medium, high, critical */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** File path */
    filePath: string;
    /** Line number */
    line?: number;
    /** Description of the issue */
    description: string;
    /** Suggested fix */
    suggestion?: string;
    /** Whether this is in a critical module (from Phase 2) */
    inCriticalModule?: boolean;
    /** Original severity before multiplier */
    originalSeverity?: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Phase 3 configuration
 */
interface Phase3Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** File filter for filtering files */
    fileFilter?: FileFilter;
    /** Ignore handler for filtering */
    ignoreHandler?: IgnoreHandler;
    /** Report aggregator for reporting violations */
    reportAggregator?: ReportAggregator;
}
/**
 * Phase 3 result
 */
export interface Phase3Result {
    /** Overall success */
    success: boolean;
    /** Security findings */
    findings: SecurityFinding[];
    /** Total critical findings */
    criticalFindings: number;
    /** Total high severity findings */
    highSeverityFindings: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 3: Security - Vulnerability & Secret Detection
 *
 * This phase identifies vulnerabilities and data leaks, using BusinessProfile
 * as a risk multiplier for context-aware severity escalation.
 *
 * @class Phase3Security
 * @example
 * ```typescript
 * const phase3 = new Phase3Security({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase3.execute();
 * ```
 */
export declare class Phase3Security {
    private config;
    constructor(config: Phase3Config);
    /**
     * Executes Phase 3: Security
     *
     * @returns Promise<Phase3Result> - Security analysis result
     */
    execute(): Promise<Phase3Result>;
    /**
     * Scans for files to analyze
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private scanFiles;
    /**
     * Analyzes a single file for security vulnerabilities
     *
     * @private
     * @param filePath - File path
     * @param criticalModules - Critical modules from Phase 2
     * @param domain - Business domain
     * @returns Promise<SecurityFinding[]> - Security findings
     */
    private analyzeFile;
    /**
     * Computes SHA-1 hash of file content
     *
     * @private
     * @param content - File content
     * @returns string - SHA-1 hash
     */
    private computeHash;
    /**
     * Generates unique ID for a finding
     *
     * @private
     * @param fileHash - SHA-1 hash of file content
     * @param line - Line number
     * @param type - Finding type
     * @returns string - Unique ID
     */
    private generateFindingId;
    /**
     * Sanitizes a secret by masking it
     *
     * @private
     * @param secret - Secret to sanitize
     * @returns string - Sanitized secret
     */
    private sanitizeSecret;
    /**
     * Detects secrets (API keys, tokens, credentials)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param lines - File lines
     * @param fileHash - File hash
     * @param inCriticalModule - Whether file is in critical module
     * @param domain - Business domain
     * @returns SecurityFinding[] - Secret findings
     */
    private detectSecrets;
    /**
     * Calculates Shannon entropy of a string
     *
     * @private
     * @param str - String to analyze
     * @returns number - Entropy value
     */
    private calculateEntropy;
    /**
     * Detects injection vulnerabilities
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param lines - File lines
     * @param fileHash - File hash
     * @param inCriticalModule - Whether file is in critical module
     * @param domain - Business domain
     * @returns SecurityFinding[] - Injection findings
     */
    private detectInjections;
    /**
     * Detects sensitive data leaks (PII in console.log)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param lines - File lines
     * @param fileHash - File hash
     * @param inCriticalModule - Whether file is in critical module
     * @param domain - Business domain
     * @returns SecurityFinding[] - Sensitive data leak findings
     */
    private detectSensitiveDataLeaks;
    /**
     * Applies security multiplier based on BusinessProfile
     *
     * @private
     * @param findings - Original findings
     * @param criticalModules - Critical modules from Phase 2
     * @param domain - Business domain
     * @returns SecurityFinding[] - Escalated findings
     */
    private applySecurityMultiplier;
    /**
     * Sub-phase 3B: AI API Security
     * Analyzes AI API integrations for security vulnerabilities
     *
     * @private
     */
    private runSubPhase3B_AI_API_Security;
    /**
     * Sub-phase 3C: Secure Development Methodology
     * Checks for secure development practices
     *
     * @private
     */
    private runSubPhase3C_SecureDevMethodology;
    /**
     * Sub-phase 3E: BaaS/RLS Platform Security
     * Validates Row Level Security policies for Supabase
     *
     * @private
     */
    private runSubPhase3E_BaaSPlatformSecurity;
    /**
     * Sub-phase 3F: Webhook Security
     * Analyzes webhook implementations for security vulnerabilities
     *
     * @private
     */
    private runSubPhase3F_WebhookSecurity;
    /**
     * Sub-phase 3G: Data Privacy PII
     * Analyzes PII handling for privacy compliance
     *
     * @private
     */
    private runSubPhase3G_DataPrivacyPII;
    /**
     * Detects if the project uses AI APIs
     *
     * @private
     * @returns Promise<boolean> - True if AI API usage detected
     */
    private detectAIUsage;
    /**
     * Detects if the project uses Supabase
     *
     * @private
     * @returns Promise<boolean> - True if Supabase project detected
     */
    private detectSupabaseProject;
    /**
     * Detects if the project uses webhooks
     *
     * @private
     * @returns Promise<boolean> - True if webhooks detected
     */
    private detectWebhooks;
    /**
     * Finds SQL files in the project
     *
     * @private
     * @returns Promise<string[]> - Array of SQL file paths
     */
    private findSQLFiles;
    /**
     * Extracts table names from SQL content
     *
     * @private
     * @param content - SQL content
     * @returns string[] - Array of table names
     */
    private extractTables;
    /**
     * Writes partial report for Phase 3
     *
     * @private
     * @param result - Phase 3 result
     * @param domain - Business domain
     * @param criticalModulesCount - Number of critical modules
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-3-security.d.ts.map