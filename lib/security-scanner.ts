/**
 * Security Scanner - Security Violation Detection for SovereignQA
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

import * as fs from "fs-extra";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { glob } from "glob";

const execAsync = promisify(exec);

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
  domainMap?: any;

  /** Thermal controller for hardware protection */
  thermalController?: any;

  /** Report aggregator for centralized violations */
  reporter?: any;

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
 * Security Scanner - Premium Quality Implementation
 *
 * Detects security violations with:
 * - RLS Cross-Check (DomainMap integration)
 * - Service Role Abuse Detection (CRITICAL)
 * - Missing Policies on Critical Tables (HIGH)
 * - Hardware Protection (ThermalController)
 * - Business Context Awareness
 */
class SecurityScanner {
  private config: Required<Omit<SecurityScannerConfig, 'domainMap' | 'thermalController' | 'reporter' | 'supabaseUrl' | 'supabaseServiceRoleKey' | 'checkDatabase'>> & {
    domainMap?: any;
    thermalController?: any;
    reporter?: any;
    supabaseUrl?: string;
    supabaseServiceRoleKey?: string;
    checkDatabase?: boolean;
  };
  private fileMetadataCache: Map<string, any> = new Map();
  private rlsPolicies: Map<string, RLSPolicy[]> = new Map();
  private serviceRoleUsages: ServiceRoleUsage[] = [];

  constructor(config: SecurityScannerConfig) {
    this.config = {
      projectRoot: config.projectRoot,
      scanPatterns: config.scanPatterns || ['**/*.{ts,tsx,js,jsx,sql}'],
      fileExtensions: config.fileExtensions || ['.ts', '.tsx', '.js', '.jsx', '.sql'],
      domainMap: config.domainMap,
      thermalController: config.thermalController,
      reporter: config.reporter,
      maxFilesPerBatch: config.maxFilesPerBatch || 20,
      batchCooldownMs: config.batchCooldownMs || 3000,
      checkDatabase: config.checkDatabase ?? false,
      supabaseUrl: config.supabaseUrl,
      supabaseServiceRoleKey: config.supabaseServiceRoleKey,
    };
  }

