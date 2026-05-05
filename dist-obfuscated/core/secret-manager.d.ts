/**
 * SecretManager - Secure Credential Management
 *
 * Purpose: Centralized, type-safe management of project secrets with validation
 * and mock mode support. This is the single source of truth for all credentials
 * in the Aegis QA project.
 *
 * Features:
 * - Type-safe secret access using ProjectSecrets interface
 * - Supabase connection validation using SDK
 * - Mock mode for development without real credentials
 * - Environment variable loading from multiple paths
 * - Secure logging (never exposes secrets in logs)
 *
 * @module core/secret-manager
 * @since 1.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectSecrets, SecretKey, ValidationResult, SecretManagerConfig } from '../types/secrets.js';
/**
 * SecretManager - Centralized credential management
 *
 * This class provides secure, type-safe access to project secrets with validation
 * and mock mode support. All credential access in Aegis QA must go through this
 * manager to ensure security and consistency.
 *
 * @class SecretManager
 * @example
 * ```typescript
 * const manager = new SecretManager({ mockMode: false });
 * await manager.initialize();
 *
 * const url = manager.get('SUPABASE_URL');
 * const isValid = await manager.validateConnection();
 * ```
 */
export declare class SecretManager {
    private secrets;
    private config;
    private supabaseClient;
    private initialized;
    private mockMode;
    /**
     * Creates a new SecretManager instance
     *
     * @param config - Configuration options for the manager
     * @param customEnvPath - Optional custom path to .env file for CLI context
     */
    constructor(config?: Partial<SecretManagerConfig>, customEnvPath?: string);
    /**
     * Initializes the secret manager by loading environment variables
     *
     * This method loads secrets from .env files and validates the connection
     to Supabase if validation is enabled. It should be called before any
     * secret access operations.
     *
     * @returns Promise<ValidationResult> - Validation result with success status
     * @throws {Error} If required secrets are missing and not in mock mode
     *
     * @example
     * ```typescript
     * const manager = new SecretManager();
     * const result = await manager.initialize();
     * if (!result.success) {
     *   console.error(result.error);
     * }
     * ```
     */
    initialize(): Promise<ValidationResult>;
    /**
     * Validates the Supabase connection using the SDK
     *
     * This method attempts to connect to Supabase using the configured
     * credentials and verifies that the connection is valid and has
     * the necessary permissions.
     *
     * @returns Promise<ValidationResult> - Validation result with connection status
     *
     * @example
     * ```typescript
     * const result = await manager.validateConnection();
     * if (result.success) {
     *   console.log('Supabase connection is valid');
     * }
     * ```
     */
    validateConnection(): Promise<ValidationResult>;
    /**
     * Gets a secret value by key
     *
     * This method retrieves a secret value securely. In mock mode, it returns
     * placeholder values. Never logs the actual secret value.
     *
     * @param key - The secret key to retrieve
     * @returns string - The secret value or placeholder in mock mode
     * @throws {Error} If secret is not found and not in mock mode
     *
     * @example
     * ```typescript
     * const url = manager.get('SUPABASE_URL');
     * // In mock mode: returns 'https://mock.supabase.co'
     * // In normal mode: returns actual value from .env
     * ```
     */
    get(key: SecretKey): string;
    /**
     * Gets a secret value with type conversion
     *
     * @param key - The secret key to retrieve
     * @returns string - The secret value as string
     */
    getString(key: SecretKey): string;
    /**
     * Gets a secret value as number
     *
     * @param key - The secret key to retrieve
     * @returns number - The secret value as number
     * @throws {Error} If value cannot be converted to number
     */
    getNumber(key: SecretKey): number;
    /**
     * Gets a secret value as boolean
     *
     * @param key - The secret key to retrieve
     * @returns boolean - The secret value as boolean
     */
    getBoolean(key: SecretKey): boolean;
    /**
     * Checks if a secret key exists
     *
     * @param key - The secret key to check
     * @returns boolean - True if the secret exists
     */
    has(key: SecretKey): boolean;
    /**
     * Gets all available secret keys
     *
     * @returns SecretKey[] - Array of available secret keys
     */
    listKeys(): SecretKey[];
    /**
     * Clears the internal cache of secrets
     *
     * This method clears the in-memory cache of secrets, forcing a reload
     from environment variables on next access.
     */
    clearCache(): void;
    /**
     * Enables or disables mock mode
     *
     * Mock mode allows the orchestrator to run in "Audit-Only" mode without
     * requiring actual credentials. This is useful for development and testing.
     *
     * @param enabled - Whether to enable mock mode
     *
     * @example
     * ```typescript
     * manager.setMockMode(true);
     * // Now all get() calls return mock values
     * ```
     */
    setMockMode(enabled: boolean): void;
    /**
     * Gets the current mock mode status
     *
     * @returns boolean - True if mock mode is enabled
     */
    isMockMode(): boolean;
    /**
     * Gets the Supabase client instance
     *
     * @returns SupabaseClient | null - The Supabase client or null if not initialized
     */
    getSupabaseClient(): SupabaseClient | null;
    /**
     * Gets all secrets as a ProjectSecrets object
     *
     * @returns ProjectSecrets - All secrets (incomplete if in mock mode)
     * @throws {Error} If not in mock mode and secrets are incomplete
     */
    getAll(): ProjectSecrets;
    /**
     * Gets sanitized secrets for safe logging and reporting
     *
     * This method returns all secrets with sensitive values masked for display
     * in logs, reports, and debugging output. Use this method whenever you need
     * to display secret information without exposing actual values.
     *
     * Masking rules:
     * - API keys: Show first 4 characters, mask the rest (e.g., sk-****)
     * - URLs: Show domain only, mask credentials
     * - Emails: Show first character, mask domain (e.g., t***@example.com)
     * - Passwords: Fully masked (******)
     *
     * @returns Partial<ProjectSecrets> - Sanitized secrets with masked values
     *
     * @example
     * ```typescript
     * const sanitized = manager.getSanitizedSecrets();
     * console.log(sanitized.SUPABASE_URL); // https://***.supabase.co
     * console.log(sanitized.SUPABASE_ANON_KEY); // sk-****
     * ```
     */
    getSanitizedSecrets(): Partial<ProjectSecrets>;
    /**
     * Loads environment variables from configured paths
     *
     * @private
     */
    private loadEnvironmentVariables;
    /**
     * Loads secrets from environment variables into memory
     *
     * @private
     */
    private loadSecrets;
    /**
     * Gets a mock value for a secret key
     *
     * @private
     * @param key - The secret key
     * @returns string - Mock value for the key
     */
    private getMockValue;
    /**
     * Gets mock secrets for testing
     *
     * @private
     * @returns ProjectSecrets - Mock secrets object
     */
    private getMockSecrets;
}
/**
 * Singleton instance of SecretManager
 *
 * Use this instance throughout the application to ensure a single source
 * of truth for credentials.
 */
export declare const secretManager: SecretManager;
//# sourceMappingURL=secret-manager.d.ts.map