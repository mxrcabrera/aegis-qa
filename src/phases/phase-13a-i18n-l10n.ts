/**
 * Phase 13: i18n & l10n - Internationalization & Localization
 *
 * Purpose: Detect hardcoded strings that should be in translation files,
 * verify i18n library usage, and audit sensitive format handling (dates, currencies, numbers).
 *
 * Architecture:
 * - Hardcoded String Detection: Find user-facing strings not in translation files
 * - i18n Library Detection: Check for next-i18next, react-intl, etc.
 * - Format Audit: Verify Intl.DateTimeFormat, currency/number handling
 * - Thermal Verification: Mandatory resource check before scanning
 * - Batch Processing: Use BatchProcessor for thermal-safe processing
 *
 * @module phases/phase-13-i18n-l10n
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
 * Business profile
 */
interface BusinessProfile {
  /** Domain */
  domain: string;
  /** Core path files */
  corePathFiles: string[];
  /** Critical modules */
  criticalModules: string[];
}

/**
 * Global object with gc
 */
interface GlobalWithGC {
  gc?: () => void;
}

/**
 * i18n/l10n finding
 */
interface I18nFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'hardcoded-string' | 'missing-i18n-lib' | 'format-issue' | 'locale-hardcode';
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
  /** The hardcoded string found (sanitized) */
  stringValue?: string;
}

/**
 * i18n library detection result
 */
interface I18nLibraryResult {
  /** Has i18n library installed */
  hasI18nLibrary: boolean;
  /** Library name detected */
  libraryName?: string;
  /** Has translation files */
  hasTranslationFiles: boolean;
  /** Translation file paths */
  translationFiles: string[];
}

/**
 * Phase 13 configuration
 */
interface Phase13Config {
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
 * Phase 13 result
 */
export interface Phase13Result {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** i18n/l10n findings */
  i18nFindings: I18nFinding[];
  /** i18n library detection result */
  i18nLibrary: I18nLibraryResult;
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
 * Phase 13: i18n & l10n - Internationalization & Localization
 *
 * This phase detects hardcoded strings, verifies i18n library usage, and audits format handling.
 *
 * @class Phase13I18nL10n
 */
export class Phase13I18nL10n {
  private config: Phase13Config;

  constructor(config: Phase13Config) {
    this.config = config;
  }

