/**
 * ASTAnalyzer - Dependency Graph Analysis using ts-morph
 *
 * Purpose: Map the entire project using AST analysis to detect
 * real import/export relationships between files. This enables
 * accurate impact analysis for Safe Level 4 risk assessment.
 *
 * @module core/ast-analyzer
 * @since 1.2.0
 */

import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';

/**
 * Export information
 */
interface ExportInfo {
  /** Exported name */
  name: string;
  /** Export type (function, class, variable, etc.) */
  type: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum' | 'default';
  /** Is default export */
  isDefault: boolean;
  /** Source file path */
  sourceFilePath: string;
}

/**
 * Import information
 */
interface ImportInfo {
  /** Imported name */
  name: string;
  /** Source file path of the import */
  sourceFilePath: string;
  /** Target file path that imports it */
  targetFilePath: string;
  /** Import type (named, default, namespace, etc.) */
  importType: 'named' | 'default' | 'namespace' | 'type' | 'side-effect';
}

/**
 * File dependency information
 */
interface FileDependency {
  /** File path */
  filePath: string;
  /** Files that this file imports */
  imports: string[];
  /** Files that import this file */
  importedBy: string[];
  /** Total number of imports */
  totalImports: number;
  /** Total number of files that import this file */
  totalImportedBy: number;
  /** Exported symbols from this file */
  exports: ExportInfo[];
}

/**
 * Impact radius result
 */
interface ImpactRadius {
  /** File being analyzed */
  filePath: string;
  /** Files that would be affected if this file changes */
  affectedFiles: string[];
  /** Total number of affected files */
  totalAffected: number;
  /** Risk level based on impact */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * ASTAnalyzer - Dependency graph analysis using ts-morph
 *
 * This class uses ts-morph to analyze the project's AST and build
 * an accurate dependency graph for impact analysis.
 *
 * @class ASTAnalyzer
 */
export class ASTAnalyzer {
  private project: Project;
  private projectRoot: string;
  private dependencyMap: Map<string, FileDependency>;
  private importMap: Map<string, ImportInfo[]>;
  private exportMap: Map<string, ExportInfo[]>;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.project = new Project({
      tsConfigFilePath: path.join(projectRoot, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
    });
    this.dependencyMap = new Map();
    this.importMap = new Map();
    this.exportMap = new Map();
  }

  /**
   * Analyzes the entire project and builds dependency graph
   *
   * @returns Promise<void>
   */
  async analyzeProject(): Promise<void> {
    console.log('[ASTAnalyzer] Analyzing project dependency graph...');
    
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      
      // Skip node_modules and test files
      if (filePath.includes('node_modules') || filePath.includes('.test.') || filePath.includes('.spec.')) {
        continue;
      }
      
      // Only analyze files in the project root
      if (!filePath.startsWith(this.projectRoot)) {
        continue;
      }
      
      await this.analyzeFile(sourceFile);
    }
    
    console.log(`[ASTAnalyzer] Analysis complete: ${this.dependencyMap.size} files analyzed`);
  }

  /**
   * Analyzes a single source file
   *
   * @private
   * @param sourceFile - Source file to analyze
   * @returns Promise<void>
   */
  private async analyzeFile(sourceFile: SourceFile): Promise<void> {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(this.projectRoot, filePath);
    
    // Get imports
    const imports = this.extractImports(sourceFile, relativePath);
    this.importMap.set(relativePath, imports);
    
    // Get exports
    const exports = this.extractExports(sourceFile, relativePath);
    this.exportMap.set(relativePath, exports);
    
    // Build dependency info
    const importedFiles = imports.map(imp => imp.sourceFilePath);
    const importedByFiles = this.getFilesThatImport(relativePath);
    
    const dependency: FileDependency = {
      filePath: relativePath,
      imports: importedFiles,
      importedBy: importedByFiles,
      totalImports: importedFiles.length,
      totalImportedBy: importedByFiles.length,
      exports,
    };
    
    this.dependencyMap.set(relativePath, dependency);
  }

