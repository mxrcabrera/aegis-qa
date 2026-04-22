/**
 * Phase 6: UI Components - Component Architecture and Best Practices
 *
 * Purpose: Analyze UI components for architecture patterns, reusability,
 * performance, and adherence to component best practices.
 *
 * Architecture:
 * - Component Structure: Check for proper component organization
 * - Props Validation: Check for proper props typing
 * - State Management: Check for proper state usage
 * - Performance: Check for unnecessary re-renders
 *
 * @module phases/phase-6-ui-components
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * UI component finding
 */
interface UIComponentFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'component-structure' | 'props-validation' | 'state-issue' | 'performance-issue' | 'accessibility-issue' | 'styling-issue';
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
 * UI component metrics
 */
interface UIComponentMetrics {
  /** Total component files analyzed */
  totalComponents: number;
  /** Components with proper props validation */
  componentsWithProps: number;
  /** Components using hooks */
  componentsWithHooks: number;
  /** Performance issues */
  performanceIssues: number;
  /** Accessibility issues */
  accessibilityIssues: number;
}

/**
 * Phase 6 configuration
 */
interface Phase6Config {
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
 * Phase 6 result
 */
export interface Phase6Result {
  /** Overall success */
  success: boolean;
  /** UI component findings */
  findings: UIComponentFinding[];
  /** UI component metrics */
  metrics: UIComponentMetrics;
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
 * Phase 6: UI Components - Component Architecture and Best Practices
 *
 * This phase analyzes UI components for architecture patterns, reusability,
 * performance, and adherence to component best practices.
 *
 * @class Phase6UIComponents
 * @example
 * ```typescript
 * const uiComponents = new Phase6UIComponents(config);
 * const result = await uiComponents.execute();
 * console.log(`Total components: ${result.metrics.totalComponents}`);
 * console.log(`Performance issues: ${result.metrics.performanceIssues}`);
 * ```
 */
export class Phase6UIComponents {
  private config: Phase6Config;

