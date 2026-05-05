/**
 * Phase 1: Code Quality - Technical Health Assessment
 *
 * Purpose: Evaluate the technical health of the code by detecting code smells,
 * complexity issues, and naming inconsistencies. This is about finding code that will
 * be difficult to maintain, not just syntax errors.
 *
 * Architecture:
 * - Cyclomatic Complexity: Detect functions too long or too nested
 * - Linter-like Rules: Find inconsistencies, unused variables, unnecessary any
 * - Naming Consistency: Check camelCase, PascalCase patterns
 * - Scoring System: Each file gets a quality score (0-100)
 * - Integration with BatchProcessor for thermal-safe processing
 *
 * @module phases/phase-1-code-quality
 * @since 2.0.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BatchProcessor } from '../processing/batch-processor.js';
import { runWithFileTimeout } from '../core/file-timeout.js';
/**
 * Phase 1: Code Quality - Technical Health Assessment
 *
 * This phase evaluates the technical health of the code by detecting code smells,
 * complexity issues, and naming inconsistencies.
 *
 * @class Phase1CodeQuality
 * @example
 * ```typescript
 * const phase1 = new Phase1CodeQuality({
 *   projectRoot: '/path/to/project',
 *   thermalController: new ThermalController(),
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   fileFilter: new FileFilter(),
 *   ignoreHandler: new IgnoreHandler({ projectRoot: '/path/to/project' }),
 *   currentState: executionState,
 * });
 * const result = await phase1.execute();
 * ```
 */
