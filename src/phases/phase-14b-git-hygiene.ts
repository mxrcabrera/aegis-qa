// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 14: Git, Repo & Documentation Hygiene
 *
 * Purpose: Audit the structural health of the repository including git hygiene,
 * documentation quality, orphaned files, and script verification.
 *
 * Architecture:
 * - Git Hygiene: Detect .log, .env, node_modules, dist leaks in .gitignore
 * - Documentation Check: Verify README.md and build/dev instructions for Next.js
 * - Orphaned Files: Detect .bak, .old, copy of..., IDE config files
 * - Script Verification: Check if package.json scripts reference existing files
 * - Thermal Verification: Mandatory resource check before scanning
 * - Batch Processing: Use BatchProcessor for thermal-safe processing
 *
 * @module phases/phase-14-git-hygiene
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { execSafe } from '../core/command-sanitizer.js';

/**
 * Phase 2 result
 */
interface Phase2Result {
  /** Core path files */
  corePathFiles: string[];
}

/**
 * Git hygiene finding
 */
interface GitHygieneFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'gitignore-leak' | 'missing-docs' | 'orphaned-file' | 'script-verification' | 'env-committed' | 'large-file' | 'git-tracked-sensitive' | 'script-typo';
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
  /** The leaked file type (for gitignore leaks) */
  leakedType?: string;
  /** File size in MB (for large files) */
  fileSizeMB?: number;
}

/**
 * Git hygiene audit result
 */
interface GitHygieneAuditResult {
  /** Has .gitignore file */
  hasGitignore: boolean;
  /** Leaked .log files */
  leakedLogFiles: string[];
  /** Leaked .env files (CRITICAL) */
  leakedEnvFiles: string[];
  /** Leaked node_modules directories */
  leakedNodeModules: string[];
  /** Leaked dist directories */
  leakedDistDirs: string[];
  /** Orphaned files (.bak, .old, copy of...) */
  orphanedFiles: string[];
  /** IDE config files (.vscode, .idea) */
  ideConfigFiles: string[];
  /** Large files (> 5MB non-binary) */
  largeFiles: Array<{ path: string; sizeMB: number }>;
  /** Git-tracked sensitive files (BLOCKER) */
  gitTrackedSensitive: string[];
  /** README.md exists */
  hasReadme: boolean;
  /** README.md has build instructions */
  hasBuildInstructions: boolean;
  /** README.md has dev instructions */
  hasDevInstructions: boolean;
  /** Script verification results */
  scriptVerification: ScriptVerificationResult;
}

/**
 * Script verification result
 */
interface ScriptVerificationResult {
  /** Scripts checked */
  scriptsChecked: string[];
  /** Invalid scripts (file not found) */
  invalidScripts: string[];
  /** Valid scripts */
  validScripts: string[];
  /** Scripts with typos */
  scriptsWithTypos: Array<{ scriptName: string; command: string; typo: string }>;
}

/**
 * Phase 14 configuration
 */
interface Phase14Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 14 result
 */
export interface Phase14Result {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** Git hygiene findings */
  gitHygieneFindings: GitHygieneFinding[];
  /** Git hygiene audit result */
  gitHygieneAudit: GitHygieneAuditResult;
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
 * Phase 14: Git, Repo & Documentation Hygiene
 *
 * This phase audits git hygiene, documentation, orphaned files, and script verification.
 *
 * @class Phase14GitHygiene
 */
export class Phase14GitHygiene {
  private config: Phase14Config;

  constructor(config: Phase14Config) {
    this.config = config;
  }

