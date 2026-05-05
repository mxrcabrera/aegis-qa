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
export declare class ASTAnalyzer {
    private project;
    private projectRoot;
    private dependencyMap;
    private importMap;
    private exportMap;
    constructor(projectRoot: string);
    /**
     * Analyzes the entire project and builds dependency graph
     *
     * @returns Promise<void>
     */
    analyzeProject(): Promise<void>;
    /**
     * Analyzes a single source file
     *
     * @private
     * @param sourceFile - Source file to analyze
     * @returns Promise<void>
     */
    private analyzeFile;
    /**
     * Extracts imports from a source file
     *
     * @private
     * @param sourceFile - Source file
     * @param relativePath - Relative path of the file
     * @returns ImportInfo[] - Array of import information
     */
    private extractImports;
    /**
     * Extracts exports from a source file
     *
     * @private
     * @param sourceFile - Source file
     * @param relativePath - Relative path of the file
     * @returns ExportInfo[] - Array of export information
     */
    private extractExports;
    /**
     * Resolves module path to relative path
     *
     * @private
     * @param moduleSpecifier - Module specifier
     * @param fromPath - Path of the importing file
     * @returns string | null - Resolved path or null
     */
    private resolveModulePath;
    /**
     * Gets files that import a specific file
     *
     * @private
     * @param filePath - File path to check
     * @returns string[] - Array of file paths that import this file
     */
    private getFilesThatImport;
    /**
     * Gets the impact radius of a file
     *
     * @param filePath - File path to analyze (relative to project root)
     * @returns ImpactRadius - Impact radius information
     */
    getImpactRadius(filePath: string): ImpactRadius;
    /**
     * Recursively collects all files that depend on a given file
     *
     * @private
     * @param filePath - File path to start from
     * @param affectedFiles - Set to collect affected files
     * @param visited - Set to track visited files
     */
    private collectDependents;
    /**
     * Gets dependency information for a file
     *
     * @param filePath - File path (relative to project root)
     * @returns FileDependency | null - Dependency information or null
     */
    getFileDependency(filePath: string): FileDependency | null;
    /**
     * Gets all files in the dependency map
     *
     * @returns string[] - Array of file paths
     */
    getAllFiles(): string[];
    /**
     * Gets files sorted by impact (most impactful first)
     *
     * @returns Array<{filePath: string; impact: number}> - Files sorted by impact
     */
    getFilesByImpact(): Array<{
        filePath: string;
        impact: number;
    }>;
    /**
     * Clears the dependency map
     */
    clear(): void;
}
export {};
//# sourceMappingURL=ast-analyzer.d.ts.map