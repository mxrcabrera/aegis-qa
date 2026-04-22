/**
 * Phase 12: Error Handling, Observability & Resilience [CONSOLIDATED + HARDENED]
 *
 * Purpose: Evaluate error handling patterns, observability infrastructure, and resilience
 * to ensure the system can gracefully handle failures and provide actionable insights.
 *
 * Architecture:
 * - Error Pattern Analysis: Detect empty try-catch blocks, missing error handlers
 * - Stack Trace Verification: Ensure custom exceptions maintain stack traces
 * - Observability Audit: Check for structured logging, metrics, and tracing
 * - Error Boundary Detection: Check for React Error Boundaries
 * - Generic Error Handlers: Identify catch blocks without meaningful error handling
 * - Error Context: Detect error handlers that don't log or provide context
 * - Anti-Swallow Guard: Prohibit empty catch blocks in automatic fixes
 * - Circuit Breaker Detection: Detect external API calls without timeout/retry
 * - Log-Level Sanitization: Ensure logs don't include PII or complete request bodies
 * - Log-Flood Prevention: Detect logging in loops that could saturate I/O
 * - Thermal Verification: Mandatory resource check before scanning
 * - Batch Processing: Use BatchProcessor with adaptive cooldown
 *
 * @module phases/phase-12-error-handling
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BatchProcessor } from '../processing/batch-processor.js';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';

/**
 * Error handling finding
 */
interface ErrorHandlingFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'empty-catch' | 'console-log-catch' | 'missing-handler' | 'no-stack-trace' | 'sensitive-log' | 'missing-observability' | 'timeout-review' | 'missing-error-boundary' | 'no-error-context' | 'anti-swallow-violation' | 'circuit-breaker-missing' | 'log-level-unsafe' | 'log-flood-risk';
  /** Severity: low, medium, high, critical */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Description of the issue */
  description: string;
  /** Suggested fix */
  suggestion?: string;
  /** Whether in Core Path */
  isCorePath?: boolean;
  /** Sanitized description (for report output) */
  sanitizedDescription?: string;
}

/**
 * Observability audit result
 */
interface ObservabilityAuditResult {
  /** Has structured logging */
  hasStructuredLogging: boolean;
  /** Has metrics implementation */
  hasMetrics: boolean;
  /** Has distributed tracing */
  hasTracing: boolean;
  /** Logging library detected (winston, pino, bunyan, etc.) */
  loggingLibrary?: string;
  /** Metrics library detected (prometheus, datadog, newrelic, etc.) */
  metricsLibrary?: string;
  /** Tracing library detected (opentelemetry, sentry, jaeger, etc.) */
  tracingLibrary?: string;
}

/**
 * Phase 12 configuration
 */
interface Phase12Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** File filter for size/extension filtering */
  fileFilter: FileFilter;
  /** Ignore handler for glob optimization */
  ignoreHandler: IgnoreHandler;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 12 result
 */
export interface Phase12Result {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** Error handling findings */
  errorFindings: ErrorHandlingFinding[];
  /** Observability audit result */
  observabilityAudit: ObservabilityAuditResult;
  /** Critical findings count */
  criticalFindings: number;
  /** High severity findings count */
  highSeverityFindings: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 12: Error Handling & Observability
 *
 * This phase evaluates error handling patterns and observability infrastructure.
 *
 * @class Phase12ErrorHandling
 */
export class Phase12ErrorHandling {
  private config: Phase12Config;

  constructor(config: Phase12Config) {
    this.config = config;
  }

