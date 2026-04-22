// eslint-disable @typescript-eslint/no-explicit-any
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

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
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
export class Phase4Database {
  private config: Phase4Config;

  constructor(config: Phase4Config) {
    this.config = config;
  }

  /**
   * Executes Phase 4: Database
   *
   * @returns Promise<Phase4Result> - Database analysis result
   */
  async execute(): Promise<Phase4Result> {
    const startTime = Date.now();
    console.log('­ƒùä´©Å  Phase 4: Database - Schema & Query Audit\n');

    try {
      // Get security summary from Phase 3 for cross-phase alerting
      const securitySummary = this.config.currentState.contextStore?.securitySummary;
      const hasSqlInjectionRisks = securitySummary?.sqlInjectionFindings > 0;

      console.log(`­ƒöì Context: SQL Injection Risks from Phase 3 = ${hasSqlInjectionRisks ? 'YES (Extreme Mode)' : 'NO'}\n`);

      // Get BusinessProfile from Phase 2 for Transactional Integrity Check
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const domain = businessProfile?.domain || 'General';
      const isFintech = domain === 'Fintech';

      console.log(`­ƒÄ» Domain Context: ${domain}${isFintech ? ' (Fintech - Strict Mode)' : ''}\n`);

      // Detect ORM type
      const ormType = await this.detectORMType();
      console.log(`­ƒôª Detected ORM: ${ormType}\n`);

      // Scan for database files
      const files = await this.scanDatabaseFiles(ormType);

      // Resource Cap: Check if ThermalController is in savings mode
      let isResourceCapMode = false;
      if (this.config.thermalController) {
        const systemResources = await this.config.thermalController.checkSystemResources();
        isResourceCapMode = systemResources.cpuUsage > 80 || systemResources.ramUsage > 80;
        
        if (isResourceCapMode) {
          console.log(`ÔÜí Resource Cap Mode: CPU ${systemResources.cpuUsage}%, RAM ${systemResources.ramUsage}%`);
          console.log(`   Limiting DB scan to Critical Modules (db/repository folders) and skipping UI components\n`);
        }
      }

      const filteredFiles = isResourceCapMode 
        ? files.filter(f => f.includes('/db/') || f.includes('/repository/') || f.includes('/models/') || f.includes('/entities/'))
        : files;

      if (filteredFiles.length === 0) {
        console.log('ÔÜá´©Å  No database files found for analysis\n');
        
        const result: Phase4Result = {
          success: true,
          findings: [],
          criticalFindings: 0,
          highSeverityFindings: 0,
          ormType,
          executionTimeMs: Date.now() - startTime,
        };

        await this.config.statePersistence.storeAnalysisResults(4, result, this.config.currentState);
        await this.writePartialReport(result, ormType);
        await this.config.statePersistence.saveState(this.config.currentState);

        return result;
      }

      console.log(`­ƒôé Analyzing ${filteredFiles.length} database files${isResourceCapMode ? ' (Resource Cap Mode - Critical Modules only)' : ''}...\n`);

      const findings: DatabaseFinding[] = [];

      for (const file of filteredFiles) {
        const fileFindings = await this.analyzeFile(file, hasSqlInjectionRisks, isFintech);
        findings.push(...fileFindings);
      }

      const criticalFindings = findings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter(f => f.severity === 'high').length;

      const result: Phase4Result = {
        success: true,
        findings,
        criticalFindings,
        highSeverityFindings,
        ormType,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(4, result, this.config.currentState);
      await this.writePartialReport(result, ormType);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`Ô£à Phase 4 Complete`);
      console.log(`  ­ƒöì Total findings: ${findings.length}`);
      console.log(`  ­ƒÜ¿ Critical findings: ${criticalFindings}`);
      console.log(`  ÔÜá´©Å  High severity findings: ${highSeverityFindings}\n`);

      return result;
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ÔØî Phase 4 failed: ${errorMessage}\n`);

      const result: Phase4Result = {
        success: false,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Detects the ORM type used in the project
   *
   * @private
   * @returns Promise<ormType> - Detected ORM type
   */
  private async detectORMType(): Promise<'prisma' | 'mongoose' | 'typeorm' | 'raw-sql' | 'none'> {
    const projectRoot = this.config.projectRoot;

    // Check for Prisma
    if (fs.existsSync(path.join(projectRoot, 'prisma/schema.prisma'))) {
      return 'prisma';
    }

    // Check for Mongoose
    if (fs.existsSync(path.join(projectRoot, 'models')) || 
        fs.existsSync(path.join(projectRoot, 'src/models'))) {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps['mongoose']) {
          return 'mongoose';
        }
      }
    }

    // Check for TypeORM
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps['typeorm']) {
        return 'typeorm';
      }
    }

    // Check for raw SQL files
    const sqlPatterns = ['**/*.sql', '**/*.sqlx'];
    for (const pattern of sqlPatterns) {
      const { glob } = await import('glob');
      const files = await glob(pattern, { cwd: projectRoot, absolute: true });
      if (files.length > 0) {
        return 'raw-sql';
      }
    }

    return 'none';
  }

  /**
   * Scans for database files based on ORM type
   *
   * @private
   * @param ormType - Detected ORM type
   * @returns Promise<string[]> - Array of file paths
   */
  private async scanDatabaseFiles(ormType: string): Promise<string[]> {
    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });

    let patterns: string[] = [];

    switch (ormType) {
      case 'prisma':
        patterns = ['prisma/**/*.prisma', 'prisma/schema.prisma'];
        break;
      case 'mongoose':
        patterns = ['models/**/*.ts', 'models/**/*.js', 'src/models/**/*.ts', 'src/models/**/*.js'];
        break;
      case 'typeorm':
        patterns = ['entities/**/*.ts', 'entities/**/*.js', 'src/entities/**/*.ts', 'src/entities/**/*.js', 'repository/**/*.ts', 'src/repository/**/*.ts'];
        break;
      case 'raw-sql':
        patterns = ['**/*.sql', '**/*.sqlx', 'db/**/*.sql', 'migrations/**/*.sql'];
        break;
      default:
        patterns = ['**/*.sql', 'models/**/*.ts', 'entities/**/*.ts', 'repository/**/*.ts'];
    }

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const { glob } = await import('glob');
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      for (const file of files) {
        if (ignoreHandler.shouldIgnore(file)) {
          continue;
        }

        // Mock & Seed Exclusion: Ignore seed.ts, mocks/, tests/ files
        if (file.includes('seed.ts') || 
            file.includes('seed.js') ||
            file.includes('/mocks/') || 
            file.includes('/mock/') ||
            file.includes('/tests/') ||
            file.includes('/test/') ||
            file.endsWith('.test.ts') ||
            file.endsWith('.test.js') ||
            file.endsWith('.spec.ts') ||
            file.endsWith('.spec.js')) {
          continue;
        }

        const filterResult = fileFilter.shouldAnalyzeFile(file);
        if (filterResult.shouldAnalyze) {
          allFiles.push(file);
        }
      }
    }

    // Also scan repository and db folders for query patterns
    const queryPatterns = ['repository/**/*.ts', 'src/repository/**/*.ts', 'db/**/*.ts', 'src/db/**/*.ts'];
    for (const pattern of queryPatterns) {
      const { glob } = await import('glob');
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      for (const file of files) {
        if (ignoreHandler.shouldIgnore(file)) {
          continue;
        }

        // Mock & Seed Exclusion: Ignore seed.ts, mocks/, tests/ files
        if (file.includes('seed.ts') || 
            file.includes('seed.js') ||
            file.includes('/mocks/') || 
            file.includes('/mock/') ||
            file.includes('/tests/') ||
            file.includes('/test/') ||
            file.endsWith('.test.ts') ||
            file.endsWith('.test.js') ||
            file.endsWith('.spec.ts') ||
            file.endsWith('.spec.js')) {
          continue;
        }

        const filterResult = fileFilter.shouldAnalyzeFile(file);
        if (filterResult.shouldAnalyze) {
          allFiles.push(file);
        }
      }
    }

    return Array.from(new Set(allFiles));
  }

  /**
   * Analyzes a single file for database issues
   *
   * @private
   * @param filePath - File path
   * @param ormType - Detected ORM type
   * @param hasSqlInjectionRisks - Whether Phase 3 detected SQL injection risks
   * @returns Promise<DatabaseFinding[]> - Database findings
   */
  private async analyzeFile(filePath: string, hasSqlInjectionRisks: boolean, isFintech: boolean): Promise<DatabaseFinding[]> {
    const findings: DatabaseFinding[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileHash = this.computeHash(content);

      // 1. Schema & ORM Audit
      const schemaFindings = this.analyzeSchema(filePath, content, fileHash, isFintech);
      findings.push(...schemaFindings);

      // 2. Query Efficiency
      const queryFindings = this.analyzeQueries(filePath, content, fileHash);
      findings.push(...queryFindings);

      // 3. Cross-Phase Alerting (Extreme Mode for SQL injection risks)
      if (hasSqlInjectionRisks && (filePath.includes('/repository') || filePath.includes('/db'))) {
        const extremeFindings = this.analyzeStringConcatenation(filePath, content, fileHash);
        findings.push(...extremeFindings);
      }

      return findings;
    } catch {
      console.warn(`ÔÜá´©Å  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Computes SHA-1 hash of file content
   *
   * @private
   * @param content - File content
   * @returns string - SHA-1 hash
   */
  private computeHash(content: string): string {
    return crypto.createHash('sha1').update(content).digest('hex');
  }

  /**
   * Generates unique ID for a finding
   *
   * @private
   * @param fileHash - SHA-1 hash of file content
   * @param line - Line number
   * @param type - Finding type
   * @returns string - Unique ID
   */
  private generateFindingId(fileHash: string, line: number | undefined, type: string): string {
    const lineStr = line !== undefined ? line.toString() : '0';
    return `${fileHash.substring(0, 8)}-${lineStr}-${type}`;
  }

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
  private analyzeSchema(filePath: string, content: string, fileHash: string, isFintech: boolean): DatabaseFinding[] {
    const findings: DatabaseFinding[] = [];
    const lines = content.split('\n');

    // Schema Consistency Alert: Detect @unique fields that might need special attention
    if (filePath.includes('schema.prisma') || filePath.includes('.prisma')) {
      const uniquePattern = /@unique/g;
      let uniqueMatch: RegExpExecArray | null;
      while ((uniqueMatch = uniquePattern.exec(content)) !== null) {
        const lineNumber = content.slice(0, uniqueMatch.index).split('\n').length;
        
        // Get the field name
        const lineContent = lines[lineNumber - 1];
        const fieldMatch = lineContent.match(/(\w+)\s*:/);
        const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
        
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'schema-issue'),
          type: 'schema-issue',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: `Field '${fieldName}' marked as @unique in schema`,
          suggestion: 'Ensure repository queries use this field with proper indexing to leverage the unique constraint.',
        });
      }
    }

