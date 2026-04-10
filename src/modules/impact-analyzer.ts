/**
 * Impact Analysis Module (Task 4.5)
 *
 * Analyzes the impact of modifying a file by tracking import dependencies.
 * This helps determine the risk level of applying fixes to high-traffic files.
 *
 * @module impact-analyzer
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ImpactScore {
  dependentsCount: number;
  isBarrelExport: boolean;
  isEntryPoint: boolean;
}

export interface ImportGraph {
  [filePath: string]: {
    imports: string[];
    importedBy: string[];
  };
}

export class ImpactAnalyzer {
  private projectRoot: string;
  private importGraph: ImportGraph | null = null;
  private graphCacheTime: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Analyze the impact of modifying a specific file
   *
   * @param filePath - The file path to analyze
   * @returns Impact score for the file
   */
  async analyzeImpact(filePath: string): Promise<ImpactScore> {
    // Build or refresh import graph if needed
    await this.ensureImportGraph();

    const relativePath = path.relative(this.projectRoot, filePath);
    
    // Get the node for this file
    const node = this.importGraph![relativePath];
    
    if (!node) {
      // File not in graph (new file or not a source file)
      return {
        dependentsCount: 0,
        isBarrelExport: false,
        isEntryPoint: false
      };
    }

    // Check if this is a barrel file (index.ts, index.js)
    const isBarrelExport = this.isBarrelFile(relativePath);
    
    // If it's a barrel file, include dependents of the barrel
    let dependentsCount = node.importedBy.length;
    if (isBarrelExport) {
      // Count direct dependents plus any files that re-export from this barrel
      dependentsCount = this.countBarrelDependents(relativePath);
    }

    // Check if this is an entry point (no imports, or only imports from node_modules)
    const isEntryPoint = this.isEntryPoint(node);

    return {
      dependentsCount,
      isBarrelExport,
      isEntryPoint
    };
  }

  /**
   * Ensure the import graph is built and fresh
   */
  private async ensureImportGraph(): Promise<void> {
    const now = Date.now();
    
    if (!this.importGraph || (now - this.graphCacheTime) > this.CACHE_TTL_MS) {
      this.importGraph = await this.buildImportGraph();
      this.graphCacheTime = now;
    }
  }

  /**
   * Build the import graph for the entire project
   *
   * @private
   * @returns Import graph mapping files to their imports and dependents
   */
  private async buildImportGraph(): Promise<ImportGraph> {
    const graph: ImportGraph = {};
    const sourceFiles = this.findSourceFiles();

    // Initialize graph nodes
    for (const file of sourceFiles) {
      const relativePath = path.relative(this.projectRoot, file);
      graph[relativePath] = {
        imports: [],
        importedBy: []
      };
    }

    // Scan each file for imports
    for (const file of sourceFiles) {
      const relativePath = path.relative(this.projectRoot, file);
      const imports = await this.extractImports(file);

      graph[relativePath].imports = imports;

      // Update dependents for each imported file
      for (const importedFile of imports) {
        if (graph[importedFile]) {
          graph[importedFile].importedBy.push(relativePath);
        }
      }
    }

    return graph;
  }

  /**
   * Find all source files in the project
   *
   * @private
   * @returns Array of source file paths
   */
  private findSourceFiles(): string[] {
    const sourceFiles: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

    const scanDirectory = (dir: string) => {
      try {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        if (!entries || !Array.isArray(entries)) return;

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules and .git
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.sentinel') {
              continue;
            }
            scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              sourceFiles.push(fullPath);
            }
          }
        }
      } catch {
        // Skip directories that can't be read (permission issues, etc.)
        return;
      }
    };

    scanDirectory(this.projectRoot);
    return sourceFiles;
  }

  /**
   * Extract imports from a file
   *
   * @private
   * @param filePath - Path to the file
   * @returns Array of imported file paths (relative to project root)
   */
  private async extractImports(filePath: string): Promise<string[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: string[] = [];
    const fileDir = path.dirname(filePath);

    // Match ES6 imports: import ... from '...' or import '...'
    const es6ImportRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = this.resolveImportPath(importPath, fileDir);
      if (resolved) {
        imports.push(resolved);
      }
    }

    // Match CommonJS requires: require('...')
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = this.resolveImportPath(importPath, fileDir);
      if (resolved) {
        imports.push(resolved);
      }
    }

    return imports;
  }

  /**
   * Resolve an import path to a relative path in the project
   *
   * @private
   * @param importPath - The import path
   * @param fileDir - The directory of the file containing the import
   * @returns Resolved path relative to project root, or null if external
   */
  private resolveImportPath(importPath: string, fileDir: string): string | null {
    // Skip node_modules and built-in modules
    if (importPath.startsWith('.') || importPath.startsWith('node_modules')) {
      // Only process relative imports
      if (importPath.startsWith('.')) {
        const absolutePath = path.resolve(fileDir, importPath);
        
        // Try with extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
        for (const ext of extensions) {
          const withExt = absolutePath + ext;
          if (fs.existsSync(withExt)) {
            return path.relative(this.projectRoot, withExt).replace(/\\/g, '/');
          }
        }

        // Try with index file
        for (const ext of extensions) {
          const indexPath = path.join(absolutePath, 'index' + ext);
          if (fs.existsSync(indexPath)) {
            return path.relative(this.projectRoot, indexPath).replace(/\\/g, '/');
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if a file is a barrel file (index.ts, index.js, etc.)
   *
   * @private
   * @param relativePath - Relative path to the file
   * @returns True if barrel file
   */
  private isBarrelFile(relativePath: string): boolean {
    const basename = path.basename(relativePath);
    return basename === 'index.ts' || basename === 'index.js' || basename === 'index.tsx' || basename === 'index.jsx';
  }

  /**
   * Count dependents of a barrel file, including indirect dependents
   *
   * @private
   * @param barrelPath - Path to the barrel file
   * @returns Total dependents count
   */
  private countBarrelDependents(barrelPath: string): number {
    const node = this.importGraph![barrelPath];
    if (!node) return 0;

    // Start with direct dependents
    const dependents = new Set(node.importedBy);
    
    // Check if any dependents re-export from this barrel
    for (const dependent of node.importedBy) {
      const dependentNode = this.importGraph![dependent];
      if (dependentNode) {
        // Check if dependent re-exports from the barrel
        const reExports = this.checkReExports(dependent, barrelPath);
        if (reExports) {
          // Add dependents of the re-exporting file
          for (const dep of dependentNode.importedBy) {
            dependents.add(dep);
          }
        }
      }
    }

    return dependents.size;
  }

  /**
   * Check if a file re-exports from another file
   *
   * @private
   * @param filePath - Path to check
   * @param exportPath - Path of the export to check for
   * @returns True if re-exports
   */
  private checkReExports(filePath: string, exportPath: string): boolean {
    const absolutePath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(absolutePath)) return false;

    const content = fs.readFileSync(absolutePath, 'utf-8');
    
    // Check for export ... from patterns
    const exportRegex = /export\s+(?:\*|\{[^}]+\})\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportedPath = match[1];
      if (exportedPath === exportPath || exportedPath.startsWith(exportPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a file is an entry point (no imports from project)
   *
   * @private
   * @param node - Graph node for the file
   * @returns True if entry point
   */
  private isEntryPoint(node: { imports: string[] }): boolean {
    // Entry point has no project-local imports
    return node.imports.length === 0;
  }

  /**
   * Clear the import graph cache
   */
  clearCache(): void {
    this.importGraph = null;
    this.graphCacheTime = 0;
  }

  /**
   * Get the current import graph (for testing/debugging)
   */
  getImportGraph(): ImportGraph | null {
    return this.importGraph;
  }
}
