/**
 * Cloud Cost Detection
 *
 * Purpose: Analyzes infrastructure code to detect potential cost issues and optimization opportunities.
 * Focus on resource usage, scaling configurations, and cost-efficient patterns.
 *
 * Architecture:
 * - Resource Analysis: Identifies resource-intensive code patterns
 * - Cost Scoring: Assigns cost impact scores to infrastructure configurations
 * - Optimization Suggestions: Provides cost optimization recommendations
 * - Cloud Provider Detection: Detects AWS, GCP, Azure patterns
 *
 * @module lib/cloud-cost-detection
 * @since 2.0.0
 */

import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Cost detection result
 */
export interface CostDetection {
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Cost issue type */
  costType: string;
  /** Cost impact score (0-1) */
  impactScore: number;
  /** Estimated monthly cost impact */
  estimatedCost?: number;
  /** Description */
  description: string;
  /** Suggestion */
  suggestion?: string;
}

/**
 * Cost pattern rule
 */
interface CostPatternRule {
  /** Rule name */
  name: string;
  /** Pattern to match (regex) */
  pattern: RegExp;
  /** Cost type */
  costType: string;
  /** Base impact score */
  baseImpactScore: number;
  /** Estimated monthly cost multiplier */
  costMultiplier?: number;
  /** Description */
  description: string;
  /** Suggestion */
  suggestion: string;
}

/**
 * Cloud Cost Detection
 *
 * Analyzes infrastructure code to detect potential cost issues and optimization opportunities.
 * Focuses on resource usage, scaling configurations, and cost-efficient patterns.
 *
 * @class CloudCostDetection
 */
export class CloudCostDetection {
  private patternRules: CostPatternRule[] = [];

  constructor() {
    this.registerBuiltinPatterns();
  }