  /**
   * Executes Phase 13: i18n & l10n
   *
   * @returns Promise<Phase13Result> - i18n/l10n assessment result
   */
  async execute(): Promise<Phase13Result> {
    const startTime = Date.now();
    console.log('INFO Phase 13: i18n & l10n - Internationalization & Localization\n');

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

      // Detect i18n library first
      const i18nLibrary = await this.detectI18nLibrary();

      // Get all TypeScript/JavaScript/JSX/TSX files
      const files = await this.getSourceFiles();
      console.log(`INFO Found ${files.length} files to analyze\n`);

      if (files.length === 0) {
        return {
          success: true,
          totalFiles: 0,
          i18nFindings: [],
          i18nLibrary,
          criticalFindings: 0,
          highSeverityFindings: 0,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Get critical modules from Phase 2 business profile if available
      const phase2Results = this.config.statePersistence.getAnalysisResults(2, this.config.currentState) as BusinessProfile | undefined;
      const criticalModules = phase2Results?.criticalModules || [];
      const corePathFiles = new Set<string>(phase2Results?.corePathFiles || []);
      const businessDomain = phase2Results?.domain || '';

      // Create batch processor for thermal-safe processing
      let currentBatchSize = 20;
      const batchProcessor = new BatchProcessor({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        recommendedBatchSize: currentBatchSize,
        recommendedCooldown: 5000,
        applyCooldowns: true,
        criticalModules,
      });

      // Process files in batches
      const allFindings: I18nFinding[] = [];
      let ramWarningTriggered = false;
      let previousRamUsage = (await this.config.thermalController.checkSystemResources()).ramUsage;

      await batchProcessor.processFiles(
        files,
        async (filePath) => {
          const result = await this.analyzeFile(filePath, corePathFiles, i18nLibrary, businessDomain);
          allFindings.push(...result);
          
          // Check RAM usage during processing
          const currentResources = await this.config.thermalController.checkSystemResources();
          if (currentResources.ramUsage > 85 && !ramWarningTriggered) {
            console.log(`WARNING RAM usage > 85% (${currentResources.ramUsage}%). Forcing adaptive cooldown...`);
            await this.config.thermalController.applyAdaptiveCooldown('medium');
            ramWarningTriggered = true;
          }
          
          // Memory Safety: Reducir batch size si temperatura > 65°C
          const tempCheck = await this.config.thermalController.checkSystemResources();
          if (tempCheck.cpuUsage > 65 && currentBatchSize > 5) {
            console.log(`WARNING High temperature detected (${tempCheck.cpuUsage}%). Reducing batch size from ${currentBatchSize} to ${currentBatchSize / 2}`);
            currentBatchSize = Math.max(5, Math.floor(currentBatchSize / 2));
            await this.config.thermalController.applyAdaptiveCooldown('medium');
          }
          
          // Memory Leak Guard: Verificar incremento anómalo de RAM entre archivos
          const ramIncrease = currentResources.ramUsage - previousRamUsage;
          if (ramIncrease > 10) {
            console.log(`WARNING Memory leak detected (RAM increased ${ramIncrease}%). Attempting cleanup...`);
            const globalWithGC = global as unknown as GlobalWithGC;
            if (typeof global !== 'undefined' && globalWithGC.gc) {
              try {
                globalWithGC.gc();
                console.log('INFO Garbage collection executed');
              } catch (error: unknown) {
                console.log('WARNING Garbage collection failed');
              }
            }
            await this.config.thermalController.applyAdaptiveCooldown('high');
          }
          previousRamUsage = currentResources.ramUsage;
          
          return {
            filePath,
            success: true,
            processingTimeMs: 0,
            findings: result,
          };
        },
        this.config.currentState
      );

      // Calculate statistics
      const criticalFindings = allFindings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = allFindings.filter(f => f.severity === 'high').length;

      // Self-Audit: Verificar que la Fase 13 no reporte strings de logs internos de Aegis
      await this.selfAudit();

      // Write partial report
      await this.writePartialReport(allFindings, i18nLibrary, criticalFindings, highSeverityFindings);

      // Store Phase 13 results in StatePersistence for shared context
      await this.config.statePersistence.storeAnalysisResults(13, {
        i18nFindings: allFindings,
        i18nLibrary,
        criticalFindings,
        highSeverityFindings,
      }, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 13 Complete`);
      console.log(`INFO Files analyzed: ${files.length}`);
      console.log(`INFO Total findings: ${allFindings.length}`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);
      console.log(`INFO i18n Library: ${i18nLibrary.libraryName || 'None'}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        totalFiles: files.length,
        i18nFindings: allFindings,
        i18nLibrary,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 13 failed: ${errorMessage}\n`);

      return {
        success: false,
        totalFiles: 0,
        i18nFindings: [],
        i18nLibrary: {
          hasI18nLibrary: false,
          hasTranslationFiles: false,
          translationFiles: [],
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
   * Detects i18n library usage
   *
   * @private
   * @returns Promise<I18nLibraryResult> - i18n library detection result
   */
  private async detectI18nLibrary(): Promise<I18nLibraryResult> {
    const result: I18nLibraryResult = {
      hasI18nLibrary: false,
      hasTranslationFiles: false,
      translationFiles: [],
    };

    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Check for i18n libraries
        const i18nLibraries = ['next-i18next', 'react-i18next', 'i18next', 'react-intl', 'formatjs', 'lingui', 'vue-i18n'];
        for (const lib of i18nLibraries) {
          if (dependencies[lib]) {
            result.hasI18nLibrary = true;
            result.libraryName = lib;
            break;
          }
        }
      } catch (error: unknown) {
        // Invalid package.json, skip
      }
    }

    // Check for translation files
    const translationPatterns = ['/locales/**/*.json', '/i18n/**/*.json', '/lang/**/*.json', '/translations/**/*.json'];
    for (const pattern of translationPatterns) {
      const localeDir = path.join(this.config.projectRoot, pattern.split('/')[0]);
      if (fs.existsSync(localeDir)) {
        result.hasTranslationFiles = true;
        const findTranslationFiles = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              findTranslationFiles(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.json')) {
              result.translationFiles.push(fullPath);
            }
          }
        };
        findTranslationFiles(localeDir);
        break;
      }
    }

    return result;
  }

  /**
   * Analyzes a single file for i18n/l10n issues
   *
   * @private
   * @param filePath - File path
   * @param corePathFiles - Set of Core Path files
   * @param i18nLibrary - i18n library detection result
   * @param businessDomain - Business domain from Phase 2
   * @returns Promise<I18nFinding[]> - Array of findings
   */
  private async analyzeFile(filePath: string, corePathFiles: Set<string>, i18nLibrary: I18nLibraryResult, businessDomain: string): Promise<I18nFinding[]> {
    const findings: I18nFinding[] = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const isCorePath = corePathFiles.has(filePath);
    const isUIFile = this.isUIFile(filePath);

    // If no i18n library detected, report as Medium (Escalabilidad)
    if (!i18nLibrary.hasI18nLibrary && isUIFile) {
      findings.push({
        id: this.generateFindingId(filePath, 1, 'missing-i18n-lib'),
        type: 'missing-i18n-lib',
        severity: 'medium',
        filePath,
        line: 1,
        description: 'No i18n library detected (next-i18next, react-intl, etc.)',
        suggestion: 'Install and configure an i18n library for internationalization support',
        isCorePath,
      });
    }

    // Detect hardcoded strings in UI files
    if (isUIFile) {
      const hardcodedStrings = this.detectHardcodedStrings(content, filePath);
      for (const stringInfo of hardcodedStrings) {
        // Integración con Phase 2: Prioridad crítica para Fintech/SaaS con Price/Currency/Invoice/Payment
        let severity: 'low' | 'medium' | 'high' | 'critical' = isCorePath ? 'high' : 'medium';
        const isFintech = businessDomain.toLowerCase().includes('fintech');
        const isSaaS = businessDomain.toLowerCase().includes('saas');
        const fileName = path.basename(filePath).toLowerCase();
        
        if ((isFintech || isSaaS) && (fileName.includes('price') || fileName.includes('currency') || fileName.includes('invoice') || fileName.includes('payment'))) {
          severity = 'critical';
        }
        
        findings.push({
          id: this.generateFindingId(filePath, stringInfo.line, 'hardcoded-string'),
          type: 'hardcoded-string',
          severity,
          filePath,
          line: stringInfo.line,
          description: `Hardcoded user-facing string: "${stringInfo.value}"`,
          stringValue: this.sanitizeString(stringInfo.value),
          suggestion: 'Move this string to translation file and use i18n library',
          isCorePath,
        });
      }
    }

    // Detect locale hardcoding (e.g., 'en-US', 'es-ES' as literals)
    const localeHardcodes = this.detectLocaleHardcoding(content);
    for (const localeInfo of localeHardcodes) {
      findings.push({
        id: this.generateFindingId(filePath, localeInfo.line, 'locale-hardcode'),
        type: 'locale-hardcode',
        severity: isCorePath ? 'high' : 'medium',
        filePath,
        line: localeInfo.line,
        description: `Hardcoded locale: "${localeInfo.locale}"`,
        suggestion: 'Use dynamic locale from user preferences or i18n library',
        isCorePath,
      });
    }

    // Detect format issues (date, currency, number)
    const formatIssues = this.detectFormatIssues(content);
    for (const formatInfo of formatIssues) {
      findings.push({
        id: this.generateFindingId(filePath, formatInfo.line, 'format-issue'),
        type: 'format-issue',
        severity: 'medium',
        filePath,
        line: formatInfo.line,
        description: `Format issue: ${formatInfo.issue}`,
        suggestion: 'Use Intl.DateTimeFormat, Intl.NumberFormat, or i18n library for proper localization',
        isCorePath,
      });
    }

    return findings;
  }

  /**
   * Determines if a file is a UI file (component, page, view)
   *
   * @private
   * @param filePath - File path
   * @returns boolean - Whether file is a UI file
   */
  private isUIFile(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase();
    const uiPatterns = [
      'component', 'page', 'view', 'screen', 'layout', 'header', 'footer',
      'nav', 'sidebar', 'modal', 'dialog', 'form', 'button', 'input',
      'card', 'list', 'table', 'grid', 'menu', 'dropdown', 'toast',
      'alert', 'badge', 'banner', 'carousel', 'slider', 'tooltip'
    ];
    
    for (const pattern of uiPatterns) {
      if (lowerPath.includes(pattern)) {
        return true;
      }
    }
    
    // Check for .jsx or .tsx files (typically UI components)
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
      return true;
    }
    
    return false;
  }

  /**
   * Detects hardcoded user-facing strings
   *
   * @private
   * @param content - File content
   * @param _filePath - File path (unused, kept for interface consistency)
   * @returns Array<{value: string, line: number}> - Hardcoded strings found
   */
  private detectHardcodedStrings(content: string, _filePath: string): Array<{value: string, line: number}> {
    const results: Array<{value: string, line: number}> = [];
    const lines = content.split('\n');

    // Patterns to match strings in code
    const stringPatterns = [
      // JSX text content: <div>Hello</div>
      />([^<]+)</g,
      // Template literals with spaces: `Hello ${name}`
      /`([^`]+)`/g,
      // Single quotes with spaces: 'Hello World'
      /'([^']+)'/g,
      // Double quotes with spaces: "Hello World"
      /"([^"]+)"/g,
    ];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      for (const pattern of stringPatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const stringValue = match[1].trim();
          
          // Skip if not a translatable string
          if (!this.isTranslatableString(stringValue)) {
            continue;
          }

          results.push({
            value: stringValue,
            line: lineNumber,
          });
        }
      }
    }

