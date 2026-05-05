/**
 * Impact Analysis Module (Task 4.5)
 *
 * Analyzes the impact of modifying a file by tracking import dependencies.
 * This helps determine the risk level of applying fixes to high-traffic files.
 *
 * @module impact-analyzer
 * @since 2.0.0
 */
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
export declare class ImpactAnalyzer {
    private projectRoot;
    private importGraph;
    private graphCacheTime;
    private readonly CACHE_TTL_MS;
    constructor(projectRoot: string);
    /**
     * Analyze the impact of modifying a specific file
     *
     * @param filePath - The file path to analyze
     * @returns Impact score for the file
     */
    analyzeImpact(filePath: string): Promise<ImpactScore>;
    /**
     * Ensure the import graph is built and fresh
     */
    private ensureImportGraph;
    /**
     * Build the import graph for the entire project
     *
     * @private
     * @returns Import graph mapping files to their imports and dependents
     */
    private buildImportGraph;
    /**
     * Find all source files in the project
     *
     * @private
     * @returns Array of source file paths
     */
    private findSourceFiles;
    /**
     * Extract imports from a file
     *
     * @private
     * @param filePath - Path to the file
     * @returns Array of imported file paths (relative to project root)
     */
    private extractImports;
    /**
     * Resolve an import path to a relative path in the project
     *
     * @private
     * @param importPath - The import path
     * @param fileDir - The directory of the file containing the import
     * @returns Resolved path relative to project root, or null if external
     */
    private resolveImportPath;
    /**
     * Check if a file is a barrel file (index.ts, index.js, etc.)
     *
     * @private
     * @param relativePath - Relative path to the file
     * @returns True if barrel file
     */
    private isBarrelFile;
    /**
     * Count dependents of a barrel file, including indirect dependents
     *
     * @private
     * @param barrelPath - Path to the barrel file
     * @returns Total dependents count
     */
    private countBarrelDependents;
    /**
     * Check if a file re-exports from another file
     *
     * @private
     * @param filePath - Path to check
     * @param exportPath - Path of the export to check for
     * @returns True if re-exports
     */
    private checkReExports;
    /**
     * Check if a file is an entry point (no imports from project)
     *
     * @private
     * @param node - Graph node for the file
     * @returns True if entry point
     */
    private isEntryPoint;
    /**
     * Clear the import graph cache
     */
    clearCache(): void;
    /**
     * Get the current import graph (for testing/debugging)
     */
    getImportGraph(): ImportGraph | null;
}
//# sourceMappingURL=impact-analyzer.d.ts.map