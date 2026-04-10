/**
 * Type Definitions for QA Orchestrator
 *
 * Strict interfaces to eliminate 'any' type usage
 */

/**
 * Base violation interface
 */
export interface BaseViolation {
  file: string;
  line: number;
  type: string;
  message: string;
}

/**
 * Style violation from StyleAuditor
 */
export interface StyleViolation extends BaseViolation {
  type: "inline-style" | "hardcoded-color" | "hardcoded-spacing" | "non-tailwind";
}

/**
 * Security violation from SecurityScanner
 */
export interface SecurityViolation extends BaseViolation {
  type: "critical" | "high" | "medium" | "low" | "none";
  table: string;
  statusCode?: number;
  vulnerability?: string;
}

/**
 * Route violation from CodeReader
 */
export interface RouteViolation extends BaseViolation {
  type: "missing-export" | "invalid-path" | "duplicate-route";
  path?: string;
  component?: string;
}

/**
 * Union type for all violation types
 */
export type Violation = StyleViolation | SecurityViolation | RouteViolation;

/**
 * Fix result from AutoFixer
 */
export interface FixResult {
  success: boolean;
  fixesApplied: number;
  errors: string[];
  fixes: Fix[];
  summary: {
    styleFixes: number;
    securityFixes: number;
    routeFixes: number;
  };
}

/**
 * Fix details
 */
export interface Fix {
  file: string;
  type: "style" | "security";
  description: string;
  applied: boolean;
  error?: string;
}

/**
 * Ollama response from OllamaProcessor
 */
export interface OllamaResponse {
  model: string;
  response: string;
  duration?: number;
  tokensUsed?: number;
}

/**
 * Audit results from StyleAuditor
 */
export interface StyleAuditResult {
  violations: StyleViolation[];
  totalFilesScanned: number;
  summary: {
    totalViolations: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Security scan result from SecurityScanner
 */
export interface SecurityScanResult {
  supabaseUrl: string;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  tablesTested: SecurityTestResult[];
  serviceRoleExposed?: {
    found: boolean;
    files: string[];
  };
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Security test result for individual table
 */
export interface SecurityTestResult {
  table: string;
  accessible: boolean;
  statusCode?: number;
  vulnerability: "critical" | "high" | "medium" | "low" | "none";
  file?: string;
  line?: number;
}

/**
 * Route analysis result from CodeReader
 */
export interface RouteAnalysisResult {
  files: string[];
  functions: FunctionInfo[];
  routes: RouteInfo[];
  routeTree?: RouteNode[];
}

/**
 * Route node for tree structure
 */
export interface RouteNode {
  path: string;
  component?: string;
  file?: string;
  children?: RouteNode[];
}

/**
 * Function information from CodeReader
 */
export interface FunctionInfo {
  name: string;
  file: string;
  line: number;
  parameters: ParameterInfo[];
  returnType: string;
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
}

/**
 * Route information
 */
export interface RouteInfo {
  path: string;
  component: string;
  file: string;
  line: number;
}

/**
 * Domain model from DomainInference
 */
export interface DomainModel {
  name: string;
  description: string;
  entities: Entity[];
  relationships: Relationship[];
}

/**
 * Entity from domain model
 */
export interface Entity {
  name: string;
  businessRules: string[];
  attributes: Attribute[];
}

/**
 * Entity attribute
 */
export interface Attribute {
  name: string;
  type: string;
  constraints: string[];
}

/**
 * Relationship between entities
 */
export interface Relationship {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  description?: string;
}

/**
 * Audit results union type
 */
export interface AuditResults {
  routes?: RouteAnalysisResult;
  styles?: StyleAuditResult;
  security?: SecurityScanResult;
  error?: string;
}

/**
 * Orchestrator report
 */
export interface OrchestratorReport {
  timestamp: string;
  projectPath: string;
  phases: {
    seed: { success: boolean; details: SeedResult };
    audit: { success: boolean; details: AuditResults };
    fix: { success: boolean; details: FixResult };
    test: { success: boolean; details: TestResults };
    verify: { success: boolean; details: VerificationResult };
  };
  summary: {
    totalViolations: number;
    fixesApplied: number;
    testsPassed: number;
    testsFailed: number;
    overallSuccess: boolean;
  };
  recommendations: string[];
}

/**
 * Seed result
 */
export interface SeedResult {
  success: boolean;
  recordsInserted: number;
  tablesSeeded: string[];
  error?: string;
}

/**
 * Test results
 */
export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  failures?: TestFailure[];
}

/**
 * Individual test detail
 */
export interface TestDetail {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

/**
 * Test failure detail
 */
export interface TestFailure {
  test: string;
  error: string;
  file: string;
  line: number;
}

/**
 * Verification result
 */
export interface VerificationResult {
  success: boolean;
  checksPassed: number;
  checksFailed: number;
  details: VerificationCheck[];
  testResults?: { exists: boolean };
}

/**
 * Individual verification check
 */
export interface VerificationCheck {
  name: string;
  status: "passed" | "failed";
  message: string;
}
