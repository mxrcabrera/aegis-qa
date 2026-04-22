// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase Cleanup
 *
 * Purpose: Identify and remove dead code, unused dependencies, and clean up
 * temporary files to improve project maintainability and reduce bloat.
 *
 * Architecture:
 * - Dead Code Detection: Identify unused functions, variables, and imports
 * - Dependency Cleanup: Detect and remove unused dependencies
 * - Temporary File Cleanup: Remove temporary and backup files
 * - Unused File Detection: Identify files that are not imported anywhere
 *
 * @module phases/phase-cleanup
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';

interface CleanupFinding {
  id: string;
  type: 'dead-code' | 'unused-dependency' | 'temporary-file' | 'unused-file' | 'unused-import' | 'commented-code';
  severity: 'low' | 'medium' | 'high';
  filePath: string;
  line?: number;
  description: string;
  suggestion?: string;
  itemName?: string;
}

interface CleanupMetrics {
  totalFiles: number;
  deadCodeInstances: number;
  unusedDependencies: number;
  temporaryFiles: number;
  unusedFiles: number;
  unusedImports: number;
}

interface CleanupConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
}

export interface CleanupResult {
  success: boolean;
  findings: CleanupFinding[];
  metrics: CleanupMetrics;
  highSeverityFindings: number;
  mediumSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class PhaseCleanup {
  private config: CleanupConfig;

  constructor(config: CleanupConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<CleanupResult> {
    const startTime = Date.now();
    console.log('INFO Phase: Cleanup\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Analyzing cleanup opportunities...\n');
      
      const findings: CleanupFinding[] = [];

      // 1. Identify dead code
      console.log('INFO Identifying dead code...');
      findings.push(...await this.identifyDeadCode());

      // 2. Identify unused dependencies
      console.log('INFO Identifying unused dependencies...');
      findings.push(...await this.identifyUnusedDependencies());

      // 3. Identify temporary files
      console.log('INFO Identifying temporary files...');
      findings.push(...await this.identifyTemporaryFiles());

      // 4. Identify unused files
      console.log('INFO Identifying unused files...');
      findings.push(...await this.identifyUnusedFiles());

      // 5. Identify unused imports
      console.log('INFO Identifying unused imports...');
      findings.push(...await this.identifyUnusedImports());

      // 6. Identify commented code
      console.log('INFO Identifying commented code...');
      findings.push(...await this.identifyCommentedCode());

      console.log(`INFO Total findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Dead code instances: ${metrics.deadCodeInstances}`);
      console.log(`INFO Unused dependencies: ${metrics.unusedDependencies}`);
      console.log(`INFO Temporary files: ${metrics.temporaryFiles}\n`);

      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;
      const mediumSeverityFindings = findings.filter((f) => f.severity === 'medium').length;

      const executionTimeMs = Date.now() - startTime;

      const result: CleanupResult = {
        success: true,
        findings,
        metrics,
        highSeverityFindings,
        mediumSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase Cleanup Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);
      console.log(`INFO Medium severity findings: ${mediumSeverityFindings}`);

      return result;
    } catch {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: CleanupResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          deadCodeInstances: 0,
          unusedDependencies: 0,
          temporaryFiles: 0,
          unusedFiles: 0,
          unusedImports: 0,
        },
        highSeverityFindings: 0,
        mediumSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase Cleanup:', sanitizedError);
      return result;
    }
  }

