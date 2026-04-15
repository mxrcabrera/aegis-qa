/**
 * Phase 2: Business Logic - Domain Understanding and Analysis
 *
 * Purpose: Analyze business logic patterns, domain entities, and business rules
 * to ensure the system correctly implements the intended business requirements.
 *
 * Architecture:
 * - Domain Analysis: Understand the business domain from schema/code
 * - Entity Detection: Identify domain entities and their relationships
 * - Business Rule Validation: Validate business rule implementation
 * - Edge Case Detection: Find missing edge cases in business logic
 *
 * @module phases/phase-2-business-logic
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { DomainAnalyzer } from '../inference/domain-analyzer.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Business logic finding
 */
interface BusinessLogicFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'missing-validation' | 'incomplete-logic' | 'edge-case-missing' | 'business-rule-violation' | 'inconsistent-entity';
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
 * Domain entity
 */
interface DomainEntity {
  /** Entity name */
  name: string;
  /** File where entity is defined */
  filePath: string;
  /** Properties */
  properties: string[];
  /** Relationships */
  relationships: string[];
}

/**
 * Business rule
 */
interface BusinessRule {
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Implementation file */
  filePath: string;
  /** Line number */
  line?: number;
}

/**
 * Phase 2 configuration
 */
interface Phase2Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Domain analyzer for business understanding */
  domainAnalyzer: DomainAnalyzer;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 2 result
 */
export interface Phase2Result {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** Business logic findings */
  findings: BusinessLogicFinding[];
  /** Domain entities detected */
  entities: DomainEntity[];
  /** Business rules detected */
  businessRules: BusinessRule[];
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
 * Phase 2: Business Logic - Domain Understanding and Analysis
 *
 * This phase analyzes business logic patterns, domain entities, and business rules
 * to ensure the system correctly implements the intended business requirements.
 *
 * @class Phase2BusinessLogic
 * @example
 * ```typescript
 * const businessLogic = new Phase2BusinessLogic(config);
 * const result = await businessLogic.execute();
 * console.log(`Entities detected: ${result.entities.length}`);
 * console.log(`Business rules: ${result.businessRules.length}`);
 * ```
 */
export class Phase2BusinessLogic {
  private config: Phase2Config;

