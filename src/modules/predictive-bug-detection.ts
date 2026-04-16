/**
 * Predictive Bug Detection - Phase 13
 *
 * Identifies code patterns that are bug magnets based on senior development heuristics.
 * Automated intuition: "This will fail when the server takes >200ms".
 *
 * @module predictive-bug-detection
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PredictiveIssue {
  id: string;
  type: 'silent-killer' | 'race-condition' | 'implicit-nulls' | 'high-fragility' | 'state-mutation' | 'critical-risk' | 'performance-death-trap' | 'data-loss-risk' | 'architectural-fragility';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  description: string;
  intuition: string;
  isCorePath: boolean;
  confidenceScore: number; // 0.0 to 1.0
  combo?: string; // If this is a combo of multiple patterns
}

export interface PredictiveResults {
  issues: PredictiveIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export class PredictiveBugDetection {
  private projectRoot: string;
  private corePaths: string[];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.corePaths = ['src/', 'lib/', 'components/'];
  }

  /**
   * Run predictive bug detection
   */
  async detect(dirtyDataZones: string[] = [], heavyComputationFiles: string[] = []): Promise<PredictiveResults> {
    const results: PredictiveResults = {
      issues: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      }
    };

    // Scan source files
    const libPath = path.join(this.projectRoot, 'lib');
    const srcPath = path.join(this.projectRoot, 'src');

    const filesToScan: string[] = [];

    if (fs.existsSync(libPath)) {
      filesToScan.push(...await this.scanDirectory(libPath, '.ts'));
    }

    if (fs.existsSync(srcPath)) {
      filesToScan.push(...await this.scanDirectory(srcPath, '.ts'));
      filesToScan.push(...await this.scanDirectory(srcPath, '.tsx'));
    }

    for (const file of filesToScan) {
      const issues = await this.analyzeFile(file, dirtyDataZones, heavyComputationFiles);
      results.issues.push(...issues);
    }

    // Calculate summary
    results.summary = this.calculateSummary(results.issues);

    return results;
  }

  /**
   * Analyze a single file for predictive bugs
   */
  private async analyzeFile(filePath: string, dirtyDataZones: string[], heavyComputationFiles: string[]): Promise<PredictiveIssue[]> {
    const issues: PredictiveIssue[] = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const isCorePath = this.isCorePath(filePath);
    const isHeavyComputation = heavyComputationFiles.includes(filePath);

    // Track patterns detected in this file for combo detection
    const filePatterns: Set<string> = new Set();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Silent Killer: try-catch with empty catch or only console.log
      const silentKiller = this.detectSilentKiller(line, lines, i, isCorePath, filePath);
      if (silentKiller) {
        issues.push(silentKiller);
        filePatterns.add('silent-killer');
      }

      // Race Condition Risk: await in .map() or mutating external variable
      const raceCondition = this.detectRaceCondition(line, lines, i, isCorePath, isHeavyComputation);
      if (raceCondition) {
        issues.push(raceCondition);
        filePatterns.add('race-condition');
      }

      // Implicit Nulls: deep property access without optional chaining
      const implicitNulls = this.detectImplicitNulls(line, filePath, dirtyDataZones, isCorePath);
      if (implicitNulls) {
        issues.push(implicitNulls);
        filePatterns.add('implicit-nulls');
      }

      // Logic Heatmap: >3 levels of nesting
      const highFragility = this.detectHighFragility(line, lines, i, isCorePath);
      if (highFragility) {
        issues.push(highFragility);
        filePatterns.add('high-fragility');
      }

      // State Mutation Warning: direct mutations in React
      const stateMutation = this.detectStateMutation(line, filePath, isCorePath);
      if (stateMutation) {
        issues.push(stateMutation);
        filePatterns.add('state-mutation');
      }
    }

    // Explosive Combo Detection: Check for dangerous combinations
    this.detectExplosiveCombos(issues, filePatterns, filePath);

    return issues;
  }

  /**
   * Detect Silent Killer: try-catch with empty catch or only console.log
   */
  private detectSilentKiller(line: string, lines: string[], index: number, isCorePath: boolean, filePath: string): PredictiveIssue | null {
    const catchMatch = line.match(/catch\s*\([^)]*\)\s*\{/);
    if (!catchMatch) return null;

    // Check next few lines for catch block content
    const catchBlock = lines.slice(index, Math.min(index + 5, lines.length)).join('\n');
    
    // Empty catch or only console.log
    const isEmpty = catchBlock.match(/catch\s*\([^)]*\)\s*\{\s*\}/);
    const isOnlyConsoleLog = catchBlock.match(/catch\s*\([^)]*\)\s*\{[\s\S]*console\.log[\s\S]*\}/);

    if (isEmpty || isOnlyConsoleLog) {
      // Check if wrapping DB/API call for Silent Killer Upgrade
      const isPersistenceLayer = this.isPersistenceLayer(catchBlock);
      const isCritical = isPersistenceLayer ? 'critical' : (isCorePath ? 'critical' : 'high');
      const type = isPersistenceLayer ? 'data-loss-risk' : 'silent-killer';
      const description = isPersistenceLayer 
        ? 'Silent failure in persistence layer' 
        : (isEmpty ? 'Empty catch block' : 'Catch block only has console.log');
      const intuition = isPersistenceLayer
        ? '🚨 DATA_LOSS_RISK: Silent failure in persistence layer detected. This will lose data when the server fails.'
        : 'This will fail silently when the server takes >200ms. Errors are swallowed.';

      return {
        id: `silent-killer-${Date.now()}`,
        type,
        severity: isCritical as 'critical' | 'high',
        file: this.getRelativePath(filePath),
        line: index + 1,
        description,
        intuition,
        isCorePath,
        confidenceScore: isPersistenceLayer ? 0.95 : 0.85
      };
    }

    return null;
  }

  /**
   * Detect Race Condition Risk: await in .map() or mutating external variable
   */
  private detectRaceCondition(line: string, lines: string[], index: number, isCorePath: boolean, isHeavyComputation: boolean): PredictiveIssue | null {
    // await inside .map()
    const awaitInMap = line.match(/\.map\s*\([^)]*\)\s*=>\s*{[\s\S]*await/);
    if (awaitInMap) {
      // Concurrency Bottleneck: await in .map() in Heavy Computation = PERFORMANCE_DEATH_TRAP
      if (isHeavyComputation) {
        return {
          id: `performance-death-trap-${Date.now()}`,
          type: 'performance-death-trap',
          severity: 'critical',
          file: this.getRelativePath(lines[index] || ''),
          line: index + 1,
          description: 'PERFORMANCE DEATH TRAP: await inside .map() in heavy computation',
          intuition: 'This will kill performance when processing large datasets. The thread pool will be exhausted.',
          isCorePath,
          confidenceScore: 0.95
        };
      }

      return {
        id: `race-condition-${Date.now()}`,
        type: 'race-condition',
        severity: 'high',
        file: this.getRelativePath(lines[index] || ''),
        line: index + 1,
        description: 'await inside .map() without Promise.all()',
        intuition: 'This will fail when promises resolve out of order. Race condition imminent.',
        isCorePath,
        confidenceScore: 0.90
      };
    }

    // Mutation of external variable in loop
    const externalMutation = line.match(/\w+\.(push|pop|shift|unshift|splice|sort|reverse)\s*\(/);
    if (externalMutation) {
      return {
        id: `race-condition-${Date.now()}`,
        type: 'race-condition',
        severity: 'medium',
        file: this.getRelativePath(lines[index] || ''),
        line: index + 1,
        description: 'Direct mutation of array in potentially parallel context',
        intuition: 'This will fail when multiple iterations execute simultaneously.',
        isCorePath,
        confidenceScore: 0.80
      };
    }

    return null;
  }

  /**
   * Detect Implicit Nulls: deep property access without optional chaining
   */
  private detectImplicitNulls(line: string, filePath: string, dirtyDataZones: string[], isCorePath: boolean): PredictiveIssue | null {
    // Check if file is in dirty data zone
    const relativePath = this.getRelativePath(filePath);
    const isDirtyZone = dirtyDataZones.some(zone => relativePath.includes(zone));

    if (!isDirtyZone) return null;

    // Deep property access without optional chaining (e.g., obj.a.b.c instead of obj.a?.b?.c)
    const deepAccess = line.match(/\w+\.\w+\.\w+/);
    if (deepAccess && !line.includes('?.')) {
      return {
        id: `implicit-nulls-${Date.now()}`,
        type: 'implicit-nulls',
        severity: 'medium',
        file: relativePath,
        line: 0, // Line number would need to be tracked
        description: 'Deep property access without optional chaining',
        intuition: 'This will fail when data is missing. Null reference exception imminent.',
        isCorePath,
        confidenceScore: 0.85
      };
    }

    return null;
  }

  /**
   * Detect Logic Heatmap: >3 levels of nesting
   */
  private detectHighFragility(line: string, lines: string[], index: number, isCorePath: boolean): PredictiveIssue | null {
    const openBraces = (line.match(/{/g) || []).length;
    if (openBraces > 3) {
      return {
        id: `high-fragility-${Date.now()}`,
        type: 'high-fragility',
        severity: 'medium',
        file: this.getRelativePath(lines[index] || ''),
        line: index + 1,
        description: `High nesting level (${openBraces} braces)`,
        intuition: 'This will fail when logic complexity increases. Cognitive overload imminent.',
        isCorePath,
        confidenceScore: 0.75
      };
    }

    return null;
  }

  /**
   * Detect State Mutation Warning: direct mutations in React
   */
  private detectStateMutation(line: string, filePath: string, isCorePath: boolean): PredictiveIssue | null {
    // Check if file is a React component
    const isReactFile = filePath.endsWith('.tsx') || filePath.includes('components/');

    if (!isReactFile) return null;

    // Direct mutation of state or props
    const stateMutation = line.match(/(state|props)\.(push|pop|shift|unshift|splice|sort|reverse)\s*\(/);
    if (stateMutation) {
      // Prop Drilling Fragility: If mutation is on props (passed through components)
      const isPropsMutation = stateMutation[1] === 'props';
      if (isPropsMutation) {
        return {
          id: `architectural-fragility-${Date.now()}`,
          type: 'architectural-fragility',
          severity: 'critical',
          file: this.getRelativePath(filePath),
          line: 0,
          description: 'ARCHITECTURAL FRAGILITY: Direct mutation of props',
          intuition: 'This will fail when React tries to re-render. Props mutation breaks the data flow.',
          isCorePath,
          confidenceScore: 0.95
        };
      }

      return {
        id: `state-mutation-${Date.now()}`,
        type: 'state-mutation',
        severity: 'high',
        file: this.getRelativePath(filePath),
        line: 0,
        description: `Direct mutation of ${stateMutation[1]}`,
        intuition: 'This will fail when React tries to re-render. State mutation detected.',
        isCorePath,
        confidenceScore: 0.90
      };
    }

    return null;
  }

  /**
   * Detect Explosive Combos: Dangerous pattern combinations
   */
  private detectExplosiveCombos(issues: PredictiveIssue[], patterns: Set<string>, filePath: string): void {
    // Explosive Combo: HIGH_FRAGILITY + Implicit Nulls = CRITICAL_RISK
    if (patterns.has('high-fragility') && patterns.has('implicit-nulls')) {
      const criticalRisk: PredictiveIssue = {
        id: `critical-risk-${Date.now()}`,
        type: 'critical-risk',
        severity: 'critical',
        file: this.getRelativePath(filePath),
        line: 0,
        description: 'EXPLOSIVE COMBO: High fragility + implicit nulls',
        intuition: 'This will explode at the first unexpected data. A bomb waiting to detonate.',
        isCorePath: this.isCorePath(filePath),
        confidenceScore: 0.95,
        combo: 'high-fragility + implicit-nulls'
      };
      issues.push(criticalRisk);
    }
  }

  /**
   * Check if catch block is in persistence layer (DB/API calls)
   */
  private isPersistenceLayer(catchBlock: string): boolean {
    const persistenceKeywords = ['db.', 'database', 'query', 'insert', 'update', 'delete', 'fetch', 'axios', 'http', 'api', 'supabase', 'prisma'];
    const lowerBlock = catchBlock.toLowerCase();
    return persistenceKeywords.some(keyword => lowerBlock.includes(keyword));
  }

  /**
   * Calculate summary of issues
   */
  private calculateSummary(issues: PredictiveIssue[]): PredictiveResults['summary'] {
    return {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      total: issues.length
    };
  }

  /**
   * Check if file is in Core Path
   */
  private isCorePath(filePath: string): boolean {
    const relativePath = path.relative(this.projectRoot, filePath);
    return this.corePaths.some(corePath => relativePath.startsWith(corePath));
  }

  /**
   * Get relative path from project root
   */
  private getRelativePath(filePath: string): string {
    return path.relative(this.projectRoot, filePath);
  }

  /**
   * Scan directory for files
   */
  private async scanDirectory(dir: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...await this.scanDirectory(fullPath, extension));
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }

    return files;
  }
}

export default PredictiveBugDetection;