  constructor(config: Phase6Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 6: UI Components
   *
   * @returns Promise<Phase6Result> - UI component analysis result
   */
  async execute(): Promise<Phase6Result> {
    const startTime = Date.now();
    console.log('INFO Phase 6: UI Components - Component Architecture and Best Practices\n');

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

      // Get component files
      console.log('INFO Finding component files...');
      const componentFiles = this.getComponentFiles(this.config.projectRoot);
      console.log(`INFO Component files found: ${componentFiles.length}\n`);

      // Analyze UI components
      console.log('INFO Analyzing UI components...');
      const findings = await this.analyzeUIComponents(componentFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(componentFiles, findings);
      console.log(`INFO Total components: ${metrics.totalComponents}`);
      console.log(`INFO Components with hooks: ${metrics.componentsWithHooks}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase6Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 6 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase6Result = {
        success: false,
        findings: [],
        metrics: {
          totalComponents: 0,
          componentsWithProps: 0,
          componentsWithHooks: 0,
          performanceIssues: 0,
          accessibilityIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 6:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets component files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Component file paths
   */
  private getComponentFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const extensions = ['.tsx', '.jsx'];
    const componentDirs = ['components', 'app', 'pages'];
    
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
      } catch {
        // Skip directories we can't read
      }
    };

    // Search in component directories
    for (const dir of componentDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        searchDir(dirPath);
      }
    }

    // Also search root directory
    searchDir(projectRoot);

    return files;
  }

  /**
   * Analyzes UI components
   *
   * @private
   * @param componentFiles - Component file paths
   * @returns Promise<UIComponentFinding[]> - UI component findings
   */
  private async analyzeUIComponents(componentFiles: string[]): Promise<UIComponentFinding[]> {
    const findings: UIComponentFinding[] = [];

    for (const filePath of componentFiles) {
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
        
        const fileFindings = this.analyzeComponent(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes component file
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UIComponentFinding[] - Findings from component
   */
  private analyzeComponent(filePath: string, content: string): UIComponentFinding[] {
    const findings: UIComponentFinding[] = [];

    // Check for component structure
    findings.push(...this.checkComponentStructure(filePath, content));

    // Check for props validation
    findings.push(...this.checkPropsValidation(filePath, content));

    // Check for state issues
    findings.push(...this.checkStateManagement(filePath, content));

    // Check for performance issues
    findings.push(...this.checkPerformance(filePath, content));

    // Check for accessibility
    findings.push(...this.checkAccessibility(filePath, content));

    return findings;
  }

  /**
   * Checks component structure
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UIComponentFinding[] - Component structure findings
   */
  private checkComponentStructure(filePath: string, content: string): UIComponentFinding[] {
    const findings: UIComponentFinding[] = [];

    // Check for proper component export
    const exportPattern = /export\s+(?:default\s+)?(?:const|function|class)\s+(\w+)/g;
    const match = exportPattern.exec(content);

    if (!match) {
      findings.push({
        id: this.generateFindingId(filePath, 'component-structure'),
        type: 'component-structure',
        severity: 'medium',
        filePath,
        description: 'Component may not be properly exported',
        suggestion: 'Ensure component has proper export statement',
      });
    }

    return findings;
  }

  /**
   * Checks for props validation
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UIComponentFinding[] - Props validation findings
   */
  private checkPropsValidation(filePath: string, content: string): UIComponentFinding[] {
    const findings: UIComponentFinding[] = [];

    // Check for TypeScript interface or type for props
    const propsPattern = /interface\s+(\w*Props)/g;
    const typePattern = /type\s+(\w*Props)/g;
    const hasInterface = propsPattern.test(content);
    const hasType = typePattern.test(content);

    // Check if component accepts props
    const componentPattern = /(?:function|const)\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = componentPattern.exec(content)) !== null) {
      const props = match[2];
      
      if (props.length > 0 && !hasInterface && !hasType) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'props-validation'),
          type: 'props-validation',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Component accepts props but has no props interface/type',
          suggestion: 'Add TypeScript interface or type for props validation',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for state management issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UIComponentFinding[] - State management findings
   */
  private checkStateManagement(filePath: string, content: string): UIComponentFinding[] {
    const findings: UIComponentFinding[] = [];

    // Check for useState usage without proper initialization
    const useStatePattern = /useState<[^>]*>\(([^)]+)\)/g;
    let match;
    while ((match = useStatePattern.exec(content)) !== null) {
      const initialValue = match[1];
      
      if (initialValue === 'null' || initialValue === 'undefined') {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'state-issue'),
          type: 'state-issue',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: 'useState initialized with null/undefined',
          suggestion: 'Consider using a proper initial value or union type',
        });
      }
    }

    // Check for useEffect without dependencies array
    const useEffectPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{/g;
    while ((match = useEffectPattern.exec(content)) !== null) {
      const useEffectStart = match.index;
      const contextEnd = Math.min(content.length, useEffectStart + 200);
      const context = content.substring(useEffectStart, contextEnd);

      if (!context.includes('[') || context.includes('[]')) {
        const lineNumber = content.substring(0, useEffectStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'state-issue'),
          type: 'state-issue',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'useEffect may be missing dependencies array',
          suggestion: 'Add dependencies array to useEffect to prevent infinite loops',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for performance issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UIComponentFinding[] - Performance findings
   */
  private checkPerformance(filePath: string, content: string): UIComponentFinding[] {
    const findings: UIComponentFinding[] = [];

    // Check for inline function definitions in render
    const inlineFunctionPattern = /onClick=\{[^}]*=>/g;
    let match;
    while ((match = inlineFunctionPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(filePath, 'performance-issue'),
        type: 'performance-issue',
        severity: 'medium',
        filePath,
        line: lineNumber,
        description: 'Inline function in render may cause unnecessary re-renders',
        suggestion: 'Use useCallback or move function outside component',
      });
    }

    // Check for missing React.memo
    const componentPattern = /export\s+(?:default\s+)?(?:const|function)\s+(\w+)/g;
    while ((match = componentPattern.exec(content)) !== null) {
      const componentName = match[1];
      const componentStart = match.index;
      const contextEnd = Math.min(content.length, componentStart + 1000);
      const context = content.substring(componentStart, contextEnd);

      if (context.includes('useState') && !context.includes('React.memo')) {
        const lineNumber = content.substring(0, componentStart).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'performance-issue'),
          type: 'performance-issue',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: `Component ${componentName} uses state but may benefit from React.memo`,
          suggestion: 'Consider wrapping component in React.memo to prevent unnecessary re-renders',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for accessibility issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns UIComponentFinding[] - Accessibility findings
   */
  private checkAccessibility(filePath: string, content: string): UIComponentFinding[] {
    const findings: UIComponentFinding[] = [];

    // Check for images without alt text
    const imgPattern = /<img[^>]*>/g;
    let match;
    while ((match = imgPattern.exec(content)) !== null) {
      const imgTag = match[0];
      
      if (!imgTag.includes('alt=') || imgTag.includes('alt=""')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'accessibility-issue'),
          type: 'accessibility-issue',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Image tag missing alt text or has empty alt',
          suggestion: 'Add descriptive alt text for accessibility',
        });
      }
    }

    // Check for buttons without aria-label when text is not descriptive
    const buttonPattern = /<button[^>]*>([^<]*)<\/button>/g;
    while ((match = buttonPattern.exec(content)) !== null) {
      const buttonText = match[1].trim();
      const buttonTag = match[0];
      
      if (buttonText.length < 3 && !buttonTag.includes('aria-label')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'accessibility-issue'),
          type: 'accessibility-issue',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Button has non-descriptive text and no aria-label',
          suggestion: 'Add aria-label or use more descriptive button text',
        });
      }
    }

    return findings;
  }

  /**
   * Calculates UI component metrics
   *
   * @private
   * @param componentFiles - Component file paths
   * @param findings - UI component findings
   * @returns UIComponentMetrics - Calculated metrics
   */
  private calculateMetrics(componentFiles: string[], findings: UIComponentFinding[]): UIComponentMetrics {
    let componentsWithProps = 0;
    let componentsWithHooks = 0;

    for (const filePath of componentFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (/interface\s+\w*Props/.test(content) || /type\s+\w*Props/.test(content)) {
          componentsWithProps++;
        }
        
        if (/useState|useEffect|useCallback|useMemo/.test(content)) {
          componentsWithHooks++;
        }
      } catch {
        // Skip files we can't read
      }
    }

    return {
      totalComponents: componentFiles.length,
      componentsWithProps,
      componentsWithHooks,
      performanceIssues: findings.filter(f => f.type === 'performance-issue').length,
      accessibilityIssues: findings.filter(f => f.type === 'accessibility-issue').length,
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


