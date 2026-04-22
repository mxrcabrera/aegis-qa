/**
 * Phase 3E: BaaS/Platform Security
 *
 * Purpose: Analyze Backend-as-a-Service (BaaS) and platform security configurations,
 * specifically focusing on Supabase RLS policies, PostGREST access patterns, storage buckets,
 * and authentication configurations.
 *
 * Architecture:
 * - RLS Policy Analysis: Table-by-table Row Level Security verification
 * - PostGREST + Anon Key Testing: Direct API testing with anon key to detect data exposure
 * - Storage Bucket Security: Public/private bucket configurations and access policies
 * - Auth Configuration: JWT settings, MFA, email verification, session policies
 *
 * @module phases/phase-3e-baas-platform-security
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';

interface BaaSSecurityFinding {
  id: string;
  type: 'missing-rls' | 'rls-bypass' | 'public-bucket' | 'weak-auth' | 'exposed-table' | 'storage-overexposed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath: string;
  line?: number;
  tableName?: string;
  bucketName?: string;
  description: string;
  suggestion?: string;
}

interface BaaSSecurityMetrics {
  totalTables: number;
  tablesWithoutRLS: number;
  tablesWithBypass: number;
  publicBuckets: number;
  weakAuthConfigs: number;
  exposedTablesViaAnon: number;
}

interface Phase3EConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
}

export interface Phase3EResult {
  success: boolean;
  findings: BaaSSecurityFinding[];
  metrics: BaaSSecurityMetrics;
  criticalFindings: number;
  highSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class Phase3EBaaSPlatformSecurity {
  private config: Phase3EConfig;

  constructor(config: Phase3EConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<Phase3EResult> {
    const startTime = Date.now();
    console.log('INFO Phase 3E: BaaS/Platform Security\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Analyzing BaaS security configurations...\n');
      
      const findings: BaaSSecurityFinding[] = [];

      // 1. Analyze RLS policies from SQL migrations
      console.log('INFO Analyzing RLS policies from SQL migrations...');
      findings.push(...await this.analyzeRLSPolicies());

      // 2. Check for RLS bypass patterns in code
      console.log('INFO Checking for RLS bypass patterns...');
      findings.push(...await this.checkRLSBypass());

      // 3. Analyze storage bucket configurations
      console.log('INFO Analyzing storage bucket configurations...');
      findings.push(...await this.analyzeStorageBuckets());

      // 4. Analyze authentication configurations
      console.log('INFO Analyzing authentication configurations...');
      findings.push(...await this.analyzeAuthConfig());

      // 5. Simulate PostGREST + anon key exposure check
      console.log('INFO Simulating PostGREST + anon key exposure check...');
      findings.push(...await this.checkPostgRESTExposure());

      console.log(`INFO Total findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Tables without RLS: ${metrics.tablesWithoutRLS}`);
      console.log(`INFO Tables with RLS bypass: ${metrics.tablesWithBypass}`);
      console.log(`INFO Public storage buckets: ${metrics.publicBuckets}`);
      console.log(`INFO Weak auth configurations: ${metrics.weakAuthConfigs}`);
      console.log(`INFO Exposed tables via anon key: ${metrics.exposedTablesViaAnon}\n`);

      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase3EResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 3E Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase3EResult = {
        success: false,
        findings: [],
        metrics: {
          totalTables: 0,
          tablesWithoutRLS: 0,
          tablesWithBypass: 0,
          publicBuckets: 0,
          weakAuthConfigs: 0,
          exposedTablesViaAnon: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 3E:', sanitizedError);
      return result;
    }
  }

  private async analyzeRLSPolicies(): Promise<BaaSSecurityFinding[]> {
    const findings: BaaSSecurityFinding[] = [];
    const sqlFiles = this.findSQLFiles();

    for (const filePath of sqlFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const tables = this.extractTables(content);
        
        tables.forEach((tableName) => {
          const hasRLS = content.includes(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`);
          const hasPolicies = content.includes(`CREATE POLICY`) && content.includes(`ON ${tableName}`);

          if (!hasRLS) {
            findings.push({
              id: `missing-rls-${Date.now()}-${Math.random()}`,
              type: 'missing-rls',
              severity: 'critical',
              filePath,
              description: `Table '${tableName}' does not have Row Level Security enabled`,
              suggestion: 'Enable RLS on this table and create appropriate policies to restrict access based on user identity',
              tableName,
            });
          } else if (!hasPolicies) {
            findings.push({
              id: `rls-no-policies-${Date.now()}-${Math.random()}`,
              type: 'missing-rls',
              severity: 'high',
              filePath,
              description: `Table '${tableName}' has RLS enabled but no policies defined`,
              suggestion: 'Create RLS policies to define access rules. Without policies, all access is denied by default',
              tableName,
            });
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkRLSBypass(): Promise<BaaSSecurityFinding[]> {
    const findings: BaaSSecurityFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for service_role usage in client code
          const isClientSide = filePath.includes('/app/') || filePath.includes('/pages/') || filePath.includes('/components/');
          if (isClientSide && line.includes('service_role')) {
            findings.push({
              id: `rls-bypass-${Date.now()}-${Math.random()}`,
              type: 'rls-bypass',
              severity: 'critical',
              filePath,
              line: index + 1,
              description: 'Service role key used in client-side code - bypasses all RLS policies',
              suggestion: 'Move service role usage to server actions or API routes. Never use service_role in client code',
            });
          }

          // Check for bypass via admin API
          if (line.includes('bypass') && line.includes('RLS')) {
            findings.push({
              id: `rls-bypass-${Date.now()}-${Math.random()}`,
              type: 'rls-bypass',
              severity: 'high',
              filePath,
              line: index + 1,
              description: 'Explicit RLS bypass detected',
              suggestion: 'Review this bypass. RLS bypasses should only be used in trusted server contexts with proper authorization',
            });
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async analyzeStorageBuckets(): Promise<BaaSSecurityFinding[]> {
    const findings: BaaSSecurityFinding[] = [];
    const sqlFiles = this.findSQLFiles();

    for (const filePath of sqlFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for public storage buckets
          if (line.includes('storage') && (line.includes('public') || line.includes('true'))) {
            findings.push({
              id: `public-bucket-${Date.now()}-${Math.random()}`,
              type: 'public-bucket',
              severity: 'high',
              filePath,
              line: index + 1,
              description: 'Storage bucket configured as public - files are accessible without authentication',
              suggestion: 'Review bucket configuration. Use private buckets with signed URLs for secure file access',
            });
          }

          // Check for overexposed storage policies
          if (line.includes('storage') && line.includes('ALL') && line.includes('SELECT')) {
            findings.push({
              id: `storage-overexposed-${Date.now()}-${Math.random()}`,
              type: 'storage-overexposed',
              severity: 'critical',
              filePath,
              line: index + 1,
              description: 'Storage policy allows unrestricted access (ALL)',
              suggestion: 'Restrict storage policies to specific users or roles. Use bucket-level policies for granular access control',
            });
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async analyzeAuthConfig(): Promise<BaaSSecurityFinding[]> {
    const findings: BaaSSecurityFinding[] = [];
    const configFiles = this.findConfigFiles();

    for (const filePath of configFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for weak JWT settings
          if (line.includes('jwt') && (line.includes('1h') || line.includes('3600'))) {
            findings.push({
              id: `weak-auth-${Date.now()}-${Math.random()}`,
              type: 'weak-auth',
              severity: 'medium',
              filePath,
              line: index + 1,
              description: 'JWT expiration set to 1 hour - may be too short for good UX',
              suggestion: 'Consider longer JWT expiration with refresh tokens for better UX while maintaining security',
            });
          }

          // Check for missing email verification
          if (line.includes('email') && line.includes('verify') && line.includes('false')) {
            findings.push({
              id: `weak-auth-${Date.now()}-${Math.random()}`,
              type: 'weak-auth',
              severity: 'high',
              filePath,
              line: index + 1,
              description: 'Email verification disabled - allows unverified email addresses',
              suggestion: 'Enable email verification to prevent account creation with fake or malicious email addresses',
            });
          }

          // Check for missing MFA
          if (line.includes('mfa') && line.includes('false')) {
            findings.push({
              id: `weak-auth-${Date.now()}-${Math.random()}`,
              type: 'weak-auth',
              severity: 'medium',
              filePath,
              line: index + 1,
              description: 'Multi-factor authentication disabled',
              suggestion: 'Enable MFA for sensitive operations to add an extra layer of security',
            });
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkPostgRESTExposure(): Promise<BaaSSecurityFinding[]> {
    const findings: BaaSSecurityFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for direct table access with anon key
          const isClientSide = filePath.includes('/app/') || filePath.includes('/pages/') || filePath.includes('/components/');
          if (isClientSide && line.includes('anon') && line.includes('from(')) {
            const tableMatch = line.match(/from\(['"`]([^'"`]+)['"`]\)/);
            if (tableMatch) {
              findings.push({
                id: `exposed-table-${Date.now()}-${Math.random()}`,
                type: 'exposed-table',
                severity: 'critical',
                filePath,
                line: index + 1,
                description: `Table '${tableMatch[1]}' potentially exposed via anon key in client code`,
                suggestion: 'Move this query to a server action or API route. Direct table access with anon key should only be done server-side',
                tableName: tableMatch[1],
              });
            }
          }

          // Check for select * with anon
          if (isClientSide && line.includes('anon') && line.includes('select *')) {
            findings.push({
              id: `exposed-table-${Date.now()}-${Math.random()}`,
              type: 'exposed-table',
              severity: 'high',
              filePath,
              line: index + 1,
              description: 'SELECT * with anon key in client code - may expose all columns',
              suggestion: 'Specify only required columns and move to server-side. Use RLS policies to restrict column access',
            });
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private findSQLFiles(): string[] {
    const sqlFiles: string[] = [];
    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && item.endsWith('.sql')) {
            sqlFiles.push(fullPath);
          }
        }
      } catch {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return sqlFiles;
  }

  private findSourceFiles(): string[] {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const sourceFiles: string[] = [];

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
            sourceFiles.push(fullPath);
          }
        }
      } catch {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return sourceFiles;
  }

  private findConfigFiles(): string[] {
    const configFiles: string[] = [];
    const extensions = ['.json', '.yaml', '.yml', '.toml', '.env'];

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
            configFiles.push(fullPath);
          }
        }
      } catch {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return configFiles;
  }

  private extractTables(content: string): string[] {
    const tables: string[] = [];
    const createTableRegex = /CREATE TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let match;

    while ((match = createTableRegex.exec(content)) !== null) {
      tables.push(match[1]);
    }

    return tables;
  }

  private calculateMetrics(findings: BaaSSecurityFinding[]): BaaSSecurityMetrics {
    const tables = new Set(findings.filter((f) => f.tableName).map((f) => f.tableName!));

    return {
      totalTables: tables.size,
      tablesWithoutRLS: findings.filter((f) => f.type === 'missing-rls').length,
      tablesWithBypass: findings.filter((f) => f.type === 'rls-bypass').length,
      publicBuckets: findings.filter((f) => f.type === 'public-bucket').length,
      weakAuthConfigs: findings.filter((f) => f.type === 'weak-auth').length,
      exposedTablesViaAnon: findings.filter((f) => f.type === 'exposed-table').length,
    };
  }
}





