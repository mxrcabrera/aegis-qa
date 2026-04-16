/**
 * Dependency Risk Analyzer - Safe Level 4 Dynamic Risk Assessment
 *
 * Purpose: Calculate risk level for files based on depth, location context,
 * and importer context. This implements the Safe Level 4 dynamic risk
 * assessment to prevent catastrophic fixes in critical files.
 *
 * Risk Matrix:
 * - Critical (riskScore >= 100): /core or /server-actions imported by >3 core files
 * - High (riskScore >= 70): /core or /server-actions imported by 1-2 core files
 * - Medium (riskScore >= 40): /utils imported by >5 files
 * - Low (riskScore < 40): /ui or /components
 *
 * @module core/dependency-risk-analyzer
 * @since 1.1.0
 */

import * as path from 'path';
import { ASTAnalyzer } from './ast-analyzer.js';

/**
 * File location context
 */
type FileLocation = 'core' | 'server-actions' | 'utils' | 'ui' | 'components' | 'api' | 'middleware' | 'other';

/**
 * Risk level
 */
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Dependency risk assessment
 */
interface DependencyRisk {
  /** File path */
  filePath: string;
  /** Number of files importing this file */
  importCount: number;
  /** Calculated risk level */
  riskLevel: RiskLevel;
  /** Risk score (0-100+) */
  riskScore: number;
  /** Context information */
  context: {
    /** Location of the file */
    location: FileLocation;
    /** Paths of files importing this file */
    importers: string[];
    /** Locations of importers */
    importerContexts: FileLocation[];
    /** Distance from entry point */
    depth: number;
  };
  /** Recommended action */
  recommendedAction: 'allow-auto-fix' | 'dry-run-only' | 'manual-approval-required' | 'blocked';
}

/**
 * Dependency Risk Analyzer - Safe Level 4 Dynamic Risk Assessment
 *
 * This class calculates risk levels for files based on their location context
 * and the context of their importers to prevent catastrophic fixes.
 *
 * @class DependencyRiskAnalyzer
 */
export class DependencyRiskAnalyzer {
  private criticalPaths: string[] = [
    '/auth',
    '/database',
    '/api',
    '/middleware',
    '/lib/auth',
    '/lib/database',
  ];
  private astAnalyzer: ASTAnalyzer | null = null;

  constructor(astAnalyzer?: ASTAnalyzer) {
    this.astAnalyzer = astAnalyzer || null;
  }

  /**
   * Analyzes file location based on path
   *
   * @private
   * @param filePath - File path to analyze
   * @returns FileLocation - Location context
   */
  private analyzeLocation(filePath: string): FileLocation {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
    
    // Core directories
    if (normalizedPath.includes('/core/') || normalizedPath.includes('/lib/core/')) {
      return 'core';
    }
    if (normalizedPath.includes('/server-actions/') || normalizedPath.includes('/actions/')) {
      return 'server-actions';
    }
    if (normalizedPath.includes('/utils/') || normalizedPath.includes('/lib/')) {
      return 'utils';
    }
    if (normalizedPath.includes('/api/') || normalizedPath.includes('/routes/')) {
      return 'api';
    }
    if (normalizedPath.includes('/middleware/')) {
      return 'middleware';
    }
    if (normalizedPath.includes('/components/') || normalizedPath.includes('/ui/')) {
      return 'components';
    }
    if (normalizedPath.includes('/ui/')) {
      return 'ui';
    }
    
    // Check for critical paths
    for (const criticalPath of this.criticalPaths) {
      if (normalizedPath.includes(criticalPath)) {
        return 'core';
      }
    }
    
    return 'other';
  }

