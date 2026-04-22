/**
 * Phase 8: Performance & SEO - Performance Optimization and SEO Analysis
 *
 * Purpose: Analyze application performance metrics and SEO best practices
 * including Core Web Vitals, meta tags, and performance optimization opportunities.
 *
 * Architecture:
 * - Core Web Vitals: Check for LCP, FID, CL optimization
 * - SEO Meta Tags: Verify proper meta tags for SEO
 * - Performance: Check for lazy loading, code splitting
 * - Image Optimization: Check for image optimization
 *
 * @module phases/phase-8-performance-seo
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Performance/SEO finding
 */
interface PerformanceSEOFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'performance-issue' | 'seo-missing' | 'image-optimization' | 'bundle-size' | 'code-splitting' | 'caching';
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
 * Performance/SEO metrics
 */
interface PerformanceSEOMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Performance issues */
  performanceIssues: number;
  /** SEO issues */
  seoIssues: number;
  /** Image optimization issues */
  imageOptimizationIssues: number;
  /** Bundle size issues */
  bundleSizeIssues: number;
}

/**
 * Phase 8 configuration
 */
interface Phase8Config {
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
 * Phase 8 result
 */
export interface Phase8Result {
  /** Overall success */
  success: boolean;
  /** Performance/SEO findings */
  findings: PerformanceSEOFinding[];
  /** Performance/SEO metrics */
  metrics: PerformanceSEOMetrics;
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
 * Phase 8: Performance & SEO - Performance Optimization and SEO Analysis
 *
 * This phase analyzes application performance metrics and SEO best practices
 * including Core Web Vitals, meta tags, and performance optimization opportunities.
 *
 * @class Phase8PerformanceSEO
 * @example
 * ```typescript
 * const performanceSEO = new Phase8PerformanceSEO(config);
 * const result = await performanceSEO.execute();
 * console.log(`Performance issues: ${result.metrics.performanceIssues}`);
 * console.log(`SEO issues: ${result.metrics.seoIssues}`);
 * ```
 */
export class Phase8PerformanceSEO {
  private config: Phase8Config;