  private async identifyDeadCode(): Promise<CleanupFinding[]> {
    const findings: CleanupFinding[] = [];
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

        // Extract function definitions
        const functionDefinitions: string[] = [];
        lines.forEach((line) => {
          const match = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\(|function))/);
          if (match) {
            const functionName = match[1] || match[2];
            if (functionName) {
              functionDefinitions.push(functionName);
            }
          }
        });

        // Check if functions are used
        functionDefinitions.forEach((funcName) => {
          const usageRegex = new RegExp(`\\b${funcName}\\b`, 'g');
          const matches = content.match(usageRegex);
          
          // If function is only defined once and never called (or only in its definition)
          if (matches && matches.length <= 1) {
            findings.push({
              id: `dead-code-${Date.now()}-${Math.random()}`,
              type: 'dead-code',
              severity: 'medium',
              filePath,
              description: `Function '${funcName}' appears to be unused`,
              suggestion: 'Remove unused functions or export them if they are intended for external use',
              itemName: funcName,
            });
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async identifyUnusedDependencies(): Promise<CleanupFinding[]> {
    const findings: CleanupFinding[] = [];
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return findings;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (!dependencies) {
        return findings;
      }

      const sourceFiles = this.findSourceFiles();
      const allContent = sourceFiles.map((file) => {
        try {
          return fs.readFileSync(file, 'utf-8');
        } catch {
          return '';
        }
      }).join('\n');

      Object.entries(dependencies).forEach(([dep]) => {
        // Skip common dependencies that might be used in build scripts
        const commonDeps = ['typescript', '@types/node', 'eslint', 'prettier', 'vitest', 'jest'];
        if (commonDeps.includes(dep)) {
          return;
        }

        // Check if dependency is used in imports or require statements
        const importPatterns = [
          new RegExp(`from ['"]${dep}['"]`),
          new RegExp(`require\\(['"]${dep}['"]\\)`),
          new RegExp(`import.*${dep.replace(/[-@]/g, '_')}`),
        ];

        const isUsed = importPatterns.some((pattern) => pattern.test(allContent));

        if (!isUsed) {
          findings.push({
            id: `unused-dep-${Date.now()}-${Math.random()}`,
            type: 'unused-dependency',
            severity: 'low',
            filePath: packageJsonPath,
            description: `Dependency '${dep}' appears to be unused`,
            suggestion: 'Remove unused dependencies to reduce bundle size and attack surface',
            itemName: dep,
          });
        }
      });
    } catch {
      console.warn(`Failed to analyze package.json:`, sanitizeError(error));
    }

    return findings;
  }

  private async identifyTemporaryFiles(): Promise<CleanupFinding[]> {
    const findings: CleanupFinding[] = [];
    const tempPatterns = [
      '*.tmp',
      '*.temp',
      '*.bak',
      '*.backup',
      '*.swp',
      '*~',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '.cache',
    ];

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
            scanDirectory(fullPath);
          } else if (stat.isFile()) {
            // Check if file matches temporary patterns
            const isTempFile = tempPatterns.some((pattern) => {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(item);
            });

            if (isTempFile) {
              findings.push({
                id: `temp-file-${Date.now()}-${Math.random()}`,
                type: 'temporary-file',
                severity: 'low',
                filePath: fullPath,
                description: `Temporary file detected: ${item}`,
                suggestion: 'Remove temporary files to keep repository clean',
              });
            }
          }
        }
      } catch {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return findings;
  }

  private async identifyUnusedFiles(): Promise<CleanupFinding[]> {
    const findings: CleanupFinding[] = [];
    const sourceFiles = this.findSourceFiles();
    const allImports = new Set<string>();

    // Collect all imports from all files
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
        
        // Extract local imports
        const importMatches = content.match(/from\s+['"]\.\/[^'"]+['"]/g) || [];
        importMatches.forEach((match) => {
          const importPath = match.match(/['"]([^'"]+)['"]/)?.[1] || '';
          allImports.add(importPath);
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    // Check if each source file is imported
    for (const filePath of sourceFiles) {
      const relativePath = path.relative(this.config.projectRoot, filePath).replace(/\\/g, '/');
      
      // Skip index files and common entry points
      if (relativePath.endsWith('index.ts') || relativePath.endsWith('index.js') || 
          relativePath.includes('app/page') || relativePath.includes('pages/index')) {
        continue;
      }

      // Convert to import format
      const importPathWithoutExt = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');
      const isImported = allImports.has(importPathWithoutExt) || 
                        allImports.has(`./${importPathWithoutExt}`) ||
                        allImports.has(`../${importPathWithoutExt}`);

      if (!isImported) {
        findings.push({
          id: `unused-file-${Date.now()}-${Math.random()}`,
          type: 'unused-file',
          severity: 'medium',
          filePath,
          description: `File appears to be unused: ${relativePath}`,
          suggestion: 'Remove unused files or ensure they are properly exported and imported',
        });
      }
    }

    return findings;
  }

  private async identifyUnusedImports(): Promise<CleanupFinding[]> {
    const findings: CleanupFinding[] = [];
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

        // Extract imports
        const imports: Map<string, number> = new Map();
        lines.forEach((line, index) => {
          const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
          if (importMatch) {
            const importedItems = importMatch[1].split(',').map((item) => item.trim().split(' as ')[0]);
            importedItems.forEach((item) => {
              imports.set(item, index + 1);
            });
          }

          const defaultImportMatch = line.match(/import\s+(\w+)\s+from/);
          if (defaultImportMatch && !line.includes('{')) {
            imports.set(defaultImportMatch[1], index + 1);
          }
        });

        // Check if imports are used
        imports.forEach((lineNumber, importName) => {
          const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
          const matches = content.match(usageRegex);
          
          // If import appears only once (in the import statement itself)
          if (matches && matches.length === 1) {
            findings.push({
              id: `unused-import-${Date.now()}-${Math.random()}`,
              type: 'unused-import',
              severity: 'low',
              filePath,
              line: lineNumber,
              description: `Import '${importName}' appears to be unused`,
              suggestion: 'Remove unused imports to keep code clean',
              itemName: importName,
            });
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async identifyCommentedCode(): Promise<CleanupFinding[]> {
    const findings: CleanupFinding[] = [];
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
          // Check for multi-line commented code
          if (line.trim().startsWith('//') && line.length > 50) {
            // Check if it looks like code (has common code patterns)
            if (line.includes('function') || line.includes('const') || line.includes('if') || line.includes('return')) {
              findings.push({
                id: `commented-code-${Date.now()}-${Math.random()}`,
                type: 'commented-code',
                severity: 'low',
                filePath,
                line: index + 1,
                description: 'Commented code detected',
                suggestion: 'Remove commented code or use version control for history',
              });
            }
          }
        });
      } catch {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private findSourceFiles(): string[] {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
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
      } catch {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return sourceFiles;
  }

  private calculateMetrics(findings: CleanupFinding[]): CleanupMetrics {
    return {
      totalFiles: findings.length > 0 ? new Set(findings.map((f) => f.filePath)).size : 0,
      deadCodeInstances: findings.filter((f) => f.type === 'dead-code').length,
      unusedDependencies: findings.filter((f) => f.type === 'unused-dependency').length,
      temporaryFiles: findings.filter((f) => f.type === 'temporary-file').length,
      unusedFiles: findings.filter((f) => f.type === 'unused-file').length,
      unusedImports: findings.filter((f) => f.type === 'unused-import').length,
    };
  }
}











