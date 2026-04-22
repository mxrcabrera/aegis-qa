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
import { CloudCostDetection, type CostDetection } from '../lib/cloud-cost-detection.js';

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
    this.cloudCostDetection = new CloudCostDetection();
  }

  /**
   * Executes Phase 14: Cloud Cost Detection
   *
   * @returns Promise<Phase14Result> - Cloud cost detection result
   */
  async execute(): Promise<Phase14Result> {
    const startTime = Date.now();
    console.log('≠É∆¶ Phase 14: Cloud Cost Detection\n');

    try {
      const files = await this.cloudCostDetection.scanInfrastructureFiles(this.config.projectRoot);

      if (files.length === 0) {
        console.log('‘‹·¥©≈  No infrastructure files found for analysis\n');
        
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

      console.log(`≠ÉÙÈ Analyzing ${files.length} infrastructure files...\n`);

      const detections = await this.cloudCostDetection.analyzeFiles(files);

      const highImpactCount = detections.filter(d => d.impactScore >= 0.7).length;
      const mediumImpactCount = detections.filter(d => d.impactScore >= 0.4 && d.impactScore < 0.7).length;
      const estimatedSavings = detections.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);

      const result: Phase14Result = {
        success: true,
        detections,
        highImpactCount,
        mediumImpactCount,
        estimatedSavings,
        filesAnalyzed: files.length,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(14, result, this.config.currentState);
      await this.writePartialReport(result);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`‘£‡ Phase 14 Complete`);
      console.log(`  ≠ÉˆÏ Total detections: ${detections.length}`);
      console.log(`  ≠É‹ø High impact: ${highImpactCount}`);
      console.log(`  ‘‹·¥©≈  Medium impact: ${mediumImpactCount}`);
      console.log(`  ≠É∆¶ Estimated monthly savings: $${estimatedSavings.toFixed(2)}\n`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`‘ÿÓ Phase 14 failed: ${errorMessage}\n`);

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
   * Writes partial report for Phase 14
   *
   * @private
   * @param result - Phase 14 result
   */
  private async writePartialReport(result: Phase14Result): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      const summary = this.cloudCostDetection.generateSummary(result.detections);

      const reportContent = `
## Phase 14: Cloud Cost Detection - ‘£‡ PASSED
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

      console.log(`≠ÉÙÿ Partial report written: ${reportPath}`);
    } catch (error) {
      console.warn('‘‹·¥©≈  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}