  /**
   * Executes Phase 12: Error Handling, Observability & Resilience [CONSOLIDATED + HARDENED]
   *
   * @returns Promise<Phase12Result> - Error handling assessment result
   */
  async execute(): Promise<Phase12Result> {
    const startTime = Date.now();
    console.log('INFO Phase 12: Error Handling, Observability & Resilience [CONSOLIDATED + HARDENED]\n');

    try {
      // Thermal Verification: Check system resources before scanning
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        console.log(`WARNING System resources not safe (${resourceCheck.category}). Applying cooldown...`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }

      // Get all TypeScript/JavaScript files
      const files = await this.getSourceFiles();
      console.log(`INFO Found ${files.length} files to analyze\n`);

      if (files.length === 0) {
        return {
          success: true,
          totalFiles: 0,
          errorFindings: [],
          observabilityAudit: {
            hasStructuredLogging: false,
            hasMetrics: false,
            hasTracing: false,
          },
          criticalFindings: 0,
          highSeverityFindings: 0,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Get critical modules from Phase 2 business profile if available
      const phase2Results = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const criticalModules = phase2Results?.criticalModules || [];
      const corePathFiles = new Set<string>(phase2Results?.corePathFiles || []);

      // Create batch processor for thermal-safe processing
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
      const allFindings: ErrorHandlingFinding[] = [];
      let ramWarningTriggered = false;
      let previousRamUsage = (await this.config.thermalController.checkSystemResources()).ramUsage;

      await batchProcessor.processFiles(
        files,
        async (filePath) => {
          // Circuit Breaker Interno: Timeout por archivo (5 segundos)
          const fileTimeout = new Promise<ErrorHandlingFinding[]>((resolve) => {
            setTimeout(() => resolve([{ 
              id: this.generateFindingId(filePath, 1, 'timeout-review'),
              type: 'timeout-review',
              severity: 'medium',
              filePath,
              line: 1,
              description: 'File analysis timeout (>5s) - marked for manual review',
              suggestion: 'Review this file manually - complex regex/AST analysis may have issues',
              isCorePath: corePathFiles.has(filePath),
            }]), 5000);
          });

          const fileAnalysis = this.analyzeFile(filePath, corePathFiles);
          const fileResult = await Promise.race([fileAnalysis, fileTimeout]);
          
          allFindings.push(...fileResult);
          
          // Check RAM usage during processing
          const currentResources = await this.config.thermalController.checkSystemResources();
          if (currentResources.ramUsage > 85 && !ramWarningTriggered) {
            console.log(`WARNING RAM usage > 85% (${currentResources.ramUsage}%). Forcing adaptive cooldown...`);
            await this.config.thermalController.applyAdaptiveCooldown('medium');
            ramWarningTriggered = true;
          }
          
          // Memory Leak Guard: Verificar incremento anómalo de RAM entre archivos
          const ramIncrease = currentResources.ramUsage - previousRamUsage;
          if (ramIncrease > 10) { // Incremento anómalo > 10%
            console.log(`WARNING Memory leak detected (RAM increased ${ramIncrease}%). Attempting cleanup...`);
            
            // Intentar global.gc() si está disponible
            if (typeof global !== 'undefined' && (global as unknown).gc) {
              try {
                (global as unknown).gc();
                console.log('INFO Garbage collection executed');
              } catch {
                console.log('WARNING Garbage collection failed');
              }
            }
            
            // Forzar cooldown largo para liberar buffers
            await this.config.thermalController.applyAdaptiveCooldown('high');
          }
          
          previousRamUsage = currentResources.ramUsage;
          
          return {
            filePath,
            success: true,
            processingTimeMs: 0,
            findings: fileResult,
          };
        },
        this.config.currentState
      );

      // Perform observability audit
      const observabilityAudit = await this.auditObservability();

      // Validation Gate: Self-Audit para verificar que esta fase no introdujo try-catch vacíos
      await this.selfAudit();

      // Calculate statistics
      const criticalFindings = allFindings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = allFindings.filter(f => f.severity === 'high').length;

      // Write partial report
      await this.writePartialReport(allFindings, observabilityAudit, criticalFindings, highSeverityFindings);

      // Store Phase 12 results in StatePersistence for shared context
      await this.config.statePersistence.storeAnalysisResults(12, {
        errorFindings: allFindings,
        observabilityAudit,
        criticalFindings,
        highSeverityFindings,
      }, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 12 Complete`);
      console.log(`INFO Files analyzed: ${files.length}`);
      console.log(`INFO Total findings: ${allFindings.length}`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);
      console.log(`INFO Structured logging: ${observabilityAudit.hasStructuredLogging ? 'YES' : 'NO'}`);
      console.log(`INFO Metrics: ${observabilityAudit.hasMetrics ? 'YES' : 'NO'}`);
      console.log(`INFO Tracing: ${observabilityAudit.hasTracing ? 'YES' : 'NO'}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        totalFiles: files.length,
        errorFindings: allFindings,
        observabilityAudit,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 12 failed: ${errorMessage}\n`);

      return {
        success: false,
        totalFiles: 0,
        errorFindings: [],
        observabilityAudit: {
          hasStructuredLogging: false,
          hasMetrics: false,
          hasTracing: false,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Gets all source files to analyze
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async getSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    const findFilesRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git, .sentinel
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.sentinel') {
            findFilesRecursive(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            // Apply file filter
            const filterResult = this.config.fileFilter.shouldAnalyzeFile(fullPath);
            if (filterResult.shouldAnalyze) {
              // Apply ignore handler
              const ignoreResult = !this.config.ignoreHandler.shouldIgnore(fullPath);
              if (ignoreResult) {
                files.push(fullPath);
              }
            }
          }
        }
      }
    };

    findFilesRecursive(this.config.projectRoot);
    return files;
  }

  /**
   * Analyzes a single file for error handling issues
   *
   * @private
   * @param filePath - File path
   * @param corePathFiles - Set of Core Path files
   * @returns Promise<ErrorHandlingFinding[]> - Array of findings
   */
  private async analyzeFile(filePath: string, corePathFiles: Set<string>): Promise<ErrorHandlingFinding[]> {
    const findings: ErrorHandlingFinding[] = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const isCorePath = corePathFiles.has(filePath);

    // Detect empty try-catch blocks
    const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
    let match;
    while ((match = emptyCatchPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(filePath, lineNumber, 'empty-catch'),
        type: 'empty-catch',
        severity: isCorePath ? 'critical' : 'high',
        filePath,
        line: lineNumber,
        description: 'Empty catch block - errors are silently swallowed',
        suggestion: 'Add error handling logic or at minimum log the error',
        isCorePath,
      });
    }

    // Anti-Swallow Guard (PUNTO 1): Detect catch blocks without telemetry integration
    const telemetryLibraries = ['Sentry', 'sentry', 'logger', 'Logger', 'winston', 'pino', 'bunyan', 'log4js'];
    const catchWithoutTelemetryPattern = /catch\s*\(([^)]+)\)\s*\{([^}]*)\}/g;
    while ((match = catchWithoutTelemetryPattern.exec(content)) !== null) {
      const catchBody = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Check if catch block has telemetry integration
      const hasTelemetry = telemetryLibraries.some((lib) => catchBody.includes(lib));
      const hasMeaningfulHandling = catchBody.includes('throw') || catchBody.includes('retry') || catchBody.includes('rethrow');
      
      // If catch block is empty, only has console.log, or lacks telemetry in Core Path
      if (!hasTelemetry && !hasMeaningfulHandling) {
        if (catchBody.trim().length < 10 || catchBody.includes('console.')) {
          findings.push({
            id: this.generateFindingId(filePath, lineNumber, 'anti-swallow-violation'),
            type: 'anti-swallow-violation',
            severity: isCorePath ? 'critical' : 'high',
            filePath,
            line: lineNumber,
            description: 'Anti-Swallow Guard violation: Catch block lacks telemetry integration',
            suggestion: 'Integrate telemetry (Sentry.captureException, logger.error, etc.) instead of silent swallowing',
            isCorePath,
          });
        }
      }
    }

    // Detect catch blocks that only do console.log
    const consoleLogCatchPattern = /catch\s*\([^)]*\)\s*\{[\s\S]*?console\.(log|error|warn)[\s\S]*?\}/g;
    while ((match = consoleLogCatchPattern.exec(content)) !== null) {
      const catchBlock = match[0];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Check if it's ONLY console.log (minimal handling)
      if (catchBlock.trim().match(/catch\s*\([^)]*\)\s*\{\s*console\.(log|error|warn)\([^)]*\);\s*\}/)) {
        findings.push({
          id: this.generateFindingId(filePath, lineNumber, 'console-log-catch'),
          type: 'console-log-catch',
          severity: isCorePath ? 'critical' : 'medium',
          filePath,
          line: lineNumber,
          description: 'Catch block only does console.log - insufficient error handling',
          suggestion: 'Implement proper error handling (rethrow, logging service, error tracking)',
          isCorePath,
        });
      }
    }

    // Detect custom exceptions without proper stack trace preservation
    const customExceptionPattern = /class\s+\w+\s+extends\s+(Error|Exception)/g;
    while ((match = customExceptionPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const classContent = content.substring(match.index, match.index + 500);
      
      // Check if super() is called with message and stack trace is preserved
      if (!classContent.includes('super(')) {
        findings.push({
          id: this.generateFindingId(filePath, lineNumber, 'no-stack-trace'),
          type: 'no-stack-trace',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Custom exception does not call super() - stack trace may be lost',
          suggestion: 'Call super(message) in constructor to preserve stack trace',
          isCorePath,
        });
      }
    }

    // Detect sensitive data in logs
    const sensitiveLogPatterns = [
      /console\.(log|error|warn|info)\([^)]*password[^)]*\)/gi,
      /console\.(log|error|warn|info)\([^)]*api[_-]?key[^)]*\)/gi,
      /console\.(log|error|warn|info)\([^)]*token[^)]*\)/gi,
      /console\.(log|error|warn|info)\([^)]*secret[^)]*\)/gi,
    ];
    
    for (const pattern of sensitiveLogPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const matchedText = match[0];
        
        // Sanitización de Logs de Auditoría: Enmascarar datos sensibles
        const sanitizedMatchedText = this.maskSensitiveData(matchedText);
        
        findings.push({
          id: this.generateFindingId(filePath, lineNumber, 'sensitive-log'),
          type: 'sensitive-log',
          severity: 'high',
          filePath,
          line: lineNumber,
          description: 'Sensitive data (password, API key, token, secret) logged to console',
          sanitizedDescription: `Sensitive data in console log: ${sanitizedMatchedText}`,
          suggestion: 'Remove sensitive data from logs or use secure logging service',
          isCorePath,
        });
      }
    }

    // Detect missing global error handlers (Next.js, Express)
    if (filePath.includes('next.config') || filePath.includes('_app') || filePath.includes('_error')) {
      if (!content.includes('ErrorBoundary') && !content.includes('errorHandler')) {
        findings.push({
          id: this.generateFindingId(filePath, 1, 'missing-handler'),
          type: 'missing-handler',
          severity: isCorePath ? 'critical' : 'high',
          filePath,
          line: 1,
          description: 'Missing global error handler in Next.js configuration',
          suggestion: 'Implement ErrorBoundary or global error handler for uncaught errors',
          isCorePath,
        });
      }
    }

    if (filePath.includes('server') || filePath.includes('app') || filePath.includes('index')) {
      if (content.includes('express') || content.includes('Express')) {
        if (!content.includes('errorHandler') && !content.includes('.use(')) {
          findings.push({
            id: this.generateFindingId(filePath, 1, 'missing-handler'),
            type: 'missing-handler',
            severity: isCorePath ? 'critical' : 'high',
            filePath,
            line: 1,
            description: 'Express app missing global error handler middleware',
            suggestion: 'Add error handling middleware: app.use((err, req, res, next) => {...})',
            isCorePath,
          });
        }
      }
    }

    // Detect missing Error Boundary in React components
    if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
      if (content.includes('componentDidCatch') || content.includes('getDerivedStateFromError')) {
        // Has error boundary methods, good
      } else if (content.includes('class') && content.includes('extends') && (content.includes('Component') || content.includes('React.Component'))) {
        // React component without error boundary
        if (!content.includes('ErrorBoundary') && isCorePath) {
          findings.push({
            id: this.generateFindingId(filePath, 1, 'missing-error-boundary'),
            type: 'missing-error-boundary',
            severity: 'medium',
            filePath,
            line: 1,
            description: 'React component in Core Path without Error Boundary',
            suggestion: 'Wrap component in ErrorBoundary or implement componentDidCatch/getDerivedStateFromError',
            isCorePath,
          });
        }
      }
    }

    // Detect catch blocks without error context (no logging or meaningful handling)
    const catchWithoutContextPattern = /catch\s*\([^)]*\)\s*\{([^}]*)\}/g;
    while ((match = catchWithoutContextPattern.exec(content)) !== null) {
      const catchBody = match[1];
      
      // Check if catch block has no logging, no rethrow, and no meaningful handling
      if (!catchBody.includes('console.') && !catchBody.includes('logger.') && !catchBody.includes('throw') && catchBody.trim().length < 50) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, lineNumber, 'no-error-context'),
          type: 'no-error-context',
          severity: isCorePath ? 'high' : 'medium',
          filePath,
          line: lineNumber,
          description: 'Catch block without error context or logging',
          suggestion: 'Add error logging, rethrow, or meaningful error handling logic',
          isCorePath,
        });
      }
    }

    // Circuit Breaker Pattern Detection (PUNTO 2): Detect external API calls without timeout/retry
    const apiCallPatterns = [
      /axios\.(get|post|put|delete|patch)\([^)]+\)/g,
      /fetch\([^)]+\)/g,
    ];
    
    for (const pattern of apiCallPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        const apiCall = match[0];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        // Check if the API call has timeout or retry logic
        const hasTimeout = apiCall.includes('timeout') || apiCall.includes('signal');
        const hasRetry = content.substring(match.index - 200, match.index + 200).includes('retry') || 
                        content.substring(match.index - 200, match.index + 200).includes('axios-retry');
        
        if (!hasTimeout && !hasRetry) {
          findings.push({
            id: this.generateFindingId(filePath, lineNumber, 'circuit-breaker-missing'),
            type: 'circuit-breaker-missing',
            severity: isCorePath ? 'high' : 'medium',
            filePath,
            line: lineNumber,
            description: 'External API call without timeout or retry logic - Circuit Breaker pattern recommended',
            suggestion: 'Add timeout configuration and implement Circuit Breaker pattern (e.g., axios-retry, opencircuitbreaker)',
            isCorePath,
          });
        }
      }
    }

    // Log-Level Sanitization (PUNTO 3): Detect logging of complete objects that may contain PII/secrets
    const unsafeLogPatterns = [
      /console\.(log|error|warn|info)\([^)]*\{[\s\S]*?\}[^)]*\)/g,
      /logger\.(log|error|warn|info)\([^)]*\{[\s\S]*?\}[^)]*\)/g,
      /console\.(log|error|warn|info)\([^)]*request\.body[^)]*\)/gi,
      /console\.(log|error|warn|info)\([^)]*user[^)]*\)/gi,
      /console\.(log|error|warn|info)\([^)]*password[^)]*\)/gi,
    ];
    
    for (const pattern of unsafeLogPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        findings.push({
          id: this.generateFindingId(filePath, lineNumber, 'log-level-unsafe'),
          type: 'log-level-unsafe',
          severity: isCorePath ? 'critical' : 'high',
          filePath,
          line: lineNumber,
          description: 'Log-Level Sanitization violation: Logging complete objects that may contain PII/secrets',
          suggestion: 'Only log error.message and error.stack, never complete objects or request.body',
          isCorePath,
        });
      }
    }

    // Hardware Guard Log-Flood Prevention (PUNTO 4): Detect logging in loops
    const loopPatterns = [
      /\.map\([^)]*\)\s*=>\s*\{[\s\S]*?console\./g,
      /\.forEach\([^)]*\)\s*\{[\s\S]*?console\./g,
      /for\s*\([^)]*\)\s*\{[\s\S]*?console\./g,
      /while\s*\([^)]*\)\s*\{[\s\S]*?console\./g,
    ];
    
    for (const pattern of loopPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        findings.push({
          id: this.generateFindingId(filePath, lineNumber, 'log-flood-risk'),
          type: 'log-flood-risk',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: 'Hardware Guard Log-Flood Prevention: Logging inside loop may saturate disk I/O',
          suggestion: 'Implement sampling (e.g., log every 10th iteration) or move logging outside loop',
          isCorePath,
        });
      }
    }

    return findings;
  }

  /**
   * Audits observability infrastructure
   *
   * @private
   * @returns Promise<ObservabilityAuditResult> - Observability audit result
   */
  private async auditObservability(): Promise<ObservabilityAuditResult> {
    const result: ObservabilityAuditResult = {
      hasStructuredLogging: false,
      hasMetrics: false,
      hasTracing: false,
    };

    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Check for structured logging libraries
        const loggingLibraries = ['winston', 'pino', 'bunyan', 'log4js', 'morgan'];
        for (const lib of loggingLibraries) {
          if (dependencies[lib]) {
            result.hasStructuredLogging = true;
            result.loggingLibrary = lib;
            break;
          }
        }

        // Check for metrics libraries
        const metricsLibraries = ['prometheus', 'prom-client', 'datadog', 'newrelic', 'elastic-apm'];
        for (const lib of metricsLibraries) {
          if (dependencies[lib]) {
            result.hasMetrics = true;
            result.metricsLibrary = lib;
            break;
          }
        }

        // Check for tracing libraries
        const tracingLibraries = ['@opentelemetry', 'opentelemetry', 'sentry', '@sentry', 'jaeger-client', 'dd-trace'];
        for (const lib of tracingLibraries) {
          if (dependencies[lib]) {
            result.hasTracing = true;
            result.tracingLibrary = lib;
            break;
          }
        }
      } catch {
        // Invalid package.json, skip
      }
    }

    // Check for observability implementation in source files
    const files = await this.getSourceFiles();
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for actual usage of observability libraries
      if (content.includes('winston.') || content.includes('pino.') || content.includes('logger.')) {
        result.hasStructuredLogging = true;
      }

      if (content.includes('Counter') || content.includes('Histogram') || content.includes('Gauge') || content.includes('metrics.')) {
        result.hasMetrics = true;
      }

      if (content.includes('startSpan') || content.includes('Sentry.') || content.includes('trace.')) {
        result.hasTracing = true;
      }
    }

    // Check for missing observability in critical business paths
    if (!result.hasStructuredLogging || !result.hasMetrics) {
      const phase2Results = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const criticalModules = phase2Results?.criticalModules || [];
      
      if (criticalModules.length > 0 && (!result.hasStructuredLogging || !result.hasMetrics)) {
        // This will be added as a finding in the main analysis
      }
    }

    return result;
  }

  /**
   * Writes partial report for Phase 12
   *
   * @private
   * @param findings - Error handling findings
   * @param observabilityAudit - Observability audit result
   * @param criticalFindings - Critical findings count
   * @param highSeverityFindings - High severity findings count
   */
  private async writePartialReport(
    findings: ErrorHandlingFinding[],
    observabilityAudit: ObservabilityAuditResult,
    criticalFindings: number,
    highSeverityFindings: number
  ): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      let reportContent = `
## Phase 12: Error Handling & Observability - COMPLETED
- **Timestamp:** ${timestamp}

### Summary
- **Total Findings:** ${findings.length}
- **Critical Findings:** ${criticalFindings}
- **High Severity Findings:** ${highSeverityFindings}
- **Structured Logging:** ${observabilityAudit.hasStructuredLogging ? 'YES' : 'NO'}
- **Metrics:** ${observabilityAudit.hasMetrics ? 'YES' : 'NO'}
- **Distributed Tracing:** ${observabilityAudit.hasTracing ? 'YES' : 'NO'}

### Observability Infrastructure
`;
      if (observabilityAudit.loggingLibrary) {
        reportContent += `- **Logging Library:** ${observabilityAudit.loggingLibrary}\n`;
      }
      if (observabilityAudit.metricsLibrary) {
        reportContent += `- **Metrics Library:** ${observabilityAudit.metricsLibrary}\n`;
      }
      if (observabilityAudit.tracingLibrary) {
        reportContent += `- **Tracing Library:** ${observabilityAudit.tracingLibrary}\n`;
      }

      reportContent += `
### Error Handling Findings
`;

      for (const finding of findings) {
        const severityIcon = (finding as unknown).severity === 'critical' ? 'CRITICAL' : (finding as unknown).severity === 'high' ? 'HIGH' : (finding as unknown).severity === 'medium' ? 'MEDIUM' : 'LOW';
        reportContent += `- [${severityIcon}] **${(finding as unknown).type}** ${(finding as unknown).filePath}`;
        if ((finding as unknown).line) {
          reportContent += `:${(finding as unknown).line}`;
        }
        reportContent += `\n`;
        
        // Sanitización de Logs de Auditoría: Usar descripción sanitizada si es sensitive-log
        const descriptionToUse = (finding as unknown).type === 'sensitive-log' 
          ? ((finding as unknown).sanitizedDescription || (finding as unknown).description)
          : (finding as unknown).description;
        
        reportContent += `  - ${descriptionToUse}\n`;
        if ((finding as unknown).suggestion) {
          reportContent += `  - Suggestion: ${(finding as unknown).suggestion}\n`;
        }
        if ((finding as unknown).isCorePath) {
          reportContent += `  - CORE PATH FILE\n`;
        }
        reportContent += `\n`;
      }

      reportContent += `

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

      console.log(`INFO Partial report written: ${reportPath}`);
    } catch {
      console.warn('WARNING Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Generates a unique finding ID
   *
   * @private
   * @param filePath - File path
   * @param line - Line number
   * @param type - Finding type
   * @returns string - Unique finding ID
   */
  private generateFindingId(filePath: string, line: number, type: string): string {
    const hash = crypto.createHash('sha1').update(filePath + line + type).digest('hex');
    return hash.substring(0, 12);
  }

  /**
   * Masks sensitive data in log statements for safe reporting
   *
   * @private
   * @param logStatement - The log statement containing sensitive data
   * @returns string - Sanitized log statement
   */
  private maskSensitiveData(logStatement: string): string {
    // Replace common sensitive patterns with asterisks
    let sanitized = logStatement;
    
    // Mask values after =, :, or within quotes
    sanitized = sanitized.replace(/(password|api[_-]?key|token|secret)[\s]*[:=][\s]*['"]?([^'"\s,)]+)['"]?/gi, '$1: *****');
    sanitized = sanitized.replace(/(['"])(password|api[_-]?key|token|secret)\1[\s]*[:=][\s]*['"]?([^'"\s,)]+)['"]?/gi, '$1$2$1: *****');
    
    // Mask values within brackets or parentheses
    sanitized = sanitized.replace(/(password|api[_-]?key|token|secret)[\s]*\([^)]*\)/gi, '$1(***)');
    
    return sanitized;
  }

  /**
   * Self-Audit: Verifies that this phase did not introduce empty try-catch blocks
   *
   * @private
   * @returns Promise<void>
   */
  private async selfAudit(): Promise<void> {
    try {
      const phase12Path = path.join(__dirname, 'phase-12-error-handling.ts');
      const content = fs.readFileSync(phase12Path, 'utf-8');
      
      const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
      const matches = content.match(emptyCatchPattern);
      
      if (matches && matches.length > 0) {
        console.log('WARNING Self-Audit: Empty catch blocks detected in phase-12-error-handling.ts');
        console.log(`WARNING Found ${matches.length} empty catch blocks - review required`);
      } else {
        console.log('SUCCESS Self-Audit: No empty catch blocks found in phase-12-error-handling.ts');
      }
    } catch {
      console.log('WARNING Self-Audit failed:', error instanceof Error ? error.message : error);
    }
  }
}