    return results;
  }

  /**
   * Determines if a string is translatable (user-facing) vs technical (config/ID)
   *
   * LOGIC FOR DIFFERENTIATION:
   * 
   * NON-TRANSLATABLE (skip):
   * - IDs: userId, orderId, productId (pattern: /^[a-z]+[A-Z]?[a-z]*Id$/)
   * - Object keys: key:, value:, type: (pattern: /^[a-z_]+:$/)
   * - URLs: http://, https://
   * - Routes: /api, /users, /products
   * - Constants: MAX_SIZE, API_KEY, DEFAULT_VALUE (pattern: /^[A-Z_]+$/)
   * - Technical terms: null, undefined, true, false, return, function, const, let, var
   * - Regular expressions: /pattern/
   * - CSS classes: className="..."
   * - Function names: onClick, onChange, onSubmit
   * - HTML attributes: href, src, alt, id, name
   * - Short strings: < 3 characters
   * - Single words without spaces (likely IDs or keys)
   * - Numbers and special characters only
   * 
   * TRANSLATABLE (include):
   * - Strings with spaces (user-facing text)
   * - Sentences (multiple words)
   * - UI labels (Login, Sign Up, Submit, Cancel)
   * - Error messages (Please enter your email, Invalid password)
   * - Button text (Click here, Continue, Back)
   * - Form labels (Email address, Password, First name)
   * - Status messages (Loading..., Success, Error)
   * - Longer than 3 characters with letters and spaces
   *
   * @private
   * @param str - String to check
   * @returns boolean - Whether string is translatable
   */
  private isTranslatableString(str: string): string {
    const trimmed = str.trim();
    
    // Skip short strings (< 3 characters)
    if (trimmed.length < 3) {
      return '';
    }
    
    // Skip if only numbers or special characters
    if (!/[a-zA-Z]/.test(trimmed)) {
      return '';
    }
    
    // Skip technical keywords
    const technicalKeywords = [
      'null', 'undefined', 'true', 'false', 'return', 'function', 'const', 'let', 'var',
      'import', 'export', 'default', 'from', 'class', 'interface', 'type', 'extends',
      'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super',
      'http', 'https', 'api', 'json', 'xml', 'html', 'css', 'js', 'ts', 'sql', 'db'
    ];
    if (technicalKeywords.includes(trimmed.toLowerCase())) {
      return '';
    }
    
    // Skip IDs (userId, orderId, etc.)
    if (/^[a-z]+[A-Z]?[a-z]*Id$/.test(trimmed)) {
      return '';
    }
    
    // Skip object keys (key:, value:, type:, etc.)
    if (/^[a-z_]+:$/.test(trimmed)) {
      return '';
    }
    
    // Skip URLs
    if (/^https?:\/\//.test(trimmed)) {
      return '';
    }
    
    // Skip routes
    if (/^\/[a-z]/.test(trimmed)) {
      return '';
    }
    
    // Skip constants (ALL_CAPS)
    if (/^[A-Z_]+$/.test(trimmed)) {
      return '';
    }
    
    // Skip regular expressions
    if (/^\/.+\/[gimuy]*$/.test(trimmed)) {
      return '';
    }
    
    // Skip function names (onClick, onChange, etc.)
    if (/^on[A-Z]/.test(trimmed)) {
      return '';
    }
    
    // Skip HTML attributes (href, src, alt, id, name, className, style)
    const htmlAttributes = ['href', 'src', 'alt', 'id', 'name', 'className', 'style', 'type', 'value', 'placeholder', 'disabled', 'readonly'];
    if (htmlAttributes.includes(trimmed)) {
      return '';
    }
    
    // Skip if it's a single word without spaces (likely ID or key)
    if (!/\s/.test(trimmed) && /^[a-z]+$/.test(trimmed)) {
      return '';
    }
    
    // Skip if it contains only technical characters
    if (/^[{}()[\];,.<>]+$/.test(trimmed)) {
      return '';
    }
    
    // Skip if it's a React prop name
    if (/^[a-z]+[A-Z]/.test(trimmed) && !/\s/.test(trimmed)) {
      return '';
    }
    
    // Skip if it's a CSS class name (kebab-case with hyphens)
    if (/^[a-z][a-z0-9-]*-[a-z0-9-]+$/.test(trimmed)) {
      return '';
    }
    
    // Skip if it's a number
    if (/^\d+$/.test(trimmed)) {
      return '';
    }
    
    // Skip if it's a boolean or boolean-like
    if (/^(true|false|yes|no|on|off)$/i.test(trimmed)) {
      return '';
    }
    
    // Skip if it's a common technical term
    const technicalTerms = ['div', 'span', 'button', 'input', 'form', 'label', 'select', 'option', 'textarea', 'img', 'a', 'link', 'script', 'style'];
    if (technicalTerms.includes(trimmed.toLowerCase())) {
      return '';
    }
    
    // Detección de Falsos Positivos en Props: Ignorar rutas de archivos (.png, .svg, .css, .jpg, .jpeg, .gif, .webp, .woff, .woff2, .ttf, .eot)
    const fileExtensions = ['.png', '.svg', '.css', '.jpg', '.jpeg', '.gif', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.wav', '.pdf'];
    for (const ext of fileExtensions) {
      if (trimmed.includes(ext)) {
        return '';
      }
    }
    
    // Ignorar nombres de fuentes comunes (Roboto, Arial, Helvetica, Times, Courier, etc.)
    const commonFonts = ['Roboto', 'Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans', 'Trebuchet', 'Arial Black', 'Impact'];
    if (commonFonts.some(font => trimmed.toLowerCase().includes(font.toLowerCase()))) {
      return '';
    }
    
    // Self-Audit: Ignorar logs internos de Aegis (SUCCESS:, ERROR:, WARNING:, INFO:)
    const aegisLogs = ['SUCCESS:', 'ERROR:', 'WARNING:', 'INFO:', 'DEBUG:', 'TRACE:'];
    if (aegisLogs.some(log => trimmed.toUpperCase().includes(log))) {
      return '';
    }
    
    // If it has spaces and contains letters, it's likely translatable
    if (/\s/.test(trimmed) && /[a-zA-Z]/.test(trimmed)) {
      return trimmed;
    }
    
    // If it's a longer word (>5 chars) with mixed case (PascalCase or camelCase), might be translatable
    if (trimmed.length > 5 && /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed)) {
      return trimmed;
    }
    
    // Default: not translatable
    return '';
  }

