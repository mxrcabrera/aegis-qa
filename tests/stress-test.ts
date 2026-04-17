/**
 * Stress Test - Large Repository Testing
 *
 * Purpose: Tests Aegis QA performance and stability with large repositories
 * (1000+ files) to ensure it can handle enterprise-scale codebases.
 *
 * @module tests/stress-test
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { E2ETestSuite, type E2ETestResult } from './e2e-test-suite.js';

/**
 * Stress test configuration
 */
export interface StressTestConfig {
  /** Repository path */
  repoPath: string;
  /** Minimum file count to qualify as stress test */
  minFileCount: number;
  /** Maximum memory limit in MB */
  maxMemoryMB: number;
  /** Maximum execution time in milliseconds */
  maxExecutionTimeMs: number;
  /** Whether to generate synthetic test data if repo is too small */
  generateSynthetic?: boolean;
  /** Number of synthetic files to generate */
  syntheticFileCount?: number;
}

/**
 * Stress test metrics
 */
export interface StressTestMetrics {
  /** Total files processed */
  totalFiles: number;
  /** Files per second */
  filesPerSecond: number;
  /** Peak memory usage in MB */
  peakMemoryMB: number;
  /** Average memory usage in MB */
  avgMemoryMB: number;
  /** Memory growth rate (MB/min) */
  memoryGrowthRateMBPerMin: number;
  /** CPU usage percentage (if available) */
  cpuUsagePercent?: number;
  /** Disk I/O operations */
  diskIOOperations?: number;
}

/**
 * Stress Test - Large repository performance testing
 *
 * @class StressTest
 */
export class StressTest {
  private config: StressTestConfig;
  private memorySamples: number[] = [];

  constructor(config: StressTestConfig) {
    this.config = config;
  }

  /**
   * Runs stress test
   *
   * @returns Promise<{ result: E2ETestResult; metrics: StressTestMetrics }> - Test result and metrics
   */
  async run(): Promise<{ result: E2ETestResult; metrics: StressTestMetrics }> {
    console.log('🔥 Starting Stress Test');
    console.log(`📂 Repository: ${this.config.repoPath}`);
    console.log(`🎯 Minimum file count: ${this.config.minFileCount}`);
    console.log(`💾 Max memory: ${this.config.maxMemoryMB}MB`);
    console.log(`⏱️  Max execution time: ${(this.config.maxExecutionTimeMs / 1000 / 60).toFixed(1)}min\n`);

    const startTime = Date.now();
    let syntheticGenerated = false;

    try {
      // Check if repository meets stress test criteria
      const fileCount = await this.countFiles(this.config.repoPath);
      console.log(`📄 Total files: ${fileCount}`);

      if (fileCount < this.config.minFileCount) {
        console.warn(`⚠️  Repository has only ${fileCount} files (< ${this.config.minFileCount})`);

        if (this.config.generateSynthetic) {
          console.log(`🔨 Generating ${this.config.syntheticFileCount || 1000} synthetic files...`);
          await this.generateSyntheticFiles(
            this.config.repoPath,
            this.config.syntheticFileCount || this.config.minFileCount
          );
          syntheticGenerated = true;
          console.log(`✅ Synthetic files generated`);
        } else {
          console.log(`⚠️  Proceeding with current file count (stress test may not be representative)`);
        }
      }

      // Start memory monitoring
      this.startMemoryMonitoring();

      // Run E2E test
      const e2eSuite = new E2ETestSuite([
        {
          name: 'Stress Test',
          path: this.config.repoPath,
          size: 'large' as any,
          expectedFileCount: Math.max(fileCount, this.config.minFileCount),
          expectedTSFileCount: Math.floor(Math.max(fileCount, this.config.minFileCount) * 0.5),
        },
      ]);

      const results = await e2eSuite.runAllTests();
      const result = results[0];

      // Stop memory monitoring
      this.stopMemoryMonitoring();

      // Calculate metrics
      const metrics = this.calculateMetrics(startTime, result.executionTimeMs);

      // Validate constraints
      this.validateConstraints(result, metrics);

      // Clean up synthetic files if generated
      if (syntheticGenerated) {
        console.log(`🧹 Cleaning up synthetic files...`);
        await this.cleanupSyntheticFiles(this.config.repoPath);
        console.log(`✅ Cleanup complete`);
      }

      return { result, metrics };

    } catch (error) {
      this.stopMemoryMonitoring();

      // Clean up synthetic files if generated
      if (syntheticGenerated) {
        await this.cleanupSyntheticFiles(this.config.repoPath);
      }

      throw error;
    }
  }

