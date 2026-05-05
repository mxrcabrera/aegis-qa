// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 3H: XSS/Injection Security
 *
 * Purpose: Deep analysis of Cross-Site Scripting (XSS) and injection vulnerabilities
 * beyond basic innerHTML checks, covering eval, document.write, URL-based XSS,
 * HTML attributes, template literals, and client-side storage.
 *
 * Architecture:
 * - Dynamic Code Execution: eval(), Function(), setTimeout/setInterval with strings
 * - DOM Manipulation: document.write(), innerHTML, outerHTML, insertAdjacentHTML
 * - URL-based XSS: href, src, data URLs with user input
 * - HTML Attribute XSS: on* event handlers, javascript: protocol
 * - Template Literal XSS: Unescaped template literals with user input
 * - Storage XSS: localStorage/sessionStorage with unsanitized data
 * - React/Next.js Specific: dangerouslySetInnerHTML, unsanitized props
 *
 * @module phases/phase-3h-xss-injection-security
 * @since 2.0.0
 */
import * as fs from 'fs';
import * as path from 'path';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';
export class Phase3HXSSInjectionSecurity {
    config;
    constructor(config) {
        if (!validatePath(config.projectRoot, config.projectRoot)) {
            throw new Error('Invalid project root path');
        }
        this.config = config;
    }
    async execute() {
        const startTime = Date.now();
        console.log('INFO Phase 3H: XSS/Injection Security\n');
        try {
            console.log('INFO Verifying system resources...');
            const resourceCheck = await this.config.thermalController.checkSystemResources();
            console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
            console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
            console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);
            if (!resourceCheck.isSafe) {
                throw new Error('System resources not safe for operation');
            }
            console.log('INFO Analyzing XSS and injection vulnerabilities...\n');
            const findings = [];
            // 1. Check for eval() with user input
            console.log('INFO Checking for eval() with user input...');
            findings.push(...await this.checkEvalWithUserInput());
            // 2. Check for document.write() XSS
            console.log('INFO Checking for document.write() XSS...');
            findings.push(...await this.checkDocumentWriteXSS());
            // 3. Check for URL-based XSS
            console.log('INFO Checking for URL-based XSS...');
            findings.push(...await this.checkURLBasedXSS());
            // 4. Check for HTML attribute XSS
            console.log('INFO Checking for HTML attribute XSS...');
            findings.push(...await this.checkAttributeXSS());
            // 5. Check for template literal XSS
            console.log('INFO Checking for template literal XSS...');
            findings.push(...await this.checkTemplateLiteralXSS());
            // 6. Check for storage XSS
            console.log('INFO Checking for storage XSS...');
            findings.push(...await this.checkStorageXSS());
            // 7. Check for setTimeout/setInterval XSS
            console.log('INFO Checking for setTimeout/setInterval XSS...');
            findings.push(...await this.checkTimeoutXSS());
            // 8. Check for Function() constructor XSS
            console.log('INFO Checking for Function() constructor XSS...');
            findings.push(...await this.checkFunctionConstructorXSS());
            // 9. Check for dangerous innerHTML/outerHTML
            console.log('INFO Checking for dangerous innerHTML/outerHTML...');
            findings.push(...await this.checkDangerousInnerHTML());
            // 10. Check for React dangerouslySetInnerHTML
            console.log('INFO Checking for React dangerouslySetInnerHTML...');
            findings.push(...await this.checkReactDangerousSet());
            console.log(`INFO Total findings: ${findings.length}\n`);
            const metrics = this.calculateMetrics(findings);
            console.log(`INFO eval() with user input: ${metrics.evalWithUserInput}`);
            console.log(`INFO document.write() XSS: ${metrics.documentWriteXSS}`);
            console.log(`INFO URL-based XSS: ${metrics.urlBasedXSS}`);
            console.log(`INFO Template literal XSS: ${metrics.templateLiteralXSS}\n`);
            const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
            const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;
            const executionTimeMs = Date.now() - startTime;
            const result = {
                success: true,
                findings,
                metrics,
                criticalFindings,
                highSeverityFindings,
                executionTimeMs,
            };
            console.log(`SUCCESS Phase 3H Complete in ${executionTimeMs / 1000}s`);
            console.log(`INFO Critical findings: ${criticalFindings}`);
            console.log(`INFO High severity findings: ${highSeverityFindings}`);
            return result;
        }
        catch (error) {
            const executionTimeMs = Date.now() - startTime;
            const sanitizedError = sanitizeError(error);
            const result = {
                success: false,
                findings: [],
                metrics: {
                    totalFiles: 0,
                    evalWithUserInput: 0,
                    documentWriteXSS: 0,
                    urlBasedXSS: 0,
                    attributeXSS: 0,
                    templateLiteralXSS: 0,
                    storageXSS: 0,
                    timeoutXSS: 0,
                    functionConstructorXSS: 0,
                    dangerousInnerHTML: 0,
                    reactDangerousSet: 0,
                },
                criticalFindings: 0,
                highSeverityFindings: 0,
                executionTimeMs,
                error: sanitizedError,
            };
            console.error('FAILED Phase 3H:', sanitizedError);
            return result;
        }
    }
    async checkEvalWithUserInput() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for eval() with potential user input
                    const evalPatterns = [
                        { pattern: /eval\s*\(\s*[^)]*[a-zA-Z_$][a-zA-Z0-9_$]*[^)]*\)/, severity: 'critical' },
                        { pattern: /eval\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/, severity: 'critical' },
                        { pattern: /eval\s*\(\s*["'][^"']*\$\{[^}]+\}[^"']*["']\s*\)/, severity: 'critical' },
                    ];
                    evalPatterns.forEach(({ pattern, severity }) => {
                        if (pattern.test(line)) {
                            findings.push({
                                id: `eval-xss-${Date.now()}-${Math.random()}`,
                                type: 'eval-with-user-input',
                                severity,
                                filePath,
                                line: index + 1,
                                description: 'eval() with potential user input detected - critical XSS vulnerability',
                                suggestion: 'Never use eval() with user input. Use JSON.parse() for JSON data, or create a safe evaluation context',
                                pattern: 'eval()',
                            });
                        }
                    });
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkDocumentWriteXSS() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    const docWritePatterns = [
                        /document\.write\s*\(/,
                        /document\.writeln\s*\(/,
                        /document\.open\s*\(\s*\)\s*;?[\s\S]*?document\.write/,
                    ];
                    docWritePatterns.forEach((pattern) => {
                        if (pattern.test(line)) {
                            findings.push({
                                id: `doc-write-xss-${Date.now()}-${Math.random()}`,
                                type: 'document-write-xss',
                                severity: 'high',
                                filePath,
                                line: index + 1,
                                description: 'document.write() detected - potential XSS vulnerability',
                                suggestion: 'Avoid document.write() as it can overwrite the entire document. Use DOM manipulation methods instead',
                                pattern: 'document.write()',
                            });
                        }
                    });
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkURLBasedXSS() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for javascript: protocol in URLs
                    const jsProtocolPattern = /href\s*=\s*["']javascript:/i;
                    if (jsProtocolPattern.test(line)) {
                        findings.push({
                            id: `url-xss-${Date.now()}-${Math.random()}`,
                            type: 'url-xss',
                            severity: 'critical',
                            filePath,
                            line: index + 1,
                            description: 'javascript: protocol in href attribute - critical XSS vulnerability',
                            suggestion: 'Never use javascript: protocol in href. Use event handlers instead',
                            pattern: 'javascript:',
                        });
                    }
                    // Check for data URLs with user input
                    const dataURLPattern = /href\s*=\s*["']data:[^"']*["']/i;
                    if (dataURLPattern.test(line)) {
                        findings.push({
                            id: `url-xss-${Date.now()}-${Math.random()}`,
                            type: 'url-xss',
                            severity: 'high',
                            filePath,
                            line: index + 1,
                            description: 'data: URL in href attribute - potential XSS vulnerability',
                            suggestion: 'Avoid data: URLs with user input. Use proper URL encoding and validation',
                            pattern: 'data:',
                        });
                    }
                    // Check for src with potential user input
                    const srcPattern = /src\s*=\s*["'][^"']*\$\{[^}]+\}[^"']*["']/i;
                    if (srcPattern.test(line)) {
                        findings.push({
                            id: `url-xss-${Date.now()}-${Math.random()}`,
                            type: 'url-xss',
                            severity: 'high',
                            filePath,
                            line: index + 1,
                            description: 'src attribute with template literal - potential XSS vulnerability',
                            suggestion: 'Validate and sanitize URLs before using in src attributes. Use allow-lists for allowed domains',
                            pattern: 'src=',
                        });
                    }
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkAttributeXSS() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for on* event handlers with user input
                    const eventHandlerPattern = /on\w+\s*=\s*["'][^"']*\$\{[^}]+\}[^"']*["']/i;
                    if (eventHandlerPattern.test(line)) {
                        findings.push({
                            id: `attr-xss-${Date.now()}-${Math.random()}`,
                            type: 'attribute-xss',
                            severity: 'high',
                            filePath,
                            line: index + 1,
                            description: 'Event handler with template literal - potential XSS vulnerability',
                            suggestion: 'Avoid inline event handlers. Use addEventListener() instead and validate user input',
                            pattern: 'on*=',
                        });
                    }
                    // Check for style attribute with user input
                    const stylePattern = /style\s*=\s*["'][^"']*\$\{[^}]+\}[^"']*["']/i;
                    if (stylePattern.test(line)) {
                        findings.push({
                            id: `attr-xss-${Date.now()}-${Math.random()}`,
                            type: 'attribute-xss',
                            severity: 'medium',
                            filePath,
                            line: index + 1,
                            description: 'style attribute with template literal - potential CSS injection/XSS',
                            suggestion: 'Validate and sanitize CSS values. Use CSS variables or inline styles with proper escaping',
                            pattern: 'style=',
                        });
                    }
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkTemplateLiteralXSS() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for template literals with user input in React/Next.js
                    const reactContext = filePath.includes('.tsx') || filePath.includes('.jsx') || content.includes('React');
                    if (reactContext) {
                        // Check for dangerously rendering HTML in React
                        const reactXSSPatterns = [
                            { pattern: /<div[^>]*>\s*\{[^}]*\$\{[^}]+\}[^}]*\}\s*<\/div>/, severity: 'high' },
                            { pattern: /<[^>]+>\s*\{[^}]*html[^}]*\}\s*<\/[^>]+>/i, severity: 'high' },
                        ];
                        reactXSSPatterns.forEach(({ pattern, severity }) => {
                            if (pattern.test(line)) {
                                findings.push({
                                    id: `template-xss-${Date.now()}-${Math.random()}`,
                                    type: 'template-literal-xss',
                                    severity,
                                    filePath,
                                    line: index + 1,
                                    description: 'Template literal with potential HTML in React component - XSS risk',
                                    suggestion: 'Use React\'s built-in escaping or DOMPurify for sanitizing HTML before rendering',
                                    pattern: 'template literal',
                                });
                            }
                        });
                    }
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkStorageXSS() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for localStorage/sessionStorage with potential XSS
                    const storagePatterns = [
                        { pattern: /localStorage\.getItem\s*\([^)]+\)\s*\+\s*/, severity: 'medium' },
                        { pattern: /sessionStorage\.getItem\s*\([^)]+\)\s*\+\s*/, severity: 'medium' },
                        { pattern: /localStorage\.setItem\s*\([^,]+,\s*[^)]*\$\{[^}]+\}[^)]*\)/, severity: 'high' },
                        { pattern: /sessionStorage\.setItem\s*\([^,]+,\s*[^)]*\$\{[^}]+\}[^)]*\)/, severity: 'high' },
                    ];
                    storagePatterns.forEach(({ pattern, severity }) => {
                        if (pattern.test(line)) {
                            findings.push({
                                id: `storage-xss-${Date.now()}-${Math.random()}`,
                                type: 'storage-xss',
                                severity,
                                filePath,
                                line: index + 1,
                                description: 'localStorage/sessionStorage with potential XSS - stored XSS vulnerability',
                                suggestion: 'Validate and sanitize data before storing. Use JSON.parse/stringify and validate structure on retrieval',
                                pattern: 'storage',
                            });
                        }
                    });
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkTimeoutXSS() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for setTimeout/setInterval with string argument
                    const timeoutPatterns = [
                        { pattern: /setTimeout\s*\(\s*["'][^"']*\$\{[^}]+\}[^"']*["']\s*,/, severity: 'critical' },
                        { pattern: /setInterval\s*\(\s*["'][^"']*\$\{[^}]+\}[^"']*["']\s*,/, severity: 'critical' },
                        { pattern: /setTimeout\s*\(\s*["'][^"']+user[^"']*["']\s*,/, severity: 'high' },
                        { pattern: /setInterval\s*\(\s*["'][^"']+user[^"']*["']\s*,/, severity: 'high' },
                    ];
                    timeoutPatterns.forEach(({ pattern, severity }) => {
                        if (pattern.test(line)) {
                            findings.push({
                                id: `timeout-xss-${Date.now()}-${Math.random()}`,
                                type: 'timeout-xss',
                                severity,
                                filePath,
                                line: index + 1,
                                description: 'setTimeout/setInterval with string argument - critical XSS vulnerability',
                                suggestion: 'Never pass strings to setTimeout/setInterval. Use function references instead',
                                pattern: 'setTimeout/setInterval',
                            });
                        }
                    });
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkFunctionConstructorXSS() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for Function() constructor
                    const functionPatterns = [
                        { pattern: /new Function\s*\(\s*["'][^"']*\$\{[^}]+\}[^"']*["']\s*\)/, severity: 'critical' },
                        { pattern: /Function\s*\(\s*["'][^"']*\$\{[^}]+\}[^"']*["']\s*\)/, severity: 'critical' },
                    ];
                    functionPatterns.forEach(({ pattern, severity }) => {
                        if (pattern.test(line)) {
                            findings.push({
                                id: `function-xss-${Date.now()}-${Math.random()}`,
                                type: 'function-xss',
                                severity,
                                filePath,
                                line: index + 1,
                                description: 'Function() constructor with potential user input - critical XSS vulnerability',
                                suggestion: 'Never use Function() constructor with user input. It\'s equivalent to eval()',
                                pattern: 'Function()',
                            });
                        }
                    });
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkDangerousInnerHTML() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    const innerHTMLPatterns = [
                        { pattern: /\.innerHTML\s*=\s*[^;]+/, severity: 'high' },
                        { pattern: /\.outerHTML\s*=\s*[^;]+/, severity: 'high' },
                        { pattern: /insertAdjacentHTML\s*\(/, severity: 'high' },
                    ];
                    innerHTMLPatterns.forEach(({ pattern, severity }) => {
                        if (pattern.test(line)) {
                            // Check if sanitized
                            const hasSanitization = line.includes('DOMPurify') || line.includes('sanitize') || line.includes('escape');
                            if (!hasSanitization) {
                                findings.push({
                                    id: `innerhtml-xss-${Date.now()}-${Math.random()}`,
                                    type: 'dangerous-innerhtml',
                                    severity,
                                    filePath,
                                    line: index + 1,
                                    description: 'innerHTML/outerHTML/insertAdjacentHTML without sanitization',
                                    suggestion: 'Always sanitize HTML before using innerHTML. Use DOMPurify or similar library',
                                    pattern: 'innerHTML',
                                });
                            }
                        }
                    });
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    async checkReactDangerousSet() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        for (const filePath of sourceFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    // Check for dangerouslySetInnerHTML
                    const dangerousPattern = /dangerouslySetInnerHTML\s*=/;
                    if (dangerousPattern.test(line)) {
                        // Check if sanitized
                        const hasSanitization = line.includes('DOMPurify') || line.includes('sanitize') || line.includes('escape');
                        if (!hasSanitization) {
                            findings.push({
                                id: `react-xss-${Date.now()}-${Math.random()}`,
                                type: 'react-dangerous-set',
                                severity: 'critical',
                                filePath,
                                line: index + 1,
                                description: 'React dangerouslySetInnerHTML without sanitization',
                                suggestion: 'Always sanitize HTML before using dangerouslySetInnerHTML. Use DOMPurify or similar library',
                                pattern: 'dangerouslySetInnerHTML',
                            });
                        }
                    }
                });
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        return findings;
    }
    findSourceFiles() {
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.html'];
        const sourceFiles = [];
        const scanDirectory = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
                        scanDirectory(fullPath);
                    }
                    else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
                        sourceFiles.push(fullPath);
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
            }
        };
        scanDirectory(this.config.projectRoot);
        return sourceFiles;
    }
    calculateMetrics(findings) {
        return {
            totalFiles: findings.length > 0 ? new Set(findings.map((f) => f.filePath)).size : 0,
            evalWithUserInput: findings.filter((f) => f.type === 'eval-with-user-input').length,
            documentWriteXSS: findings.filter((f) => f.type === 'document-write-xss').length,
            urlBasedXSS: findings.filter((f) => f.type === 'url-xss').length,
            attributeXSS: findings.filter((f) => f.type === 'attribute-xss').length,
            templateLiteralXSS: findings.filter((f) => f.type === 'template-literal-xss').length,
            storageXSS: findings.filter((f) => f.type === 'storage-xss').length,
            timeoutXSS: findings.filter((f) => f.type === 'timeout-xss').length,
            functionConstructorXSS: findings.filter((f) => f.type === 'function-xss').length,
            dangerousInnerHTML: findings.filter((f) => f.type === 'dangerous-innerhtml').length,
            reactDangerousSet: findings.filter((f) => f.type === 'react-dangerous-set').length,
        };
    }
}
//# sourceMappingURL=phase-3h-xss-injection-security.js.map