    // Key field patterns that should have indexes
    const keyFieldPatterns = [
      { pattern: /\b(email)\s*:/g, name: 'email', severity: 'high' as const },
      { pattern: /\b(userId)\s*:/g, name: 'userId', severity: 'high' as const },
      { pattern: /\b(slug)\s*:/g, name: 'slug', severity: 'medium' as const },
      { pattern: /\b(username)\s*:/g, name: 'username', severity: 'medium' as const },
      { pattern: /\b(externalId)\s*:/g, name: 'externalId', severity: 'medium' as const },
    ];

    // Add Fintech-specific fields if in Fintech domain
    if (isFintech) {
      keyFieldPatterns.push(
        { pattern: /\b(amount)\s*:/g, name: 'amount', severity: 'high' as const },
        { pattern: /\b(currency)\s*:/g, name: 'currency', severity: 'high' as const },
        { pattern: /\b(status)\s*:/g, name: 'status', severity: 'high' as const }
      );
    }

    // Detect missing indexes
    for (const { pattern, name, severity } of keyFieldPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.slice(0, match.index).split('\n').length;
        
        // Check if there's an @@index or unique constraint nearby
        const nextLines = lines.slice(lineNumber, lineNumber + 10).join('\n');
        
        const hasIndex = /@@index|@unique|@db\.Index|unique:\s*true/i.test(nextLines);
        
        if (!hasIndex) {
          findings.push({
            id: this.generateFindingId(fileHash, lineNumber, 'missing-index'),
            type: 'missing-index',
            severity,
            filePath,
            line: lineNumber,
            description: `Field '${name}' detected without index`,
            suggestion: `Add an index on '${name}' for query performance. Consider using @@index or @unique constraint.`,
          });
        }
      }
    }

    // Detect dangerous relationships (cascading deletes)
    const cascadePattern = /onDelete:\s*['"]?Cascade['"]?|ondelete:\s*cascade/gi;
    let cascadeMatch: RegExpExecArray | null;
    while ((cascadeMatch = cascadePattern.exec(content)) !== null) {
      const lineNumber = content.slice(0, cascadeMatch.index).split('\n').length;
      
      // Check if this is on a large table
      const tableMatch = content.match(/model\s+(\w+)|table\s+"?(\w+)"?/i);
      const tableName = tableMatch ? (tableMatch[1] || tableMatch[2]) : 'unknown';
      
      const isLargeTable = ['users', 'transactions', 'orders', 'payments', 'products'].includes(tableName.toLowerCase());
      
      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'dangerous-relationship'),
        type: 'dangerous-relationship',
        severity: isLargeTable ? 'critical' : 'medium',
        filePath,
        line: lineNumber,
        description: `Cascading delete detected on ${isLargeTable ? 'large table' : 'relationship'}`,
        suggestion: isLargeTable 
          ? 'Cascading delete on large tables can cause massive data loss. Consider soft deletes or manual deletion logic.'
          : 'Review if cascading delete is appropriate for this relationship.',
        table: tableName,
      });
    }

    return findings;
  }

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
  private analyzeQueries(filePath: string, content: string, fileHash: string): DatabaseFinding[] {
    const findings: DatabaseFinding[] = [];

    // Detect SELECT * pattern
    const selectStarPattern = /SELECT\s+\*/gi;
    let selectStarMatch: RegExpExecArray | null;
    while ((selectStarMatch = selectStarPattern.exec(content)) !== null) {
      const lineNumber = content.slice(0, selectStarMatch.index).split('\n').length;
      
      // Check if it's on a large table
      const tableMatch = content.match(/FROM\s+(\w+)/gi);
      const tableName = tableMatch ? tableMatch[0].replace(/FROM\s+/i, '') : 'unknown';
      
      const isLargeTable = ['users', 'transactions', 'orders', 'payments', 'products', 'logs'].includes(tableName.toLowerCase());
      
      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'select-star'),
        type: 'select-star',
        severity: isLargeTable ? 'high' : 'medium',
        filePath,
        line: lineNumber,
        description: `SELECT * detected on ${isLargeTable ? 'potentially large table' : 'table'}`,
        suggestion: 'Specify only the columns you need instead of SELECT *. This improves performance and reduces memory usage.',
        table: tableName,
      });
    }

    // Detect findMany() without where clause
    const findManyPattern = /findMany\(\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = findManyPattern.exec(content)) !== null) {
      const matchIndex = match.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;
      
      // Check if it's on a sensitive table
      const sensitiveTables = ['users', 'transactions', 'orders', 'payments', 'credit_cards', 'ssn', 'personal_data'];
      const inSensitiveContext = sensitiveTables.some(table => 
        content.slice(0, matchIndex).toLowerCase().includes(table)
      );
      
      if (inSensitiveContext) {
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'dangerous-query'),
          type: 'dangerous-query',
          severity: 'critical',
          filePath,
          line: lineNumber,
          description: 'findMany() without where clause detected on sensitive data',
          suggestion: 'Always add a where clause or limit to prevent loading all records. This is a security and performance risk.',
        });
      }
    }

    // Detect N+1 pattern (queries inside loops)
    const loopPattern = /(?:for|while)\s*\([^)]+\)\s*\{/g;
    let loopMatch: RegExpExecArray | null;
    while ((loopMatch = loopPattern.exec(content)) !== null) {
      const loopStart = loopMatch.index;
      const loopContent = content.slice(loopStart, loopStart + 500); // Check next 500 chars
      
      // Check for query patterns inside loop
      const queryPatterns = [
        /\.(find|findOne|findAll|query|execute)\s*\(/g,
        /SELECT\s+/gi,
        /INSERT\s+INTO/gi,
        /UPDATE\s+/gi,
      ];
      
      for (const queryPattern of queryPatterns) {
        if (queryPattern.test(loopContent)) {
          const lineNumber = content.slice(0, loopStart).split('\n').length;
          
          findings.push({
            id: this.generateFindingId(fileHash, lineNumber, 'n-plus-1'),
            type: 'n-plus-1',
            severity: 'high',
            filePath,
            line: lineNumber,
            description: 'Potential N+1 query pattern detected (query inside loop)',
            suggestion: 'Consider using eager loading (include/join) or batch fetching to avoid N+1 queries.',
          });
          break; // Only report once per loop
        }
      }
    }

    return findings;
  }

  /**
   * Analyzes string concatenation in queries (Extreme Mode for SQL injection risks)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @returns DatabaseFinding[] - String concatenation findings
   */
  private analyzeStringConcatenation(filePath: string, content: string, fileHash: string): DatabaseFinding[] {
    const findings: DatabaseFinding[] = [];

    // Detect string concatenation in queries
    const concatPatterns = [
      /query\s*\+=\s*['"`]/g,
      /sql\s*\+=\s*['"`]/g,
      /['"`]\s*\+\s*\w+\s*\+\s*['"`]/g,
      /\$\{[^}]*\}/g, // Template literals with variables
    ];

    for (const pattern of concatPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.slice(0, match.index).split('\n').length;
        
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'dangerous-query'),
          type: 'dangerous-query',
          severity: 'critical',
          filePath,
          line: lineNumber,
          description: 'String concatenation in query detected (SQL injection risk)',
          suggestion: 'Use parameterized queries or prepared statements instead of string concatenation.',
        });
      }
    }

    return findings;
  }

  /**
   * Writes partial report for Phase 4
   *
   * @private
   * @param result - Phase 4 result
   * @param ormType - Detected ORM type
   */
  private async writePartialReport(result: Phase4Result, ormType: string): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, DatabaseFinding[]>();
      for (const finding of result.findings) {
        if (!findingsByType.has((finding as any).type)) {
          findingsByType.set((finding as any).type, []);
        }
        findingsByType.get((finding as any).type)!.push(finding);
      }

      let findingsContent = '';
      for (const [type, findings] of findingsByType) {
        findingsContent += `
### ${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')} (${findings.length})
`;
        for (const finding of findings) {
          findingsContent += `- [${(finding as any).id}] **${(finding as any).severity.toUpperCase()}** ${(finding as any).filePath}`;
          if ((finding as any).line) {
            findingsContent += `:${(finding as any).line}`;
          }
          if ((finding as any).table) {
            findingsContent += ` (${(finding as any).table})`;
          }
          findingsContent += `\n  - ${(finding as any).description}\n`;
        }
      }

      const reportContent = `
## Phase 4: Database - Ô£à PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms
- **Detected ORM:** ${ormType}

### Database Summary
- **Total Findings:** ${result.findings.length}
- **Critical Findings:** ${result.criticalFindings}
- **High Severity Findings:** ${result.highSeverityFindings}

### Findings by Type
${findingsContent || 'No database issues detected.'}

---

`;

      // Append to partial report
      if (fs.existsSync(reportPath)) {
        fs.appendFileSync(reportPath, reportContent, 'utf-8');
      } else {
        // Create new partial report with header
        const header = `# Aegis QA - Partial Report
Generated: ${timestamp}

`;
        fs.writeFileSync(reportPath, header + reportContent, 'utf-8');
      }

      console.log(`­ƒôØ Partial report written: ${reportPath}`);
    } catch {
      console.warn('ÔÜá´©Å  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}