  /**
   * Registers builtin cost pattern rules
   *
   * @private
   */
  private registerBuiltinPatterns(): void {
    // Pattern: Oversized EC2 instances
    this.patternRules.push({
      name: 'oversized-instance',
      pattern: /instance_type\s*:\s*['"]?(t3\.xlarge|t3\.2xlarge|m5\.large|c5\.large)['"]?/g,
      costType: 'oversized-instance',
      baseImpactScore: 0.7,
      costMultiplier: 50,
      description: 'Potentially oversized instance type',
      suggestion: 'Consider using smaller instance types or auto-scaling groups to reduce costs',
    });

    // Pattern: Missing auto-scaling
    this.patternRules.push({
      name: 'missing-autoscaling',
      pattern: /min_capacity\s*:\s*\d+\s*,\s*max_capacity\s*:\s*\d+/g,
      costType: 'missing-autoscaling',
      baseImpactScore: 0.6,
      description: 'Fixed capacity without auto-scaling',
      suggestion: 'Implement auto-scaling to adjust capacity based on demand',
    });

    // Pattern: Unreserved instances
    this.patternRules.push({
      name: 'unreserved-instances',
      pattern: /instance_market_options\s*:\s*{\s*market_type\s*:\s*['"]?on-demand['"]?/g,
      costType: 'unreserved-instances',
      baseImpactScore: 0.5,
      costMultiplier: 30,
      description: 'On-demand instances without reserved or spot options',
      suggestion: 'Consider reserved instances or spot instances for significant cost savings',
    });

    // Pattern: Large storage volumes
    this.patternRules.push({
      name: 'large-storage',
      pattern: /volume_size\s*:\s*(5[0-9]{2,}|[6-9][0-9]{2,}|[1-9]\d{3,})/g,
      costType: 'large-storage',
      baseImpactScore: 0.4,
      costMultiplier: 0.1,
      description: 'Large storage volume size',
      suggestion: 'Review storage requirements and consider using lifecycle policies for old data',
    });

    // Pattern: Unoptimized database instances
    this.patternRules.push({
      name: 'unoptimized-db',
      pattern: /db_instance_class\s*:\s*['"]?(db\.t3\.large|db\.r5\.large|db\.m5\.large)['"]?/g,
      costType: 'unoptimized-db',
      baseImpactScore: 0.6,
      costMultiplier: 100,
      description: 'Potentially oversized database instance',
      suggestion: 'Consider using read replicas, caching, or smaller instances with proper indexing',
    });

    // Pattern: Missing lifecycle policies
    this.patternRules.push({
      name: 'missing-lifecycle',
      pattern: /s3_bucket|storage_class/gi,
      costType: 'missing-lifecycle',
      baseImpactScore: 0.3,
      description: 'S3 bucket without lifecycle policy',
      suggestion: 'Implement lifecycle policies to move old data to cheaper storage tiers',
    });

    // Pattern: Unused resources
    this.patternRules.push({
      name: 'unused-resources',
      pattern: /tags\s*:\s*{\s*environment\s*:\s*['"]?dev['"]?/g,
      costType: 'unused-resources',
      baseImpactScore: 0.5,
      description: 'Development resources that may be left running',
      suggestion: 'Implement automated shutdown for development resources outside business hours',
    });

    // Pattern: Inefficient CDN caching
    this.patternRules.push({
      name: 'inefficient-cdn',
      pattern: /cache_behavior.*min_ttl\s*:\s*0/gi,
      costType: 'inefficient-cdn',
      baseImpactScore: 0.4,
      costMultiplier: 20,
      description: 'CDN with low TTL causing high origin requests',
      suggestion: 'Increase cache TTL for static assets to reduce origin load and CDN costs',
    });

    // Pattern: Lambda over-provisioning
    this.patternRules.push({
      name: 'lambda-overprovision',
      pattern: /memory_size\s*:\s*(1024|1536|2048|3008)/g,
      costType: 'lambda-overprovision',
      baseImpactScore: 0.5,
      costMultiplier: 0.0001,
      description: 'Lambda function with high memory allocation',
      suggestion: 'Monitor actual memory usage and reduce allocation if possible',
    });

    // Pattern: Missing cost monitoring
    this.patternRules.push({
      name: 'missing-cost-monitoring',
      pattern: /aws_cloudwatch|budgets/gi,
      costType: 'missing-cost-monitoring',
      baseImpactScore: 0.3,
      description: 'Infrastructure without cost monitoring or budgets',
      suggestion: 'Implement cost monitoring and budgets to track and control spending',
    });
  }

  /**
   * Analyzes a file for cost issues
   *
   * @param filePath - File path
   * @returns Promise<CostDetection[]> - Array of cost detections
   */
  async analyzeFile(filePath: string): Promise<CostDetection[]> {
    const detections: CostDetection[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const rule of this.patternRules) {
        let match: RegExpExecArray | null;
        const globalPattern = new RegExp(rule.pattern.source, rule.pattern.flags + 'g');
        
        while ((match = globalPattern.exec(content)) !== null) {
          const matchIndex = match.index;
          const lineNumber = content.slice(0, matchIndex).split('\n').length;
          
          const estimatedCost = rule.costMultiplier 
            ? rule.baseImpactScore * rule.costMultiplier 
            : undefined;
          
          detections.push({
            filePath,
            line: lineNumber,
            costType: rule.costType,
            impactScore: rule.baseImpactScore,
            estimatedCost,
            description: rule.description,
            suggestion: rule.suggestion,
          });
        }
      }

      // Sort by impact score (highest first)
      detections.sort((a, b) => b.impactScore - a.impactScore);

      return detections;
    } catch (error) {
      console.warn(`‘‹·¥©≈  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Analyzes multiple files for cost issues
   *
   * @param filePaths - Array of file paths
   * @returns Promise<CostDetection[]> - Array of cost detections
   */
  async analyzeFiles(filePaths: string[]): Promise<CostDetection[]> {
    const allDetections: CostDetection[] = [];

    for (const filePath of filePaths) {
      const detections = await this.analyzeFile(filePath);
      allDetections.push(...detections);
    }

    // Sort by impact score (highest first)
    allDetections.sort((a, b) => b.impactScore - a.impactScore);

    return allDetections;
  }

  /**
   * Registers a custom cost pattern rule
   *
   * @param rule - Cost pattern rule to register
   */
  registerPattern(rule: CostPatternRule): void {
    this.patternRules.push(rule);
  }

  /**
   * Gets all registered pattern rules
   *
   * @returns CostPatternRule[] - Array of pattern rules
   */
  getPatterns(): CostPatternRule[] {
    return [...this.patternRules];
  }

  /**
   * Generates a summary report of cost detections
   *
   * @param detections - Array of cost detections
   * @returns string - Summary report
   */
  generateSummary(detections: CostDetection[]): string {
    const totalDetections = detections.length;
    const highImpact = detections.filter(d => d.impactScore >= 0.7).length;
    const mediumImpact = detections.filter(d => d.impactScore >= 0.4 && d.impactScore < 0.7).length;
    const lowImpact = detections.filter(d => d.impactScore < 0.4).length;

    const totalEstimatedCost = detections.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);

    // Group by cost type
    const byType = new Map<string, number>();
    for (const detection of detections) {
      const count = byType.get(detection.costType) || 0;
      byType.set(detection.costType, count + 1);
    }

    let report = `Cloud Cost Detection Summary\n`;
    report += `============================\n`;
    report += `Total Issues: ${totalDetections}\n`;
    report += `High Impact: ${highImpact}\n`;
    report += `Medium Impact: ${mediumImpact}\n`;
    report += `Low Impact: ${lowImpact}\n`;
    if (totalEstimatedCost > 0) {
      report += `Estimated Monthly Savings: $${totalEstimatedCost.toFixed(2)}\n`;
    }
    report += `\n`;

    report += `By Cost Type:\n`;
    for (const [costType, count] of Array.from(byType).sort((a, b) => b[1] - a[1])) {
      report += `  ${costType}: ${count}\n`;
    }

    return report;
  }

  /**
   * Scans for infrastructure files
   *
   * @param projectRoot - Project root directory
   * @returns Promise<string[]> - Array of infrastructure file paths
   */
  async scanInfrastructureFiles(projectRoot: string): Promise<string[]> {
    const patterns = [
      '**/terraform/**/*.tf',
      '**/cloudformation/**/*.yaml',
      '**/cloudformation/**/*.yml',
      '**/cloudformation/**/*.json',
      '**/serverless.yml',
      '**/serverless.yaml',
      '**/pulumi/**/*.ts',
      '**/aws/**/*.ts',
      '**/aws/**/*.js',
      '**/azure/**/*.ts',
      '**/gcp/**/*.ts',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      try {
        const files = glob.sync(pattern, {
          cwd: projectRoot,
          absolute: true,
        });
        allFiles.push(...files);
      } catch (error) {
        // glob not available, skip
      }
    }

    return Array.from(new Set(allFiles));
  }
}
