/**
 * Phase 4: Database - Database Schema and Query Analysis
 *
 * Purpose: Analyze database schema, query patterns, and database-related
 * code for optimization opportunities, normalization issues, and best practices.
 *
 * Architecture:
 * - Schema Analysis: Check for proper normalization and indexing
 * - Query Analysis: Identify N+1 queries and inefficient queries
 * - Migration Analysis: Check migration files for issues
 * - Connection Pooling: Verify proper connection management
 *
 * @module phases/phase-4-database
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Database finding
 */
interface DatabaseFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'normalization-issue' | 'missing-index' | 'n-plus-one-query' | 'inefficient-query' | 'connection-leak' | 'migration-issue';
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Description */
  description: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Database metrics
 */
interface DatabaseMetrics {
  /** Total database files analyzed */
  totalFiles: number;
  /** Tables detected */
  tablesDetected: number;
  /** Normalization issues */
  normalizationIssues: number;
  /** Missing indexes */
  missingIndexes: number;
  /** N+1 queries detected */
  nPlusOneQueries: number;
}

/**
 * Phase 4 configuration
 */
interface Phase4Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 4 result
 */
export interface Phase4Result {
  /** Overall success */
  success: boolean;
  /** Database findings */
  findings: DatabaseFinding[];
  /** Database metrics */
  metrics: DatabaseMetrics;
  /** Critical findings count */
  criticalFindings: number;
  /** High severity findings count */
  highSeverityFindings: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 4: Database - Database Schema and Query Analysis
 *
 * This phase analyzes database schema, query patterns, and database-related
 * code for optimization opportunities, normalization issues, and best practices.
 *
 * @class Phase4Database
 * @example
 * ```typescript
 * const database = new Phase4Database(config);
 * const result = await database.execute();
 * console.log(`Tables detected: ${result.metrics.tablesDetected}`);
 * console.log(`N+1 queries: ${result.metrics.nPlusOneQueries}`);
 * ```
 */
export class Phase4Database {
  private config: Phase4Config;