  /**
   * Executes Phase 14: Git, Repo & Documentation Hygiene
   *
   * @returns Promise<Phase14Result> - Git hygiene assessment result
   */
  async execute(): Promise<Phase14Result> {
    const startTime = Date.now();
    console.log('INFO Phase 14: Git, Repo & Documentation Hygiene\n');

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

      // Get all files in the repository
      const files = await this.getAllRepositoryFiles();
      console.log(`INFO Found ${files.length} files in repository\n`);

      if (files.length === 0) {
        return {
          success: true,
          totalFiles: 0,
          gitHygieneFindings: [],
          gitHygieneAudit: {
            hasGitignore: false,
            leakedLogFiles: [],
            leakedEnvFiles: [],
            leakedNodeModules: [],
            leakedDistDirs: [],
            orphanedFiles: [],
            ideConfigFiles: [],
            largeFiles: [],
            gitTrackedSensitive: [],
            hasReadme: false,
            hasBuildInstructions: false,
            hasDevInstructions: false,
            scriptVerification: {
              scriptsChecked: [],
              invalidScripts: [],
              validScripts: [],
              scriptsWithTypos: [],
            },
          },
          criticalFindings: 0,
          highSeverityFindings: 0,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Get critical modules from Phase 2 business profile if available
      const phase2Results = this.config.statePersistence.getAnalysisResults(2, this.config.currentState) as Phase2Result | undefined;
      const corePathFiles = new Set<string>(phase2Results?.corePathFiles || []);

      // Perform git hygiene audit
      const gitHygieneAudit = await this.performGitHygieneAudit(files);

      // Generate findings from audit
      const allFindings: GitHygieneFinding[] = this.generateFindingsFromAudit(gitHygieneAudit, corePathFiles);

      // Write partial report
      await this.writePartialReport(allFindings, gitHygieneAudit);

      // Store Phase 14 results in StatePersistence for shared context
      await this.config.statePersistence.storeAnalysisResults(14, {
        gitHygieneFindings: allFindings,
        gitHygieneAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
      }, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 14 Complete`);
      console.log(`INFO Files analyzed: ${files.length}`);
      console.log(`INFO Total findings: ${allFindings.length}`);
      console.log(`INFO Critical findings: ${allFindings.filter(f => f.severity === 'critical').length}`);
      console.log(`INFO High severity findings: ${allFindings.filter(f => f.severity === 'high').length}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        totalFiles: files.length,
        gitHygieneFindings: allFindings,
        gitHygieneAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
        executionTimeMs,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 14 failed: ${errorMessage}\n`);

      return {
        success: false,
        totalFiles: 0,
        gitHygieneFindings: [],
        gitHygieneAudit: {
          hasGitignore: false,
          leakedLogFiles: [],
          leakedEnvFiles: [],
          leakedNodeModules: [],
          leakedDistDirs: [],
          orphanedFiles: [],
          ideConfigFiles: [],
          largeFiles: [],
          gitTrackedSensitive: [],
          hasReadme: false,
          hasBuildInstructions: false,
          hasDevInstructions: false,
          scriptVerification: {
            scriptsChecked: [],
            invalidScripts: [],
            validScripts: [],
            scriptsWithTypos: [],
          },
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Gets all repository files
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async getAllRepositoryFiles(): Promise<string[]> {
    const files: string[] = [];

    const findFilesRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip .git directory
          if (entry.name !== '.git') {
            findFilesRecursive(fullPath);
          }
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    };

    findFilesRecursive(this.config.projectRoot);
    return files;
  }

  /**
   * Performs git hygiene audit
   *
   * LÓGICA PARA DETECCIÓN DE FUGAS EN .GITIGNORE (Punto 1):
   * 
   * 1. Lee el archivo .gitignore si existe
   * 2. Obtiene todos los archivos del repositorio (ya tracked + untracked)
   * 3. Para cada archivo, verifica si debería estar ignorado según .gitignore
   * 4. Detecta fugas específicas:
   *    - Archivos .log (deberían estar en .gitignore)
   *    - Archivos .env (CRITICAL si están commiteados sin .example)
   *    - Carpetas node_modules (deberían estar en .gitignore)
   *    - Carpetas dist (deberían estar en .gitignore)
   * 
   * CÓMO REPORTAR UN .ENV COMMITEADO POR ERROR (CRITICAL):
   * - Tipo de finding: 'env-committed'
   * - Severidad: 'critical'
   * - Descripción: "CRITICAL SECURITY RISK: .env file committed to repository"
   * - Sugerencia: "Remove .env from git history, add to .gitignore, and create .env.example"
   * - Marcar como isCorePath si está en directorio raíz
   *
   * @private
   * @param files - Array of file paths
   * @returns Promise<GitHygieneAuditResult> - Git hygiene audit result
   */
  private async performGitHygieneAudit(files: string[]): Promise<GitHygieneAuditResult> {
    const result: GitHygieneAuditResult = {
      hasGitignore: false,
      leakedLogFiles: [],
      leakedEnvFiles: [],
      leakedNodeModules: [],
      leakedDistDirs: [],
      orphanedFiles: [],
      ideConfigFiles: [],
      largeFiles: [],
      gitTrackedSensitive: [],
      hasReadme: false,
      hasBuildInstructions: false,
      hasDevInstructions: false,
      scriptVerification: {
        scriptsChecked: [],
        invalidScripts: [],
        validScripts: [],
        scriptsWithTypos: [],
      },
    };

    const gitignorePath = path.join(this.config.projectRoot, '.gitignore');
    const gitignorePatterns: string[] = [];

    // Read .gitignore if exists
    if (fs.existsSync(gitignorePath)) {
      result.hasGitignore = true;
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      const lines = gitignoreContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          gitignorePatterns.push(trimmed);
        }
      }
    }

    // Memory Guard: Process files in blocks of 500 if > 2000 files
    const blockSize = files.length > 2000 ? 500 : files.length;
    for (let i = 0; i < files.length; i += blockSize) {
      const block = files.slice(i, i + blockSize);
      
      // Detect leaked files in this block
      for (const filePath of block) {
        const relativePath = path.relative(this.config.projectRoot, filePath);
        const fileName = path.basename(filePath);
        const fileDir = path.dirname(relativePath);

        // Check for .log files (should be in .gitignore)
        if (fileName.endsWith('.log')) {
          result.leakedLogFiles.push(relativePath);
        }

        // Check for .env files (CRITICAL if committed without .example)
        if (fileName === '.env') {
          const envExamplePath = path.join(path.dirname(filePath), '.env.example');
          if (!fs.existsSync(envExamplePath)) {
            result.leakedEnvFiles.push(relativePath);
          }
        }

        // Check for node_modules directories
        if (fileDir.includes('node_modules')) {
          result.leakedNodeModules.push(relativePath);
        }

        // Check for dist directories
        if (fileDir.includes('dist') || fileDir.includes('build')) {
          result.leakedDistDirs.push(relativePath);
        }

        // Check for orphaned files (.bak, .old, copy of...)
        if (fileName.endsWith('.bak') || fileName.endsWith('.old') || fileName.toLowerCase().includes('copy of')) {
          result.orphanedFiles.push(relativePath);
        }

        // Check for IDE config files (.vscode, .idea)
        if (fileDir.includes('.vscode') || fileDir.includes('.idea')) {
          result.ideConfigFiles.push(relativePath);
        }

        // Large Files detection (Zombie Files): Non-binary files > 5MB
        try {
          const stats = fs.statSync(filePath);
          const sizeMB = stats.size / (1024 * 1024);
          if (sizeMB > 5) {
            // Check if it's not an image/video binary
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.heic', '.heif'];
            const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.3gp', '.ogg'];
            const ext = path.extname(fileName).toLowerCase();
            const isImage = imageExtensions.includes(ext);
            const isVideo = videoExtensions.includes(ext);
            
            if (!isImage && !isVideo) {
              result.largeFiles.push({ path: relativePath, sizeMB: Math.round(sizeMB * 100) / 100 });
            }
          }
        } catch (error: unknown) {
          // File might not be accessible
        }
      }
    }

    // Deep Git Check: Detect sensitive files tracked by Git (even if in .gitignore now)
    try {
      const { stdout } = await execSafe('git', ['ls-files'], { cwd: this.config.projectRoot });
      const gitTrackedFiles = stdout.split('\n').filter((f: string) => f.trim());
      
      const sensitivePatterns = ['.env', '.pem', 'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519', '.key', '.cert', '.crt', '.p12', '.pfx'];
      
      for (const trackedFile of gitTrackedFiles) {
        const fileName = path.basename(trackedFile).toLowerCase();
        
        for (const pattern of sensitivePatterns) {
          if (fileName === pattern.toLowerCase() || fileName.includes(pattern.toLowerCase())) {
            result.gitTrackedSensitive.push(trackedFile);
            break;
          }
        }
      }
    } catch (error: unknown) {
      // Not a git repository or git not available
    }

    // Check README.md
    const readmePath = path.join(this.config.projectRoot, 'README.md');
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    let isNextJs = false;
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        isNextJs = !!dependencies['next'];
      } catch (error: unknown) {
        // Invalid package.json
      }
    }
    
    if (fs.existsSync(readmePath)) {
      result.hasReadme = true;
      const readmeContent = fs.readFileSync(readmePath, 'utf-8').toLowerCase();

      if (isNextJs) {
        result.hasBuildInstructions = readmeContent.includes('build') || readmeContent.includes('npm run build');
        result.hasDevInstructions = readmeContent.includes('dev') || readmeContent.includes('npm run dev');
      } else {
        // For non-Next.js, just check for any instructions
        result.hasBuildInstructions = readmeContent.includes('build') || readmeContent.includes('compile');
        result.hasDevInstructions = readmeContent.includes('dev') || readmeContent.includes('start');
      }
    }

    // Script verification with typo detection
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};

        // Common typos in script commands
        const commonTypos: Record<string, string> = {
          'next buil': 'next build',
          'next devv': 'next dev',
          'next startt': 'next start',
          'npm installl': 'npm install',
          'npm rund': 'npm run',
          'npm buil': 'npm run build',
          'npm testt': 'npm test',
          'npm lintt': 'npm lint',
          'yarn addd': 'yarn add',
          'yarn buil': 'yarn build',
          'yarn testt': 'yarn test',
          'node mon': 'node mon',
          'nodemon': 'nodemon',
          'ts-nod': 'ts-node',
          'ts-nodee': 'ts-node',
          'webpackk': 'webpack',
          'babeel': 'babel',
          'jestt': 'jest',
          'vitestt': 'vitest',
          'eslintt': 'eslint',
          'prettierr': 'prettier',
        };

        for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
          if (typeof scriptCommand === 'string') {
            result.scriptVerification.scriptsChecked.push(scriptName);
            
            // Check for common typos
            let detectedTypo = '';
            for (const typo of Object.keys(commonTypos)) {
              if (scriptCommand.toLowerCase().includes(typo)) {
                detectedTypo = typo;
                break;
              }
            }
            
            if (detectedTypo) {
              result.scriptVerification.scriptsWithTypos.push({
                scriptName,
                command: scriptCommand,
                typo: detectedTypo,
              });
            }
            
            // Extract file references from common patterns
            // e.g., "node dist/index.js", "ts-node src/server.ts"
            const fileMatch = scriptCommand.match(/(?:node|ts-node|ts-node-esm)\s+([^\s]+)/);
            if (fileMatch) {
              const referencedFile = path.join(this.config.projectRoot, fileMatch[1]);
              if (fs.existsSync(referencedFile)) {
                result.scriptVerification.validScripts.push(scriptName);
              } else {
                result.scriptVerification.invalidScripts.push(scriptName);
              }
            } else if (!detectedTypo) {
              // For scripts that don't reference files directly (e.g., "next build"), mark as valid if no typo
              result.scriptVerification.validScripts.push(scriptName);
            }
          }
        }
      } catch (error: unknown) {
        // Invalid package.json
      }
    }

    return result;
  }

  /**
   * Generates findings from git hygiene audit
   *
   * @private
   * @param audit - Git hygiene audit result
   * @param corePathFiles - Set of Core Path files
   * @returns GitHygieneFinding[] - Array of findings
   */
  private generateFindingsFromAudit(audit: GitHygieneAuditResult, corePathFiles: Set<string>): GitHygieneFinding[] {
    const findings: GitHygieneFinding[] = [];

    // .env files committed (CRITICAL)
    for (const envFile of audit.leakedEnvFiles) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, envFile));
      findings.push({
        id: this.generateFindingId(envFile, 1, 'env-committed'),
        type: 'env-committed',
        severity: 'critical',
        filePath: envFile,
        line: 1,
        description: 'CRITICAL SECURITY RISK: .env file committed to repository without .env.example',
        suggestion: 'Remove .env from git history, add to .gitignore, and create .env.example with template variables',
        isCorePath,
      });
    }

    // .log files leaked
    for (const logFile of audit.leakedLogFiles) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, logFile));
      findings.push({
        id: this.generateFindingId(logFile, 1, 'gitignore-leak'),
        type: 'gitignore-leak',
        severity: isCorePath ? 'high' : 'medium',
        filePath: logFile,
        line: 1,
        description: 'Log file committed to repository (should be in .gitignore)',
        suggestion: 'Add *.log to .gitignore and remove from git history',
        isCorePath,
        leakedType: 'log',
      });
    }

    // node_modules leaked
    for (const nodeModule of audit.leakedNodeModules) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, nodeModule));
      findings.push({
        id: this.generateFindingId(nodeModule, 1, 'gitignore-leak'),
        type: 'gitignore-leak',
        severity: 'high',
        filePath: nodeModule,
        line: 1,
        description: 'node_modules directory committed to repository',
        suggestion: 'Add node_modules/ to .gitignore and remove from git history',
        isCorePath,
        leakedType: 'node_modules',
      });
    }

    // dist directories leaked
    for (const distDir of audit.leakedDistDirs) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, distDir));
      findings.push({
        id: this.generateFindingId(distDir, 1, 'gitignore-leak'),
        type: 'gitignore-leak',
        severity: isCorePath ? 'high' : 'medium',
        filePath: distDir,
        line: 1,
        description: 'Build/dist directory committed to repository',
        suggestion: 'Add dist/ or build/ to .gitignore and remove from git history',
        isCorePath,
        leakedType: 'dist',
      });
    }

    // Orphaned files
    for (const orphanedFile of audit.orphanedFiles) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, orphanedFile));
      findings.push({
        id: this.generateFindingId(orphanedFile, 1, 'orphaned-file'),
        type: 'orphaned-file',
        severity: 'low',
        filePath: orphanedFile,
        line: 1,
        description: 'Orphaned file (.bak, .old, copy of...) in repository',
        suggestion: 'Remove orphaned files or move to proper location',
        isCorePath,
      });
    }

    // IDE config files
    for (const ideConfig of audit.ideConfigFiles) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, ideConfig));
      findings.push({
        id: this.generateFindingId(ideConfig, 1, 'orphaned-file'),
        type: 'orphaned-file',
        severity: 'low',
        filePath: ideConfig,
        line: 1,
        description: 'IDE configuration file (.vscode, .idea) in repository',
        suggestion: 'Consider adding IDE config to .gitignore or using project-specific settings',
        isCorePath,
      });
    }

    // Missing README
    if (!audit.hasReadme) {
      findings.push({
        id: this.generateFindingId('README.md', 1, 'missing-docs'),
        type: 'missing-docs',
        severity: 'medium',
        filePath: 'README.md',
        line: 1,
        description: 'README.md not found in repository root',
        suggestion: 'Create README.md with project description, installation, and usage instructions',
        isCorePath: true,
      });
    }

    // Missing build instructions (for Next.js)
    if (!audit.hasBuildInstructions) {
      findings.push({
        id: this.generateFindingId('README.md', 1, 'missing-docs'),
        type: 'missing-docs',
        severity: 'medium',
        filePath: 'README.md',
        line: 1,
        description: 'README.md missing build instructions',
        suggestion: 'Add build instructions to README.md (e.g., npm run build, npm run dev)',
        isCorePath: true,
      });
    }

    // Missing dev instructions (for Next.js)
    if (!audit.hasDevInstructions) {
      findings.push({
        id: this.generateFindingId('README.md', 1, 'missing-docs'),
        type: 'missing-docs',
        severity: 'medium',
        filePath: 'README.md',
        line: 1,
        description: 'README.md missing development instructions',
        suggestion: 'Add development instructions to README.md (e.g., npm run dev)',
        isCorePath: true,
      });
    }

    // Script verification failures
    for (const invalidScript of audit.scriptVerification.invalidScripts) {
      findings.push({
        id: this.generateFindingId('package.json', 1, 'script-verification'),
        type: 'script-verification',
        severity: 'high',
        filePath: 'package.json',
        line: 1,
        description: `Script "${invalidScript}" references non-existent file`,
        suggestion: 'Verify the script command and ensure the referenced file exists',
        isCorePath: true,
      });
    }

    // Large files (Zombie Files)
    for (const largeFile of audit.largeFiles) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, largeFile.path));
      findings.push({
        id: this.generateFindingId(largeFile.path, 1, 'large-file'),
        type: 'large-file',
        severity: 'medium',
        filePath: largeFile.path,
        line: 1,
        description: `Large file detected: ${largeFile.path} (${largeFile.sizeMB} MB)`,
        suggestion: 'Consider removing or compressing this file. Large files slow down CI/CD',
        isCorePath,
        fileSizeMB: largeFile.sizeMB,
      });
    }

    // Git-tracked sensitive files (BLOCKER)
    for (const sensitiveFile of audit.gitTrackedSensitive) {
      const isCorePath = corePathFiles.has(path.join(this.config.projectRoot, sensitiveFile));
      findings.push({
        id: this.generateFindingId(sensitiveFile, 1, 'git-tracked-sensitive'),
        type: 'git-tracked-sensitive',
        severity: 'critical',
        filePath: sensitiveFile,
        line: 1,
        description: `BLOCKER: Sensitive file tracked by Git: ${sensitiveFile}`,
        suggestion: 'Remove from git history using git filter-branch or BFG Repo-Cleaner, add to .gitignore',
        isCorePath,
      });
    }

    // Script typos
    for (const scriptWithTypo of audit.scriptVerification.scriptsWithTypos) {
      findings.push({
        id: this.generateFindingId('package.json', 1, 'script-typo'),
        type: 'script-typo',
        severity: 'medium',
        filePath: 'package.json',
        line: 1,
        description: `Script "${scriptWithTypo.scriptName}" has typo: "${scriptWithTypo.typo}"`,
        suggestion: `Fix typo in script command: "${scriptWithTypo.command}"`,
        isCorePath: true,
      });
    }

    return findings;
  }

  /**
   * Writes partial report for Phase 14
   *
   * @private
   * @param findings - Git hygiene findings
   * @param audit - Git hygiene audit result
   */
  private async writePartialReport(findings: GitHygieneFinding[], audit: GitHygieneAuditResult): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      let reportContent = `
## Phase 14: Git, Repo & Documentation Hygiene - COMPLETED
- **Timestamp:** ${timestamp}

### Summary
- **Total Findings:** ${findings.length}
- **Critical Findings:** ${findings.filter(f => f.severity === 'critical').length}
- **High Severity Findings:** ${findings.filter(f => f.severity === 'high').length}
- **Has .gitignore:** ${audit.hasGitignore ? 'YES' : 'NO'}
- **Has README.md:** ${audit.hasReadme ? 'YES' : 'NO'}
- **Leaked .env Files:** ${audit.leakedEnvFiles.length}
- **Leaked .log Files:** ${audit.leakedLogFiles.length}
- **Leaked node_modules:** ${audit.leakedNodeModules.length}
- **Leaked dist/build:** ${audit.leakedDistDirs.length}
- **Large Files (> 5MB):** ${audit.largeFiles.length}
- **Git-Tracked Sensitive Files:** ${audit.gitTrackedSensitive.length}
- **Script Typos:** ${audit.scriptVerification.scriptsWithTypos.length}

### Git Hygiene Audit
`;

      if (audit.leakedEnvFiles.length > 0) {
        reportContent += `- **CRITICAL - .env files committed:** ${audit.leakedEnvFiles.length}\n`;
        for (const envFile of audit.leakedEnvFiles) {
          reportContent += `  - ${envFile}\n`;
        }
      }
      if (audit.leakedLogFiles.length > 0) {
        reportContent += `- **Leaked .log files:** ${audit.leakedLogFiles.length}\n`;
        for (const logFile of audit.leakedLogFiles) {
          reportContent += `  - ${logFile}\n`;
        }
      }
      if (audit.leakedNodeModules.length > 0) {
        reportContent += `- **Leaked node_modules:** ${audit.leakedNodeModules.length}\n`;
      }
      if (audit.leakedDistDirs.length > 0) {
        reportContent += `- **Leaked dist/build:** ${audit.leakedDistDirs.length}\n`;
      }
      if (audit.largeFiles.length > 0) {
        reportContent += `- **Large Files (> 5MB):** ${audit.largeFiles.length}\n`;
        for (const largeFile of audit.largeFiles) {
          reportContent += `  - ${largeFile.path} (${largeFile.sizeMB} MB)\n`;
        }
      }
      if (audit.gitTrackedSensitive.length > 0) {
        reportContent += `- **BLOCKER - Git-Tracked Sensitive Files:** ${audit.gitTrackedSensitive.length}\n`;
        for (const sensitiveFile of audit.gitTrackedSensitive) {
          reportContent += `  - ${sensitiveFile}\n`;
        }
      }

      reportContent += `
### Documentation Check
- **README.md exists:** ${audit.hasReadme ? 'YES' : 'NO'}
- **Build instructions:** ${audit.hasBuildInstructions ? 'YES' : 'NO'}
- **Dev instructions:** ${audit.hasDevInstructions ? 'YES' : 'NO'}

### Orphaned Files
- **.bak/.old files:** ${audit.orphanedFiles.length}
- **IDE config files:** ${audit.ideConfigFiles.length}

### Script Verification
- **Scripts checked:** ${audit.scriptVerification.scriptsChecked.length}
- **Valid scripts:** ${audit.scriptVerification.validScripts.length}
- **Invalid scripts:** ${audit.scriptVerification.invalidScripts.length}
`;

      if (audit.scriptVerification.invalidScripts.length > 0) {
        reportContent += `**Invalid scripts:**\n`;
        for (const invalidScript of audit.scriptVerification.invalidScripts) {
          reportContent += `- ${invalidScript}\n`;
        }
      }
      
      if (audit.scriptVerification.scriptsWithTypos.length > 0) {
        reportContent += `**Scripts with typos:**\n`;
        for (const scriptWithTypo of audit.scriptVerification.scriptsWithTypos) {
          reportContent += `- ${scriptWithTypo.scriptName}: "${scriptWithTypo.typo}"\n`;
        }
      }

      reportContent += `
### Git Hygiene Findings
`;

      for (const finding of findings) {
        const severityIcon = finding.severity === 'critical' ? 'CRITICAL' : finding.severity === 'high' ? 'HIGH' : finding.severity === 'medium' ? 'MEDIUM' : 'LOW';
        reportContent += `- [${severityIcon}] **${finding.type}** ${finding.filePath}`;
        if (finding.line) {
          reportContent += `:${finding.line}`;
        }
        reportContent += `\n`;
        reportContent += `  - ${finding.description}\n`;
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
    } catch (error: unknown) {
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
}













