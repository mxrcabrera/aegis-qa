/**
 * Stack Detector - Automatic Technology Stack Detection
 *
 * Purpose: Automatically detects the technology stack (React, Next.js, Node, etc.)
 * used in the project to provide intelligent default configuration.
 *
 * Security: This class uses only safe file system operations and never executes
 * arbitrary code. All file access is audited and restricted to project root.
 *
 * @module core/stack-detector
 * @since 2.0.0
 */
/**
 * Detected technology stack
 */
export interface TechStack {
    /** Framework (React, Vue, Angular, Next.js, etc.) */
    framework?: string;
    /** Language (TypeScript, JavaScript, etc.) */
    language: string;
    /** Package manager (npm, yarn, pnpm) */
    packageManager: string;
    /** Build tool (Webpack, Vite, Rollup, etc.) */
    buildTool?: string;
    /** Testing framework (Jest, Vitest, Mocha, etc.) */
    testingFramework?: string;
    /** CSS framework (Tailwind, Bootstrap, etc.) */
    cssFramework?: string;
    /** Backend framework (Express, NestJS, Fastify, etc.) */
    backendFramework?: string;
    /** Database (PostgreSQL, MongoDB, MySQL, etc.) */
    database?: string;
    /** ORM/Query builder (Prisma, TypeORM, Sequelize, etc.) */
    orm?: string;
    /** Whether this is a monorepo */
    isMonorepo: boolean;
    /** Whether this is a TypeScript project */
    isTypeScript: boolean;
    /** Confidence score (0-1) */
    confidence: number;
}
/**
 * StackDetector - Automatic technology stack detection
 *
 * @class StackDetector
 */
export declare class StackDetector {
    private projectRoot;
    private auditLog;
    constructor(projectRoot: string);
    /**
     * Validates that a file path is within the project root (sandbox)
     *
     * @private
     * @param filePath - File path to validate
     * @throws {Error} If path is outside project root
     */
    private validatePath;
    /**
     * Audits a file system operation
     *
     * @private
     * @param operation - Operation performed
     * @param filePath - File path accessed
     */
    private auditOperation;
    /**
     * Checks file content for blocked patterns
     *
     * @private
     * @param content - File content to check
     * @returns boolean - True if content is safe
     */
    private isContentSafe;
    /**
     * Safe file read with validation
     *
     * @private
     * @param filePath - File path to read
     * @returns string - File content
     * @throws {Error} If validation fails
     */
    private safeReadFile;
    /**
     * Safe file existence check with validation
     *
     * @private
     * @param filePath - File path to check
     * @returns boolean - Whether file exists
     */
    private safeExistsSync;
    /**
     * Gets the audit log
     *
     * @returns string[] - Audit log entries
     */
    getAuditLog(): string[];
    /**
     * Detects the technology stack
     *
     * @returns Promise<TechStack> - Detected technology stack
     */
    detect(): Promise<TechStack>;
    /**
     * Detects if project uses TypeScript
     *
     * @private
     * @returns Promise<boolean> - True if TypeScript is detected
     */
    private detectTypeScript;
    /**
     * Detects package manager
     *
     * @private
     * @returns Promise<string> - Detected package manager
     */
    private detectPackageManager;
    /**
     * Detects framework
     *
     * @private
     * @returns Promise<string | undefined> - Detected framework
     */
    private detectFramework;
    /**
     * Detects build tool
     *
     * @private
     * @returns Promise<string | undefined> - Detected build tool
     */
    private detectBuildTool;
    /**
     * Detects testing framework
     *
     * @private
     * @returns Promise<string | undefined> - Detected testing framework
     */
    private detectTestingFramework;
    /**
     * Detects CSS framework
     *
     * @private
     * @returns Promise<string | undefined> - Detected CSS framework
     */
    private detectCSSFramework;
    /**
     * Detects backend framework
     *
     * @private
     * @returns Promise<string | undefined> - Detected backend framework
     */
    private detectBackendFramework;
    /**
     * Detects database
     *
     * @private
     * @returns Promise<string | undefined> - Detected database
     */
    private detectDatabase;
    /**
     * Detects ORM
     *
     * @private
     * @returns Promise<string | undefined> - Detected ORM
     */
    private detectORM;
    /**
     * Detects if project is a monorepo
     *
     * @private
     * @returns Promise<boolean> - True if monorepo detected
     */
    private detectMonorepo;
    /**
     * Checks if project has files with specific extensions
     *
     * @private
     * @param extensions - Array of file extensions to check
     * @returns Promise<boolean> - True if files with extensions found
     */
    private hasFilesWithExtension;
    /**
     * Calculates confidence score based on detected information
     *
     * @private
     * @param stack - Detected tech stack
     * @returns number - Confidence score (0-1)
     */
    private calculateConfidence;
}
//# sourceMappingURL=stack-detector.d.ts.map