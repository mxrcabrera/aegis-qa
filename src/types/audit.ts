/**
 * Audit Types - Type-safe audit results and violations
 *
 * This module defines interfaces for audit results, violations, and reports
 * for the Aegis QA project, ensuring type safety and consistency.
 *
 * @module types/audit
 * @since 1.0.0
 */

/**
 * Severity level for violations
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'none';

/**
 * Violation type classification
 */
export type ViolationType =
  | 'style'
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'type'
  | 'unknown';

/**
 * File metadata
 */
export interface FileMetadata {
  /** File path relative to project root */
  path: string;

  /** File extension */
  extension: string;

  /** Number of lines in the file */
  lineCount: number;

  /** Whether file is in a critical path */
  inCriticalPath: boolean;

  /** Associated critical path name (if any) */
  criticalPathName?: string;

  /** Last modified timestamp */
  lastModified?: Date;
}

/**
 * Violation location in a file
 */
export interface ViolationLocation {
  /** Line number (1-indexed) */
  line: number;

  /** Column number (1-indexed) */
  column?: number;

  /** End line number (for multi-line violations) */
  endLine?: number;

  /** End column number (for multi-line violations) */
  endColumn?: number;
}

/**
 * Code violation
 */
export interface Violation {
  /** Unique identifier for the violation */
  id: string;

  /** Type of violation */
  type: ViolationType;

  /** Severity level */
  severity: Severity;

  /** File where violation occurred */
  file: FileMetadata;

  /** Location in file */
  location: ViolationLocation;

  /** Description of the violation */
  message: string;

  /** Suggested fix */
  suggestion?: string;

  /** Rule that was violated */
  rule: string;

  /** Whether this violation is auto-fixable */
  autoFixable: boolean;

  /** Confidence score for the violation (0-1) */
  confidence: number;
}

/**
 * Route analysis result
 */
export interface RouteAnalysisResult {
  /** Total number of routes found */
  totalRoutes: number;

  /** Routes by type */
  routesByType: {
    pages: number;
    layouts: number;
    routes: number;
    loading: number;
    error: number;
    notFound: number;
    serverActions: number;
  };

  /** Detected routes */
  routes: Array<{
    path: string;
    type: 'page' | 'layout' | 'route' | 'loading' | 'error' | 'not-found' | 'server-action';
    file: string;
  }>;

  /** Missing routes (if any) */
  missingRoutes?: string[];
}

/**
 * Style audit result
 */
export interface StyleAuditResult {
  /** Total violations found */
  totalViolations: number;

  /** Violations by severity */
  violationsBySeverity: Record<Severity, number>;

  /** Violations by type */
  violationsByType: Record<ViolationType, number>;

  /** All violations */
  violations: Violation[];

  /** Files analyzed */
  filesAnalyzed: number;

  /** Files with violations */
  filesWithViolations: number;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  /** Total vulnerabilities found */
  totalVulnerabilities: number;

  /** Vulnerabilities by severity */
  vulnerabilitiesBySeverity: Record<Severity, number>;

  /** All vulnerabilities */
  vulnerabilities: Violation[];

  /** RLS status for each table */
  rlsStatus: Array<{
    table: string;
    rlsEnabled: boolean;
    policies: number;
  }>;

  /** Tables with RLS disabled */
  tablesWithoutRLS: string[];

  /** Security score (0-100) */
  securityScore: number;
}

/**
 * Audit results summary
 */
export interface AuditResults {
  /** Route analysis results */
  routes?: RouteAnalysisResult;

  /** Style audit results */
  styles?: StyleAuditResult;

  /** Security scan results */
  security?: SecurityScanResult;

  /** Overall audit timestamp */
  timestamp: Date;

  /** Overall audit status */
  status: 'passed' | 'failed' | 'warning';

  /** Error message if audit failed */
  error?: string;
}

/**
 * Audit configuration
 */
export interface AuditConfig {
  /** Root directory of the project to audit */
  projectRoot: string;

  /** Domain map for context */
  domainMap?: import('./domain.js').DomainMap;

  /** Thermal controller for hardware protection */
  thermalController?: import('../core/thermal-controller.js').ThermalController;

  /** Whether to enable auto-fix */
  enableAutoFix: boolean;

  /** Maximum files to process per batch */
  maxFilesPerBatch: number;

  /** Cooldown between batches (ms) */
  batchCooldownMs: number;

  /** Severity threshold for failing the audit */
  failSeverity: Severity;

  /** File patterns to include */
  includePatterns: string[];

  /** File patterns to exclude */
  excludePatterns: string[];
}