  constructor(config: Phase4Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 4: Database
   *
   * @returns Promise<Phase4Result> - Database analysis result
   */
  async execute(): Promise<Phase4Result> {
    const startTime = Date.now();
    console.log('INFO Phase 4: Database - Database Schema and Query Analysis\n');

    try {
      // Thermal check before starting
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      // Get database files
      console.log('INFO Finding database files...');
      const databaseFiles = this.getDatabaseFiles(this.config.projectRoot);
      console.log(`INFO Database files found: ${databaseFiles.length}\n`);

      // Get source files for query analysis
      console.log('INFO Finding source files...');
      const sourceFiles = this.getSourceFiles(this.config.projectRoot);
      console.log(`INFO Source files found: ${sourceFiles.length}\n`);

      // Analyze database
      console.log('INFO Analyzing database schema and queries...');
      const findings = await this.analyzeDatabase(databaseFiles, sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(databaseFiles, findings);
      console.log(`INFO Tables detected: ${metrics.tablesDetected}`);
      console.log(`INFO N+1 queries: ${metrics.nPlusOneQueries}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase4Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 4 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase4Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          tablesDetected: 0,
          normalizationIssues: 0,
          missingIndexes: 0,
          nPlusOneQueries: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 4:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets database files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Database file paths
   */
  private getDatabaseFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const extensions = ['.sql', '.prisma'];
    const patterns = ['supabase/migrations', 'prisma', 'database', 'migrations'];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip node_modules and .aegis directories
            if (item.name !== 'node_modules' && item.name !== '.aegis' && item.name !== '.git') {
              searchDir(fullPath);
            }
          } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    // Search in specific directories
    for (const pattern of patterns) {
      const dirPath = path.join(projectRoot, pattern);
      if (fs.existsSync(dirPath)) {
        searchDir(dirPath);
      }
    }

    // Also search root directory
    searchDir(projectRoot);

    return files;
  }

  /**
   * Gets source files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Source file paths
   */
  private getSourceFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip node_modules and .aegis directories
            if (item.name !== 'node_modules' && item.name !== '.aegis' && item.name !== '.git') {
              searchDir(fullPath);
            }
          } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes database schema and queries
   *
   * @private
   * @param databaseFiles - Database file paths
   * @param sourceFiles - Source file paths
   * @returns Promise<DatabaseFinding[]> - Database findings
   */
  private async analyzeDatabase(databaseFiles: string[], sourceFiles: string[]): Promise<DatabaseFinding[]> {
    const findings: DatabaseFinding[] = [];

    // Analyze database files for schema issues
    for (const filePath of databaseFiles) {
      try {
        // Validate path
        if (!validatePath(filePath, this.config.projectRoot)) {
          console.warn(`Invalid path: ${filePath}`);
          continue;
        }

        const stats = fs.statSync(filePath);
        
        // Validate file size (max 10MB)
        if (!validateFileSize(stats.size, 10)) {
          console.warn(`File too large: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Censor potential secrets
        const sanitizedContent = censorSecrets(content);
        
        const fileFindings = this.analyzeDatabaseSchema(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    // Analyze source files for query patterns
    for (const filePath of sourceFiles) {
      try {
        // Validate path
        if (!validatePath(filePath, this.config.projectRoot)) {
          console.warn(`Invalid path: ${filePath}`);
          continue;
        }

        const stats = fs.statSync(filePath);
        
        // Validate file size (max 10MB)
        if (!validateFileSize(stats.size, 10)) {
          console.warn(`File too large: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Censor potential secrets
        const sanitizedContent = censorSecrets(content);
        
        const fileFindings = this.analyzeQueries(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes database schema file
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DatabaseFinding[] - Schema findings
   */
  private analyzeDatabaseSchema(filePath: string, content: string): DatabaseFinding[] {
    const findings: DatabaseFinding[] = [];

    // Check for missing indexes
    const tablePattern = /CREATE\s+TABLE\s+(\w+)\s*\(([^)]+)\)/gi;
    let match;
    while ((match = tablePattern.exec(content)) !== null) {
      const tableName = match[1];
      const tableDef = match[2];

      // Check if table has indexes
      const hasIndex = /INDEX|PRIMARY\s+KEY/i.test(tableDef);
      
      if (!hasIndex && tableDef.includes('id')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'missing-index'),
          type: 'missing-index',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Table ${tableName} may be missing indexes`,
          suggestion: 'Consider adding indexes for frequently queried columns',
        });
      }
    }

    // Check for normalization issues (repeated columns)
    const columnPattern = /(\w+)\s+(?:VARCHAR|TEXT|INT|BIGINT)/gi;
    const columns: Map<string, number> = new Map();
    
    while ((match = columnPattern.exec(content)) !== null) {
      const columnName = match[1];
      columns.set(columnName, (columns.get(columnName) || 0) + 1);
    }

    for (const [columnName, count] of columns.entries()) {
      if (count > 3 && columnName !== 'id' && columnName !== 'created_at' && columnName !== 'updated_at') {
        findings.push({
          id: this.generateFindingId(filePath, 'normalization-issue'),
          type: 'normalization-issue',
          severity: 'low',
          filePath,
          description: `Column ${columnName} appears in multiple tables, consider normalization`,
          suggestion: 'Consider creating a separate table for this column if it represents a common entity',
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes source files for query patterns
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DatabaseFinding[] - Query findings
   */
  private analyzeQueries(filePath: string, content: string): DatabaseFinding[] {
    const findings: DatabaseFinding[] = [];

    // Check for N+1 query pattern (query inside loop)
    const loopPattern = /(?:for|forEach|map)\s*\([^)]*\)\s*\{/gi;
    let match;
    while ((match = loopPattern.exec(content)) !== null) {
      const loopStart = match.index;
      const loopEnd = this.findMatchingBrace(content, loopStart + match[0].length);
      const loopContent = content.substring(loopStart, loopEnd);

      // Check for database queries inside loop
      if (loopContent.includes('select') || loopContent.includes('find') || loopContent.includes('query')) {
        const lineNumber = content.substring(0, loopStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'n-plus-one-query'),
          type: 'n-plus-one-query',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Potential N+1 query pattern detected inside loop',
          suggestion: 'Use eager loading or batch queries instead of querying inside loop',
        });
      }
    }

    // Check for connection leaks (connections not closed)
    const connectionPattern = /(?:createConnection|connect|pool\.connect)\s*\(/gi;
    while ((match = connectionPattern.exec(content)) !== null) {
      const matchStart = match.index;
      const contextEnd = Math.min(content.length, matchStart + 500);
      const context = content.substring(matchStart, contextEnd);

      if (!context.includes('close') && !context.includes('release')) {
        const lineNumber = content.substring(0, matchStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'connection-leak'),
          type: 'connection-leak',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Database connection may not be properly closed',
          suggestion: 'Ensure connections are closed or released after use',
        });
      }
    }

    return findings;
  }

  /**
   * Finds matching closing brace
   *
   * @private
   * @param content - Content to search
   * @param startIndex - Start index
   * @returns number - Index of closing brace
   */
  private findMatchingBrace(content: string, startIndex: number): number {
    let braceCount = 0;
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }
    return content.length;
  }

  /**
   * Calculates database metrics
   *
   * @private
   * @param databaseFiles - Database file paths
   * @param findings - Database findings
   * @returns DatabaseMetrics - Calculated metrics
   */
  private calculateMetrics(databaseFiles: string[], findings: DatabaseFinding[]): DatabaseMetrics {
    let tablesDetected = 0;

    // Count tables from database files
    for (const filePath of databaseFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const tableMatches = content.match(/CREATE\s+TABLE/gi);
        if (tableMatches) {
          tablesDetected += tableMatches.length;
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    return {
      totalFiles: databaseFiles.length,
      tablesDetected,
      normalizationIssues: findings.filter(f => f.type === 'normalization-issue').length,
      missingIndexes: findings.filter(f => f.type === 'missing-index').length,
      nPlusOneQueries: findings.filter(f => f.type === 'n-plus-one-query').length,
    };
  }

  /**
   * Generates unique finding ID
   *
   * @private
   * @param filePath - File path
   * @param type - Finding type
   * @returns string - Unique ID
   */
  private generateFindingId(filePath: string, type: string): string {
    const hash = path.basename(filePath);
    return `${type}-${hash}-${Date.now()}`;
  }
}
