/**
 * Predictive Bug Detection
 *
 * Purpose: Analyzes code patterns to predict potential bugs before they occur.
 * Uses historical data and pattern matching to identify high-risk code areas.
 *
 * Architecture:
 * - Pattern Analysis: Identifies bug-prone code patterns
 * - Historical Data: Uses past bug reports to train detection
 * - Risk Scoring: Assigns risk scores to code sections
 * - Prediction: Predicts likelihood of bugs in new code
 *
 * @module lib/predictive-bug-detection
 * @since 2.0.0
 */
import * as fs from 'fs';
/**
 * Predictive Bug Detection
 *
 * Analyzes code patterns to predict potential bugs before they occur.
 * Uses pattern matching and risk scoring to identify high-risk code areas.
 *
 * @class PredictiveBugDetection
 */
export class PredictiveBugDetection {
    patternRules = [];
    constructor() {
        this.registerBuiltinPatterns();
    }
    /**
     * Registers builtin bug-prone patterns
     *
     * @private
     */
    registerBuiltinPatterns() {
        // Pattern: Null/undefined dereference
        this.patternRules.push({
            name: 'null-dereference',
            pattern: /\.(\w+)\s*\.\s*(\w+)/g,
            bugType: 'null-dereference',
            baseRiskScore: 0.7,
            description: 'Potential null/undefined dereference',
            suggestion: 'Add null check before accessing nested properties: if (obj.prop) { obj.prop.value }',
        });
        // Pattern: Unhandled promise rejection
        this.patternRules.push({
            name: 'unhandled-promise',
            pattern: /\b(fetch|axios|http\.request)\s*\(/g,
            bugType: 'unhandled-promise',
            baseRiskScore: 0.6,
            description: 'Promise without error handling',
            suggestion: 'Add .catch() or try/catch to handle promise rejections',
        });
        // Pattern: Race condition
        this.patternRules.push({
            name: 'race-condition',
            pattern: /setTimeout|setInterval/g,
            bugType: 'race-condition',
            baseRiskScore: 0.5,
            description: 'Async operation without proper synchronization',
            suggestion: 'Consider using async/await with proper error handling',
        });
        // Pattern: Memory leak
        this.patternRules.push({
            name: 'memory-leak',
            pattern: /addEventListener|subscribe/g,
            bugType: 'memory-leak',
            baseRiskScore: 0.8,
            description: 'Event listener or subscription without cleanup',
            suggestion: 'Ensure removeEventListener or unsubscribe is called in cleanup functions',
        });
        // Pattern: Type coercion issues
        this.patternRules.push({
            name: 'type-coercion',
            pattern: /==\s*(?!=)|!=\s*(?!=)/g,
            bugType: 'type-coercion',
            baseRiskScore: 0.4,
            description: 'Loose equality comparison (== instead of ===)',
            suggestion: 'Use strict equality (===) to avoid type coercion bugs',
        });
        // Pattern: Missing error handling
        this.patternRules.push({
            name: 'missing-error-handling',
            pattern: /JSON\.parse\(/g,
            bugType: 'missing-error-handling',
            baseRiskScore: 0.7,
            description: 'JSON.parse without try/catch',
            suggestion: 'Wrap JSON.parse in try/catch to handle parse errors',
        });
        // Pattern: Infinite loop risk
        this.patternRules.push({
            name: 'infinite-loop',
            pattern: /while\s*\(\s*true\s*\)/g,
            bugType: 'infinite-loop',
            baseRiskScore: 0.9,
            description: 'while(true) loop without clear exit condition',
            suggestion: 'Add clear exit condition or use break statement',
        });
        // Pattern: SQL injection risk
        this.patternRules.push({
            name: 'sql-injection',
            pattern: /query\s*\(\s*['"`][^'"`]*\$\{/g,
            bugType: 'sql-injection',
            baseRiskScore: 0.95,
            description: 'Template literal in SQL query (potential SQL injection)',
            suggestion: 'Use parameterized queries or prepared statements',
        });
        // Pattern: XSS risk
        this.patternRules.push({
            name: 'xss-risk',
            pattern: /dangerouslySetInnerHTML|innerHTML\s*=/g,
            bugType: 'xss-risk',
            baseRiskScore: 0.9,
            description: 'Direct HTML injection (potential XSS vulnerability)',
            suggestion: 'Use DOMPurify or React safe rendering methods',
        });
        // Pattern: Async/await without error handling
        this.patternRules.push({
            name: 'async-no-error',
            pattern: /await\s+[^(]+\([^)]*\)(?!\s*\.catch)(?!\s*try)/g,
            bugType: 'async-no-error',
            baseRiskScore: 0.6,
            description: 'await without error handling',
            suggestion: 'Wrap await in try/catch or add .catch()',
        });
    }
    /**
     * Analyzes a file for bug-prone patterns
     *
     * @param filePath - File path
     * @returns Promise<BugPrediction[]> - Array of bug predictions
     */
    async analyzeFile(filePath) {
        const predictions = [];
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            for (const rule of this.patternRules) {
                let match;
                const globalPattern = new RegExp(rule.pattern.source, rule.pattern.flags + 'g');
                while ((match = globalPattern.exec(content)) !== null) {
                    const matchIndex = match.index;
                    const lineNumber = content.slice(0, matchIndex).split('\n').length;
                    // Calculate confidence based on context
                    const context = this.getContext(content, matchIndex, 50);
                    const confidence = this.calculateConfidence(context, rule);
                    predictions.push({
                        filePath,
                        line: lineNumber,
                        bugType: rule.bugType,
                        riskScore: rule.baseRiskScore,
                        confidence,
                        description: rule.description,
                        suggestion: rule.suggestion,
                    });
                }
            }
            // Sort by risk score (highest first)
            predictions.sort((a, b) => b.riskScore - a.riskScore);
            return predictions;
        }
        catch (error) {
            console.warn(`��ᴩ�  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
            return [];
        }
    }
    /**
     * Analyzes multiple files for bug-prone patterns
     *
     * @param filePaths - Array of file paths
     * @returns Promise<BugPrediction[]> - Array of bug predictions
     */
    async analyzeFiles(filePaths) {
        const allPredictions = [];
        for (const filePath of filePaths) {
            const predictions = await this.analyzeFile(filePath);
            allPredictions.push(...predictions);
        }
        // Sort by risk score (highest first)
        allPredictions.sort((a, b) => b.riskScore - a.riskScore);
        return allPredictions;
    }
    /**
     * Gets context around a match
     *
     * @private
     * @param content - File content
     * @param matchIndex - Match index
     * @param contextSize - Context size in characters
     * @returns string - Context string
     */
    getContext(content, matchIndex, contextSize) {
        const start = Math.max(0, matchIndex - contextSize);
        const end = Math.min(content.length, matchIndex + contextSize);
        return content.slice(start, end);
    }
    /**
     * Calculates confidence level based on context
     *
     * @private
     * @param context - Context string
     * @param rule - Pattern rule
     * @returns 'low' | 'medium' | 'high' - Confidence level
     */
    calculateConfidence(context, _rule) {
        // Simple heuristic: if context contains error handling, lower confidence
        const hasErrorHandling = /try|catch|\.catch|if\s*\([^)]*null|if\s*\([^)]*undefined/.test(context);
        if (hasErrorHandling) {
            return 'low';
        }
        // If context is short, medium confidence
        if (context.length < 100) {
            return 'medium';
        }
        // Otherwise, high confidence
        return 'high';
    }
    /**
     * Registers a custom pattern rule
     *
     * @param rule - Pattern rule to register
     */
    registerPattern(rule) {
        this.patternRules.push(rule);
    }
    /**
     * Gets all registered pattern rules
     *
     * @returns PatternRule[] - Array of pattern rules
     */
    getPatterns() {
        return [...this.patternRules];
    }
    /**
     * Generates a summary report of bug predictions
     *
     * @param predictions - Array of bug predictions
     * @returns string - Summary report
     */
    generateSummary(predictions) {
        const totalPredictions = predictions.length;
        const highRisk = predictions.filter(p => p.riskScore >= 0.8).length;
        const mediumRisk = predictions.filter(p => p.riskScore >= 0.5 && p.riskScore < 0.8).length;
        const lowRisk = predictions.filter(p => p.riskScore < 0.5).length;
        // Group by bug type
        const byType = new Map();
        for (const prediction of predictions) {
            const count = byType.get(prediction.bugType) || 0;
            byType.set(prediction.bugType, count + 1);
        }
        let report = `Bug Prediction Summary\n`;
        report += `=====================\n`;
        report += `Total Predictions: ${totalPredictions}\n`;
        report += `High Risk: ${highRisk}\n`;
        report += `Medium Risk: ${mediumRisk}\n`;
        report += `Low Risk: ${lowRisk}\n\n`;
        report += `By Bug Type:\n`;
        for (const [bugType, count] of Array.from(byType).sort((a, b) => b[1] - a[1])) {
            report += `  ${bugType}: ${count}\n`;
        }
        return report;
    }
}
//# sourceMappingURL=predictive-bug-detection.js.map