/**
 * Phase API Contracts
 *
 * Purpose: Analyze API contracts for consistency in response format, status codes,
 * pagination patterns, and error formatting across endpoints.
 *
 * Architecture:
 * - Response Format Consistency: Check for consistent response structure across endpoints
 * - Status Code Consistency: Verify appropriate HTTP status codes are used
 * - Pagination Patterns: Check for consistent pagination implementation
 * - Error Format Consistency: Verify errors follow a consistent format
 *
 * @module phases/phase-api-contracts
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';

interface APIContractFinding {
  id: string;
  type: 'inconsistent-response' | 'wrong-status-code' | 'inconsistent-pagination' | 'inconsistent-error-format' | 'missing-pagination' | 'missing-error-handler';
  severity: 'low' | 'medium' | 'high';
  filePath: string;
  line?: number;
  endpoint?: string;
  description: string;
  suggestion?: string;
}

interface APIContractMetrics {
  totalEndpoints: number;
  inconsistentResponses: number;
  wrongStatusCodes: number;
  inconsistentPagination: number;
  inconsistentErrorFormats: number;
  missingPagination: number;
  missingErrorHandlers: number;
}

interface APIContractConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
}

export interface APIContractResult {
  success: boolean;
  findings: APIContractFinding[];
  metrics: APIContractMetrics;
  highSeverityFindings: number;
  mediumSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class PhaseAPIContracts {
  private config: APIContractConfig;

  constructor(config: APIContractConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<APIContractResult> {
    const startTime = Date.now();
    console.log('INFO Phase: API Contracts\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Analyzing API contracts...\n');
      
      const findings: APIContractFinding[] = [];

      // 1. Analyze response format consistency
      console.log('INFO Analyzing response format consistency...');
      findings.push(...await this.analyzeResponseFormatConsistency());

      // 2. Check status code usage
      console.log('INFO Checking status code usage...');
      findings.push(...await this.checkStatusCodes());

      // 3. Check pagination patterns
      console.log('INFO Checking pagination patterns...');
      findings.push(...await this.checkPagination());

      // 4. Check error format consistency
      console.log('INFO Checking error format consistency...');
      findings.push(...await this.checkErrorFormats());

      console.log(`INFO Total findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Inconsistent responses: ${metrics.inconsistentResponses}`);
      console.log(`INFO Wrong status codes: ${metrics.wrongStatusCodes}`);
      console.log(`INFO Inconsistent pagination: ${metrics.inconsistentPagination}\n`);

      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;
      const mediumSeverityFindings = findings.filter((f) => f.severity === 'medium').length;

      const executionTimeMs = Date.now() - startTime;

      const result: APIContractResult = {
        success: true,
        findings,
        metrics,
        highSeverityFindings,
        mediumSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase API Contracts Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);
      console.log(`INFO Medium severity findings: ${mediumSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: APIContractResult = {
        success: false,
        findings: [],
        metrics: {
          totalEndpoints: 0,
          inconsistentResponses: 0,
          wrongStatusCodes: 0,
          inconsistentPagination: 0,
          inconsistentErrorFormats: 0,
          missingPagination: 0,
          missingErrorHandlers: 0,
        },
        highSeverityFindings: 0,
        mediumSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase API Contracts:', sanitizedError);
      return result;
    }
  }

  private async analyzeResponseFormatConsistency(): Promise<APIContractFinding[]> {
    const findings: APIContractFinding[] = [];
    const sourceFiles = this.findSourceFiles();
    const responseFormats: Map<string, string[]> = new Map();

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
          // Detect API endpoints
          const endpointMatch = line.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+['"`]([^'"`]+)['"`]/);
          if (endpointMatch) {
            const endpoint = endpointMatch[1];
            
            // Detect response format
            const responsePatterns = [
              { pattern: /return\s+{?\s*data\s*:/, format: 'data' },
              { pattern: /return\s+{?\s*result\s*:/, format: 'result' },
              { pattern: /return\s+{?\s*response\s*:/, format: 'response' },
              { pattern: /return\s+{?\s*success\s*:/, format: 'success' },
            ];

            let detectedFormat: string | null = null;
            responsePatterns.forEach(({ pattern, format }) => {
              if (pattern.test(line) || pattern.test(lines[index + 1] || '')) {
                detectedFormat = format;
              }
            });

            if (detectedFormat) {
              if (!responseFormats.has(detectedFormat)) {
                responseFormats.set(detectedFormat, []);
              }
              responseFormats.get(detectedFormat)!.push(`${filePath}:${endpoint}`);
            }
          }
        });
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    // Check for inconsistent response formats
    if (responseFormats.size > 1) {
      const formats = Array.from(responseFormats.keys());
      findings.push({
        id: `inconsistent-response-${Date.now()}`,
        type: 'inconsistent-response',
        severity: 'medium',
        filePath: this.config.projectRoot,
        description: `Multiple response formats detected: ${formats.join(', ')}`,
        suggestion: 'Standardize response format across all endpoints. Use a consistent structure like { data, error, success }',
      });
    }

    return findings;
  }

  private async checkStatusCodes(): Promise<APIContractFinding[]> {
    const findings: APIContractFinding[] = [];
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
          // Check for wrong status codes in common scenarios
          
          // Using 200 for errors
          if (line.includes('200') && (line.includes('error') || line.includes('catch') || line.includes('throw'))) {
            findings.push({
              id: `wrong-status-${Date.now()}-${Math.random()}`,
              type: 'wrong-status-code',
              severity: 'high',
              filePath,
              line: index + 1,
              description: 'Using 200 status code for error responses',
              suggestion: 'Use appropriate 4xx or 5xx status codes for errors (400, 401, 403, 404, 500, etc.)',
            });
          }

          // Using 500 for client errors
          if (line.includes('500') && (line.includes('not found') || line.includes('unauthorized') || line.includes('forbidden'))) {
            findings.push({
              id: `wrong-status-${Date.now()}-${Math.random()}`,
              type: 'wrong-status-code',
              severity: 'high',
              filePath,
              line: index + 1,
              description: 'Using 500 status code for client errors',
              suggestion: 'Use appropriate 4xx status codes for client errors (404 for not found, 401 for unauthorized, 403 for forbidden)',
            });
          }

          // Missing status code in error handler
          if (line.includes('catch') && !line.includes('status') && !line.includes('statusCode')) {
            const nextLines = lines.slice(index, index + 5).join('\n');
            if (!nextLines.includes('status') && !nextLines.includes('statusCode')) {
              findings.push({
                id: `missing-status-${Date.now()}-${Math.random()}`,
                type: 'wrong-status-code',
                severity: 'medium',
                filePath,
                line: index + 1,
                description: 'Error handler without explicit status code',
                suggestion: 'Always set appropriate status codes in error handlers',
              });
            }
          }
        });
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkPagination(): Promise<APIContractFinding[]> {
    const findings: APIContractFinding[] = [];
    const sourceFiles = this.findSourceFiles();
    const paginationPatterns: Map<string, number> = new Map();

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

        let hasPagination = false;
        let paginationPattern: string | null = null;

        lines.forEach((line) => {
          // Detect pagination patterns
          if (line.includes('page') || line.includes('limit') || line.includes('offset') || line.includes('cursor')) {
            hasPagination = true;
            
            if (line.includes('page') && line.includes('limit')) {
              paginationPattern = 'page-limit';
            } else if (line.includes('cursor')) {
              paginationPattern = 'cursor';
            } else if (line.includes('offset')) {
              paginationPattern = 'offset-limit';
            }
          }
        });

        if (hasPagination && paginationPattern) {
          const count = paginationPatterns.get(paginationPattern) || 0;
          paginationPatterns.set(paginationPattern, count + 1);
        }
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    // Check for inconsistent pagination patterns
    if (paginationPatterns.size > 1) {
      const patterns = Array.from(paginationPatterns.keys());
      findings.push({
        id: `inconsistent-pagination-${Date.now()}`,
        type: 'inconsistent-pagination',
        severity: 'medium',
        filePath: this.config.projectRoot,
        description: `Multiple pagination patterns detected: ${patterns.join(', ')}`,
        suggestion: 'Standardize pagination pattern across all endpoints. Choose one pattern (page-limit, cursor, or offset-limit) and use it consistently',
      });
    }

    return findings;
  }

  private async checkErrorFormats(): Promise<APIContractFinding[]> {
    const findings: APIContractFinding[] = [];
    const sourceFiles = this.findSourceFiles();
    const errorFormats: Map<string, number> = new Map();

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

        lines.forEach((line) => {
          // Detect error response patterns
          const errorPatterns = [
            { pattern: /{?\s*error\s*:\s*{/, format: 'error-object' },
            { pattern: /{?\s*message\s*:/, format: 'message' },
            { pattern: /{?\s*message\s*:\s*error/, format: 'message-error' },
            { pattern: /throw new Error\(/, format: 'error-exception' },
          ];

          errorPatterns.forEach(({ pattern, format }) => {
            if (pattern.test(line)) {
              const count = errorFormats.get(format) || 0;
              errorFormats.set(format, count + 1);
            }
          });
        });
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    // Check for inconsistent error formats
    if (errorFormats.size > 2) {
      const formats = Array.from(errorFormats.keys());
      findings.push({
        id: `inconsistent-error-${Date.now()}`,
        type: 'inconsistent-error-format',
        severity: 'low',
        filePath: this.config.projectRoot,
        description: `Multiple error format patterns detected: ${formats.join(', ')}`,
        suggestion: 'Standardize error format across all endpoints. Use a consistent error structure like { error: { message, code, details } }',
      });
    }

    return findings;
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
      } catch (error) {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return sourceFiles;
  }

  private calculateMetrics(findings: APIContractFinding[]): APIContractMetrics {
    return {
      totalEndpoints: findings.length > 0 ? new Set(findings.map((f) => f.filePath)).size : 0,
      inconsistentResponses: findings.filter((f) => f.type === 'inconsistent-response').length,
      wrongStatusCodes: findings.filter((f) => f.type === 'wrong-status-code').length,
      inconsistentPagination: findings.filter((f) => f.type === 'inconsistent-pagination').length,
      inconsistentErrorFormats: findings.filter((f) => f.type === 'inconsistent-error-format').length,
      missingPagination: findings.filter((f) => f.type === 'missing-pagination').length,
      missingErrorHandlers: findings.filter((f) => f.type === 'missing-error-handler').length,
    };
  }
}