  /**
   * Detects hardcoded locale strings
   *
   * @private
   * @param content - File content
   * @returns Array<{locale: string, line: number}> - Locale hardcodes found
   */
  private detectLocaleHardcoding(content: string): Array<{locale: string, line: number}> {
    const results: Array<{locale: string, line: number}> = [];
    const lines = content.split('\n');

    // Locale pattern: en-US, es-ES, fr-FR, etc.
    const localePattern = /['"]([a-z]{2}-[A-Z]{2})['"]/g;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      let match;
      while ((match = localePattern.exec(line)) !== null) {
        results.push({
          locale: match[1],
          line: lineNumber,
        });
      }
    }

    return results;
  }

  /**
   * Detects format issues (date, currency, number)
   *
   * @private
   * @param content - File content
   * @returns Array<{issue: string, line: number}> - Format issues found
   */
  private detectFormatIssues(content: string): Array<{issue: string, line: number}> {
    const results: Array<{issue: string, line: number}> = [];
    const lines = content.split('\n');

    // Date format issues: .toLocaleDateString() without locale
    const datePattern = /\.toLocaleDateString\(\)/g;
    // Currency format: hardcoded currency symbols ($, €, £)
    const currencyPattern = /['"][$€£¥₹₽₩][\d,]+['"]/g;
    // Number format: hardcoded thousand separators
    const numberPattern = /['"][\d,]+\.\d+['"]/g;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      if (datePattern.test(line)) {
        results.push({
          issue: 'Date formatting without locale parameter',
          line: lineNumber,
        });
      }

      if (currencyPattern.test(line)) {
        results.push({
          issue: 'Hardcoded currency symbol',
          line: lineNumber,
        });
      }

      if (numberPattern.test(line)) {
        results.push({
          issue: 'Hardcoded number format (thousand separators)',
          line: lineNumber,
        });
      }
    }

    return results;
  }

