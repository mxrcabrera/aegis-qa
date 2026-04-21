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

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { Violation, FileMetadata, Severity, ViolationType } from '../types/audit.js';
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
export class SecurityScanner {
  private config: Required<Omit<SecurityScannerConfig, 'domainMap' | 'thermalController' | 'reporter' | 'supabaseUrl' | 'supabaseServiceRoleKey' | 'checkDatabase'>> & {
    domainMap?: DomainMap;
    thermalController?: ThermalController;
    reporter?: ReportAggregator;
    supabaseUrl?: string;
    supabaseServiceRoleKey?: string;
    checkDatabase?: boolean;
  };
  private fileMetadataCache: Map<string, FileMetadata> = new Map();
  private rlsPolicies: Map<string, RLSPolicy[]> = new Map();
  private serviceRoleUsages: ServiceRoleUsage[] = [];

  /**
   * Creates a new SecurityScanner instance
   *
   * @param config - Configuration for security scanning
   */
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

    // Sort for deterministic execution
    return allFiles.sort();
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
   * @returns Promise<Violation[]> - Violations found
   */
  private async processBatch(files: string[]): Promise<Violation[]> {
    const violations: Violation[] = [];

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
   * @returns Promise<Violation[]> - Violations found
   */
  private async analyzeFile(fullPath: string, relativePath: string): Promise<Violation[]> {
    const violations: Violation[] = [];

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
        // Detect CREATE POLICY
        const policyMatch = line.match(/CREATE\s+POLICY\s+"?(\w+)"?\s+ON\s+(\w+)/i);
        if (policyMatch) {
          const policyName = policyMatch[1];
          const tableName = policyMatch[2];
          currentPolicy = {
            tableName,
            policyName,
            policyType: 'ALL', // Default, will be refined below
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
   * @private
   * @param line - Line of code
   * @param lineNumber - Line number
   * @param metadata - File metadata
   * @param fullContent - Full file content for context
   * @returns Violation[] - Service role violations
   */
  private checkServiceRoleKey(line: string, lineNumber: number, metadata: FileMetadata, fullContent: string): Violation[] {
    const violations: Violation[] = [];

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

        if (!isServerAction) {
          // Client-side or non-protected usage - CRITICAL
          const violation = this.createViolation(
            'security',
            'critical',
            lineNumber,
            metadata,
            `Service Role Key detected in client code or unprotected file. This key bypasses RLS and should NEVER be used on the client side. Use ANON key instead.`,
            'security-service-role-abuse',
            true
          );

          // Add business context
          violation.message = this.addBusinessContext(violation.message, metadata);
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
          const violation = this.createViolation(
            'security',
            'medium',
            lineNumber,
            metadata,
            `Service Role Key detected in Server Action. This is technically safe, but consider if ANON key with proper RLS would be more appropriate.`,
            'security-service-role-server-action',
            true
          );

          // Add business context
          violation.message = this.addBusinessContext(violation.message, metadata);
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

    // Check for file path patterns that indicate server actions
    return false;
  }

  /**
   * Checks for missing RLS policies on critical tables
   *
   * @private
   * @returns Violation[] - Missing policy violations
   */
  private checkMissingRLSPolicies(): Violation[] {
    const violations: Violation[] = [];

    if (!this.config.domainMap) {
      return violations;
    }

    // Get critical tables from DomainMap
    const criticalTables = this.getCriticalTables();

    for (const tableName of criticalTables) {
      const policies = this.rlsPolicies.get(tableName) || [];
      const hasSelectOrAll = policies.some((p) => p.policyType === 'SELECT' || p.policyType === 'ALL');

      if (!hasSelectOrAll || policies.length === 0) {
        // Create violation
        const metadata: FileMetadata = {
          path: `table:${tableName}`,
          extension: 'sql',
          lineCount: 0,
          inCriticalPath: true,
          criticalPathName: 'critical-table',
        };

        const violation = this.createViolation(
          'security',
          'high',
          1,
          metadata,
          `Atención: La tabla "${tableName}" es crítica pero no detecto políticas de RLS activas en Supabase. Esta tabla debería tener políticas de SELECT o ALL para proteger los datos.`,
          'security-missing-rls-policy',
          true
        );

        // Add business context
        violation.message = this.addBusinessContext(violation.message, metadata);
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
    for (const criticalPath of this.config.domainMap.criticalPaths) {
      for (const entity of criticalPath.entities) {
        criticalTables.add(entity);
      }
    }

    // Get core entities
    for (const entity of this.config.domainMap.entities) {
      if (entity.isCore) {
        criticalTables.add(entity.name);
      }
    }

    return Array.from(criticalTables);
  }

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
  private createViolation(
    type: ViolationType,
    severity: Severity,
    lineNumber: number,
    metadata: FileMetadata,
    message: string,
    rule: string,
    autoFixable: boolean
  ): Violation {
    return {
      id: `${rule}-${metadata.path}-${lineNumber}-${Date.now()}`,
      type,
      severity,
      file: metadata,
      location: {
        line: lineNumber,
        column: 0,
      },
      message,
      rule,
      autoFixable,
      confidence: 0.9,
    };
  }

  /**
   * Adds business context to a violation message
   *
   * @private
   * @param message - Original message
   * @param metadata - File metadata
   * @returns string - Message with business context
   */
  private addBusinessContext(message: string, metadata: FileMetadata): string {
    if (!metadata.inCriticalPath) {
      return message;
    }

    const criticalPathName = metadata.criticalPathName || 'critical path';
    return `${message} | Contexto: Este archivo está en el flujo crítico "${criticalPathName}".`;
  }

  /**
   * Gets file metadata
   *
   * @private
   * @param fullPath - Full path to file
   * @param relativePath - Relative path from project root
   * @returns FileMetadata - File metadata
   */
  private getFileMetadata(fullPath: string, relativePath: string): FileMetadata {
    if (this.fileMetadataCache.has(relativePath)) {
      return this.fileMetadataCache.get(relativePath)!;
    }

    const extension = path.extname(fullPath);
    const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
    const inCriticalPath = this.isInCriticalPath(relativePath);
    const criticalPathName = this.getCriticalPathName(relativePath);

    const metadata: FileMetadata = {
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

    for (const criticalPath of this.config.domainMap.criticalPaths) {
      for (const entity of criticalPath.entities) {
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

    for (const criticalPath of this.config.domainMap.criticalPaths) {
      for (const entity of criticalPath.entities) {
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
}
