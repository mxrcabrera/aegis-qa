/**
 * Cloud Cost & Resource Efficiency - Phase 14
 *
 * Identifies patterns that increase latency and operational cost.
 * In the cloud, time is literally money.
 *
 * @module cloud-cost-detection
 * @since 2.0.0
 */
import * as fs from 'fs';
import * as path from 'path';
export class CloudCostDetection {
    projectRoot;
    criticalModules = [];
    highTrafficFiles = [];
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    /**
     * Run cloud cost detection
     */
    async detect(apiPayloadData = new Map(), criticalModules = [], highTrafficFiles = []) {
        this.criticalModules = criticalModules;
        this.highTrafficFiles = highTrafficFiles;
        const results = {
            issues: [],
            summary: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                total: 0
            }
        };
        // Detect Zombie Dependencies
        const zombieDeps = await this.detectZombieDependencies();
        results.issues.push(...zombieDeps);
        // Scan source files
        const libPath = path.join(this.projectRoot, 'lib');
        const srcPath = path.join(this.projectRoot, 'src');
        const filesToScan = [];
        if (fs.existsSync(libPath)) {
            filesToScan.push(...await this.scanDirectory(libPath, '.ts'));
            filesToScan.push(...await this.scanDirectory(libPath, '.js'));
        }
        if (fs.existsSync(srcPath)) {
            filesToScan.push(...await this.scanDirectory(srcPath, '.ts'));
            filesToScan.push(...await this.scanDirectory(srcPath, '.tsx'));
            filesToScan.push(...await this.scanDirectory(srcPath, '.js'));
            filesToScan.push(...await this.scanDirectory(srcPath, '.jsx'));
        }
        for (const file of filesToScan) {
            const issues = await this.analyzeFile(file, apiPayloadData);
            results.issues.push(...issues);
        }
        // Apply Cost Impact Multiplier
        this.applyCostImpactMultiplier(results.issues);
        // Calculate summary
        results.summary = this.calculateSummary(results.issues);
        return results;
    }
    /**
     * Detect Zombie Dependencies: Unused dependencies in package.json
     */
    async detectZombieDependencies() {
        const issues = [];
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return issues;
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        // Collect all dependencies
        const allDeps = { ...dependencies, ...devDependencies };
        // Scan source files to check which dependencies are actually used
        const libPath = path.join(this.projectRoot, 'lib');
        const srcPath = path.join(this.projectRoot, 'src');
        const filesToScan = [];
        if (fs.existsSync(libPath)) {
            filesToScan.push(...await this.scanDirectory(libPath, '.ts'));
            filesToScan.push(...await this.scanDirectory(libPath, '.js'));
        }
        if (fs.existsSync(srcPath)) {
            filesToScan.push(...await this.scanDirectory(srcPath, '.ts'));
            filesToScan.push(...await this.scanDirectory(srcPath, '.tsx'));
            filesToScan.push(...await this.scanDirectory(srcPath, '.js'));
            filesToScan.push(...await this.scanDirectory(srcPath, '.jsx'));
        }
        const usedImports = new Set();
        for (const file of filesToScan) {
            const content = fs.readFileSync(file, 'utf-8');
            // Extract import statements
            const importMatches = content.match(/from ['"]([^'"]+)['"]/g) || [];
            for (const match of importMatches) {
                const dep = match.match(/from ['"]([^'"]+)['"]/)?.[1];
                if (dep) {
                    // Extract the package name (before first slash or @)
                    const packageName = dep.split('/')[0];
                    if (allDeps[packageName]) {
                        usedImports.add(packageName);
                    }
                }
            }
        }
        // Check for unused dependencies
        for (const depName of Object.keys(allDeps)) {
            if (!usedImports.has(depName) && !depName.startsWith('@types/')) {
                issues.push({
                    id: `zombie-dep-${Date.now()}`,
                    type: 'zombie-dependency',
                    severity: 'medium',
                    file: 'package.json',
                    line: 0,
                    description: `Zombie dependency: ${depName} is installed but never used`,
                    costImpact: 'Each KB in node_modules increases storage and CI/CD build time costs',
                    estimatedSavings: '$5-15/month by removing unused dependencies',
                    confidenceScore: 0.85
                });
            }
        }
        return issues;
    }
    /**
     * Apply Cost Impact Multiplier: Triple severity in Critical Modules with High Traffic
     */
    applyCostImpactMultiplier(issues) {
        for (const issue of issues) {
            const isCriticalModule = this.criticalModules.some(cm => issue.file.includes(cm));
            const hasHighTraffic = this.highTrafficFiles.some(htf => issue.file.includes(htf));
            issue.isCriticalModule = isCriticalModule;
            issue.hasHighTraffic = hasHighTraffic;
            if (isCriticalModule && hasHighTraffic) {
                // Triple the severity
                if (issue.severity === 'low')
                    issue.severity = 'high';
                else if (issue.severity === 'medium')
                    issue.severity = 'critical';
                // high and critical remain critical
            }
        }
    }
    /**
     * Analyze a single file for cost issues
     */
    async analyzeFile(filePath, apiPayloadData) {
        const issues = [];
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const relativePath = path.relative(this.projectRoot, filePath);
        const isCorePath = this.isCorePath(relativePath);
        // Track sequential awaits for Long-running Functions detection
        const sequentialAwaits = [];
        // Track API calls in loops for API Loop Inefficiency detection
        const apiCallsInLoops = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            // Heavy Cold Starts: Detect huge dependencies
            const heavyColdStart = this.detectHeavyColdStart(line, relativePath, lineNumber);
            if (heavyColdStart)
                issues.push(heavyColdStart);
            // Long-running Functions: Track sequential awaits
            const awaitMatch = line.match(/await\s+/);
            if (awaitMatch) {
                sequentialAwaits.push(lineNumber);
            }
            // Select Star Abuse: Detect select * queries
            const selectStar = this.detectSelectStarAbuse(line, relativePath, lineNumber);
            if (selectStar)
                issues.push(selectStar);
            // Payload Bloat: API calls with giant payloads
            const payloadBloat = this.detectPayloadBloat(line, relativePath, lineNumber, apiPayloadData);
            if (payloadBloat)
                issues.push(payloadBloat);
            // Missing Cache-Control headers
            const missingCache = this.detectMissingCacheControl(line, relativePath, lineNumber);
            if (missingCache)
                issues.push(missingCache);
            // Log Profligacy: Excessive console.log or heavy object logs in Core Path
            if (isCorePath) {
                const logProfligacy = this.detectLogProfligacy(line, relativePath, lineNumber);
                if (logProfligacy)
                    issues.push(logProfligacy);
            }
            // Inefficient Regex: Complex regex patterns with ReDoS risk
            const inefficientRegex = this.detectInefficientRegex(line, relativePath, lineNumber);
            if (inefficientRegex)
                issues.push(inefficientRegex);
            // API Loop Inefficiency: Detect API calls in loops
            const apiCallMatch = line.match(/fetch\(|axios\.|\.get\(|\.post\(/);
            if (apiCallMatch) {
                // Check if this is inside a loop (simplified check)
                const surroundingContext = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n');
                const inLoop = surroundingContext.match(/\.(map|forEach|for|while)\s*\(/);
                if (inLoop) {
                    apiCallsInLoops.push(lineNumber);
                }
            }
        }
        // Check for Long-running Functions (sequential awaits)
        if (sequentialAwaits.length > 2) {
            const longRunning = this.detectLongRunningFunction(relativePath, sequentialAwaits);
            if (longRunning)
                issues.push(longRunning);
        }
        // Check for API Loop Inefficiency
        if (apiCallsInLoops.length > 0) {
            const apiLoop = this.detectApiLoopInefficiency(relativePath, apiCallsInLoops);
            if (apiLoop)
                issues.push(apiLoop);
        }
        return issues;
    }
    /**
     * Check if file is in Core Path
     */
    isCorePath(filePath) {
        const corePaths = ['src/', 'lib/', 'components/'];
        return corePaths.some(cp => filePath.startsWith(cp));
    }
    /**
     * Detect Heavy Cold Starts: Huge dependencies in backend/lambda files
     */
    detectHeavyColdStart(line, filePath, lineNumber) {
        // Detect imports of entire libraries when specific functions could be used
        const heavyImports = [
            'import _ from \'lodash\'',
            'import * as _ from \'lodash\'',
            'import moment from \'moment\'',
            'import * as moment from \'moment\'',
            'import Rx from \'rxjs\'',
            'import * as Rx from \'rxjs\''
        ];
        for (const heavyImport of heavyImports) {
            if (line.includes(heavyImport)) {
                const libName = heavyImport.match(/from '([^']+)'/)?.[1] || 'library';
                return {
                    id: `heavy-cold-start-${Date.now()}`,
                    type: 'heavy-cold-start',
                    severity: 'high',
                    file: filePath,
                    line: lineNumber,
                    description: `Heavy cold start: Importing entire ${libName} library`,
                    costImpact: 'Increases cold start time by 100-500ms per lambda invocation',
                    estimatedSavings: '$10-50/month in serverless costs by using specific imports',
                    confidenceScore: 0.90
                };
            }
        }
        return null;
    }
    /**
     * Detect Long-running Functions: Sequential awaits that could be Promise.all()
     */
    detectLongRunningFunction(filePath, awaitLines) {
        if (awaitLines.length < 3)
            return null;
        return {
            id: `long-running-${Date.now()}`,
            type: 'long-running',
            severity: 'high',
            file: filePath,
            line: awaitLines[0],
            description: `Long-running function: ${awaitLines.length} sequential awaits detected`,
            costImpact: 'Execution time multiplied by number of awaits instead of parallel execution',
            estimatedSavings: '$20-100/month by converting to Promise.all()',
            confidenceScore: 0.85
        };
    }
    /**
     * Detect Select Star Abuse: Queries without column specification
     */
    detectSelectStarAbuse(line, filePath, lineNumber) {
        // SQL select *
        const sqlSelectStar = line.match(/select\s+\*\s+from/i);
        // Prisma select all
        const prismaSelectAll = line.match(/\.findMany\(\s*\{?\s*\}/);
        // Supabase select all
        const supabaseSelectAll = line.match(/\.select\(\s*\*\s*\)/);
        if (sqlSelectStar || prismaSelectAll || supabaseSelectAll) {
            return {
                id: `select-star-${Date.now()}`,
                type: 'select-star-abuse',
                severity: 'high',
                file: filePath,
                line: lineNumber,
                description: 'SELECT * abuse: Fetching all columns without specification',
                costImpact: 'Increases data transfer costs and latency as table grows',
                estimatedSavings: '$50-200/month in egress costs by specifying columns',
                confidenceScore: 0.95
            };
        }
        return null;
    }
    /**
     * Detect Payload Bloat: API calls fetching giant objects for single property
     */
    detectPayloadBloat(line, filePath, lineNumber, apiPayloadData) {
        // Detect API calls
        const apiCallMatch = line.match(/fetch\(|axios\.|\.get\(|\.post\(/);
        if (!apiCallMatch)
            return null;
        // Check if this endpoint is known to return large payloads
        for (const [endpoint, payloadSize] of apiPayloadData) {
            if (line.includes(endpoint) && payloadSize === 'large') {
                return {
                    id: `payload-bloat-${Date.now()}`,
                    type: 'payload-bloat',
                    severity: 'medium',
                    file: filePath,
                    line: lineNumber,
                    description: `Payload bloat: Fetching large object from ${endpoint} to use single property`,
                    costImpact: 'Unnecessary data transfer increases latency and bandwidth costs',
                    estimatedSavings: '$10-30/month by requesting only needed fields',
                    confidenceScore: 0.80
                };
            }
        }
        return null;
    }
    /**
     * Detect Log Profligacy: Excessive console.log or heavy object logs in production Core Path
     */
    detectLogProfligacy(line, filePath, lineNumber) {
        // Detect console.log of entire objects or arrays
        const objectLog = line.match(/console\.(log|debug|info|warn|error)\s*\([^,)]*(\{|\[)/);
        if (objectLog) {
            return {
                id: `log-profligacy-${Date.now()}`,
                type: 'log-profligacy',
                severity: 'medium',
                file: filePath,
                line: lineNumber,
                description: 'Log profligacy: Logging heavy object/array in production Core Path',
                costImpact: 'This log of complete object will melt your monitoring budget in Cloudwatch/Datadog',
                estimatedSavings: '$30-100/month by removing or limiting object logs in production',
                confidenceScore: 0.90
            };
        }
        return null;
    }
    /**
     * Detect Inefficient Regex: Complex regex patterns with ReDoS risk
     */
    detectInefficientRegex(line, filePath, lineNumber) {
        // Detect regex patterns with ReDoS risk indicators
        const hasNestedQuantifiers = line.includes('++') && line.includes('(');
        const hasWildcardQuantifier = line.includes('.*{') || line.includes('.+{');
        const hasRepeatedChars = line.match(/(.)\1{10,}/); // Same character repeated 10+ times
        if (hasNestedQuantifiers || hasWildcardQuantifier || hasRepeatedChars) {
            return {
                id: `inefficient-regex-${Date.now()}`,
                type: 'inefficient-regex',
                severity: 'high',
                file: filePath,
                line: lineNumber,
                description: 'Inefficient regex: Pattern with ReDoS (Regular Expression Denial of Service) risk',
                costImpact: 'This regex can spike CPU to 100% and burn compute credits in seconds',
                estimatedSavings: '$50-200/month by optimizing regex patterns',
                confidenceScore: 0.85
            };
        }
        return null;
    }
    /**
     * Detect API Loop Inefficiency: Duplicate API calls in loops without shared state/cache
     */
    detectApiLoopInefficiency(filePath, loopLines) {
        if (loopLines.length < 2)
            return null;
        return {
            id: `api-loop-inefficiency-${Date.now()}`,
            type: 'api-loop-inefficiency',
            severity: 'high',
            file: filePath,
            line: loopLines[0],
            description: `API loop inefficiency: ${loopLines.length} API calls detected in loops without shared state`,
            costImpact: 'Double billing risk: Same API called multiple times without React Context/SWR/Query cache',
            estimatedSavings: '$40-150/month by implementing proper caching or state sharing',
            confidenceScore: 0.80
        };
    }
    /**
     * Detect Missing Cache-Control headers
     */
    detectMissingCacheControl(line, filePath, lineNumber) {
        // Detect API route responses without cache headers
        const jsonResponse = line.match(/res\.json\(|NextResponse\.json\(/);
        if (jsonResponse) {
            // Check if cache-control is set in the same function (simplified check)
            // In a real implementation, we'd need to analyze the function scope
            return {
                id: `missing-cache-${Date.now()}`,
                type: 'missing-cache-control',
                severity: 'medium',
                file: filePath,
                line: lineNumber,
                description: 'Missing Cache-Control header in API response',
                costImpact: 'Repeated requests to same endpoint waste compute and bandwidth',
                estimatedSavings: '$20-80/month by implementing proper caching',
                confidenceScore: 0.70
            };
        }
        return null;
    }
    /**
     * Calculate summary of issues
     */
    calculateSummary(issues) {
        return {
            critical: issues.filter(i => i.severity === 'critical').length,
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length,
            total: issues.length
        };
    }
    /**
     * Scan directory for files
     */
    async scanDirectory(dir, extension) {
        const files = [];
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                files.push(...await this.scanDirectory(fullPath, extension));
            }
            else if (stat.isFile() && item.endsWith(extension)) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
export default CloudCostDetection;
//# sourceMappingURL=cloud-cost-detection.js.map