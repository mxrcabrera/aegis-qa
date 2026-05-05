/**
 * Smart Config - Intelligent Configuration Based on Detected Stack
 *
 * Purpose: Generates intelligent default configuration based on the detected
 * technology stack to provide optimal out-of-the-box experience.
 *
 * @module core/smart-config
 * @since 2.0.0
 */
/**
 * Aegis configuration
 */
export interface AegisConfig {
    /** File patterns to include */
    include?: string[];
    /** File patterns to exclude */
    exclude?: string[];
    /** Phases to run */
    phases?: number[];
    /** Whether to skip thermal checks */
    skipThermal?: boolean;
    /** Whether to run in CI mode */
    ciMode?: boolean;
    /** Maximum phase timeout in milliseconds */
    phaseTimeoutMs?: number;
    /** Whether to enable memory flush */
    enableMemoryFlush?: boolean;
    /** Whether to enable partial reports */
    enablePartialReports?: boolean;
    /** Custom rules for specific frameworks */
    frameworkRules?: FrameworkRules;
}
/**
 * Framework-specific rules
 */
export interface FrameworkRules {
    /** React-specific rules */
    react?: ReactRules;
    /** Next.js-specific rules */
    nextjs?: NextJsRules;
    /** Vue-specific rules */
    vue?: VueRules;
    /** Angular-specific rules */
    angular?: AngularRules;
    /** Node.js-specific rules */
    node?: NodeRules;
}
export interface ReactRules {
    /** Check for accessibility issues */
    checkAccessibility?: boolean;
    /** Check for performance issues */
    checkPerformance?: boolean;
    /** Check for best practices */
    checkBestPractices?: boolean;
}
export interface NextJsRules {
    /** Check API routes */
    checkApiRoutes?: boolean;
    /** Check server components */
    checkServerComponents?: boolean;
    /** Check app directory structure */
    checkAppDir?: boolean;
}
export interface VueRules {
    /** Check for Vue 3 composition API usage */
    checkCompositionApi?: boolean;
    /** Check for TypeScript in Vue SFC */
    checkVueTypeScript?: boolean;
}
export interface AngularRules {
    /** Check for standalone components */
    checkStandaloneComponents?: boolean;
    /** Check for signals usage */
    checkSignals?: boolean;
}
export interface NodeRules {
    /** Check for async/await patterns */
    checkAsyncPatterns?: boolean;
    /** Check for error handling */
    checkErrorHandling?: boolean;
    /** Check for security best practices */
    checkSecurity?: boolean;
}
/**
 * SmartConfig - Intelligent configuration based on detected stack
 *
 * @class SmartConfig
 */
export declare class SmartConfig {
    private projectRoot;
    private stackDetector;
    private criticalConfigs;
    constructor(projectRoot: string);
    /**
     * Checks if a config file is critical
     *
     * @private
     * @param configPath - Path to config file
     * @returns boolean - True if config is critical
     */
    private isCriticalConfig;
    /**
     * Validates that overwriting a config is allowed
     *
     * @private
     * @param configPath - Path to config file
     * @param overwrite - Whether overwrite is requested
     * @returns boolean - True if overwrite is allowed
     */
    private validateOverwrite;
    /**
     * Generates intelligent configuration based on detected stack
     *
     * @returns Promise<AegisConfig> - Generated configuration
     */
    generateConfig(): Promise<AegisConfig>;
    /**
     * Gets include patterns based on stack
     *
     * @private
     * @param stack - Detected tech stack
     * @returns string[] - Include patterns
     */
    private getIncludePatterns;
    /**
     * Gets exclude patterns based on stack
     *
     * @private
     * @param stack - Detected tech stack
     * @returns string[] - Exclude patterns
     */
    private getExcludePatterns;
    /**
     * Gets phases to run based on stack
     *
     * @private
     * @param stack - Detected tech stack
     * @returns number[] - Phases to run
     */
    private getPhasesToRun;
    /**
     * Gets phase timeout based on stack complexity
     *
     * @private
     * @param stack - Detected tech stack
     * @returns number - Phase timeout in milliseconds
     */
    private getPhaseTimeout;
    /**
     * Gets framework-specific rules
     *
     * @private
     * @param stack - Detected tech stack
     * @returns FrameworkRules - Framework-specific rules
     */
    private getFrameworkRules;
    /**
     * Writes configuration to .aegisrc.json
     *
     * @param config - Configuration to write
     * @param overwrite - Whether to overwrite existing critical config
     * @returns Promise<void>
     */
    writeConfig(config: AegisConfig, overwrite?: boolean): Promise<void>;
    /**
     * Reads existing .aegisrc.json if it exists
     *
     * @returns Promise<AegisConfig | null> - Existing configuration or null
     */
    readConfig(): Promise<AegisConfig | null>;
    /**
     * Merges generated config with existing config
     *
     * @param generated - Generated configuration
     * @param existing - Existing configuration
     * @returns AegisConfig - Merged configuration
     */
    mergeConfigs(generated: AegisConfig, existing: AegisConfig): AegisConfig;
    /**
     * Initializes smart configuration
     *
     * @param overwrite - Whether to overwrite existing config
     * @returns Promise<AegisConfig> - Final configuration
     */
    initialize(overwrite?: boolean): Promise<AegisConfig>;
}
//# sourceMappingURL=smart-config.d.ts.map