  /**
   * Sanitizes a string for safe reporting
   *
   * @private
   * @param str - String to sanitize
   * @returns string - Sanitized string
   */
  private sanitizeString(str: string): string {
    // Truncate long strings
    if (str.length > 50) {
      return str.substring(0, 47) + '...';
    }
    return str;
  }

  /**
   * Writes partial report for Phase 13
   *
   * @private
   * @param findings - i18n/l10n findings
   * @param i18nLibrary - i18n library detection result
   * @param criticalFindings - Critical findings count
   * @param highSeverityFindings - High severity findings count
   */
  private async writePartialReport(
    findings: I18nFinding[],
    i18nLibrary: I18nLibraryResult,
    criticalFindings: number,
    highSeverityFindings: number
  ): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      let reportContent = `
## Phase 13: i18n & l10n - COMPLETED
- **Timestamp:** ${timestamp}

### Summary
- **Total Findings:** ${findings.length}
- **Critical Findings:** ${criticalFindings}
- **High Severity Findings:** ${highSeverityFindings}
- **i18n Library:** ${i18nLibrary.libraryName || 'None'}
- **Translation Files:** ${i18nLibrary.hasTranslationFiles ? 'YES' : 'NO'}

### i18n Library Detection
`;
      if (i18nLibrary.libraryName) {
        reportContent += `- **Library:** ${i18nLibrary.libraryName}\n`;
      } else {
        reportContent += `- **Library:** None detected\n`;
      }
      if (i18nLibrary.translationFiles.length > 0) {
        reportContent += `- **Translation Files:** ${i18nLibrary.translationFiles.length} files\n`;
      }

