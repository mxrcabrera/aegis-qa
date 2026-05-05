/**
 * Phase 4: Database - Schema & Query Audit
 *
 * Purpose: Audit the data layer, schemas, and queries, with special attention
 * if Phase 3 detected injection risks.
 *
 * Architecture:
 * - Schema & ORM Audit: Prisma, Mongoose, TypeORM, raw SQL detection
 * - Missing Index Detection: Fields that look like keys (email, userId, slug)
 * - Dangerous Relationship Detection: Massive cascades
 * - Query Efficiency: N+1 pattern, unnecessary SELECT *
 * - Cross-Phase Alerting: Extreme analysis if Phase 3 detected SQL injection risks
 *
 * @module phases/phase-4-database
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { ThermalController } from '../core/thermal-controller.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * Database finding
 */
interface DatabaseFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'missing-index' | 'dangerous-relationship' | 'n-plus-1' | 'select-star' | 'dangerous-query' | 'schema-issue';
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
    /** Table or model name */
    table?: string;
}
/**
 * Phase 4 configuration
 */
interface Phase4Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** Thermal controller for resource cap */
    thermalController?: ThermalController;
    /** File filter for filtering files */
    fileFilter?: FileFilter;
    /** Ignore handler for filtering */
    ignoreHandler?: IgnoreHandler;
}
/**
 * Phase 4 result
 */
export interface Phase4Result {
    /** Overall success */
    success: boolean;
    /** Database findings */
    findings: DatabaseFinding[];
    /** Total critical findings */
    criticalFindings: number;
    /** Total high severity findings */
    highSeverityFindings: number;
    /** ORM type detected */
    ormType?: 'prisma' | 'mongoose' | 'typeorm' | 'raw-sql' | 'none';
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 4: Database - Schema & Query Audit
 *
 * This phase audits the data layer, schemas, and queries, with special attention
 * to injection risks detected in Phase 3.
 *
 * @class Phase4Database
 * @example
 * ```typescript
 * const phase4 = new Phase4Database({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase4.execute();
 * ```
 */
export declare class Phase4Database {
    private config;
    constructor(config: Phase4Config);
    /**
     * Executes Phase 4: Database
     *
     * @returns Promise<Phase4Result> - Database analysis result
     */
    execute(): Promise<Phase4Result>;
    /**
     * Detects the ORM type used in the project
     *
     * @private
     * @returns Promise<ormType> - Detected ORM type
     */
    private detectORMType;
    /**
     * Scans for database files based on ORM type
     *
     * @private
     * @param ormType - Detected ORM type
     * @returns Promise<string[]> - Array of file paths
     */
    private scanDatabaseFiles;
    /**
     * Analyzes a single file for database issues
     *
     * @private
     * @param filePath - File path
     * @param ormType - Detected ORM type
     * @param hasSqlInjectionRisks - Whether Phase 3 detected SQL injection risks
     * @returns Promise<DatabaseFinding[]> - Database findings
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
     * Analyzes schema for missing indexes and dangerous relationships
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param ormType - ORM type
     * @returns DatabaseFinding[] - Schema findings
     */
    private analyzeSchema;
    /**
     * Analyzes queries for efficiency issues
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param ormType - ORM type
     * @returns DatabaseFinding[] - Query findings
     */
    private analyzeQueries;
    /**
     * Analyzes string concatenation in queries (Extreme Mode for SQL injection risks)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @returns DatabaseFinding[] - String concatenation findings
     */
    private analyzeStringConcatenation;
    /**
     * Writes partial report for Phase 4
     *
     * @private
     * @param result - Phase 4 result
     * @param ormType - Detected ORM type
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-4-database.d.ts.map