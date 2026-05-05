/**
 * Phase 6: API & Contracts
 *
 * Purpose: Audit service exposure, endpoints, and data contract consistency.
 * Detect robust API issues, input validation, and contract violations.
 *
 * Architecture:
 * - Endpoint Integrity: Versioning, Rate Limiting, CORS configuration
 * - Contract Consistency: PII exposure, response format inconsistencies
 * - Input Validation: Missing validation libraries (Zod, Joi, class-validator)
 *
 * @module phases/phase-6-api-contracts
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * API finding
 */
interface APIFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'missing-versioning' | 'missing-rate-limit' | 'cors-misconfig' | 'pii-exposure' | 'format-inconsistency' | 'missing-validation' | 'contract-issue' | 'missing-type-validation' | 'type-inconsistency';
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
    /** Endpoint or contract name */
    endpoint?: string;
}
/**
 * Phase 6 configuration
 */
interface Phase6Config {
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
}
/**
 * Phase 6 result
 */
export interface Phase6Result {
    /** Overall success */
    success: boolean;
    /** API findings */
    findings: APIFinding[];
    /** Total critical findings */
    criticalFindings: number;
    /** Total high severity findings */
    highSeverityFindings: number;
    /** Files analyzed */
    filesAnalyzed: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 6: API & Contracts
 *
 * This phase audits service exposure, endpoints, and data contract consistency.
 * Detects robust API issues, input validation, and contract violations.
 *
 * @class Phase6APIContracts
 * @example
 * ```typescript
 * const phase6 = new Phase6APIContracts({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase6.execute();
 * ```
 */
export declare class Phase6APIContracts {
    private config;
    constructor(config: Phase6Config);
    /**
     * Executes Phase 6: API & Contracts
     *
     * @returns Promise<Phase6Result> - API & contracts analysis result
     */
    execute(): Promise<Phase6Result>;
    /**
     * Scans for API files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private scanAPIFiles;
    /**
     * Analyzes a single file for API issues
     *
     * @private
     * @param filePath - File path
     * @param isSaaS - Whether domain is SaaS
     * @param isFintech - Whether domain is Fintech
     * @param sensitiveFields - Sensitive fields from Phase 3
     * @returns Promise<APIFinding[]> - API findings
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
     * Analyzes endpoint integrity (versioning, Rate Limiting, CORS)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param isSaaS - Whether domain is SaaS
     * @param isFintech - Whether domain is Fintech
     * @returns APIFinding[] - Endpoint integrity findings
     */
    private analyzeEndpointIntegrity;
    /**
     * Analyzes contract consistency (PII exposure, response format inconsistencies)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param sensitiveFields - Sensitive fields from Phase 3
     * @returns APIFinding[] - Contract consistency findings
     */
    private analyzeContractConsistency;
    /**
     * Analyzes documentation gap (missing swagger.json, openapi.yaml, @ApiProperty)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @returns APIFinding[] - Documentation gap findings
     */
    private analyzeDocumentationGap;
    /**
     * Analyzes input validation (missing Zod, Joi, class-validator)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param isCriticalModule - Whether file is in Critical Module
     * @returns APIFinding[] - Input validation findings
     */
    private analyzeInputValidation;
    /**
     * Analyzes request/response type validation
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param isCriticalModule - Whether file is in Critical Module
     * @returns APIFinding[] - Type validation findings
     */
    private analyzeTypeValidation;
    /**
     * Analyzes frontend/backend type consistency
     *
     * @private
     * @returns Promise<APIFinding[]> - Type consistency findings
     */
    private analyzeTypeConsistency;
    /**
     * Writes partial report for Phase 6
     *
     * @private
     * @param result - Phase 6 result
     * @param domain - Business domain
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-6-api-contracts.d.ts.map