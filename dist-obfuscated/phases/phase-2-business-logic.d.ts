/**
 * Phase 2: Business Logic - Business Semantics & Core Path Detection
 *
 * Purpose: Deduce the business purpose of the repository to prioritize the subsequent 18 phases.
 * This is about "Business Semantics" - Aegis must know if it's analyzing a toy or a financial engine.
 *
 * Architecture:
 * - Stack & Niche Detection: Analyze package.json dependencies and README.md keywords
 * - Core Path Identification: Detect critical folders (/services, /api/v1, /core, /lib)
 * - Risk Cross-Reference: Combine Core Path with Phase 1 Quality Scores
 * - BusinessProfile Generation: Store business context in StatePersistence
 *
 * @module phases/phase-2-business-logic
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Business domain types
 */
type BusinessDomain = 'Fintech' | 'Health' | 'E-Commerce' | 'SaaS' | 'Tooling' | 'Education' | 'Media' | 'Gaming' | 'IoT' | 'General';
/**
 * Business risk finding
 */
interface BusinessRiskFinding {
    /** File path */
    filePath: string;
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    /** Risk reason */
    reason: string;
    /** Quality score from Phase 1 */
    qualityScore: number;
}
/**
 * Business profile
 */
interface BusinessProfile {
    /** Detected business domain */
    domain: BusinessDomain;
    /** Confidence score (0-100) */
    confidence: number;
    /** Detected stack dependencies */
    stack: string[];
    /** Critical modules (files that cannot break) */
    criticalModules: string[];
    /** Business risk findings */
    riskFindings: BusinessRiskFinding[];
    /** Recommended focus for subsequent phases */
    recommendedFocus: string[];
    /** Core paths identified */
    corePaths: string[];
    /** Priority Phase: Most critical phase for this business domain */
    priorityPhase: number;
    /** Untouchable folders: Folders Atomic Fixer should not touch without double validation */
    untouchableFolders: string[];
    /** Self-audit flag: Whether this is Aegis QA auditing itself */
    isSelfAudit: boolean;
    /** Sensitivity Level: High/Medium/Low based on data type (PII, Payments, etc.) */
    sensitivityLevel: 'high' | 'medium' | 'low';
    /** Core Flow: Detected data flow patterns (useContext, Cart, Auth, etc.) */
    coreFlow: string[];
    /** Business Understanding: Human-readable description of what the software does */
    businessUnderstanding: string;
}
/**
 * Phase 2 configuration
 */
interface Phase2Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
}
/**
 * Phase 2 result
 */
export interface Phase2Result {
    /** Overall success */
    success: boolean;
    /** Business profile */
    businessProfile: BusinessProfile;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 2: Business Logic - Business Semantics & Core Path Detection
 *
 * This phase deduces the business purpose of the repository to prioritize
 * the subsequent phases.
 *
 * @class Phase2BusinessLogic
 * @example
 * ```typescript
 * const phase2 = new Phase2BusinessLogic({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase2.execute();
 * ```
 */
export declare class Phase2BusinessLogic {
    private config;
    constructor(config: Phase2Config);
    /**
     * Executes Phase 2: Business Logic
     *
     * @returns Promise<Phase2Result> - Business logic analysis result
     */
    execute(): Promise<Phase2Result>;
    /**
     * Analyzes package.json for domain detection
     *
     * @private
     * @returns Promise<{ domain: BusinessDomain; confidence: number; stack: string[] }>
     */
    private analyzePackageJson;
    /**
     * Analyzes README.md for domain detection
     *
     * @private
     * @returns Promise<{ domain: BusinessDomain; confidence: number }>
     */
    private analyzeReadme;
    /**
     * Combines domain detections from package.json and README
     *
     * @private
     * @param depsResult - Result from package.json analysis
     * @param readmeResult - Result from README analysis
     * @returns { domain: BusinessDomain; confidence: number }
     */
    private combineDomainDetections;
    /**
     * Identifies core paths in the project
     *
     * @private
     * @returns string[] - List of core paths
     */
    private identifyCorePaths;
    /**
     * Cross-references core paths with Phase 1 quality scores
     *
     * @private
     * @param corePaths - List of core paths
     * @returns Promise<BusinessRiskFinding[]> - Business risk findings
     */
    private crossReferenceWithPhase1;
    /**
     * Generates recommended focus for subsequent phases
     *
     * @private
     * @param domain - Detected business domain
     * @param riskFindings - Business risk findings
     * @returns string[] - Recommended focus areas
     */
    private generateRecommendedFocus;
    /**
     * Detects if Aegis QA is auditing itself
     *
     * @private
     * @returns boolean - True if self-audit detected
     */
    private detectSelfAudit;
    /**
     * Generates the priority phase based on business domain
     *
     * @private
     * @param domain - Detected business domain
     * @param isSelfAudit - Whether this is a self-audit
     * @returns number - Priority phase number
     */
    private generatePriorityPhase;
    /**
     * Generates untouchable folders for Atomic Fixer
     *
     * @private
     * @param domain - Detected business domain
     * @param corePaths - Identified core paths
     * @param isSelfAudit - Whether this is a self-audit
     * @returns string[] - List of untouchable folders
     */
    private generateUntouchableFolders;
    /**
     * Finds source files in the project
     *
     * @private
     * @param projectRoot - Project root directory
     * @returns string[] - Array of source file paths
     */
    private findSourceFiles;
    /**
     * Analyzes Core Flow - detects data flow patterns (useContext, Cart, Auth, etc.)
     *
     * @private
     * @returns string[] - Detected core flow patterns
     */
    private analyzeCoreFlow;
    /**
     * Calculates Sensitivity Level based on domain and core flow
     *
     * @private
     * @param domain - Business domain
     * @param coreFlow - Detected core flow patterns
     * @returns 'high' | 'medium' | 'low' - Sensitivity level
     */
    private calculateSensitivityLevel;
    /**
     * Generates Business Understanding - human-readable description of what the software does
     *
     * @private
     * @param domain - Business domain
     * @param coreFlow - Detected core flow patterns
     * @param isSelfAudit - Whether this is a self-audit
     * @returns string - Business understanding description
     */
    private generateBusinessUnderstanding;
    /**
     * Writes partial report for Phase 2
     *
     * @private
     * @param businessProfile - Business profile to write
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-2-business-logic.d.ts.map