  /**
   * Runs security scan on the project
   *
   * This method scans project files for security violations, checks thermal
   * status before processing, and uses the ReportAggregator to centralize
   * violations. It also provides business context for violations.
   *
   * @returns Promise<number> - Number of violations found
   */
  async scan(): Promise<number> {
    console.log('[SecurityScanner] Starting security scan...');

    // Check thermal status before processing
    if (this.config.thermalController) {
      const tempReading = await this.config.thermalController.checkTemperature();
      if (!tempReading.isSafe) {
        console.warn(
          `[SecurityScanner] GPU temperature unsafe (${tempReading.current}°C), applying cooldown`
        );
        await this.config.thermalController.applyCooldown(this.config.batchCooldownMs);
      }
    }

    // Find all files to scan
    const files = await this.findFiles();
    console.log(`[SecurityScanner] Found ${files.length} files to scan`);

    // Process files in batches
    const fileBatches = this.createBatches(files);
    let totalViolations = 0;

    // Phase 1: Scan SQL files for RLS policies
    console.log('[SecurityScanner] Phase 1: Scanning SQL files for RLS policies...');
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));
    for (const sqlFile of sqlFiles) {
      await this.scanRLSPolicies(sqlFile);
    }

    // Phase 2: Scan source files for service role key usage
    console.log('[SecurityScanner] Phase 2: Scanning for service role key abuse...');
    for (const batch of fileBatches) {
      const sourceBatch = batch.filter((f) => !f.endsWith('.sql'));
      if (sourceBatch.length === 0) continue;

      const violations = await this.processBatch(sourceBatch);
      totalViolations += violations.length;

      // Add violations to reporter
      if (this.config.reporter) {
        this.config.reporter.addViolations('security-scanner', violations);
      }

      // Apply cooldown between batches
      if (this.config.thermalController && batch !== fileBatches[fileBatches.length - 1]) {
        await this.config.thermalController.applyCooldown(this.config.batchCooldownMs);
      }
    }

    // Phase 3: Cross-check with DomainMap for missing policies on critical tables
    console.log('[SecurityScanner] Phase 3: Cross-checking RLS policies with DomainMap...');
    const missingPolicyViolations = this.checkMissingRLSPolicies();
    totalViolations += missingPolicyViolations.length;

    // Add violations to reporter
    if (this.config.reporter) {
      this.config.reporter.addViolations('security-scanner', missingPolicyViolations);
    }

    console.log(`[SecurityScanner] Scan complete: ${totalViolations} violations found`);
    return totalViolations;
  }

  /**
   * Finds all files to scan
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async findFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.config.scanPatterns) {
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
      });
      allFiles.push(...files);
    }

    return allFiles;
  }

  /**
   * Creates batches of files for processing
   *
   * @private
   * @param files - Files to batch
   * @returns string[][] - Array of file batches
   */
  private createBatches(files: string[]): string[][] {
    const batches: string[][] = [];
    const batchSize = this.config.maxFilesPerBatch;

    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Processes a batch of files
   *
   * @private
   * @param files - Files to process
   * @returns Promise<any[]> - Violations found
   */
  private async processBatch(files: string[]): Promise<any[]> {
    const violations: any[] = [];

    for (const file of files) {
      // Check thermal status before each file
      if (this.config.thermalController) {
        const tempReading = await this.config.thermalController.checkTemperature();
        if (!tempReading.isSafe) {
          console.warn(
            `[SecurityScanner] GPU temperature unsafe (${tempReading.current}°C), applying cooldown`
          );
          await this.config.thermalController.applyCooldown(this.config.batchCooldownMs);
        }
      }

      const fullPath = path.join(this.config.projectRoot, file);
      const relativePath = file;
      const violationsForFile = await this.analyzeFile(fullPath, relativePath);
      violations.push(...violationsForFile);
    }

    return violations;
  }

  /**
   * Analyzes a single file for security violations
   *
   * @private
   * @param fullPath - Full path to file
   * @param relativePath - Relative path from project root
   * @returns Promise<any[]> - Violations found
   */
  private async analyzeFile(fullPath: string, relativePath: string): Promise<any[]> {
    const violations: any[] = [];

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const metadata = this.getFileMetadata(fullPath, relativePath);

      // Check for service role key usage
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        const serviceRoleViolations = this.checkServiceRoleKey(line, lineNumber, metadata, content);
        violations.push(...serviceRoleViolations);
      }
    } catch (error) {
      console.warn(`[SecurityScanner] Failed to analyze file: ${relativePath}`);
    }

    return violations;
  }

  /**
   * Scans SQL file for RLS policies
   *
   * @private
   * @param filePath - Path to SQL file
   */
  private async scanRLSPolicies(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.config.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      let currentPolicy: RLSPolicy | null = null;

      for (const line of lines) {
        // Detect CREATE POLICY (handle policy names with spaces)
        const policyMatch = line.match(/CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(\w+)/i);
        if (policyMatch) {
          const policyName = policyMatch[1];
          const tableName = policyMatch[2];
          currentPolicy = {
            tableName,
            policyName,
            policyType: 'ALL',
            enabled: true,
            sourceFile: filePath,
          };
        }

        // Detect policy type (FOR SELECT, FOR INSERT, etc.)
        if (currentPolicy) {
          const typeMatch = line.match(/FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)/i);
          if (typeMatch) {
            currentPolicy.policyType = typeMatch[1].toUpperCase();
          }

          // Detect ENABLE/DISABLE
          if (line.match(/ENABLE/i)) {
            currentPolicy.enabled = true;
          }
          if (line.match(/DISABLE/i)) {
            currentPolicy.enabled = false;
          }

          // End of policy definition
          if (line.trim().endsWith(';')) {
            if (!this.rlsPolicies.has(currentPolicy.tableName)) {
              this.rlsPolicies.set(currentPolicy.tableName, []);
            }
            this.rlsPolicies.get(currentPolicy.tableName)!.push(currentPolicy);
            currentPolicy = null;
          }
        }
      }
    } catch (error) {
      console.warn(`[SecurityScanner] Failed to scan SQL file: ${filePath}`);
    }
  }

  /**
   * Checks for service role key usage
   *
   * Client-Side Leak Detector: If file is in app/ folder and doesn't have 'use server',
   * mark as BLOCKER/CRITICAL immediately.
   *
   * @private
   * @param line - Line of code
   * @param lineNumber - Line number
   * @param metadata - File metadata
   * @param fullContent - Full file content for context
   * @returns any[] - Service role violations
   */
  private checkServiceRoleKey(line: string, lineNumber: number, metadata: any, fullContent: string): any[] {
    const violations: any[] = [];

    // Check for service role key patterns
    const patterns = [
      /SERVICE_ROLE_KEY/i,
      /supabase.*service.*role/i,
      /SUPABASE_SERVICE_ROLE_KEY/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        // Check if this is in a server action (safe)
        const isServerAction = this.isServerAction(fullContent);

        // Client-Side Leak Detector: Check if file is in app/ folder
        const isInAppFolder = metadata.path.includes('app/') || metadata.path.startsWith('app/');

        if (!isServerAction) {
          // Determine severity based on location
          let severity: string = 'critical';
          let message: string = `Service Role Key detected in client code or unprotected file. This key bypasses RLS and should NEVER be used on the client side. Use ANON key instead.`;

          // BLOCKER/CRITICAL if in app/ folder without 'use server'
          if (isInAppFolder && !isServerAction) {
            severity = 'critical';
            message = `🚨 BLOCKER: Service Role Key detectado en archivo dentro de app/ sin directiva 'use server'. Esta es una fuga de seguridad CRÍTICA. La Service Role Key puede acceder a TODOS los datos sin RLS. Nunca debe usarse en código cliente. Mover a Server Action o usar ANON key.`;
          }

          const violation = {
            id: `security-service-role-abuse-${metadata.path}-${lineNumber}-${Date.now()}`,
            type: 'security',
            severity,
            file: metadata,
            location: { line: lineNumber, column: 0 },
            message: `${message} | Contexto: Este archivo está en un contexto crítico.`,
            rule: 'security-service-role-abuse',
            autoFixable: true,
            confidence: 0.95,
            timestamp: new Date(),
          };

          violations.push(violation);

          // Track usage for reporting
          this.serviceRoleUsages.push({
            filePath: metadata.path,
            lineNumber,
            context: match[0],
            isServerAction: false,
          });
        } else {
          // Server action - still worth noting but not critical
          const violation = {
            id: `security-service-role-server-action-${metadata.path}-${lineNumber}-${Date.now()}`,
            type: 'security',
            severity: 'medium',
            file: metadata,
            location: { line: lineNumber, column: 0 },
            message: `Service Role Key detected in Server Action. This is technically safe, but consider if ANON key with proper RLS would be more appropriate.`,
            rule: 'security-service-role-server-action',
            autoFixable: true,
            confidence: 0.9,
            timestamp: new Date(),
          };

          violations.push(violation);

          // Track usage for reporting
          this.serviceRoleUsages.push({
            filePath: metadata.path,
            lineNumber,
            context: match[0],
            isServerAction: true,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Checks if a file is a Server Action
   *
   * @private
   * @param content - File content
   * @returns boolean - True if file is a Server Action
   */
  private isServerAction(content: string): boolean {
    // Check for "use server" directive
    if (content.includes("'use server'") || content.includes('"use server"')) {
      return true;
    }

    return false;
  }

  /**
   * Checks for missing RLS policies on critical tables
   *
   * Uses strict table name matching - if a critical table from DomainMap
   * doesn't have an exact match in SQL files, severity is HIGH.
   *
   * @private
   * @returns any[] - Missing policy violations
   */
  private checkMissingRLSPolicies(): any[] {
    const violations: any[] = [];

    if (!this.config.domainMap) {
      return violations;
    }

    // Get critical tables from DomainMap
    const criticalTables = this.getCriticalTables();

    for (const tableName of criticalTables) {
      // Strict matching: look for exact table name in RLS policies
      const policies = this.rlsPolicies.get(tableName) || [];

      // Check for exact match - no partial matching allowed
      const hasExactMatch = policies.length > 0;
      const hasSelectOrAll = policies.some((p) => p.policyType === 'SELECT' || p.policyType === 'ALL');

      // If no exact match OR no SELECT/ALL policy, create violation
      if (!hasExactMatch || !hasSelectOrAll) {
        const metadata: any = {
          path: `table:${tableName}`,
          extension: 'sql',
          lineCount: 0,
          inCriticalPath: true,
          criticalPathName: 'critical-table',
        };

        const violation = {
          id: `security-missing-rls-policy-${tableName}-${Date.now()}`,
          type: 'security',
          severity: 'high',
          file: metadata,
          location: { line: 1, column: 0 },
          message: `Atención: La tabla "${tableName}" es crítica pero no detecto políticas de RLS activas en Supabase. Validación estricta: No hay coincidencia exacta del nombre de tabla en los archivos SQL. Esta tabla debería tener políticas de SELECT o ALL para proteger los datos.`,
          rule: 'security-missing-rls-policy',
          autoFixable: true,
          confidence: 0.95,
          timestamp: new Date(),
        };

        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Gets list of critical tables from DomainMap
   *
   * @private
   * @returns string[] - Critical table names
   */
  private getCriticalTables(): string[] {
    const criticalTables: Set<string> = new Set();

    if (!this.config.domainMap) {
      return Array.from(criticalTables);
    }

    // Get tables from critical paths
    for (const criticalPath of this.config.domainMap.criticalPaths || []) {
      for (const entity of criticalPath.entities || []) {
        criticalTables.add(entity);
      }
    }

    // Get core entities
    for (const entity of this.config.domainMap.entities || []) {
      if (entity.isCore) {
        criticalTables.add(entity.name);
      }
    }

    return Array.from(criticalTables);
  }

  /**
   * Gets file metadata
   *
   * @private
   * @param fullPath - Full path to file
   * @param relativePath - Relative path from project root
   * @returns any - File metadata
   */
  private getFileMetadata(fullPath: string, relativePath: string): any {
    if (this.fileMetadataCache.has(relativePath)) {
      return this.fileMetadataCache.get(relativePath)!;
    }

    const extension = path.extname(fullPath);
    const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
    const inCriticalPath = this.isInCriticalPath(relativePath);
    const criticalPathName = this.getCriticalPathName(relativePath);

    const metadata: any = {
      path: relativePath,
      extension,
      lineCount,
      inCriticalPath,
      criticalPathName,
    };

    this.fileMetadataCache.set(relativePath, metadata);
    return metadata;
  }

  /**
   * Checks if a file is in a critical path
   *
   * @private
   * @param relativePath - Relative path from project root
   * @returns boolean - True if in critical path
   */
  private isInCriticalPath(relativePath: string): boolean {
    if (!this.config.domainMap) {
      return false;
    }

    const normalizedPath = relativePath.replace(/\\/g, '/').toLowerCase();

    for (const criticalPath of this.config.domainMap.criticalPaths || []) {
      for (const entity of criticalPath.entities || []) {
        if (normalizedPath.includes(entity.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Gets the name of the critical path for a file
   *
   * @private
   * @param relativePath - Relative path from project root
   * @returns string | undefined - Critical path name
   */
  private getCriticalPathName(relativePath: string): string | undefined {
    if (!this.config.domainMap) {
      return undefined;
    }

    const normalizedPath = relativePath.replace(/\\/g, '/').toLowerCase();

    for (const criticalPath of this.config.domainMap.criticalPaths || []) {
      for (const entity of criticalPath.entities || []) {
        if (normalizedPath.includes(entity.toLowerCase())) {
          return criticalPath.name;
        }
      }
    }

    return undefined;
  }

  /**
   * Clears the file metadata cache
   */
  clearCache(): void {
    this.fileMetadataCache.clear();
    this.rlsPolicies.clear();
    this.serviceRoleUsages = [];
  }

  /**
   * Gets detected RLS policies
   *
   * @returns Map<string, RLSPolicy[]> - RLS policies by table
   */
  getRLSPolicies(): Map<string, RLSPolicy[]> {
    return this.rlsPolicies;
  }

  /**
   * Gets detected service role key usages
   *
   * @returns ServiceRoleUsage[] - Service role key usages
   */
  getServiceRoleUsages(): ServiceRoleUsage[] {
    return this.serviceRoleUsages;
  }

  /**
   * Legacy method for backward compatibility - BaaS scan
   * @deprecated Use scan() method for premium quality security checks
   */
  /*
  async legacyScan(): Promise<SecurityScanResult> {
    // Legacy implementation commented out - use scan() instead
    throw new Error("legacyScan is deprecated. Use scan() method for premium quality security checks.");
  }

  generateMarkdownReport(result: SecurityScanResult): string {
    // Legacy implementation commented out
    throw new Error("generateMarkdownReport is deprecated.");
  }

  printReport(result: SecurityScanResult): void {
    // Legacy implementation commented out
    throw new Error("printReport is deprecated.");
  }
  */
}

// Legacy interfaces - commented out for premium quality implementation
/*
interface SecurityTestResult {
  table: string;
  accessible: boolean;
  statusCode?: number;
  error?: string;
  vulnerability: "critical" | "high" | "medium" | "low" | "none";
}

interface SecurityScanResult {
  supabaseUrl: string;
  hasAnonKey: boolean;
  tablesTested: SecurityTestResult[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    passed: number;
  };
  recommendations: string[];
}
*/

export default SecurityScanner;
export { SecurityScanner, RLSPolicy, ServiceRoleUsage };
