/**
 * Phase Refactor
 *
 * Purpose: Identify and execute code refactoring opportunities including
 * extracting services, simplifying structure, and improving code organization.
 *
 * Architecture:
 * - Service Extraction: Identify code that should be extracted into services
 * - Structure Simplification: Simplify complex functions and classes
 * - Code Organization: Improve file and folder structure
 * - Dependency Reduction: Reduce coupling between components
 *
 * @module phases/phase-refactor
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';

interface RefactorFinding {
  id: string;
  type: 'extract-service' | 'simplify-function' | 'reduce-coupling' | 'improve-structure' | 'duplicate-code' | 'long-function';
  severity: 'low' | 'medium' | 'high';
  filePath: string;
  line?: number;
  description: string;
  suggestion?: string;
  complexity?: number;
}

interface RefactorMetrics {
  totalFiles: number;
  extractServiceOpportunities: number;
  simplifyFunctionOpportunities: number;
  reduceCouplingOpportunities: number;
  duplicateCodeInstances: number;
  longFunctions: number;
}

interface RefactorConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
}

export interface RefactorResult {
  success: boolean;
  findings: RefactorFinding[];
  metrics: RefactorMetrics;
  highSeverityFindings: number;
  mediumSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class PhaseRefactor {
  private config: RefactorConfig;

  constructor(config: RefactorConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<RefactorResult> {
    const startTime = Date.now();
    console.log('INFO Phase: Refactor\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Analyzing refactoring opportunities...\n');
      
      const findings: RefactorFinding[] = [];

      // 1. Identify service extraction opportunities
      console.log('INFO Identifying service extraction opportunities...');
      findings.push(...await this.identifyServiceExtraction());

      // 2. Identify functions to simplify
      console.log('INFO Identifying functions to simplify...');
      findings.push(...await this.identifySimplifyFunctions());

      // 3. Identify coupling reduction opportunities
      console.log('INFO Identifying coupling reduction opportunities...');
      findings.push(...await this.identifyCouplingReduction());

      // 4. Identify duplicate code
      console.log('INFO Identifying duplicate code...');
      findings.push(...await this.identifyDuplicateCode());

      // 5. Identify long functions
      console.log('INFO Identifying long functions...');
      findings.push(...await this.identifyLongFunctions());

      console.log(`INFO Total findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Service extraction opportunities: ${metrics.extractServiceOpportunities}`);
      console.log(`INFO Simplify function opportunities: ${metrics.simplifyFunctionOpportunities}`);
      console.log(`INFO Long functions: ${metrics.longFunctions}\n`);

      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;
      const mediumSeverityFindings = findings.filter((f) => f.severity === 'medium').length;

      const executionTimeMs = Date.now() - startTime;

      const result: RefactorResult = {
        success: true,
        findings,
        metrics,
        highSeverityFindings,
        mediumSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase Refactor Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);
      console.log(`INFO Medium severity findings: ${mediumSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: RefactorResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          extractServiceOpportunities: 0,
          simplifyFunctionOpportunities: 0,
          reduceCouplingOpportunities: 0,
          duplicateCodeInstances: 0,
          longFunctions: 0,
        },
        highSeverityFindings: 0,
        mediumSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase Refactor:', sanitizedError);
      return result;
    }
  }

  private async identifyServiceExtraction(): Promise<RefactorFinding[]> {
    const findings: RefactorFinding[] = [];
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

        // Check for business logic in components/pages (should be in services)
        const isComponent = filePath.includes('/components/') || filePath.includes('/app/') || filePath.includes('/pages/');
        
        if (isComponent) {
          const hasBusinessLogic = 
            content.includes('await') && 
            content.includes('fetch') &&
            !content.includes('service') &&
            !content.includes('api');

          if (hasBusinessLogic) {
            findings.push({
              id: `extract-service-${Date.now()}-${Math.random()}`,
              type: 'extract-service',
              severity: 'high',
              filePath,
              description: 'Business logic detected in component - should be extracted to a service',
              suggestion: 'Extract business logic to a service layer. Components should only handle presentation and user interaction',
            });
          }
        }

        // Check for database queries in components
        if (isComponent && content.includes('SELECT') && content.includes('FROM')) {
          findings.push({
            id: `extract-service-${Date.now()}-${Math.random()}`,
            type: 'extract-service',
            severity: 'high',
            filePath,
            description: 'Database query detected in component - should be extracted to a service',
            suggestion: 'Move database queries to a service layer or data access layer',
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async identifySimplifyFunctions(): Promise<RefactorFinding[]> {
    const findings: RefactorFinding[] = [];
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

        // Check for deeply nested code (high complexity)
        lines.forEach((line: string, index: number) => {
          const indent = line.match(/^\s*/)?.[0]?.length || 0;
          if (indent > 16) { // More than 4 levels of nesting
            findings.push({
              id: `simplify-function-${Date.now()}-${Math.random()}`,
              type: 'simplify-function',
              severity: 'medium',
              filePath,
              line: index + 1,
              description: `Deeply nested code detected (${indent / 4} levels)`,
              suggestion: 'Extract nested logic into separate functions to improve readability and reduce complexity',
            });
          }
        });

        // Check for complex conditional logic
        const complexConditionals = content.match(/if\s*\([^)]{50,}\)/g) || [];
        if (complexConditionals.length > 0) {
          findings.push({
            id: `simplify-function-${Date.now()}-${Math.random()}`,
            type: 'simplify-function',
            severity: 'medium',
            filePath,
            description: 'Complex conditional logic detected',
            suggestion: 'Extract complex conditions into separate functions with descriptive names',
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async identifyCouplingReduction(): Promise<RefactorFinding[]> {
    const findings: RefactorFinding[] = [];
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

        // Check for too many imports (high coupling)
        const importMatches = content.match(/^import /gm) || [];
        if (importMatches.length > 15) {
          findings.push({
            id: `reduce-coupling-${Date.now()}-${Math.random()}`,
            type: 'reduce-coupling',
            severity: 'medium',
            filePath,
            description: `High number of imports detected (${importMatches.length}) - indicates high coupling`,
            suggestion: 'Consider using dependency injection, interfaces, or aggregating related imports into modules',
          });
        }

        // Check for circular dependencies (simplified check)
        const relativeImports = content.match(/from\s+['"`]\.\.\//g) || [];
        if (relativeImports.length > 5) {
          findings.push({
            id: `reduce-coupling-${Date.now()}-${Math.random()}`,
            type: 'reduce-coupling',
            severity: 'low',
            filePath,
            description: `Many relative imports detected (${relativeImports.length}) - potential circular dependencies`,
            suggestion: 'Reorganize file structure to reduce relative imports and avoid circular dependencies',
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async identifyDuplicateCode(): Promise<RefactorFinding[]> {
    const findings: RefactorFinding[] = [];
    const sourceFiles = this.findSourceFiles();
    const codeBlocks: Map<string, string[]> = new Map();

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

        // Extract code blocks (simplified - looking for repeated patterns)
        for (let i = 0; i < lines.length - 3; i++) {
          const block = lines.slice(i, i + 3).join('\n').trim();
          if (block.length > 50) {
            const hash = this.simpleHash(block);
            if (!codeBlocks.has(hash)) {
              codeBlocks.set(hash, []);
            }
            codeBlocks.get(hash)!.push(`${filePath}:${i + 1}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    // Find code blocks that appear multiple times
    codeBlocks.forEach((locations, hash) => {
      if (locations.length > 2) {
        findings.push({
          id: `duplicate-code-${Date.now()}-${Math.random()}`,
          type: 'duplicate-code',
          severity: 'medium',
          filePath: locations[0],
          description: `Duplicate code detected in ${locations.length} locations`,
          suggestion: 'Extract duplicate code into a shared function or utility',
        });
      }
    });

    return findings;
  }

  private async identifyLongFunctions(): Promise<RefactorFinding[]> {
    const findings: RefactorFinding[] = [];
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

        // Find function definitions and their lengths
        let inFunction = false;
        let functionStart = 0;
        let braceCount = 0;

        lines.forEach((line, index) => {
          // Detect function start
          const functionMatch = line.match(/(?:function|const\s+\w+\s*=\s*(?:async\s*)?\(|async\s+function)/);
          if (functionMatch) {
            inFunction = true;
            functionStart = index;
            braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
          } else if (inFunction) {
            braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            
            // Function ends when brace count returns to 0
            if (braceCount === 0) {
              const functionLength = index - functionStart + 1;
              if (functionLength > 50) {
                findings.push({
                  id: `long-function-${Date.now()}-${Math.random()}`,
                  type: 'long-function',
                  severity: functionLength > 100 ? 'high' : 'medium',
                  filePath,
                  line: functionStart + 1,
                  description: `Long function detected (${functionLength} lines)`,
                  suggestion: 'Extract function into smaller, focused functions. Aim for functions under 50 lines',
                  complexity: functionLength,
                });
              }
              inFunction = false;
            }
          }
        });
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
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

  private calculateMetrics(findings: RefactorFinding[]): RefactorMetrics {
    return {
      totalFiles: findings.length > 0 ? new Set(findings.map((f) => f.filePath)).size : 0,
      extractServiceOpportunities: findings.filter((f) => f.type === 'extract-service').length,
      simplifyFunctionOpportunities: findings.filter((f) => f.type === 'simplify-function').length,
      reduceCouplingOpportunities: findings.filter((f) => f.type === 'reduce-coupling').length,
      duplicateCodeInstances: findings.filter((f) => f.type === 'duplicate-code').length,
      longFunctions: findings.filter((f) => f.type === 'long-function').length,
    };
  }
}