  /**
   * Calculates risk level for a file based on its context and importers
   *
   * @param filePath - File path to analyze
   * @param importers - Array of file paths that import this file (optional if ASTAnalyzer is available)
   * @returns DependencyRisk - Risk assessment
   */
  calculateRisk(filePath: string, importers?: string[]): DependencyRisk {
    // Use ASTAnalyzer if available to get real importers
    let realImporters = importers || [];
    let impactRadius = 0;
    
    if (this.astAnalyzer) {
      const impact = this.astAnalyzer.getImpactRadius(filePath);
      impactRadius = impact.totalAffected;
      
      // Get real importers from ASTAnalyzer
      const fileDependency = this.astAnalyzer.getFileDependency(filePath);
      if (fileDependency) {
        realImporters = fileDependency.importedBy;
      }
    }
    
    // 1. Analyze location of the file
    const location = this.analyzeLocation(filePath);
    
    // 2. Analyze context of importers
    const importerContexts = realImporters.map(imp => this.analyzeLocation(imp));
    
    // 3. Calculate risk score
    let riskScore = 0;
    
    // Points by location of the file
    if (location === 'core') riskScore += 50;
    if (location === 'server-actions') riskScore += 40;
    if (location === 'middleware') riskScore += 35;
    if (location === 'api') riskScore += 30;
    if (location === 'utils') riskScore += 20;
    if (location === 'components' || location === 'ui') riskScore += 5;
    
    // Points by context of importers
    const coreImporters = importerContexts.filter(c => c === 'core').length;
    const serverActionImporters = importerContexts.filter(c => c === 'server-actions').length;
    const middlewareImporters = importerContexts.filter(c => c === 'middleware').length;
    const apiImporters = importerContexts.filter(c => c === 'api').length;
    
    riskScore += coreImporters * 25; // Imported by core = very dangerous
    riskScore += serverActionImporters * 20; // Imported by server-actions = dangerous
    riskScore += middlewareImporters * 15; // Imported by middleware = dangerous
    riskScore += apiImporters * 10; // Imported by API = moderately dangerous
    
    // Points by total import count
    riskScore += Math.min(realImporters.length * 2, 20); // Max 20 points for import count
    
    // 4. Determine risk level
    let riskLevel: RiskLevel;
    
    // Override with AST-based impact analysis if available
    if (this.astAnalyzer && impactRadius > 10) {
      // If impact radius > 10 files, force to critical
      riskLevel = 'critical';
      riskScore = Math.max(riskScore, 100); // Ensure score reflects critical level
    } else if (riskScore >= 100) {
      riskLevel = 'critical';
    } else if (riskScore >= 70) {
      riskLevel = 'high';
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    // 5. Determine recommended action
    let recommendedAction: DependencyRisk['recommendedAction'];
    if (riskLevel === 'critical') {
      recommendedAction = 'manual-approval-required';
    } else if (riskLevel === 'high') {
      recommendedAction = 'dry-run-only';
    } else if (riskLevel === 'medium') {
      recommendedAction = 'dry-run-only';
    } else {
      recommendedAction = 'allow-auto-fix';
    }
    
    // 6. Calculate depth (distance from entry point)
    const depth = this.calculateDepth(filePath);
    
    return {
      filePath,
      importCount: realImporters.length,
      riskLevel,
      riskScore,
      context: {
        location,
        importers: realImporters,
        importerContexts,
        depth,
      },
      recommendedAction,
    };
  }

  /**
   * Calculates depth of file from entry point
   *
   * @private
   * @param filePath - File path
   * @returns number - Depth level
   */
  private calculateDepth(filePath: string): number {
    const parts = filePath.split(path.sep).filter(p => p && p !== '.' && p !== '..');
    return parts.length;
  }

  /**
   * Checks if a file is safe for automatic fixes
   *
   * @param filePath - File path to check
   * @param importers - Array of file paths that import this file
   * @returns boolean - True if safe for auto-fix
   */
  isSafeForAutoFix(filePath: string, importers: string[]): boolean {
    const risk = this.calculateRisk(filePath, importers);
    return risk.recommendedAction === 'allow-auto-fix';
  }

  /**
   * Checks if a file requires dry-run mode
   *
   * @param filePath - File path to check
   * @param importers - Array of file paths that import this file
   * @returns boolean - True if dry-run is required
   */
  requiresDryRun(filePath: string, importers: string[]): boolean {
    const risk = this.calculateRisk(filePath, importers);
    return risk.recommendedAction === 'dry-run-only' || 
           risk.recommendedAction === 'manual-approval-required';
  }

  /**
   * Checks if a file is blocked from any fixes
   *
   * @param filePath - File path to check
   * @param importers - Array of file paths that import this file
   * @returns boolean - True if file is blocked
   */
  isBlocked(filePath: string, importers: string[]): boolean {
    const risk = this.calculateRisk(filePath, importers);
    return risk.recommendedAction === 'manual-approval-required' || 
           risk.recommendedAction === 'blocked';
  }

  /**
   * Gets risk assessment for multiple files
   *
   * @param files - Array of file paths
   * @param dependencyGraph - Map of file -> importers
   * @returns Map<string, DependencyRisk> - Risk assessments
   */
  assessMultipleRisks(
    files: string[],
    dependencyGraph: Map<string, string[]>
  ): Map<string, DependencyRisk> {
    const riskMap = new Map<string, DependencyRisk>();
    
    for (const file of files) {
      const importers = dependencyGraph.get(file) || [];
      const risk = this.calculateRisk(file, importers);
      riskMap.set(file, risk);
    }
    
    return riskMap;
  }

  /**
   * Filters files that are safe for auto-fix
   *
   * @param files - Array of file paths
   * @param dependencyGraph - Map of file -> importers
   * @returns string[] - Files safe for auto-fix
   */
  getSafeFilesForAutoFix(
    files: string[],
    dependencyGraph: Map<string, string[]>
  ): string[] {
    const safeFiles: string[] = [];
    
    for (const file of files) {
      const importers = dependencyGraph.get(file) || [];
      if (this.isSafeForAutoFix(file, importers)) {
        safeFiles.push(file);
      }
    }
    
    return safeFiles;
  }

  /**
   * Filters files that require dry-run
   *
   * @param files - Array of file paths
   * @param dependencyGraph - Map of file -> importers
   * @returns string[] - Files requiring dry-run
   */
  getFilesRequiringDryRun(
    files: string[],
    dependencyGraph: Map<string, string[]>
  ): string[] {
    const dryRunFiles: string[] = [];
    
    for (const file of files) {
      const importers = dependencyGraph.get(file) || [];
      if (this.requiresDryRun(file, importers)) {
        dryRunFiles.push(file);
      }
    }
    
    return dryRunFiles;
  }

  /**
   * Filters blocked files
   *
   * @param files - Array of file paths
   * @param dependencyGraph - Map of file -> importers
   * @returns string[] - Blocked files
   */
  getBlockedFiles(
    files: string[],
    dependencyGraph: Map<string, string[]>
  ): string[] {
    const blockedFiles: string[] = [];
    
    for (const file of files) {
      const importers = dependencyGraph.get(file) || [];
      if (this.isBlocked(file, importers)) {
        blockedFiles.push(file);
      }
    }
    
    return blockedFiles;
  }
}
