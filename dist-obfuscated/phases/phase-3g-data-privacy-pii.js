// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 3G: Data Privacy & PII
 *
 * Purpose: Analyze data privacy and PII (Personally Identifiable Information) handling,
 * including PII inventory, account deletion, data export, and logs with PII.
 *
 * Architecture:
 * - PII Inventory: Detect and catalog PII in database schemas and code
 * - Account Deletion: Verify account deletion and data retention policies
 * - Data Export: Check for data export functionality (GDPR compliance)
 * - Logs with PII: Detect PII in logs and log statements
 *
 * @module phases/phase-3g-data-privacy-pii
 * @since 2.0.0
 */
import * as fs from 'fs';
import * as path from 'path';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';
export class Phase3GDataPrivacyPII {
    config;
    constructor(config) {
        if (!validatePath(config.projectRoot, config.projectRoot)) {
            throw new Error('Invalid project root path');
        }
        this.config = config;
    }
    async execute() {
        const startTime = Date.now();
        console.log('INFO Phase 3G: Data Privacy & PII\n');
        try {
            console.log('INFO Verifying system resources...');
            const resourceCheck = await this.config.thermalController.checkSystemResources();
            console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
            console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
            console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);
            if (!resourceCheck.isSafe) {
                throw new Error('System resources not safe for operation');
            }
            console.log('INFO Analyzing data privacy and PII handling...\n');
            const findings = [];
            // 1. Analyze database schemas for PII
            console.log('INFO Analyzing database schemas for PII...');
            findings.push(...await this.analyzePIIInSchemas());
            // 2. Check for account deletion functionality
            console.log('INFO Checking for account deletion functionality...');
            findings.push(...await this.checkAccountDeletion());
            // 3. Check for data export functionality
            console.log('INFO Checking for data export functionality...');
            findings.push(...await this.checkDataExport());
            // 4. Check for PII in logs
            console.log('INFO Checking for PII in logs...');
            findings.push(...await this.checkPIIInLogs());
            // 5. Check for unencrypted PII
            console.log('INFO Checking for unencrypted PII...');
            findings.push(...await this.checkUnencryptedPII());
            // 6. Check for data retention policies
            console.log('INFO Checking for data retention policies...');
            findings.push(...await this.checkRetentionPolicies());
            console.log(`INFO Total findings: ${findings.length}\n`);
            const metrics = this.calculateMetrics(findings);
            console.log(`INFO PII in schemas: ${metrics.piiInSchemas}`);
            console.log(`INFO Missing account deletion: ${metrics.missingAccountDeletion}`);
            console.log(`INFO Missing data export: ${metrics.missingDataExport}`);
            console.log(`INFO PII in logs: ${metrics.piiInLogs}\n`);
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
            console.log(`SUCCESS Phase 3G Complete in ${executionTimeMs / 1000}s`);
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
                    piiInSchemas: 0,
                    missingAccountDeletion: 0,
                    missingDataExport: 0,
                    piiInLogs: 0,
                    unencryptedPII: 0,
                    missingRetentionPolicies: 0,
                },
                criticalFindings: 0,
                highSeverityFindings: 0,
                executionTimeMs,
                error: sanitizedError,
            };
            console.error('FAILED Phase 3G:', sanitizedError);
            return result;
        }
    }
    async analyzePIIInSchemas() {
        const findings = [];
        const sqlFiles = this.findSQLFiles();
        for (const filePath of sqlFiles) {
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
                    // Detect PII columns in database schemas
                    const piiPatterns = [
                        { pattern: /email\s+[a-zA-Z]/, type: 'email', severity: 'high' },
                        { pattern: /phone\s+[a-zA-Z]/, type: 'phone', severity: 'high' },
                        { pattern: /ssn\s+[a-zA-Z]/, type: 'ssn', severity: 'critical' },
                        { pattern: /social_security\s+[a-zA-Z]/, type: 'ssn', severity: 'critical' },
                        { pattern: /credit_card\s+[a-zA-Z]/, type: 'credit-card', severity: 'critical' },
                        { pattern: /address\s+[a-zA-Z]/, type: 'address', severity: 'medium' },
                        { pattern: /full_name\s+[a-zA-Z]/, type: 'name', severity: 'medium' },
                        { pattern: /first_name\s+[a-zA-Z]/, type: 'name', severity: 'medium' },
                        { pattern: /last_name\s+[a-zA-Z]/, type: 'name', severity: 'medium' },
                    ];
                    piiPatterns.forEach(({ pattern, type, severity }) => {
                        if (pattern.test(line)) {
                            const isEncrypted = line.includes('encrypt') || line.includes('hash') || line.includes('bytea');
                            if (!isEncrypted) {
                                findings.push({
                                    id: `pii-schema-${Date.now()}-${Math.random()}`,
                                    type: 'pii-in-schema',
                                    severity,
                                    filePath,
                                    line: index + 1,
                                    description: `Unencrypted PII column detected: ${type}`,
                                    suggestion: 'Encrypt or hash PII columns at rest. Use encryption for fields like email, phone, SSN, credit card numbers',
                                    piiType: type,
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
    async checkAccountDeletion() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        let hasAccountDeletion = false;
        let hasSoftDelete = false;
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
                const lowerContent = content.toLowerCase();
                // Check for account deletion functionality
                if (lowerContent.includes('delete') && lowerContent.includes('account')) {
                    hasAccountDeletion = true;
                }
                // Check for soft delete
                if (lowerContent.includes('deleted_at') || lowerContent.includes('is_deleted')) {
                    hasSoftDelete = true;
                }
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        if (!hasAccountDeletion && !hasSoftDelete) {
            findings.push({
                id: `missing-deletion-${Date.now()}`,
                type: 'missing-account-deletion',
                severity: 'high',
                filePath: this.config.projectRoot,
                description: 'No account deletion functionality found',
                suggestion: 'Implement account deletion functionality (hard delete or soft delete) to comply with GDPR right to erasure',
            });
        }
        if (hasSoftDelete && !hasAccountDeletion) {
            findings.push({
                id: `missing-hard-delete-${Date.now()}`,
                type: 'missing-account-deletion',
                severity: 'medium',
                filePath: this.config.projectRoot,
                description: 'Soft delete implemented but no hard delete for GDPR compliance',
                suggestion: 'Implement hard delete functionality for GDPR right to erasure, in addition to soft delete',
            });
        }
        return findings;
    }
    async checkDataExport() {
        const findings = [];
        const sourceFiles = this.findSourceFiles();
        let hasDataExport = false;
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
                const lowerContent = content.toLowerCase();
                // Check for data export functionality
                if (lowerContent.includes('export') && (lowerContent.includes('data') || lowerContent.includes('user'))) {
                    hasDataExport = true;
                }
                // Check for GDPR-related exports
                if (lowerContent.includes('gdpr') || lowerContent.includes('right to data portability')) {
                    hasDataExport = true;
                }
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        if (!hasDataExport) {
            findings.push({
                id: `missing-export-${Date.now()}`,
                type: 'missing-data-export',
                severity: 'high',
                filePath: this.config.projectRoot,
                description: 'No data export functionality found (GDPR right to data portability)',
                suggestion: 'Implement data export functionality to allow users to download their data in a machine-readable format',
            });
        }
        return findings;
    }
    async checkPIIInLogs() {
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
                    // Check for log statements with potential PII
                    const logPatterns = [
                        /console\.log.*user/i,
                        /console\.log.*email/i,
                        /console\.log.*password/i,
                        /logger\.(info|debug|error).*user/i,
                        /logger\.(info|debug|error).*email/i,
                        /log\.(info|debug|error).*user/i,
                    ];
                    logPatterns.forEach((pattern) => {
                        if (pattern.test(line)) {
                            findings.push({
                                id: `pii-logs-${Date.now()}-${Math.random()}`,
                                type: 'pii-in-logs',
                                severity: 'high',
                                filePath,
                                line: index + 1,
                                description: 'Potential PII in log statement detected',
                                suggestion: 'Remove PII from logs. Use user IDs instead of email/name. Sanitize log data before logging',
                            });
                        }
                    });
                    // Check for direct logging of variables that might contain PII
                    if (line.includes('console.log') && line.includes('req.body')) {
                        findings.push({
                            id: `pii-logs-${Date.now()}-${Math.random()}`,
                            type: 'pii-in-logs',
                            severity: 'critical',
                            filePath,
                            line: index + 1,
                            description: 'Direct logging of req.body may expose PII',
                            suggestion: 'Never log req.body directly. Sanitize or redact PII before logging',
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
    async checkUnencryptedPII() {
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
                    // Check for storage of PII without encryption
                    const piiStoragePatterns = [
                        { pattern: /password\s*=\s*['"`]/, type: 'custom', severity: 'critical' },
                        { pattern: /email\s*=\s*['"`]/, type: 'email', severity: 'high' },
                        { pattern: /ssn\s*=\s*['"`]/, type: 'ssn', severity: 'critical' },
                        { pattern: /credit.*card\s*=\s*['"`]/, type: 'credit-card', severity: 'critical' },
                    ];
                    piiStoragePatterns.forEach(({ pattern, type, severity }) => {
                        if (pattern.test(line)) {
                            const isEncrypted = line.includes('encrypt') || line.includes('hash') || line.includes('bcrypt');
                            if (!isEncrypted) {
                                findings.push({
                                    id: `unencrypted-pii-${Date.now()}-${Math.random()}`,
                                    type: 'unencrypted-pii',
                                    severity,
                                    filePath,
                                    line: index + 1,
                                    description: `Unencrypted PII storage detected: ${type}`,
                                    suggestion: 'Always encrypt or hash sensitive PII before storage. Use bcrypt for passwords, encryption for other PII',
                                    piiType: type,
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
    async checkRetentionPolicies() {
        const findings = [];
        const sqlFiles = this.findSQLFiles();
        let hasRetentionPolicy = false;
        for (const filePath of sqlFiles) {
            try {
                if (!validatePath(filePath, this.config.projectRoot)) {
                    continue;
                }
                const stats = fs.statSync(filePath);
                if (!validateFileSize(stats.size, 10)) {
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const lowerContent = content.toLowerCase();
                // Check for data retention policies
                if (lowerContent.includes('retention') || lowerContent.includes('ttl') || lowerContent.includes('expire')) {
                    hasRetentionPolicy = true;
                }
            }
            catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
            }
        }
        if (!hasRetentionPolicy) {
            findings.push({
                id: `missing-retention-${Date.now()}`,
                type: 'missing-retention-policy',
                severity: 'medium',
                filePath: this.config.projectRoot,
                description: 'No data retention policy found in database schemas',
                suggestion: 'Implement data retention policies to automatically delete old data and comply with privacy regulations',
            });
        }
        return findings;
    }
    findSQLFiles() {
        const sqlFiles = [];
        const scanDirectory = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        scanDirectory(fullPath);
                    }
                    else if (stat.isFile() && item.endsWith('.sql')) {
                        sqlFiles.push(fullPath);
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
            }
        };
        scanDirectory(this.config.projectRoot);
        return sqlFiles;
    }
    findSourceFiles() {
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
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
            piiInSchemas: findings.filter((f) => f.type === 'pii-in-schema').length,
            missingAccountDeletion: findings.filter((f) => f.type === 'missing-account-deletion').length,
            missingDataExport: findings.filter((f) => f.type === 'missing-data-export').length,
            piiInLogs: findings.filter((f) => f.type === 'pii-in-logs').length,
            unencryptedPII: findings.filter((f) => f.type === 'unencrypted-pii').length,
            missingRetentionPolicies: findings.filter((f) => f.type === 'missing-retention-policy').length,
        };
    }
}
//# sourceMappingURL=phase-3g-data-privacy-pii.js.map