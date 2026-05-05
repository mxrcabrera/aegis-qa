// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 13: Predictive Bugs
 *
 * Purpose: Analyzes code patterns to predict potential bugs before they occur.
 * Uses the PredictiveBugDetection class to identify high-risk code areas.
 *
 * Architecture:
 * - Pattern Analysis: Identifies bug-prone code patterns
 * - Risk Scoring: Assigns risk scores to code sections
 * - Prediction: Predicts likelihood of bugs in new code
 * - Integration with lib/predictive-bug-detection.ts
 *
 * @module phases/phase-13-predictive-bugs
 * @since 2.0.0
 */
import * as fs from 'fs';
import * as path from 'path';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
import { PredictiveBugDetection } from '../lib/predictive-bug-detection.js';
/**
 * Phase 13: Predictive Bugs
 *
 * Analyzes code patterns to predict potential bugs before they occur.
 * Uses the PredictiveBugDetection class to identify high-risk code areas.
 *
 * @class Phase13PredictiveBugs
 */
export class Phase13PredictiveBugs {
    config;
    predictiveBugDetection;
    constructor(config) {
        this.config = config;
        this.predictiveBugDetection = new PredictiveBugDetection();
    }
    /**
     * Executes Phase 13: Predictive Bugs
     *
     * @returns Promise<Phase13Result> - Predictive bugs analysis result
     */
    async execute() {
        const startTime = Date.now();
        console.log('���� Phase 13: Predictive Bugs\n');
        try {
            const files = await this.scanSourceFiles();
            if (files.length === 0) {
                console.log('��ᴩ�  No source files found for analysis\n');
                const result = {
                    success: true,
                    predictions: [],
                    highRiskCount: 0,
                    mediumRiskCount: 0,
                    filesAnalyzed: 0,
                    executionTimeMs: Date.now() - startTime,
                };
                await this.config.statePersistence.storeAnalysisResults(13, result, this.config.currentState);
                await this.writePartialReport(result);
                await this.config.statePersistence.saveState(this.config.currentState);
                return result;
            }
            console.log(`���� Analyzing ${files.length} source files...\n`);
            const predictions = await this.predictiveBugDetection.analyzeFiles(files);
            const highRiskCount = predictions.filter((p) => p.riskScore >= 0.7).length;
            const mediumRiskCount = predictions.filter((p) => p.riskScore >= 0.4 && p.riskScore < 0.7).length;
            const result = {
                success: true,
                predictions,
                highRiskCount,
                mediumRiskCount,
                filesAnalyzed: files.length,
                executionTimeMs: Date.now() - startTime,
            };
            await this.config.statePersistence.storeAnalysisResults(13, result, this.config.currentState);
            await this.writePartialReport(result);
            await this.config.statePersistence.saveState(this.config.currentState);
            console.log(`ԣ� Phase 13 Complete`);
            console.log(`  ���� Total predictions: ${predictions.length}`);
            console.log(`  ��ܿ High risk: ${highRiskCount}`);
            console.log(`  ��ᴩ�  Medium risk: ${mediumRiskCount}\n`);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`��� Phase 13 failed: ${errorMessage}\n`);
            const result = {
                success: false,
                predictions: [],
                highRiskCount: 0,
                mediumRiskCount: 0,
                filesAnalyzed: 0,
                executionTimeMs: Date.now() - startTime,
                error: errorMessage,
            };
            return result;
        }
    }
    /**
     * Scans for source files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    async scanSourceFiles() {
        const fileFilter = this.config.fileFilter || new FileFilter();
        const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });
        const patterns = [
            'src/**/*.ts',
            'src/**/*.tsx',
            'src/**/*.js',
            'src/**/*.jsx',
            'lib/**/*.ts',
            'lib/**/*.js',
        ];
        const allFiles = [];
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
                    // Skip test files, mocks, seeds
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
            catch {
                // glob not available, skip
            }
        }
        return Array.from(new Set(allFiles));
    }
    /**
     * Writes partial report for Phase 13
     *
     * @private
     * @param result - Phase 13 result
     */
    async writePartialReport(result) {
        try {
            const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
            const timestamp = new Date().toISOString();
            const summary = this.predictiveBugDetection.generateSummary(result.predictions);
            const reportContent = `
## Phase 13: Predictive Bugs - ԣ� PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms

### Predictive Bugs Summary
- **Total Predictions:** ${result.predictions.length}
- **High Risk:** ${result.highRiskCount}
- **Medium Risk:** ${result.mediumRiskCount}
- **Files Analyzed:** ${result.filesAnalyzed}

### Detailed Report
${summary}

---

`;
            // Append to partial report
            if (fs.existsSync(reportPath)) {
                fs.appendFileSync(reportPath, reportContent, 'utf-8');
            }
            else {
                // Create new partial report with header
                const header = `# Aegis QA - Partial Report
Generated: ${timestamp}

`;
                fs.writeFileSync(reportPath, header + reportContent, 'utf-8');
            }
            console.log(`���� Partial report written: ${reportPath}`);
        }
        catch (error) {
            console.warn('��ᴩ�  Failed to write partial report:', error instanceof Error ? error.message : error);
        }
    }
}
//# sourceMappingURL=phase-13b-predictive-bugs.js.map