/**
 * Phase 3B: AI API Integration Security
 *
 * Purpose: Analyze AI API integrations for security vulnerabilities including
 * prompt injection, API key exposure, cost limits, and output validation.
 *
 * Architecture:
 * - Prompt Injection Detection: Detect patterns vulnerable to prompt injection
 * - API Key Exposure: Check for hardcoded AI API keys in client code
 * - Cost Limits: Verify cost limits and rate limiting implementations
 * - Output Validation: Check for proper AI output validation and sanitization
 *
 * @module phases/phase-3b-ai-api-security
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

interface AIAPIFinding {
  id: string;
  type: 'prompt-injection' | 'key-exposure' | 'missing-cost-limit' | 'missing-output-validation' | 'unsafe-ai-usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath: string;
  line?: number;
  description: string;
  suggestion?: string;
  apiProvider?: 'openai' | 'anthropic' | 'cohere' | 'huggingface' | 'custom';
}

interface AIAPIsMetrics {
  totalFiles: number;
  promptInjectionVulnerabilities: number;
  exposedKeys: number;
  missingCostLimits: number;
  missingOutputValidation: number;
  unsafeAIUsage: number;
}

interface Phase3BConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
}

export interface Phase3BResult {
  success: boolean;
  findings: AIAPIFinding[];
  metrics: AIAPIsMetrics;
  criticalFindings: number;
  highSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class Phase3BAIAPIIntegration {
  private config: Phase3BConfig;

  constructor(config: Phase3BConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<Phase3BResult> {
    const startTime = Date.now();
    console.log('INFO Phase 3B: AI API Integration Security\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Scanning for AI API integrations...\n');
      const sourceFiles = this.findSourceFiles();
      console.log(`INFO Found ${sourceFiles.length} source files\n`);

      const findings = await this.analyzeAIAPIIntegrations(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Prompt injection vulnerabilities: ${metrics.promptInjectionVulnerabilities}`);
      console.log(`INFO Exposed API keys: ${metrics.exposedKeys}`);
      console.log(`INFO Missing cost limits: ${metrics.missingCostLimits}`);
      console.log(`INFO Missing output validation: ${metrics.missingOutputValidation}\n`);

      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase3BResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 3B Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase3BResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          promptInjectionVulnerabilities: 0,
          exposedKeys: 0,
          missingCostLimits: 0,
          missingOutputValidation: 0,
          unsafeAIUsage: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 3B:', sanitizedError);
      return result;
    }
  }

  private findSourceFiles(): string[] {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py'];
    const sourceFiles: string[] = [];

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
            sourceFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return sourceFiles;
  }

  private async analyzeAIAPIIntegrations(sourceFiles: string[]): Promise<AIAPIFinding[]> {
    const findings: AIAPIFinding[] = [];

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          console.warn(`Invalid path: ${filePath}`);
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          console.warn(`File too large: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const sanitizedContent = censorSecrets(content);

        const fileFindings = this.analyzeFileForAIAPI(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private analyzeFileForAIAPI(filePath: string, content: string): AIAPIFinding[] {
    const findings: AIAPIFinding[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Detect AI API providers
      const apiProvider = this.detectAPIProvider(line);

      if (apiProvider) {
        // Check for prompt injection vulnerabilities
        findings.push(...this.checkPromptInjection(filePath, index + 1, line, apiProvider));

        // Check for API key exposure
        findings.push(...this.checkKeyExposure(filePath, index + 1, line, apiProvider));

        // Check for cost limits
        findings.push(...this.checkCostLimits(filePath, index + 1, line, apiProvider));

        // Check for output validation
        findings.push(...this.checkOutputValidation(filePath, index + 1, line, apiProvider));
      }
    });

    return findings;
  }

  private detectAPIProvider(line: string): 'openai' | 'anthropic' | 'cohere' | 'huggingface' | 'custom' | null {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes('openai') || lowerLine.includes('gpt-')) return 'openai';
    if (lowerLine.includes('anthropic') || lowerLine.includes('claude')) return 'anthropic';
    if (lowerLine.includes('cohere')) return 'cohere';
    if (lowerLine.includes('huggingface') || lowerLine.includes('transformers')) return 'huggingface';
    if (lowerLine.includes('ai.') || lowerLine.includes('llm') || lowerLine.includes('completion')) return 'custom';

    return null;
  }

  private checkPromptInjection(filePath: string, line: number, content: string, apiProvider: string): AIAPIFinding[] {
    const findings: AIAPIFinding[] = [];
    const patterns = [
      /userInput\s*\+\s*['"`].*['"`]/, // String concatenation with user input
      /`\$\{.*user.*\}/, // Template literal with user input
      /message\.content\s*=\s*userInput/, // Direct assignment of user input
      /system:\s*userInput/, // User input in system message
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(content)) {
        findings.push({
          id: `prompt-injection-${Date.now()}-${Math.random()}`,
          type: 'prompt-injection',
          severity: 'critical',
          filePath,
          line,
          description: `Potential prompt injection vulnerability: user input used directly in AI prompt without sanitization`,
          suggestion: 'Sanitize and validate user input before including in AI prompts. Use allow-lists and length limits.',
          apiProvider: apiProvider as any,
        });
      }
    });

    return findings;
  }

  private checkKeyExposure(filePath: string, line: number, content: string, apiProvider: string): AIAPIFinding[] {
    const findings: AIAPIFinding[] = [];
    const patterns = [
      /api[_-]?key\s*=\s*['"`][a-zA-Z0-9_-]{20,}['"`]/, // Hardcoded API key
      /sk-[a-zA-Z0-9]{20,}/, // OpenAI API key pattern
      /anthropic[_-]?key\s*=\s*['"`][a-zA-Z0-9_-]{20,}['"`]/, // Anthropic key
    ];

    // Check if file is in client-side directory
    const isClientSide = filePath.includes('/app/') || filePath.includes('/pages/') || filePath.includes('/components/');

    patterns.forEach((pattern) => {
      if (pattern.test(content)) {
        findings.push({
          id: `key-exposure-${Date.now()}-${Math.random()}`,
          type: 'key-exposure',
          severity: isClientSide ? 'critical' : 'high',
          filePath,
          line,
          description: `AI API key exposed in ${isClientSide ? 'client-side code' : 'source code'}`,
          suggestion: isClientSide 
            ? 'Move API key calls to server actions or API routes. Never expose API keys in client code.'
            : 'Use environment variables and secret management. Never commit API keys to source code.',
          apiProvider: apiProvider as any,
        });
      }
    });

    return findings;
  }

  private checkCostLimits(filePath: string, line: number, content: string, apiProvider: string): AIAPIFinding[] {
    const findings: AIAPIFinding[] = [];
    
    // Check if max_tokens or similar cost controls are missing in API calls
    const hasAPIcall = content.includes('completion') || content.includes('chat.completions');
    const hasCostControl = content.includes('max_tokens') || content.includes('max_completion_tokens') || content.includes('limit');

    if (hasAPIcall && !hasCostControl) {
      findings.push({
        id: `missing-cost-limit-${Date.now()}-${Math.random()}`,
        type: 'missing-cost-limit',
        severity: 'medium',
        filePath,
        line,
        description: `AI API call without cost limits (max_tokens) - potential for excessive costs`,
        suggestion: 'Always set max_tokens or equivalent cost limits to prevent runaway costs from long AI responses.',
        apiProvider: apiProvider as any,
      });
    }

    return findings;
  }

  private checkOutputValidation(filePath: string, line: number, content: string, apiProvider: string): AIAPIFinding[] {
    const findings: AIAPIFinding[] = [];
    
    // Check if AI output is used directly without validation
    const patterns = [
      /response\.choices\[0\]\.message\.content/, // Direct use of OpenAI response
      /message\.content\s*=\s*aiResponse/, // Direct assignment
      /return.*aiResponse/, // Direct return without validation
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(content)) {
        findings.push({
          id: `missing-output-validation-${Date.now()}-${Math.random()}`,
          type: 'missing-output-validation',
          severity: 'medium',
          filePath,
          line,
          description: `AI output used directly without validation or sanitization`,
          suggestion: 'Always validate and sanitize AI output before using it. Check for malicious content, length limits, and expected format.',
          apiProvider: apiProvider as any,
        });
      }
    });

    return findings;
  }

  private calculateMetrics(findings: AIAPIFinding[]): AIAPIsMetrics {
    return {
      totalFiles: findings.length > 0 ? new Set(findings.map((f) => f.filePath)).size : 0,
      promptInjectionVulnerabilities: findings.filter((f) => f.type === 'prompt-injection').length,
      exposedKeys: findings.filter((f) => f.type === 'key-exposure').length,
      missingCostLimits: findings.filter((f) => f.type === 'missing-cost-limit').length,
      missingOutputValidation: findings.filter((f) => f.type === 'missing-output-validation').length,
      unsafeAIUsage: findings.filter((f) => f.type === 'unsafe-ai-usage').length,
    };
  }
}
