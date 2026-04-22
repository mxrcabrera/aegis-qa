// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 14: Cloud Cost Detection
 *
 * Purpose: Analyzes infrastructure code to detect potential cost issues and optimization opportunities.
 * Uses the CloudCostDetection class to identify cost-inefficient patterns.
 *
 * Architecture:
 * - Resource Analysis: Identifies resource-intensive code patterns
 * - Cost Scoring: Assigns cost impact scores to infrastructure configurations
 * - Optimization Suggestions: Provides cost optimization recommendations
 * - Integration with lib/cloud-cost-detection.ts
 *
 * @module phases/phase-14-cloud-cost
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
import { CloudCostDetection, type CostIssue as CostDetection } from '../modules/cloud-cost-detection.js';

/**
 * Phase 14 result
 */
export interface Phase14Result {
  /** Overall success */
  success: boolean;
  /** Cost detections */
  detections: CostDetection[];
  /** Total high impact detections */
  highImpactCount: number;
  /** Total medium impact detections */
  mediumImpactCount: number;
  /** Total estimated monthly savings */
  estimatedSavings: number;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 14 configuration
 */
interface Phase14Config {
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
 * Phase 14: Cloud Cost Detection
 *
 * Analyzes infrastructure code to detect potential cost issues and optimization opportunities.
 * Uses the CloudCostDetection class to identify cost-inefficient patterns.
 *
 * @class Phase14CloudCost
 */
export class Phase14CloudCost {
  private config: Phase14Config;
  private cloudCostDetection: CloudCostDetection;

  constructor(config: Phase14Config) {
    this.config = config;
    this.cloudCostDetection = new CloudCostDetection(this.config.projectRoot);
  }

  /**
   * Executes Phase 14: Cloud Cost Detection
   *
   * @returns Promise<Phase14Result> - Cloud cost detection result
   */
  async execute(): Promise<Phase14Result> {
    const startTime = Date.now();
    console.log('��Ʀ Phase 14: Cloud Cost Detection\n');

    try {
      const files = await this.scanInfrastructureFiles();

      if (files.length === 0) {
        console.log('��ᴩ�  No infrastructure files found for analysis\n');
        
        const result: Phase14Result = {
          success: true,
          detections: [],
          highImpactCount: 0,
          mediumImpactCount: 0,
          estimatedSavings: 0,
          filesAnalyzed: 0,
          executionTimeMs: Date.now() - startTime,
        };

        await this.config.statePersistence.storeAnalysisResults(14, result, this.config.currentState);
        await this.writePartialReport(result);
        await this.config.statePersistence.saveState(this.config.currentState);

        return result;
      }

      console.log(`���� Analyzing ${files.length} infrastructure files...\n`);

      const cloudResult = await this.cloudCostDetection.detect();
      const detections = cloudResult.issues;

      const highImpactCount = detections.filter(d => d.severity === 'critical' || d.severity === 'high').length;
      const mediumImpactCount = detections.filter(d => d.severity === 'medium').length;
      const estimatedSavings = detections.reduce((sum, d) => {
        const savings = parseFloat(d.estimatedSavings.replace(/[^0-9.]/g, '')) || 0;
        return sum + savings;
      }, 0);

      const phase14Result: Phase14Result = {
        success: true,
        detections,
        highImpactCount,
        mediumImpactCount,
        estimatedSavings,
        filesAnalyzed: files.length,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(14, phase14Result, this.config.currentState);
      await this.writePartialReport(phase14Result);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`ԣ� Phase 14 Complete`);
      console.log(`  ���� Total detections: ${detections.length}`);
      console.log(`  ��ܿ High impact: ${highImpactCount}`);
      console.log(`  ��ᴩ�  Medium impact: ${mediumImpactCount}`);
      console.log(`  ��Ʀ Estimated monthly savings: $${estimatedSavings.toFixed(2)}\n`);

      return phase14Result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`��� Phase 14 failed: ${errorMessage}\n`);

      const result: Phase14Result = {
        success: false,
        detections: [],
        highImpactCount: 0,
        mediumImpactCount: 0,
        estimatedSavings: 0,
        filesAnalyzed: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Scans for infrastructure files
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async scanInfrastructureFiles(): Promise<string[]> {
    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });

    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx',
      'infrastructure/**/*.ts',
      'infrastructure/**/*.js',
      'terraform/**/*.tf',
      'cloudformation/**/*.yml',
      'cloudformation/**/*.yaml',
      'k8s/**/*.yml',
      'k8s/**/*.yaml',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      try {
        const { glob } = await import('glob');
        const files = await glob(pattern, {
          cwd: this.config.projectRoot,
          absolute: true,
        });

        for (const file of files) {
          if (ignoreHandler.shouldIgnore(file)) {
            continue;
          }

          const filterResult = fileFilter.shouldAnalyzeFile(file);
          if (filterResult.shouldAnalyze) {
            allFiles.push(file);
          }
        }
      } catch {
        // glob not available, skip
      }
    }

    return Array.from(new Set(allFiles));
  }

  /**
   * Generates summary of detections
   *
   * @private
   * @param detections - Array of cost detections
   * @returns string - Formatted summary
   */
  private generateSummary(detections: CostDetection[]): string {
    if (detections.length === 0) {
      return 'No cost issues found.\n';
    }

    let summary = '';

    // Group by type
    const byType = new Map<string, CostDetection[]>();
    for (const d of detections) {
      if (!byType.has(d.type)) {
        byType.set(d.type, []);
      }
      byType.get(d.type)!.push(d);
    }

    for (const [type, items] of byType) {
      summary += `\n### ${type} (${items.length})\n`;
      for (const item of items.slice(0, 5)) { // Show top 5 per type
        summary += `- ${item.file}:${item.line} - ${item.description} (Savings: ${item.estimatedSavings})\n`;
      }
      if (items.length > 5) {
        summary += `  ... and ${items.length - 5} more\n`;
      }
    }

    return summary;
  }

  /**
   * Writes partial report for Phase 14
   *
   * @private
   * @param result - Phase 14 result
   */
  private async writePartialReport(result: Phase14Result): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      const summary = this.generateSummary(result.detections);

      const reportContent = `
## Phase 14: Cloud Cost Detection - ԣ� PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms

### Cloud Cost Detection Summary
- **Total Detections:** ${result.detections.length}
- **High Impact:** ${result.highImpactCount}
- **Medium Impact:** ${result.mediumImpactCount}
- **Estimated Monthly Savings:** $${result.estimatedSavings.toFixed(2)}
- **Files Analyzed:** ${result.filesAnalyzed}

### Detailed Report
${summary}

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