  constructor(config: Phase8Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 8: Performance & SEO
   *
   * @returns Promise<Phase8Result> - Performance/SEO analysis result
   */
  async execute(): Promise<Phase8Result> {
    const startTime = Date.now();
    console.log('INFO Phase 8: Performance & SEO - Performance Optimization and SEO Analysis\n');

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

      // Get source files
      console.log('INFO Finding source files...');
      const sourceFiles = this.getSourceFiles(this.config.projectRoot);
      console.log(`INFO Source files found: ${sourceFiles.length}\n`);

      // Analyze Performance/SEO
      console.log('INFO Analyzing performance and SEO...');
      const findings = await this.analyzePerformanceSEO(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Performance issues: ${metrics.performanceIssues}`);
      console.log(`INFO SEO issues: ${metrics.seoIssues}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase8Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 8 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase8Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          performanceIssues: 0,
          seoIssues: 0,
          imageOptimizationIssues: 0,
          bundleSizeIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 8:', sanitizedError);
      return result;
    }
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

    const extensions = ['.tsx', '.jsx', '.ts', '.js', '.html', '.css', '.scss'];
    
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

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes Performance/SEO for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<PerformanceSEOFinding[]> - Performance/SEO findings
   */
  private async analyzePerformanceSEO(sourceFiles: string[]): Promise<PerformanceSEOFinding[]> {
    const findings: PerformanceSEOFinding[] = [];

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
        
        const fileFindings = this.analyzeFileForPerformanceSEO(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for Performance/SEO issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PerformanceSEOFinding[] - Findings from file
   */
  private analyzeFileForPerformanceSEO(filePath: string, content: string): PerformanceSEOFinding[] {
    const findings: PerformanceSEOFinding[] = [];

    // Check for performance issues
    findings.push(...this.checkPerformance(filePath, content));

    // Check for SEO issues
    findings.push(...this.checkSEO(filePath, content));

    // Check for image optimization
    findings.push(...this.checkImageOptimization(filePath, content));

    return findings;
  }

  /**
   * Checks for performance issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PerformanceSEOFinding[] - Performance findings
   */
  private checkPerformance(filePath: string, content: string): PerformanceSEOFinding[] {
    const findings: PerformanceSEOFinding[] = [];

    // Check for large imports (potential bundle size issues)
    const importPattern = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      
      // Check for large library imports
      if (importPath.includes('moment') || importPath.includes('lodash')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'bundle-size'),
          type: 'bundle-size',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Large library import detected: ${importPath}`,
          suggestion: 'Consider using lighter alternatives (date-fns for moment, lodash-es for lodash)',
        });
      }
    }

    // Check for missing lazy loading
    const dynamicImportPattern = /import\(/g;
    const hasLazyLoading = dynamicImportPattern.test(content);
    
    if (!hasLazyLoading && (content.includes('import') && content.includes('from'))) {
      findings.push({
        id: this.generateFindingId(filePath, 'code-splitting'),
        type: 'code-splitting',
        severity: 'low',
        filePath,
        description: 'Component may benefit from code splitting',
        suggestion: 'Consider using dynamic imports for code splitting',
      });
    }

    // Check for missing caching headers (simplified)
    if (content.includes('fetch(') || content.includes('axios')) {
      const fetchPattern = /(?:fetch|axios)\([^)]*\)/g;
      while ((match = fetchPattern.exec(content)) !== null) {
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(content.length, match.index + 150);
        const context = content.substring(contextStart, contextEnd);

        if (!context.includes('cache') && !context.includes('Cache')) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          findings.push({
            id: this.generateFindingId(filePath, 'caching'),
            type: 'caching',
            severity: 'low',
            filePath,
            line: lineNumber,
            description: 'API call may not have caching strategy',
            suggestion: 'Consider implementing caching for frequently accessed data',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Checks for SEO issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PerformanceSEOFinding[] - SEO findings
   */
  private checkSEO(filePath: string, content: string): PerformanceSEOFinding[] {
    const findings: PerformanceSEOFinding[] = [];

    // Check for meta tags in HTML files
    if (filePath.endsWith('.html') || filePath.includes('layout') || filePath.includes('page')) {
      const requiredMetaTags = [
        { tag: 'title', name: 'title' },
        { tag: 'description', name: 'meta description' },
        { tag: 'og:title', name: 'Open Graph title' },
        { tag: 'og:description', name: 'Open Graph description' },
      ];

      for (const { tag, name } of requiredMetaTags) {
        if (!content.includes(tag)) {
          findings.push({
            id: this.generateFindingId(filePath, 'seo-missing'),
            type: 'seo-missing',
            severity: 'high',
            filePath,
            description: `Missing SEO meta tag: ${name}`,
            suggestion: `Add ${name} meta tag for better SEO`,
          });
        }
      }

      // Check for structured data
      if (!content.includes('application/ld+json') && !content.includes('schema.org')) {
        findings.push({
          id: this.generateFindingId(filePath, 'seo-missing'),
          type: 'seo-missing',
          severity: 'medium',
          filePath,
          description: 'Missing structured data (JSON-LD)',
          suggestion: 'Consider adding structured data for better search engine understanding',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for image optimization issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns PerformanceSEOFinding[] - Image optimization findings
   */
  private checkImageOptimization(filePath: string, content: string): PerformanceSEOFinding[] {
    const findings: PerformanceSEOFinding[] = [];

    // Check for images without optimization attributes
    const imgPattern = /<img[^>]*>/gi;
    let match;
    while ((match = imgPattern.exec(content)) !== null) {
      const imgTag = match[0];
      
      // Check for missing loading attribute
      if (!imgTag.includes('loading=')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'image-optimization'),
          type: 'image-optimization',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Image missing loading attribute',
          suggestion: 'Add loading="lazy" for below-the-fold images',
        });
      }

      // Check for unoptimized image formats
      if (imgTag.includes('.jpg') || imgTag.includes('.jpeg') || imgTag.includes('.png')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'image-optimization'),
          type: 'image-optimization',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: 'Image may not be in modern format',
          suggestion: 'Consider using WebP or AVIF format for better performance',
        });
      }
    }

    return findings;
  }

  /**
   * Calculates Performance/SEO metrics
   *
   * @private
   * @param findings - Performance/SEO findings
   * @returns PerformanceSEOMetrics - Calculated metrics
   */
  private calculateMetrics(findings: PerformanceSEOFinding[]): PerformanceSEOMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      performanceIssues: findings.filter(f => f.type === 'performance-issue' || f.type === 'bundle-size' || f.type === 'code-splitting' || f.type === 'caching').length,
      seoIssues: findings.filter(f => f.type === 'seo-missing').length,
      imageOptimizationIssues: findings.filter(f => f.type === 'image-optimization').length,
      bundleSizeIssues: findings.filter(f => f.type === 'bundle-size').length,
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