  /**
   * Counts files in repository
   *
   * @private
   * @param repoPath - Repository path
   * @returns Promise<number> - File count
   */
  private async countFiles(repoPath: string): Promise<number> {
    let count = 0;

    const countDir = async (dir: string): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.aegis-cache') {
            await countDir(fullPath);
          }
        } else {
          count++;
        }
      }
    };

    await countDir(repoPath);
    return count;
  }

  /**
   * Generates synthetic test files
   *
   * @private
   * @param repoPath - Repository path
   * @param count - Number of files to generate
   * @returns Promise<void>
   */
  private async generateSyntheticFiles(repoPath: string, count: number): Promise<void> {
    const syntheticDir = path.join(repoPath, '.aegis-synthetic');
    
    if (!fs.existsSync(syntheticDir)) {
      await fs.promises.mkdir(syntheticDir, { recursive: true });
    }

    const batchSize = 100;
    const batches = Math.ceil(count / batchSize);

    for (let i = 0; i < batches; i++) {
      const batchStart = i * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);

      for (let j = batchStart; j < batchEnd; j++) {
        const filePath = path.join(syntheticDir, `synthetic-${j}.ts`);
        const content = this.generateSyntheticTSContent(j);
        await fs.promises.writeFile(filePath, content, 'utf-8');
      }

      console.log(`   Generated batch ${i + 1}/${batches} (${batchEnd}/${count} files)`);
    }
  }

  /**
   * Generates synthetic TypeScript file content
   *
   * @private
   * @param index - File index
   * @returns string - TypeScript file content
   */
  private generateSyntheticTSContent(index: number): string {
    return `
/**
 * Synthetic test file ${index}
 * Generated for stress testing
 */

interface SyntheticInterface${index} {
  id: number;
  name: string;
  value: number;
}

class SyntheticClass${index} implements SyntheticInterface${index} {
  id: number;
  name: string;
  value: number;

  constructor(id: number, name: string, value: number) {
    this.id = id;
    this.name = name;
    this.value = value;
  }

  calculate(): number {
    return this.id * this.value;
  }

  async fetchData(): Promise<SyntheticInterface${index}> {
    return {
      id: this.id,
      name: this.name,
      value: this.value,
    };
  }
}

export function syntheticFunction${index}(data: SyntheticInterface${index}): number {
  return data.id * data.value;
}

export const syntheticVariable${index}: SyntheticInterface${index} = {
  id: ${index},
  name: 'synthetic',
  value: ${index} * 100,
};
`;
  }

  /**
   * Cleans up synthetic test files
   *
   * @private
   * @param repoPath - Repository path
   * @returns Promise<void>
   */
  private async cleanupSyntheticFiles(repoPath: string): Promise<void> {
    const syntheticDir = path.join(repoPath, '.aegis-synthetic');

    if (fs.existsSync(syntheticDir)) {
      await fs.promises.rm(syntheticDir, { recursive: true, force: true });
    }
  }

  /**
   * Starts memory monitoring
   *
   * @private
   */
  private startMemoryMonitoring(): void {
    this.memorySamples = [];
    const interval = setInterval(() => {
      const memoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
      this.memorySamples.push(memoryMB);
    }, 1000);

    // Store interval ID for cleanup
    (this as any).memoryInterval = interval;
  }

  /**
   * Stops memory monitoring
   *
   * @private
   */
  private stopMemoryMonitoring(): void {
    const interval = (this as any).memoryInterval;
    if (interval) {
      clearInterval(interval);
      delete (this as any).memoryInterval;
    }
  }

  /**
   * Calculates stress test metrics
   *
   * @private
   * @param startTime - Test start time
   * @param executionTimeMs - Execution time in milliseconds
   * @returns StressTestMetrics - Calculated metrics
   */
  private calculateMetrics(startTime: number, executionTimeMs: number): StressTestMetrics {
    const totalFiles = this.config.syntheticFileCount || this.config.minFileCount;
    const executionTimeSec = executionTimeMs / 1000;
    const filesPerSecond = totalFiles / executionTimeSec;

    const peakMemoryMB = Math.max(...this.memorySamples);
    const avgMemoryMB = this.memorySamples.reduce((a, b) => a + b, 0) / this.memorySamples.length;

    // Calculate memory growth rate (MB/min)
    const memoryGrowthRateMBPerMin =
      this.memorySamples.length > 1
        ? ((this.memorySamples[this.memorySamples.length - 1] - this.memorySamples[0]) / this.memorySamples.length) * 60
        : 0;

    return {
      totalFiles,
      filesPerSecond,
      peakMemoryMB,
      avgMemoryMB,
      memoryGrowthRateMBPerMin,
    };
  }

  /**
   * Validates stress test constraints
   *
   * @private
   * @param result - E2E test result
   * @param metrics - Stress test metrics
   */
  private validateConstraints(result: E2ETestResult, metrics: StressTestMetrics): void {
    console.log('\n🔍 Validating constraints...');

    // Check memory constraint
    if (metrics.peakMemoryMB > this.config.maxMemoryMB) {
      console.warn(`⚠️  Memory constraint violated: ${metrics.peakMemoryMB.toFixed(2)}MB > ${this.config.maxMemoryMB}MB`);
    } else {
      console.log(`✅ Memory constraint satisfied: ${metrics.peakMemoryMB.toFixed(2)}MB ≤ ${this.config.maxMemoryMB}MB`);
    }

    // Check execution time constraint
    if (result.executionTimeMs > this.config.maxExecutionTimeMs) {
      console.warn(`⚠️  Execution time constraint violated: ${(result.executionTimeMs / 1000 / 60).toFixed(1)}min > ${(this.config.maxExecutionTimeMs / 1000 / 60).toFixed(1)}min`);
    } else {
      console.log(`✅ Execution time constraint satisfied: ${(result.executionTimeMs / 1000).toFixed(2)}s ≤ ${(this.config.maxExecutionTimeMs / 1000).toFixed(2)}s`);
    }

    // Check memory growth rate
    if (metrics.memoryGrowthRateMBPerMin > 100) {
      console.warn(`⚠️  High memory growth rate: ${metrics.memoryGrowthRateMBPerMin.toFixed(2)}MB/min`);
    } else {
      console.log(`✅ Memory growth rate acceptable: ${metrics.memoryGrowthRateMBPerMin.toFixed(2)}MB/min`);
    }

    console.log(`\n📊 Performance Metrics:`);
    console.log(`   Files processed: ${metrics.totalFiles}`);
    console.log(`   Processing rate: ${metrics.filesPerSecond.toFixed(2)} files/sec`);
    console.log(`   Peak memory: ${metrics.peakMemoryMB.toFixed(2)}MB`);
    console.log(`   Average memory: ${metrics.avgMemoryMB.toFixed(2)}MB`);
    console.log(`   Memory growth: ${metrics.memoryGrowthRateMBPerMin.toFixed(2)}MB/min\n`);
  }

  /**
   * Generates stress test report
   *
   * @param result - E2E test result
   * @param metrics - Stress test metrics
   * @returns string - Report in markdown format
   */
  generateReport(result: E2ETestResult, metrics: StressTestMetrics): string {
    const timestamp = new Date().toISOString();

    let report = `# Stress Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `## Configuration\n\n`;
    report += `- **Repository:** ${this.config.repoPath}\n`;
    report += `- **Min file count:** ${this.config.minFileCount}\n`;
    report += `- **Max memory:** ${this.config.maxMemoryMB}MB\n`;
    report += `- **Max execution time:** ${(this.config.maxExecutionTimeMs / 1000 / 60).toFixed(1)}min\n\n`;

    report += `## Results\n\n`;
    report += `- **Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Execution time:** ${(result.executionTimeMs / 1000).toFixed(2)}s\n`;
    report += `- **Total findings:** ${result.totalFindings}\n`;
    report += `- **Phases completed:** ${result.phasesCompleted}\n\n`;

    report += `## Performance Metrics\n\n`;
    report += `- **Files processed:** ${metrics.totalFiles}\n`;
    report += `- **Processing rate:** ${metrics.filesPerSecond.toFixed(2)} files/sec\n`;
    report += `- **Peak memory:** ${metrics.peakMemoryMB.toFixed(2)}MB\n`;
    report += `- **Average memory:** ${metrics.avgMemoryMB.toFixed(2)}MB\n`;
    report += `- **Memory growth rate:** ${metrics.memoryGrowthRateMBPerMin.toFixed(2)}MB/min\n\n`;

    if (result.error) {
      report += `## Error\n\n`;
      report += `\`\`\`\n${result.error}\n\`\`\`\n\n`;
    }

    return report;
  }
}
