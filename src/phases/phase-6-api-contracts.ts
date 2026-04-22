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

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';

/**
 * Business profile from Phase 2
 */
interface BusinessProfile {
  /** Business domain */
  domain: string;
  /** Core paths */
  corePaths: string[];
}

/**
 * Phase 3 result
 */
interface Phase3Result {
  /** Security findings */
  findings: Array<{
    type: string;
    description: string;
    filePath: string;
  }>;
}

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
export class Phase6APIContracts {
  private config: Phase6Config;

  constructor(config: Phase6Config) {
    this.config = config;
  }

  /**
   * Executes Phase 6: API & Contracts
   *
   * @returns Promise<Phase6Result> - API & contracts analysis result
   */
  async execute(): Promise<Phase6Result> {
    const startTime = Date.now();
    console.log('���� Phase 6: API & Contracts\n');

    try {
      // Get BusinessProfile from Phase 2 for domain context
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState) as BusinessProfile | undefined;
      const domain = businessProfile?.domain || 'General';
      const isSaaS = domain === 'SaaS';
      const isFintech = domain === 'Fintech';

      console.log(`��Ļ Domain Context: ${domain}${isSaaS || isFintech ? ' (Strict Mode for Rate Limiting/CORS)' : ''}\n`);

      // Get Phase 3 security results for PII context
      const phase3Results = this.config.statePersistence.getAnalysisResults(3, this.config.currentState) as Phase3Result | undefined;
      const securityFindings = phase3Results?.findings || [];
      const sensitiveFields = new Set<string>(
        securityFindings
          .filter((f: { type: string; description: string }) => f.type === 'sensitive-data' || f.type === 'secret')
          .map((f: { description: string }) => f.description.toLowerCase())
      );

      // Cross-Phase PII Leak Prevention: Track files with Sensitive Data Leak
      const piiLeakFiles = new Set<string>(
        securityFindings
          .filter((f: { type: string; description: string; filePath: string }) => f.type === 'sensitive-data' && f.description.toLowerCase().includes('console.log'))
          .map((f: { filePath: string }) => f.filePath)
      );

      console.log(`���� Context: ${sensitiveFields.size} sensitive fields from Phase 3`);
      console.log(`���� Context: ${piiLeakFiles.size} files with PII leak in logs\n`);

      // Scan for API files
      const files = await this.scanAPIFiles();

      if (files.length === 0) {
        console.log('��ᴩ�  No API files found for analysis\n');
        
        const result: Phase6Result = {
          success: true,
          findings: [],
          criticalFindings: 0,
          highSeverityFindings: 0,
          filesAnalyzed: 0,
          executionTimeMs: Date.now() - startTime,
        };

        await this.config.statePersistence.storeAnalysisResults(6, result, this.config.currentState);
        await this.writePartialReport(result, domain);
        await this.config.statePersistence.saveState(this.config.currentState);

        return result;
      }

      console.log(`���� Analyzing ${files.length} API files...\n`);

      const findings: APIFinding[] = [];

      for (const file of files) {
        const fileFindings = await this.analyzeFile(file, isSaaS, isFintech, sensitiveFields, piiLeakFiles);
        findings.push(...fileFindings);
      }

      // Run frontend/backend type consistency check
      const typeConsistencyFindings = await this.analyzeTypeConsistency();
      findings.push(...typeConsistencyFindings);

      const criticalFindings = findings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter(f => f.severity === 'high').length;

      const result: Phase6Result = {
        success: true,
        findings,
        criticalFindings,
        highSeverityFindings,
        filesAnalyzed: files.length,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(6, result, this.config.currentState);
      await this.writePartialReport(result, domain);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`ԣ� Phase 6 Complete`);
      console.log(`  ���� Total findings: ${findings.length}`);
      console.log(`  ��ܿ Critical findings: ${criticalFindings}`);
      console.log(`  ��ᴩ�  High severity findings: ${highSeverityFindings}\n`);

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`��� Phase 6 failed: ${errorMessage}\n`);

      const result: Phase6Result = {
        success: false,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        filesAnalyzed: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Scans for API files
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async scanAPIFiles(): Promise<string[]> {
    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });

    const patterns = [
      'src/api/**/*.ts',
      'src/api/**/*.tsx',
      'src/api/**/*.js',
      'src/api/**/*.jsx',
      'src/routes/**/*.ts',
      'src/routes/**/*.js',
      'src/controllers/**/*.ts',
      'src/controllers/**/*.js',
      'src/endpoints/**/*.ts',
      'src/endpoints/**/*.js',
      'src/handlers/**/*.ts',
      'src/handlers/**/*.js',
      'pages/api/**/*.ts',
      'pages/api/**/*.js',
    ];

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

        // Mock & Seed Exclusion: Ignore test files, mocks, seeds
        if (file.includes('/test/') || 
            file.includes('/tests/') ||
            file.includes('/mocks/') || 
            file.includes('/mock/') ||
            file.includes('seed.') ||
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
   * Analyzes a single file for API issues
   *
   * @private
   * @param filePath - File path
   * @param isSaaS - Whether domain is SaaS
   * @param isFintech - Whether domain is Fintech
   * @param sensitiveFields - Sensitive fields from Phase 3
   * @returns Promise<APIFinding[]> - API findings
   */
  private async analyzeFile(filePath: string, isSaaS: boolean, isFintech: boolean, sensitiveFields: Set<string>, piiLeakFiles: Set<string>): Promise<APIFinding[]> {
    const findings: APIFinding[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileHash = this.computeHash(content);

      // Get Critical Modules from Phase 2
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState) as BusinessProfile | undefined;
      const criticalModules = businessProfile?.corePaths || [];
      const isCriticalModule = criticalModules.includes(filePath);

      // Cross-Phase PII Leak Prevention: If file has PII leak AND is API Controller, elevate to CRITICAL
      if (piiLeakFiles.has(filePath)) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'pii-exposure'),
          type: 'pii-exposure',
          severity: 'critical',
          filePath,
          description: '��ܿ CRITICAL: API Controller with PII leak in logs detected',
          suggestion: 'This file has both PII leak in console.log (Phase 3) and API endpoint exposure. This is a critical security risk. Remove all PII from logs and ensure API responses do not expose sensitive data.',
        });
      }

      // 1. Endpoint Integrity
      const endpointFindings = this.analyzeEndpointIntegrity(filePath, content, fileHash, isSaaS, isFintech);
      findings.push(...endpointFindings);

      // 2. Contract Consistency
      const contractFindings = this.analyzeContractConsistency(filePath, content, fileHash, sensitiveFields);
      findings.push(...contractFindings);

      // 3. Input Validation
      const validationFindings = this.analyzeInputValidation(filePath, content, fileHash, isCriticalModule);
      findings.push(...validationFindings);

      // 4. Documentation Gap
      const docGapFindings = this.analyzeDocumentationGap(filePath, content, fileHash);
      findings.push(...docGapFindings);

      // 5. Request/Response Type Validation
      const typeValidationFindings = this.analyzeTypeValidation(filePath, content, fileHash, isCriticalModule);
      findings.push(...typeValidationFindings);

      return findings;
    } catch (error: unknown) {
      console.warn(`��ᴩ�  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
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
  private analyzeEndpointIntegrity(filePath: string, content: string, fileHash: string, isSaaS: boolean, isFintech: boolean): APIFinding[] {
    const findings: APIFinding[] = [];

    // Detect endpoints without versioning
    const unversionedPattern = /['"`]\/api\/(?!v\d+)[^'"`]*['"`]/g;
    let unversionedMatch: RegExpExecArray | null;
    while ((unversionedMatch = unversionedPattern.exec(content)) !== null) {
      const endpoint = unversionedMatch[0].slice(1, -1);
      const lineNumber = content.slice(0, unversionedMatch.index).split('\n').length;

      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'missing-versioning'),
        type: 'missing-versioning',
        severity: 'medium',
        filePath,
        line: lineNumber,
        description: `Unversioned endpoint detected: ${endpoint}`,
        suggestion: 'Use versioned endpoints (e.g., /api/v1/users) to enable future API evolution without breaking changes.',
        endpoint,
      });
    }

    // Detect missing Rate Limiting (especially for SaaS/Fintech)
    if (isSaaS || isFintech) {
      const hasRateLimit = content.includes('rateLimit') || 
                           content.includes('rate-limit') ||
                           content.includes('express-rate-limit') ||
                           content.includes('@nestjs/throttler') ||
                           content.includes('throttle');

      if (!hasRateLimit) {
        // Public vs Private Distinction: Check if endpoint is in /api/public/* vs /api/internal/* or /api/admin/*
        const isPublicAPI = filePath.includes('/api/public/') || 
                           filePath.includes('/public/') ||
                           content.includes('/api/public') ||
                           content.includes('/public');
        
        const isInternalAPI = filePath.includes('/api/internal/') || 
                            filePath.includes('/internal/') ||
                            content.includes('/api/internal') ||
                            content.includes('/internal');
        
        const isAdminAPI = filePath.includes('/api/admin/') || 
                         filePath.includes('/admin/') ||
                         content.includes('/api/admin') ||
                         content.includes('/admin');

        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
        let description = `Missing Rate Limiting for ${isFintech ? 'Fintech' : 'SaaS'} domain`;
        
        if (isPublicAPI) {
          severity = 'critical';
          description = `��ܿ CRITICAL: Missing Rate Limiting in public API (${isFintech ? 'Fintech' : 'SaaS'} domain)`;
        } else if (isInternalAPI || isAdminAPI) {
          severity = 'low';
          description = `Missing Rate Limiting in ${isInternalAPI ? 'internal' : 'admin'} API`;
        }

        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'missing-rate-limit'),
          type: 'missing-rate-limit',
          severity,
          filePath,
          description,
          suggestion: isPublicAPI
            ? 'Public APIs without rate limiting are vulnerable to abuse and DDoS attacks. Implement rate limiting immediately.'
            : isInternalAPI || isAdminAPI
            ? 'Consider implementing rate limiting even for internal/admin APIs for defense in depth.'
            : 'Implement rate limiting to protect your API from abuse and DDoS attacks.',
        });
      }
    }

    // Detect CORS misconfiguration
    const corsPattern = /cors\s*\(|origin:\s*['"`]\*['"`]/g;
    let corsMatch: RegExpExecArray | null;
    while ((corsMatch = corsPattern.exec(content)) !== null) {
      const lineNumber = content.slice(0, corsMatch.index).split('\n').length;

      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'cors-misconfig'),
        type: 'cors-misconfig',
        severity: isFintech ? 'high' : 'medium',
        filePath,
        line: lineNumber,
        description: 'CORS configured to allow all origins (*)',
        suggestion: isFintech 
          ? 'For Fintech, restrict CORS to specific origins. Allow-all CORS is a security risk.'
          : 'Consider restricting CORS to specific origins instead of allowing all.',
      });
    }

    return findings;
  }

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
  private analyzeContractConsistency(filePath: string, content: string, fileHash: string, sensitiveFields: Set<string>): APIFinding[] {
    const findings: APIFinding[] = [];

    // Detect PII exposure in response models
    for (const sensitiveField of sensitiveFields) {
      if (content.toLowerCase().includes(sensitiveField)) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'pii-exposure'),
          type: 'pii-exposure',
          severity: 'high',
          filePath,
          description: `Potential PII exposure in API contract: ${sensitiveField}`,
          suggestion: 'Review response models to ensure sensitive fields are not exposed by mistake. Use data transfer objects (DTOs) to filter sensitive data.',
        });
      }
    }

    // Detect response format inconsistencies
    const snakeCasePattern = /(\w+)_[a-z_]+/g;
    const camelCasePattern = /[a-z]+([A-Z][a-z]*)+/g;

    const hasSnakeCase = snakeCasePattern.test(content);
    const hasCamelCase = camelCasePattern.test(content);

    if (hasSnakeCase && hasCamelCase) {
      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'format-inconsistency'),
        type: 'format-inconsistency',
        severity: 'low',
        filePath,
        description: 'Mixed naming conventions detected (snake_case and camelCase)',
        suggestion: 'Choose one naming convention for API responses and stick to it consistently.',
      });
    }

    return findings;
  }

  /**
   * Analyzes documentation gap (missing swagger.json, openapi.yaml, @ApiProperty)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @returns APIFinding[] - Documentation gap findings
   */
  private analyzeDocumentationGap(filePath: string, content: string, fileHash: string): APIFinding[] {
    const findings: APIFinding[] = [];

    // Check if file has API decorators (NestJS)
    const hasAPIDecorators = content.includes('@Get') || 
                            content.includes('@Post') ||
                            content.includes('@Put') ||
                            content.includes('@Delete') ||
                            content.includes('@Patch');

    // Check if file has documentation decorators
    const hasDocDecorators = content.includes('@ApiProperty') ||
                            content.includes('@ApiOperation') ||
                            content.includes('@ApiResponse') ||
                            content.includes('@ApiTags');

    if (hasAPIDecorators && !hasDocDecorators) {
      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'contract-issue'),
        type: 'contract-issue',
        severity: 'low',
        filePath,
        description: 'API endpoints detected without documentation decorators (@ApiProperty, @ApiOperation, etc.)',
        suggestion: 'Add documentation decorators to enable API contract generation. Consider implementing Swagger/OpenAPI documentation.',
      });
    }

    return findings;
  }

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
  private analyzeInputValidation(filePath: string, content: string, fileHash: string, isCriticalModule: boolean): APIFinding[] {
    const findings: APIFinding[] = [];

    // Check if file has validation libraries
    const hasValidation = content.includes('zod') ||
                          content.includes('Joi') ||
                          content.includes('class-validator') ||
                          content.includes('yup') ||
                          content.includes('ajv') ||
                          content.includes('validator');

    // Check if file has request body handling
    const hasRequestBody = content.includes('req.body') ||
                         content.includes('request.body') ||
                         content.includes('body:');

    // Zod/Validation Deep Scan: Check for 'any' in body or query params
    const hasAnyType = content.includes(': any') || content.includes('<any>');

    if (hasRequestBody && !hasValidation) {
      const severity = isCriticalModule ? 'critical' : 'medium';
      const description = isCriticalModule
        ? '��ܿ CRITICAL: Endpoint in Critical Module without input validation'
        : 'Endpoint without input validation detected';

      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'missing-validation'),
        type: 'missing-validation',
        severity,
        filePath,
        description,
        suggestion: isCriticalModule
          ? 'This is in the Core Path. An endpoint without input validation is an open invitation to disaster. Implement validation using Zod, Joi, or class-validator immediately.'
          : 'Implement input validation using Zod, Joi, or class-validator to protect against invalid data.',
      });
    }

    // Zod/Validation Deep Scan: If project uses validation library but uses 'any' in body/query
    if (hasValidation && hasAnyType) {
      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'missing-validation'),
        type: 'missing-validation',
        severity: 'high',
        filePath,
        description: '��ܿ Validation library detected but using `any` type in body or query params',
        suggestion: 'Using a validation tool but skipping it with `any` type is a red flag of technical negligence. Replace `any` with proper type definitions or validation schemas.',
      });
    }

    return findings;
  }

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
  private analyzeTypeValidation(filePath: string, content: string, fileHash: string, isCriticalModule: boolean): APIFinding[] {
    const findings: APIFinding[] = [];

    // Check for endpoint handlers (Express, NestJS, etc.)
    const hasEndpointHandler = content.includes('req.') || 
                               content.includes('request.') ||
                               content.includes('res.') ||
                               content.includes('response.') ||
                               content.includes('@Get') ||
                               content.includes('@Post') ||
                               content.includes('@Put') ||
                               content.includes('@Delete');

    if (!hasEndpointHandler) {
      return findings;
    }

    // Check for explicit return types
    const hasReturnType = /:\s*\w+.*\(/.test(content) || 
                          content.includes('Promise<') ||
                          content.includes('Response<');

    // Check for typed request bodies
    const hasTypedBody = /body:\s*\w+/.test(content) || 
                        /req\.body\s+as\s+\w+/.test(content) ||
                        content.includes('z.object') ||
                        content.includes('Joi.object');

    if (!hasReturnType && hasEndpointHandler) {
      const severity = isCriticalModule ? 'critical' : 'medium';
      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'missing-type-validation'),
        type: 'missing-type-validation',
        severity,
        filePath,
        description: isCriticalModule
          ? 'CRITICAL: Endpoint handler without explicit return type in Critical Module'
          : 'Endpoint handler without explicit return type',
        suggestion: isCriticalModule
          ? 'Add explicit return types to endpoint handlers to ensure type safety. This is critical for Core Path modules.'
          : 'Add explicit return types to endpoint handlers to ensure type safety and better developer experience.',
      });
    }

    if (!hasTypedBody && content.includes('req.body') && !content.includes('any')) {
      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'missing-type-validation'),
        type: 'missing-type-validation',
        severity: 'medium',
        filePath,
        description: 'Request body usage without type definition',
        suggestion: 'Define a TypeScript interface or use a validation library (Zod, Joi) to type the request body.',
      });
    }

    return findings;
  }

  /**
   * Analyzes frontend/backend type consistency
   *
   * @private
   * @returns Promise<APIFinding[]> - Type consistency findings
   */
  private async analyzeTypeConsistency(): Promise<APIFinding[]> {
    const findings: APIFinding[] = [];

    try {
      // Look for shared type definitions
      const { glob } = await import('glob');
      
      // Find backend type files
      const backendTypeFiles = await glob('**/*.types.ts', {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      // Find frontend type files
      const frontendTypeFiles = await glob('frontend/**/*.ts', {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      // Find shared types directories
      const sharedTypeFiles = await glob('**/shared/**/*.ts', {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      // Check if there's a shared types directory
      if (sharedTypeFiles.length === 0 && backendTypeFiles.length > 0 && frontendTypeFiles.length > 0) {
        findings.push({
          id: this.generateFindingId('no-shared-types', undefined, 'type-inconsistency'),
          type: 'type-inconsistency',
          severity: 'medium',
          filePath: this.config.projectRoot,
          description: 'No shared types directory detected between frontend and backend',
          suggestion: 'Create a shared types directory (e.g., /shared/types) to ensure type consistency between frontend and backend.',
        });
      }

      // Check for duplicate type definitions
      const typeNames = new Map<string, string[]>();
      
      for (const file of [...backendTypeFiles, ...frontendTypeFiles, ...sharedTypeFiles]) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const interfacePattern = /export\s+(interface|type)\s+(\w+)/g;
          let match: RegExpExecArray | null;
          
          while ((match = interfacePattern.exec(content)) !== null) {
            const typeName = match[2];
            if (!typeNames.has(typeName)) {
              typeNames.set(typeName, []);
            }
            typeNames.get(typeName)!.push(file);
          }
        } catch {
          // Skip files that can't be read
        }
      }

      // Report duplicate type definitions
      for (const [typeName, files] of typeNames) {
        if (files.length > 1) {
          // Check if files are in different directories (potential inconsistency)
          const uniqueDirs = new Set(files.map(f => path.dirname(f)));
          if (uniqueDirs.size > 1) {
            findings.push({
              id: this.generateFindingId('duplicate-type', undefined, 'type-inconsistency'),
              type: 'type-inconsistency',
              severity: 'low',
              filePath: files[0],
              description: `Type "${typeName}" defined in multiple locations: ${Array.from(uniqueDirs).join(', ')}`,
              suggestion: 'Consolidate duplicate type definitions into a shared location to prevent inconsistencies.',
            });
          }
        }
      }
    } catch (error: unknown) {
      console.warn('Failed to analyze type consistency:', error instanceof Error ? error.message : error);
    }

    return findings;
  }

  /**
   * Writes partial report for Phase 6
   *
   * @private
   * @param result - Phase 6 result
   * @param domain - Business domain
   */
  private async writePartialReport(result: Phase6Result, domain: string): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, APIFinding[]>();
      for (const finding of result.findings) {
        if (!findingsByType.has(finding.type)) {
          findingsByType.set(finding.type, []);
        }
        findingsByType.get(finding.type)!.push(finding);
      }

      let findingsContent = '';
      for (const [type, findings] of findingsByType) {
        findingsContent += `
### ${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')} (${findings.length})
`;
        for (const finding of findings) {
          findingsContent += `- [${finding.id}] **${finding.severity.toUpperCase()}** ${finding.filePath}`;
          if (finding.line) {
            findingsContent += `:${finding.line}`;
          }
          if (finding.endpoint) {
            findingsContent += ` (${finding.endpoint})`;
          }
          findingsContent += `\n  - ${finding.description}\n`;
        }
      }

      const reportContent = `
## Phase 6: API & Contracts - ԣ� PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms
- **Domain:** ${domain}

### API Summary
- **Total Findings:** ${result.findings.length}
- **Critical Findings:** ${result.criticalFindings}
- **High Severity Findings:** ${result.highSeverityFindings}

### Findings by Type
${findingsContent || 'No API issues detected.'}

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

      console.log(`���� Partial report written: ${reportPath}`);
    } catch (error: unknown) {
      console.warn('��ᴩ�  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}













