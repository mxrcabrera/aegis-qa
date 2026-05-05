/**
 * Sandbox Manager - Isolated Environment for Safe Fix Execution
 *
 * Purpose: Creates an isolated sandbox environment to apply fixes safely
 * before applying them to the main project, preventing corruption.
 *
 * @module core/sandbox-manager
 * @since 2.0.0
 */
/**
 * Sandbox configuration
 */
export interface SandboxConfig {
    /** Project root directory */
    projectRoot: string;
    /** Whether to enable sandbox mode */
    enabled: boolean;
    /** Whether to run syntax validation in sandbox */
    validateSyntax: boolean;
    /** Whether to run tests in sandbox */
    runTests: boolean;
    /** Sandbox directory path (auto-generated if not provided) */
    sandboxDir?: string;
    /** Whether to generate patch file after fixes */
    generatePatch?: boolean;
    /** Whether to skip size confirmation (CI mode) */
    skipConfirmation?: boolean;
    /** Maximum size in bytes before warning (default: 5GB) */
    maxSizeBeforeWarning?: number;
}
/**
 * Sandbox validation result
 */
export interface SandboxValidationResult {
    /** Whether validation passed */
    passed: boolean;
    /** TypeScript validation result */
    typescriptValid: boolean;
    /** ESLint validation result */
    eslintValid: boolean;
    /** Test validation result */
    testsPassed: boolean;
    /** Error messages if validation failed */
    errors: string[];
    /** Warnings from validation */
    warnings: string[];
}
/**
 * Sandbox Manager - Isolated fix execution environment
 *
 * @class SandboxManager
 */
export declare class SandboxManager {
    private config;
    private sandboxDir;
    private isActive;
    private _cleanupHandler?;
    constructor(config: SandboxConfig);
    /**
     * Creates sandbox environment
     *
     * @returns Promise<void>
     */
    create(): Promise<void>;
    /**
     * Checks repository size and warns if too large
     *
     * @private
     * @returns Promise<void>
     */
    private checkRepositorySize;
    /**
     * Gets directory size recursively
     *
     * @private
     * @param dirPath - Directory path
     * @returns Promise<number> - Size in bytes
     */
    private getDirectorySize;
    /**
     * Requests user confirmation via stdin
     *
     * @private
     * @param prompt - Prompt message
     * @returns Promise<boolean> - True if confirmed
     */
    private requestConfirmation;
    /**
     * Sets up SIGINT handler for cleanup
     *
     * @private
     */
    private setupCleanupHandler;
    /**
     * Removes SIGINT handler
     *
     * @private
     */
    private removeCleanupHandler;
    /**
     * Copies project files to sandbox using git archive (respects .gitignore)
     *
     * @private
     * @returns Promise<void>
     */
    private copyProjectToSandbox;
    /**
     * Loads .gitignore patterns
     *
     * @private
     * @returns Promise<string[]> - Array of patterns
     */
    private loadGitignorePatterns;
    /**
     * Copies directory with .gitignore filtering
     *
     * @private
     * @param patterns - Gitignore patterns
     * @returns Promise<void>
     */
    private copyWithGitignore;
    /**
     * Checks if a path matches any gitignore pattern
     *
     * @private
     * @param filePath - File path to check
     * @param patterns - Gitignore patterns
     * @returns boolean - True if matches
     */
    private matchesGitignore;
    /**
     * Copies a directory synchronously
     *
     * @private
     * @param src - Source directory
     * @param dest - Destination directory
     */
    private copyDirectorySync;
    /**
     * Gets the sandbox path for a project file
     *
     * @param projectFilePath - Path relative to project root
     * @returns string - Path in sandbox
     */
    getSandboxPath(projectFilePath: string): string;
    /**
     * Validates sandbox environment after fixes
     *
     * @returns Promise<SandboxValidationResult> - Validation result
     */
    validate(): Promise<SandboxValidationResult>;
    /**
     * Validates TypeScript using tsc
     *
     * @private
     * @returns Promise<{ passed: boolean; errors: string[]; warnings: string[] }>
     */
    private validateTypeScript;
    /**
     * Validates code style using ESLint
     *
     * @private
     * @returns Promise<{ passed: boolean; errors: string[]; warnings: string[] }>
     */
    private validateESLint;
    /**
     * Runs tests in sandbox
     *
     * @private
     * @returns Promise<{ passed: boolean; errors: string[]; warnings: string[] }>
     */
    private runTests;
    /**
     * Copies validated files from sandbox to project
     *
     * @param filePaths - Array of file paths to copy (relative to project root)
     * @returns Promise<void>
     */
    copyToProject(filePaths: string[]): Promise<void>;
    /**
     * Cleans up sandbox directory
     *
     * @returns Promise<void>
     */
    cleanup(): Promise<void>;
    /**
     * Generates unified diff patch against original project
     *
     * @returns Promise<string> - Path to generated patch file
     */
    generatePatch(): Promise<string>;
    /**
     * Gets sandbox status
     *
     * @returns Object with sandbox status
     */
    getStatus(): {
        active: boolean;
        enabled: boolean;
        sandboxDir: string;
    };
}
//# sourceMappingURL=sandbox-manager.d.ts.map