  constructor(config: Phase2Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 2: Business Logic
   *
   * @returns Promise<Phase2Result> - Business logic analysis result
   */
  async execute(): Promise<Phase2Result> {
    const startTime = Date.now();
    console.log('INFO Phase 2: Business Logic - Domain Understanding and Analysis\n');

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

      // Analyze domain using DomainAnalyzer
      console.log('INFO Analyzing business domain...');
      const domainAnalysis = await this.config.domainAnalyzer.analyze();
      console.log(`INFO Domain detected: ${domainAnalysis.domainMap?.entities.length || 0} entities\n`);

      // Detect domain entities
      console.log('INFO Detecting domain entities...');
      const entities = await this.detectEntities();
      console.log(`INFO Entities detected: ${entities.length}\n`);

      // Detect business rules
      console.log('INFO Detecting business rules...');
      const businessRules = await this.detectBusinessRules();
      console.log(`INFO Business rules detected: ${businessRules.length}\n`);

      // Analyze business logic patterns
      console.log('INFO Analyzing business logic patterns...');
      const findings = await this.analyzeBusinessLogic(entities, businessRules);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase2Result = {
        success: true,
        totalFiles: entities.length + businessRules.length,
        findings,
        entities,
        businessRules,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 2 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase2Result = {
        success: false,
        totalFiles: 0,
        findings: [],
        entities: [],
        businessRules: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 2:', sanitizedError);
      return result;
    }
  }

  /**
   * Detects domain entities from codebase
   *
   * @private
   * @returns Promise<DomainEntity[]> - Detected entities
   */
  private async detectEntities(): Promise<DomainEntity[]> {
    const entities: DomainEntity[] = [];
    const projectRoot = this.config.projectRoot;

    // Search for entity definitions
    const sourceFiles = this.getSourceFiles(projectRoot);

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
        
        const fileEntities = this.extractEntitiesFromFile(filePath, sanitizedContent);
        entities.push(...fileEntities);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return entities;
  }

  /**
   * Detects business rules from codebase
   *
   * @private
   * @returns Promise<BusinessRule[]> - Detected business rules
   */
  private async detectBusinessRules(): Promise<BusinessRule[]> {
    const rules: BusinessRule[] = [];
    const projectRoot = this.config.projectRoot;

    // Search for business rule implementations
    const sourceFiles = this.getSourceFiles(projectRoot);

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
        
        const fileRules = this.extractBusinessRulesFromFile(filePath, sanitizedContent);
        rules.push(...fileRules);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return rules;
  }

  /**
   * Analyzes business logic patterns for issues
   *
   * @private
   * @param entities - Detected domain entities
   * @param businessRules - Detected business rules
   * @returns Promise<BusinessLogicFinding[]> - Business logic findings
   */
  private async analyzeBusinessLogic(
    entities: DomainEntity[],
    businessRules: BusinessRule[]
  ): Promise<BusinessLogicFinding[]> {
    const projectRoot = this.config.projectRoot;

    const sourceFiles = this.getSourceFiles(projectRoot);

    const analyzeFiles = async (sourceFiles: string[]): Promise<BusinessLogicFinding[]> => {
      const findings: BusinessLogicFinding[] = [];

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
          
          const fileFindings = this.analyzeFileForBusinessLogic(filePath, sanitizedContent, entities, businessRules);
          findings.push(...fileFindings);
        } catch (error) {
          console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
        }
      }

      return findings;
    };

    return analyzeFiles(sourceFiles);
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
   * Extracts entities from file content
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DomainEntity[] - Entities found in file
   */
  private extractEntitiesFromFile(filePath: string, content: string): DomainEntity[] {
    const entities: DomainEntity[] = [];

    // Detect class/interface definitions that might be entities
    const entityPatterns = [
      /class\s+(\w+Entity)\s*{/g,
      /class\s+(\w+Model)\s*{/g,
      /interface\s+(\w+Entity)\s*{/g,
      /interface\s+(\w+Model)\s*{/g,
      /@Entity\s*\n\s*class\s+(\w+)/g,
      /@Table\s*\(\s*['"`](\w+)['"`]\s*\)/g,
    ];

    for (const pattern of entityPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const entityName = match[1];

        entities.push({
          name: entityName,
          filePath,
          properties: this.extractProperties(content, match.index),
          relationships: this.extractRelationships(content, match.index),
        });
      }
    }

    return entities;
  }

  /**
   * Extracts business rules from file content
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns BusinessRule[] - Business rules found in file
   */
  private extractBusinessRulesFromFile(filePath: string, content: string): BusinessRule[] {
    const rules: BusinessRule[] = [];

    // Detect business rule patterns
    const rulePatterns = [
      /validate\w+\s*\([^)]*\)\s*{/g,
      /check\w+\s*\([^)]*\)\s*{/g,
      /ensure\w+\s*\([^)]*\)\s*{/g,
      /businessRule\w+\s*\([^)]*\)\s*{/g,
    ];

    for (const pattern of rulePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const ruleName = match[0].split('(')[0];
        rules.push({
          name: ruleName,
          description: `Business rule validation: ${ruleName}`,
          filePath,
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    }

    return rules;
  }

  /**
   * Analyzes file for business logic issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param entities - Detected entities
   * @param businessRules - Detected business rules
   * @returns BusinessLogicFinding[] - Findings from file
   */
  private analyzeFileForBusinessLogic(
    filePath: string,
    content: string,
    entities: DomainEntity[],
    _businessRules: BusinessRule[]
  ): BusinessLogicFinding[] {
    const findings: BusinessLogicFinding[] = [];

    // Check for missing validation on entity operations
    for (const entity of entities) {
      if (content.toLowerCase().includes(entity.name.toLowerCase())) {
        // Check if operations on this entity have validation
        if (!this.hasValidation(content, entity.name)) {
          findings.push({
            id: this.generateFindingId(filePath, 'missing-validation'),
            type: 'missing-validation',
            severity: 'high',
            filePath,
            description: `Missing validation for ${entity.name} operations`,
            suggestion: `Add validation logic for ${entity.name} operations`,
          });
        }
      }
    }

    // Check for incomplete logic (if/else without else)
    const incompleteLogicPattern = /if\s*\([^)]*\)\s*\{[^}]*\}(?!\s*else)/g;
    let match;
    while ((match = incompleteLogicPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(filePath, 'incomplete-logic'),
        type: 'incomplete-logic',
        severity: 'medium',
        filePath,
        line: lineNumber,
        description: 'Conditional statement without else clause may have incomplete logic',
        suggestion: 'Consider adding else clause or comment explaining why else is not needed',
      });
    }

    // Check for edge case handling
    const edgeCasePatterns = [
      /forEach\([^)]*\)\s*{/g,
      /map\([^)]*\)\s*{/g,
    ];

    for (const pattern of edgeCasePatterns) {
      while ((match = pattern.exec(content)) !== null) {
        const blockStart = match.index;
        const blockContent = content.substring(blockStart, blockStart + 500);

        // Check if empty/null handling is present
        if (!blockContent.includes('if') && !blockContent.includes('?')) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          findings.push({
            id: this.generateFindingId(filePath, 'edge-case-missing'),
            type: 'edge-case-missing',
            severity: 'medium',
            filePath,
            line: lineNumber,
            description: 'Array operation may not handle empty/null arrays',
            suggestion: 'Add null/empty array check before array operation',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Checks if entity operations have validation
   *
   * @private
   * @param content - File content
   * @param entityName - Entity name
   * @returns boolean - True if validation exists
   */
  private hasValidation(content: string, entityName: string): boolean {
    const validationKeywords = ['validate', 'check', 'ensure', 'verify', 'guard'];
    const entityLower = entityName.toLowerCase();

    for (const keyword of validationKeywords) {
      if (content.toLowerCase().includes(keyword + entityLower) ||
          content.toLowerCase().includes(entityLower + keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extracts properties from entity definition
   *
   * @private
   * @param content - File content
   * @param startIndex - Start index of entity definition
   * @returns string[] - Property names
   */
  private extractProperties(content: string, startIndex: number): string[] {
    const properties: string[] = [];
    const entityContent = content.substring(startIndex, startIndex + 1000);

    const propertyPattern = /(\w+)\s*:/g;
    let match;
    while ((match = propertyPattern.exec(entityContent)) !== null) {
      properties.push(match[1]);
    }

    return properties;
  }

  /**
   * Extracts relationships from entity definition
   *
   * @private
   * @param content - File content
   * @param startIndex - Start index of entity definition
   * @returns string[] - Relationship names
   */
  private extractRelationships(content: string, startIndex: number): string[] {
    const relationships: string[] = [];
    const entityContent = content.substring(startIndex, startIndex + 1000);

    const relationshipPatterns = [
      /@ManyToOne\s*\(\(\)\s*=>\s*(\w+)/g,
      /@OneToMany\s*\(\(\)\s*=>\s*(\w+)/g,
      /@OneToOne\s*\(\(\)\s*=>\s*(\w+)/g,
      /@ManyToMany\s*\(\(\)\s*=>\s*(\w+)/g,
    ];

    for (const pattern of relationshipPatterns) {
      let match;
      while ((match = pattern.exec(entityContent)) !== null) {
        relationships.push(match[1]);
      }
    }

    return relationships;
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