  /**
   * Extracts imports from a source file
   *
   * @private
   * @param sourceFile - Source file
   * @param relativePath - Relative path of the file
   * @returns ImportInfo[] - Array of import information
   */
  private extractImports(sourceFile: SourceFile, relativePath: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    // Get all import declarations
    const importDeclarations = sourceFile.getImportDeclarations();
    
    for (const importDecl of importDeclarations) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Skip external packages
      if (!moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/')) {
        continue;
      }
      
      // Resolve the module path
      const resolvedPath = this.resolveModulePath(moduleSpecifier, relativePath);
      if (!resolvedPath) {
        continue;
      }
      
      // Get named imports
      const namedImports = importDecl.getNamedImports();
      for (const namedImport of namedImports) {
        imports.push({
          name: namedImport.getName(),
          sourceFilePath: resolvedPath,
          targetFilePath: relativePath,
          importType: 'named',
        });
      }
      
      // Get default import
      if (importDecl.getDefaultImport()) {
        imports.push({
          name: 'default',
          sourceFilePath: resolvedPath,
          targetFilePath: relativePath,
          importType: 'default',
        });
      }
      
      // Get namespace import
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        imports.push({
          name: typeof namespaceImport === 'string' ? namespaceImport : namespaceImport.getText(),
          sourceFilePath: resolvedPath,
          targetFilePath: relativePath,
          importType: 'namespace',
        });
      }
    }
    
    return imports;
  }

  /**
   * Extracts exports from a source file
   *
   * @private
   * @param sourceFile - Source file
   * @param relativePath - Relative path of the file
   * @returns ExportInfo[] - Array of export information
   */
  private extractExports(sourceFile: SourceFile, relativePath: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    
    // Get all export declarations
    const exportDeclarations = sourceFile.getExportDeclarations();
    
    for (const exportDecl of exportDeclarations) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      
      // Skip re-exports (we only care about actual exports)
      if (moduleSpecifier) {
        continue;
      }
      
      // Get named exports
      const namedExports = exportDecl.getNamedExports();
      for (const namedExport of namedExports) {
        exports.push({
          name: namedExport.getName(),
          type: 'variable',
          isDefault: false,
          sourceFilePath: relativePath,
        });
      }
    }
    
    // Get function exports
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      if (func.isExported()) {
        exports.push({
          name: func.getName() || 'anonymous',
          type: 'function',
          isDefault: func.isDefaultExport(),
          sourceFilePath: relativePath,
        });
      }
    }
    
    // Get class exports
    const classes = sourceFile.getClasses();
    for (const cls of classes) {
      if (cls.isExported()) {
        exports.push({
          name: cls.getName() || 'anonymous',
          type: 'class',
          isDefault: cls.isDefaultExport(),
          sourceFilePath: relativePath,
        });
      }
    }
    
    // Get variable exports
    const variables = sourceFile.getVariableStatements();
    for (const variable of variables) {
      if (variable.isExported()) {
        const declarations = variable.getDeclarations();
        for (const decl of declarations) {
          exports.push({
            name: decl.getName() || 'anonymous',
            type: 'variable',
            isDefault: variable.isDefaultExport(),
            sourceFilePath: relativePath,
          });
        }
      }
    }
    
    // Get interface exports
    const interfaces = sourceFile.getInterfaces();
    for (const iface of interfaces) {
      if (iface.isExported()) {
        exports.push({
          name: iface.getName(),
          type: 'interface',
          isDefault: false,
          sourceFilePath: relativePath,
        });
      }
    }
    
    // Get type exports
    const typeAliases = sourceFile.getTypeAliases();
    for (const typeAlias of typeAliases) {
      if (typeAlias.isExported()) {
        exports.push({
          name: typeAlias.getName(),
          type: 'type',
          isDefault: false,
          sourceFilePath: relativePath,
        });
      }
    }
    
    // Get enum exports
    const enums = sourceFile.getEnums();
    for (const enum_ of enums) {
      if (enum_.isExported()) {
        exports.push({
          name: enum_.getName(),
          type: 'enum',
          isDefault: false,
          sourceFilePath: relativePath,
        });
      }
    }
    
    return exports;
  }

  /**
   * Resolves module path to relative path
   *
   * @private
   * @param moduleSpecifier - Module specifier
   * @param fromPath - Path of the importing file
   * @returns string | null - Resolved path or null
   */
  private resolveModulePath(moduleSpecifier: string, fromPath: string): string | null {
    try {
      const resolved = path.resolve(path.dirname(fromPath), moduleSpecifier);
      const relative = path.relative(this.projectRoot, resolved);
      
      // Add .ts extension if not present
      if (!relative.endsWith('.ts') && !relative.endsWith('.tsx') && !relative.endsWith('.js') && !relative.endsWith('.jsx')) {
        // Try .ts first
        const withTs = relative + '.ts';
        if (this.dependencyMap.has(withTs) || this.exportMap.has(withTs)) {
          return withTs;
        }
        // Try index.ts
        const withIndex = path.join(relative, 'index.ts');
        if (this.dependencyMap.has(withIndex) || this.exportMap.has(withIndex)) {
          return withIndex;
        }
      }
      
      return relative;
    } catch {
      return null;
    }
  }

  /**
   * Gets files that import a specific file
   *
   * @private
   * @param filePath - File path to check
   * @returns string[] - Array of file paths that import this file
   */
  private getFilesThatImport(filePath: string): string[] {
    const importers: string[] = [];

    for (const [, imports] of this.importMap) {
      for (const imp of imports) {
        if (imp.sourceFilePath === filePath) {
          importers.push(imp.targetFilePath);
          break;
        }
      }
    }
    
    return [...new Set(importers)]; // Remove duplicates
  }

  /**
   * Gets the impact radius of a file
   *
   * @param filePath - File path to analyze (relative to project root)
   * @returns ImpactRadius - Impact radius information
   */
  getImpactRadius(filePath: string): ImpactRadius {
    const dependency = this.dependencyMap.get(filePath);
    
    if (!dependency) {
      return {
        filePath,
        affectedFiles: [],
        totalAffected: 0,
        riskLevel: 'low',
      };
    }
    
    // Get all files that directly or indirectly depend on this file
    const affectedFiles = new Set<string>();
    const visited = new Set<string>();
    
    this.collectDependents(filePath, affectedFiles, visited);
    
    // Remove the file itself from affected files
    affectedFiles.delete(filePath);
    
    const totalAffected = affectedFiles.size;
    
    // Determine risk level based on impact
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (totalAffected > 50) {
      riskLevel = 'critical';
    } else if (totalAffected > 20) {
      riskLevel = 'high';
    } else if (totalAffected > 10) {
      riskLevel = 'medium';
    }
    
    return {
      filePath,
      affectedFiles: Array.from(affectedFiles),
      totalAffected,
      riskLevel,
    };
  }

  /**
   * Recursively collects all files that depend on a given file
   *
   * @private
   * @param filePath - File path to start from
   * @param affectedFiles - Set to collect affected files
   * @param visited - Set to track visited files
   */
  private collectDependents(filePath: string, affectedFiles: Set<string>, visited: Set<string>): void {
    if (visited.has(filePath)) {
      return;
    }
    
    visited.add(filePath);
    affectedFiles.add(filePath);
    
    const dependency = this.dependencyMap.get(filePath);
    if (!dependency) {
      return;
    }
    
    for (const importer of dependency.importedBy) {
      this.collectDependents(importer, affectedFiles, visited);
    }
  }

  /**
   * Gets dependency information for a file
   *
   * @param filePath - File path (relative to project root)
   * @returns FileDependency | null - Dependency information or null
   */
  getFileDependency(filePath: string): FileDependency | null {
    return this.dependencyMap.get(filePath) || null;
  }

  /**
   * Gets all files in the dependency map
   *
   * @returns string[] - Array of file paths
   */
  getAllFiles(): string[] {
    return Array.from(this.dependencyMap.keys());
  }

  /**
   * Gets files sorted by impact (most impactful first)
   *
   * @returns Array<{filePath: string; impact: number}> - Files sorted by impact
   */
  getFilesByImpact(): Array<{ filePath: string; impact: number }> {
    const files = this.getAllFiles();
    
    return files
      .map(filePath => ({
        filePath,
        impact: this.getImpactRadius(filePath).totalAffected,
      }))
      .sort((a, b) => b.impact - a.impact);
  }

  /**
   * Clears the dependency map
   */
  clear(): void {
    this.dependencyMap.clear();
    this.importMap.clear();
    this.exportMap.clear();
  }
}