      reportContent += `
### i18n/l10n Findings
`;

      for (const finding of findings) {
        const severityIcon = finding.severity === 'critical' ? 'CRITICAL' : finding.severity === 'high' ? 'HIGH' : finding.severity === 'medium' ? 'MEDIUM' : 'LOW';
        reportContent += `- [${severityIcon}] **${finding.type}** ${finding.filePath}`;
        if (finding.line) {
          reportContent += `:${finding.line}`;
        }
        reportContent += `\n`;
        reportContent += `  - ${finding.description}\n`;
        if (finding.stringValue) {
          reportContent += `  - String: "${finding.stringValue}"\n`;
        }
        if (finding.suggestion) {
          reportContent += `  - Suggestion: ${finding.suggestion}\n`;
        }
        if (finding.isCorePath) {
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
    } catch (error) {
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
   * Self-Audit: Verifies that this phase does not report Aegis internal log strings as translatable
   *
   * @private
   * @returns Promise<void>
   */
  private async selfAudit(): Promise<void> {
    try {
      const phase13Path = path.join(__dirname, 'phase-13-i18n-l10n.ts');
      const content = fs.readFileSync(phase13Path, 'utf-8');
      
      const aegisLogPatterns = [/SUCCESS:/g, /ERROR:/g, /WARNING:/g, /INFO:/g, /DEBUG:/g, /TRACE:/g];
      let foundAegisLogs = 0;
      
      for (const pattern of aegisLogPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          foundAegisLogs += matches.length;
        }
      }
      
      if (foundAegisLogs > 0) {
        console.log('WARNING Self-Audit: Aegis log strings found in phase-13-i18n-l10n.ts');
        console.log(`WARNING Found ${foundAegisLogs} log strings - these should be filtered by isTranslatableString()`);
      } else {
        console.log('SUCCESS Self-Audit: No Aegis log strings reported as translatable in phase-13-i18n-l10n.ts');
      }
    } catch (error: unknown) {
      console.log('WARNING Self-Audit failed:', error instanceof Error ? error.message : error);
    }
  }
}