export class Phase1CodeQuality {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Executes Phase 1: Code Quality
     *
     * @returns Promise<Phase1Result> - Code quality assessment result
     */
    async execute() {
        const startTime = Date.now();
        console.log('­ƒöì Phase 1: Code Quality - Technical Health Assessment\n');
        try {
            // Get all TypeScript/JavaScript files
            const files = await this.getSourceFiles();
            console.log(`  Found ${files.length} files to analyze\n`);
            if (files.length === 0) {
                return {
                    success: true,
                    totalFiles: 0,
                    fileScores: [],
                    totalFindings: 0,
                    criticalFiles: [],
                    averageScore: 100,
                    executionTimeMs: Date.now() - startTime,
                };
            }
            // Get critical modules from Phase 2 business profile if available
            const phase2Results = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
            const criticalModules = phase2Results?.criticalModules || [];
            // Create batch processor for thermal-safe processing with smart scoping
            const batchProcessor = new BatchProcessor({
                projectRoot: this.config.projectRoot,
                thermalController: this.config.thermalController,
                statePersistence: this.config.statePersistence,
                recommendedBatchSize: 20,
                recommendedCooldown: 5000,
                applyCooldowns: true,
                criticalModules,
            });
            // Process files in batches
            const fileScores = [];
            const allFindings = [];
            await batchProcessor.processFiles(files, async (filePath) => {
                const result = await this.analyzeFile(filePath);
                fileScores.push(result);
                allFindings.push(...result.findings);
                return {
                    filePath,
                    success: true,
                    processingTimeMs: 0,
                    findings: result.findings,
                };
            }, this.config.currentState);
            // Calculate statistics
            const criticalFiles = fileScores.filter(f => f.isCritical).map(f => f.filePath);
            const averageScore = fileScores.reduce((sum, f) => sum + f.score, 0) / fileScores.length;
            // Write partial report
            await this.writePartialReport(fileScores, allFindings, averageScore, criticalFiles);
            // Store Phase 1 results in StatePersistence for shared context
            await this.config.statePersistence.storeAnalysisResults(1, {
                fileScores,
                totalFindings: allFindings.length,
                criticalFiles,
                averageScore,
            }, this.config.currentState);
            const executionTimeMs = Date.now() - startTime;
            console.log(`\nÔ£à Phase 1 Complete`);
            console.log(`  ­ƒôè Files analyzed: ${fileScores.length}`);
            console.log(`  ­ƒöì Total findings: ${allFindings.length}`);
            console.log(`  ÔÜá´©Å  Critical files: ${criticalFiles.length}`);
            console.log(`  ­ƒôê Average quality score: ${averageScore.toFixed(1)}/100\n`);
            return {
                success: true,
                totalFiles: fileScores.length,
                fileScores,
                totalFindings: allFindings.length,
                criticalFiles,
                averageScore,
                executionTimeMs,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`ÔØî Phase 1 failed: ${errorMessage}\n`);
            return {
                success: false,
                totalFiles: 0,
                fileScores: [],
                totalFindings: 0,
                criticalFiles: [],
                averageScore: 0,
                executionTimeMs: Date.now() - startTime,
                error: errorMessage,
            };
        }
    }
    /**
     * Gets all TypeScript/JavaScript source files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    async getSourceFiles() {
        const { glob } = await import('glob');
        const patterns = [
            'src/**/*.ts',
            'src/**/*.tsx',
            'src/**/*.js',
            'src/**/*.jsx',
            'app/**/*.ts',
            'app/**/*.tsx',
            'lib/**/*.ts',
            'lib/**/*.tsx',
            'components/**/*.ts',
            'components/**/*.tsx',
        ];
        const allFiles = [];
        for (const pattern of patterns) {
            const files = await glob(pattern, {
                cwd: this.config.projectRoot,
                absolute: true,
            });
            allFiles.push(...files);
        }
        // Filter out ignored files and large files
        const filtered = allFiles.filter(file => {
            if (this.config.ignoreHandler.shouldIgnore(file)) {
                return false;
            }
            const filterResult = this.config.fileFilter.shouldAnalyzeFile(file);
            return filterResult.shouldAnalyze;
        });
        // Remove duplicates
        return Array.from(new Set(filtered));
    }
    /**
     * Computes SHA-1 hash of file content
     *
     * @private
     * @param content - File content
     * @returns string - SHA-1 hash
     */
    computeHash(content) {
        return crypto.createHash('sha1').update(content).digest('hex');
    }
    /**
     * Generates unique ID for a finding
     *
     * @private
     * @param fileHash - SHA-1 hash of file content
     * @param line - Line number
     * @param type - Finding type
     * @returns string - Unique ID
     */
    generateFindingId(fileHash, line, type) {
        const lineStr = line !== undefined ? line.toString() : '0';
        return `${fileHash.substring(0, 8)}-${lineStr}-${type}`;
    }
    /**
     * Analyzes a single file for code quality issues
     *
     * @private
     * @param filePath - File path
     * @returns Promise<FileQualityScore> - File quality score
     */
    async analyzeFile(filePath) {
        const timeoutMs = this.config.fileTimeoutMs ?? 60000;
        const timeoutConfig = { timeoutMs };
        const result = await runWithFileTimeout(async () => this.analyzeFileInternal(filePath), filePath, timeoutConfig);
        if (result.isTimeout) {
            // Return a timeout result
            return {
                filePath,
                score: 0,
                findings: [{
                        id: 'timeout-' + Date.now(),
                        type: 'inconsistency',
                        severity: 'low',
                        filePath,
                        description: `File analysis timed out after ${timeoutMs}ms. File may be too large or complex to analyze.`,
                    }],
                isCritical: true,
            };
        }
        if (!result.success) {
            // Return an error result
            return {
                filePath,
                score: 0,
                findings: [{
                        id: 'error-' + Date.now(),
                        type: 'inconsistency',
                        severity: 'high',
                        filePath,
                        description: `Failed to analyze file: ${result.error}`,
                    }],
                isCritical: true,
            };
        }
        return result.result;
    }
    /**
     * Internal file analysis without timeout wrapper
     *
     * @private
     * @param filePath - File path
     * @returns Promise<FileQualityScore> - File quality score
     */
    async analyzeFileInternal(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const fileHash = this.computeHash(content);
            // Check cache - if file hasn't changed, return cached result
            const cachedResult = this.config.statePersistence.getFileHash(filePath, this.config.currentState);
            if (cachedResult && cachedResult.hash === fileHash) {
                console.log(`  ­ƒôª Cache hit for ${filePath} (unchanged)`);
                // Return cached score with empty findings (will be loaded from state if needed)
                return {
                    filePath,
                    score: cachedResult.score,
                    findings: [],
                    isCritical: cachedResult.score < 50,
                };
            }
            const findings = [];
            // 1. Cyclomatic Complexity
            const complexityFindings = this.analyzeComplexity(content, filePath, fileHash);
            findings.push(...complexityFindings);
            // 2. Linter-like Rules
            const linterFindings = this.analyzeLinterRules(content, filePath, fileHash);
            findings.push(...linterFindings);
            // 3. Naming Consistency
            const namingFindings = this.analyzeNamingConsistency(content, filePath, fileHash);
            findings.push(...namingFindings);
            // Calculate quality score
            const score = this.calculateQualityScore(findings);
            // Store hash in cache
            await this.config.statePersistence.storeFileHash(filePath, fileHash, score, this.config.currentState);
            return {
                filePath,
                score,
                findings,
                isCritical: score < 50, // Files with score < 50 are critical
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`  ÔÜá´©Å  Failed to analyze ${filePath}: ${errorMessage}`);
            return {
                filePath,
                score: 0,
                findings: [{
                        id: 'error-' + Date.now(),
                        type: 'inconsistency',
                        severity: 'high',
                        filePath,
                        description: `Failed to analyze file: ${errorMessage}`,
                    }],
                isCritical: true,
            };
        }
    }
    /**
     * Analyzes cyclomatic complexity
     *
     * @private
     * @param content - File content
     * @param filePath - File path
     * @param fileHash - SHA-1 hash of file content
     * @returns CodeQualityFinding[] - Complexity findings
     */
    analyzeComplexity(content, filePath, fileHash) {
        const findings = [];
        const maxFunctionLength = this.config.maxFunctionLength || 50;
        const maxNestingDepth = this.config.maxNestingDepth || 4;
        // Find function definitions
        const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|(?:class\s+\w+\s*\{))/g;
        const matches = content.matchAll(functionPattern);
        for (const match of matches) {
            const functionName = match[1] || match[2] || 'anonymous';
            const startIndex = match.index;
            // Find function body
            let braceCount = 0;
            let bodyStart = -1;
            let bodyEnd = -1;
            for (let i = startIndex; i < content.length; i++) {
                if (content[i] === '{') {
                    braceCount++;
                    if (bodyStart === -1)
                        bodyStart = i;
                }
                else if (content[i] === '}') {
                    braceCount--;
                    if (braceCount === 0 && bodyStart !== -1) {
                        bodyEnd = i;
                        break;
                    }
                }
            }
            if (bodyStart !== -1 && bodyEnd !== -1) {
                const functionBody = content.slice(bodyStart, bodyEnd);
                const functionLines = functionBody.split('\n').length;
                // Check function length
                if (functionLines > maxFunctionLength) {
                    findings.push({
                        id: this.generateFindingId(fileHash, startIndex, 'complexity-length'),
                        type: 'complexity',
                        severity: functionLines > maxFunctionLength * 2 ? 'critical' : 'high',
                        filePath,
                        description: `Function '${functionName}' is too long (${functionLines} lines, max: ${maxFunctionLength})`,
                        suggestion: 'Consider breaking this function into smaller, more focused functions.',
                    });
                }
                // Check nesting depth
                const maxDepth = this.calculateNestingDepth(functionBody);
                if (maxDepth > maxNestingDepth) {
                    findings.push({
                        id: this.generateFindingId(fileHash, startIndex, 'complexity-nesting'),
                        type: 'complexity',
                        severity: maxDepth > maxNestingDepth * 2 ? 'critical' : 'high',
                        filePath,
                        description: `Function '${functionName}' has excessive nesting (depth: ${maxDepth}, max: ${maxNestingDepth})`,
                        suggestion: 'Consider flattening the control structure by extracting nested logic into separate functions.',
                    });
                }
            }
        }
        return findings;
    }
    /**
     * Calculates maximum nesting depth in code
     *
     * @private
     * @param code - Code to analyze
     * @returns number - Maximum nesting depth
     */
    calculateNestingDepth(code) {
        let maxDepth = 0;
        let currentDepth = 0;
        for (const char of code) {
            if (char === '{' || char === '(') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            }
            else if (char === '}' || char === ')') {
                currentDepth--;
            }
        }
        return maxDepth;
    }
    /**
     * Analyzes linter-like rules
     *
     * @private
     * @param content - File content
     * @param filePath - File path
     * @param fileHash - SHA-1 hash of file content
     * @returns CodeQualityFinding[] - Linter findings
     */
    analyzeLinterRules(content, filePath, fileHash) {
        const findings = [];
        // Check for unnecessary 'any' types
        const anyPattern = /:\s*any\b/g;
        let anyMatch;
        while ((anyMatch = anyPattern.exec(content)) !== null) {
            const lineNumber = content.slice(0, anyMatch.index).split('\n').length;
            findings.push({
                id: this.generateFindingId(fileHash, lineNumber, 'any'),
                type: 'any',
                severity: 'medium',
                filePath,
                line: lineNumber,
                description: 'Unnecessary use of "any" type',
                suggestion: 'Use specific types instead of "any" for better type safety.',
            });
        }
        // Check for unused variables (basic heuristic)
        const varPattern = /(?:const|let|var)\s+(\w+)/g;
        let varMatch;
        const declaredVars = [];
        while ((varMatch = varPattern.exec(content)) !== null) {
            declaredVars.push(varMatch[1]);
        }
        // Check if declared variables are used (very basic check)
        for (const varName of declaredVars) {
            // Skip common patterns
            if (varName === 'i' || varName === 'j' || varName === 'k' || varName === 'index') {
                continue;
            }
            const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
            const matches = content.match(usagePattern);
            // If variable appears only once (declaration), it might be unused
            if (matches && matches.length === 1) {
                const lineNumber = content.indexOf(varName);
                const lineNum = content.slice(0, lineNumber).split('\n').length;
                findings.push({
                    id: this.generateFindingId(fileHash, lineNum, 'unused'),
                    type: 'unused',
                    severity: 'low',
                    filePath,
                    line: lineNum,
                    description: `Variable '${varName}' might be unused`,
                    suggestion: 'Remove unused variables or verify their usage.',
                });
            }
        }
        // Check for console.log statements (should be removed in production)
        const consolePattern = /console\.(log|warn|error|info|debug)/g;
        let consoleMatch;
        while ((consoleMatch = consolePattern.exec(content)) !== null) {
            const lineNumber = content.slice(0, consoleMatch.index).split('\n').length;
            findings.push({
                id: this.generateFindingId(fileHash, lineNumber, 'console'),
                type: 'inconsistency',
                severity: 'low',
                filePath,
                line: lineNumber,
                description: `Console statement found (${consoleMatch[1]})`,
                suggestion: 'Remove console statements before production deployment.',
            });
        }
        return findings;
    }
    /**
     * Analyzes naming consistency
     *
     * @private
     * @param content - File content
     * @param filePath - File path
     * @param fileHash - SHA-1 hash of file content
     * @returns CodeQualityFinding[] - Naming findings
     */
    analyzeNamingConsistency(content, filePath, fileHash) {
        const findings = [];
        // Check for camelCase violations in variables
        const varPattern = /(?:const|let|var)\s+([a-z][a-zA-Z0-9]*)/g;
        let varMatch;
        while ((varMatch = varPattern.exec(content)) !== null) {
            const varName = varMatch[1];
            // Check for snake_case in variables (should be camelCase)
            if (varName.includes('_')) {
                const lineNumber = content.slice(0, varMatch.index).split('\n').length;
                findings.push({
                    id: this.generateFindingId(fileHash, lineNumber, 'naming-snake'),
                    type: 'naming',
                    severity: 'medium',
                    filePath,
                    line: lineNumber,
                    description: `Variable '${varName}' uses snake_case instead of camelCase`,
                    suggestion: 'Use camelCase for variable names in JavaScript/TypeScript.',
                });
            }
        }
        // Check for PascalCase in functions (should be camelCase)
        const functionPattern = /function\s+([A-Z][a-zA-Z0-9]*)/g;
        let functionMatch;
        while ((functionMatch = functionPattern.exec(content)) !== null) {
            const functionName = functionMatch[1];
            const lineNumber = content.slice(0, functionMatch.index).split('\n').length;
            findings.push({
                id: this.generateFindingId(fileHash, lineNumber, 'naming-pascal'),
                type: 'naming',
                severity: 'medium',
                filePath,
                line: lineNumber,
                description: `Function '${functionName}' uses PascalCase instead of camelCase`,
                suggestion: 'Use camelCase for function names in JavaScript/TypeScript.',
            });
        }
        return findings;
    }
    /**
     * Calculates quality score from findings
     *
     * @private
     * @param findings - Code quality findings
     * @returns number - Quality score (0-100)
     */
    calculateQualityScore(findings) {
        let score = 100;
        for (const finding of findings) {
            switch (finding.severity) {
                case 'critical':
                    score -= 25;
                    break;
                case 'high':
                    score -= 15;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        }
        return Math.max(0, score);
    }
    /**
     * Writes partial report with unique IDs for findings
     *
     * @private
     * @param fileScores - File quality scores
     * @param allFindings - All findings
     * @param averageScore - Average quality score
     * @param criticalFiles - Critical files
     */
    async writePartialReport(fileScores, allFindings, averageScore, criticalFiles) {
        try {
            const reportPath = `${this.config.projectRoot}/qa-report.partial.md`;
            const timestamp = new Date().toISOString();
            // Group findings by file for cleaner report
            const findingsByFile = new Map();
            for (const finding of allFindings) {
                if (!findingsByFile.has(finding.filePath)) {
                    findingsByFile.set(finding.filePath, []);
                }
                findingsByFile.get(finding.filePath).push(finding);
            }
            let findingsContent = '';
            for (const [filePath, findings] of findingsByFile) {
                findingsContent += `
### ${path.basename(filePath)}
`;
                for (const finding of findings) {
                    findingsContent += `- [${finding.id}] **${finding.type}** (${finding.severity}): ${finding.description}`;
                    if (finding.line) {
                        findingsContent += ` (line ${finding.line})`;
                    }
                    findingsContent += '\n';
                }
            }
            const reportContent = `
## Phase 1: Code Quality - Ô£à PASSED
- **Timestamp:** ${timestamp}
- **Files analyzed:** ${fileScores.length}
- **Total findings:** ${allFindings.length}
- **Critical files:** ${criticalFiles.length}
- **Average quality score:** ${averageScore.toFixed(1)}/100

### Critical Files (Low Score)
${criticalFiles.length > 0 ? criticalFiles.map(f => `- ${f}`).join('\n') : 'None'}

### Findings by File
${findingsContent}
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
            console.log(`  ­ƒôØ Partial report updated: ${reportPath}`);
        }
        catch (error) {
            console.warn('  ÔÜá´©Å  Failed to write partial report:', error instanceof Error ? error.message : error);
        }
    }
}
//# sourceMappingURL=phase-1-code-quality.js.map