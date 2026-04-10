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

import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type {
  ProjectSecrets,
  SecretKey,
  ValidationResult,
  SecretManagerConfig,
} from '../types/secrets.js';

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
export class SecretManager {
  private secrets: Partial<ProjectSecrets>;
  private config: SecretManagerConfig;
  private supabaseClient: SupabaseClient | null = null;
  private initialized: boolean = false;
  private mockMode: boolean = false;

  /**
   * Creates a new SecretManager instance
   *
   * @param config - Configuration options for the manager
   * @param customEnvPath - Optional custom path to .env file for CLI context
   */
  constructor(config?: Partial<SecretManagerConfig>, customEnvPath?: string) {
    const baseEnvPaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '.env.local'),
      path.join(process.cwd(), '.env.development'),
    ];

    // Add custom env path if provided (for CLI context)
    if (customEnvPath) {
      baseEnvPaths.unshift(customEnvPath);
    }

    this.config = {
      mockMode: false,
      validateOnInit: true,
      envPaths: baseEnvPaths,
      ...config,
    };

    this.secrets = {};
    this.mockMode = this.config.mockMode;
  }

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
  async initialize(): Promise<ValidationResult> {
    if (this.initialized) {
      return {
        success: true,
        details: 'SecretManager already initialized',
      };
    }

    try {
      // Load environment variables from all configured paths
      this.loadEnvironmentVariables();

      // Load secrets into memory
      this.loadSecrets();

      // Validate connection if enabled
      if (this.config.validateOnInit && !this.mockMode) {
        const validation = await this.validateConnection();
        if (!validation.success) {
          return validation;
        }
      }

      this.initialized = true;
      return {
        success: true,
        details: 'SecretManager initialized successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to initialize SecretManager: ${errorMessage}`,
      };
    }
  }

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
  async validateConnection(): Promise<ValidationResult> {
    if (this.mockMode) {
      return {
        success: true,
        details: 'Mock mode enabled, skipping connection validation',
      };
    }

    const url = this.secrets.SUPABASE_URL;
    const serviceRoleKey = this.secrets.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return {
        success: false,
        error:
          'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for connection validation',
      };
    }

    try {
      // Create Supabase client
      this.supabaseClient = createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Test connection by querying the database schema
      const { error } = await this.supabaseClient.from('_test_connection_').select('*').limit(1);

      // If error is about relation not existing, that's expected and means connection works
      if (error && !error.message.includes('does not exist')) {
        return {
          success: false,
          error: `Supabase connection failed: ${error.message}`,
        };
      }

      return {
        success: true,
        details: 'Supabase connection validated successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Supabase connection validation failed: ${errorMessage}`,
      };
    }
  }

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
  get(key: SecretKey): string {
    if (this.mockMode) {
      return this.getMockValue(key);
    }

    const value = this.secrets[key];

    if (!value) {
      throw new Error(
        `Secret ${key} not found. Ensure it is set in environment variables.`
      );
    }

    return value;
  }

  /**
   * Gets a secret value with type conversion
   *
   * @param key - The secret key to retrieve
   * @returns string - The secret value as string
   */
  getString(key: SecretKey): string {
    return this.get(key);
  }

  /**
   * Gets a secret value as number
   *
   * @param key - The secret key to retrieve
   * @returns number - The secret value as number
   * @throws {Error} If value cannot be converted to number
   */
  getNumber(key: SecretKey): number {
    const value = this.get(key);
    const num = Number(value);

    if (isNaN(num)) {
      throw new Error(`Secret ${key} cannot be converted to number: ${value}`);
    }

    return num;
  }

  /**
   * Gets a secret value as boolean
   *
   * @param key - The secret key to retrieve
   * @returns boolean - The secret value as boolean
   */
  getBoolean(key: SecretKey): boolean {
    const value = this.get(key);
    return value === 'true' || value === '1';
  }

  /**
   * Checks if a secret key exists
   *
   * @param key - The secret key to check
   * @returns boolean - True if the secret exists
   */
  has(key: SecretKey): boolean {
    if (this.mockMode) {
      return true;
    }
    return this.secrets[key] !== undefined;
  }

  /**
   * Gets all available secret keys
   *
   * @returns SecretKey[] - Array of available secret keys
   */
  listKeys(): SecretKey[] {
    return Object.keys(this.secrets) as SecretKey[];
  }

  /**
   * Clears the internal cache of secrets
   *
   * This method clears the in-memory cache of secrets, forcing a reload
   from environment variables on next access.
   */
  clearCache(): void {
    this.secrets = {};
    this.initialized = false;
  }

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
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
  }

  /**
   * Gets the current mock mode status
   *
   * @returns boolean - True if mock mode is enabled
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Gets the Supabase client instance
   *
   * @returns SupabaseClient | null - The Supabase client or null if not initialized
   */
  getSupabaseClient(): SupabaseClient | null {
    return this.supabaseClient;
  }

  /**
   * Gets all secrets as a ProjectSecrets object
   *
   * @returns ProjectSecrets - All secrets (incomplete if in mock mode)
   * @throws {Error} If not in mock mode and secrets are incomplete
   */
  getAll(): ProjectSecrets {
    if (this.mockMode) {
      return this.getMockSecrets();
    }

    const required: (keyof ProjectSecrets)[] = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TEST_USER_EMAIL',
      'TEST_USER_PASSWORD',
    ];

    for (const key of required) {
      if (!this.secrets[key]) {
        throw new Error(`Required secret ${key} is missing`);
      }
    }

    return this.secrets as ProjectSecrets;
  }

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
  getSanitizedSecrets(): Partial<ProjectSecrets> {
    const secrets = this.mockMode ? this.getMockSecrets() : this.secrets;

    const sanitized: Partial<ProjectSecrets> = {};

    for (const [key, value] of Object.entries(secrets)) {
      if (!value) continue;

      const secretKey = key as keyof ProjectSecrets;

      // Apply masking based on secret type
      if (secretKey.includes('KEY') || secretKey.includes('TOKEN')) {
        // Mask API keys/tokens: show first 4 chars
        sanitized[secretKey] = value.substring(0, 4) + '****';
      } else if (secretKey.includes('PASSWORD')) {
        // Fully mask passwords
        sanitized[secretKey] = '******';
      } else if (secretKey.includes('EMAIL')) {
        // Mask emails: show first char, mask domain
        const [local, domain] = value.split('@');
        sanitized[secretKey] = local[0] + '***@' + domain;
      } else if (secretKey.includes('URL')) {
        // Mask URLs: show domain only
        try {
          const url = new URL(value);
          sanitized[secretKey] = url.protocol + '//' + url.hostname + '***';
        } catch {
          sanitized[secretKey] = '***';
        }
      } else {
        // Default: show first 4 chars
        sanitized[secretKey] = value.substring(0, 4) + '****';
      }
    }

    return sanitized;
  }

  /**
   * Loads environment variables from configured paths
   *
   * @private
   */
  private loadEnvironmentVariables(): void {
    for (const envPath of this.config.envPaths || []) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
      }
    }
  }

  /**
   * Loads secrets from environment variables into memory
   *
   * @private
   */
  private loadSecrets(): void {
    const secretKeys: SecretKey[] = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TEST_USER_EMAIL',
      'TEST_USER_PASSWORD',
      'TEST_ADMIN_EMAIL',
      'TEST_ADMIN_PASSWORD',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'TEST_BASE_URL',
      'TEST_TIMEOUT_MS',
    ];

    for (const key of secretKeys) {
      const value = process.env[key];
      if (value) {
        this.secrets[key] = value;
      }
    }
  }

  /**
   * Gets a mock value for a secret key
   *
   * @private
   * @param key - The secret key
   * @returns string - Mock value for the key
   */
  private getMockValue(key: SecretKey): string {
    const mockValues: Record<SecretKey, string> = {
      SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_ANON_KEY: 'mock-anon-key-xxxxxxxxxxxxxxxxxxxxx',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key-xxxxxxxxxxxxxxxxxxxxx',
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'mock-password-123',
      TEST_ADMIN_EMAIL: 'admin@example.com',
      TEST_ADMIN_PASSWORD: 'mock-admin-password-123',
      OPENAI_API_KEY: 'mock-openai-key-xxxxxxxxxxxxxxxxxxxxx',
      ANTHROPIC_API_KEY: 'mock-anthropic-key-xxxxxxxxxxxxxxxxxxxxx',
      TEST_BASE_URL: 'http://localhost:3000',
      TEST_TIMEOUT_MS: '30000',
    };

    return mockValues[key] || '';
  }

  /**
   * Gets mock secrets for testing
   *
   * @private
   * @returns ProjectSecrets - Mock secrets object
   */
  private getMockSecrets(): ProjectSecrets {
    return {
      SUPABASE_URL: this.getMockValue('SUPABASE_URL'),
      SUPABASE_ANON_KEY: this.getMockValue('SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: this.getMockValue('SUPABASE_SERVICE_ROLE_KEY'),
      TEST_USER_EMAIL: this.getMockValue('TEST_USER_EMAIL'),
      TEST_USER_PASSWORD: this.getMockValue('TEST_USER_PASSWORD'),
      TEST_ADMIN_EMAIL: this.getMockValue('TEST_ADMIN_EMAIL'),
      TEST_ADMIN_PASSWORD: this.getMockValue('TEST_ADMIN_PASSWORD'),
      OPENAI_API_KEY: this.getMockValue('OPENAI_API_KEY'),
      ANTHROPIC_API_KEY: this.getMockValue('ANTHROPIC_API_KEY'),
      TEST_BASE_URL: this.getMockValue('TEST_BASE_URL'),
      TEST_TIMEOUT_MS: this.getMockValue('TEST_TIMEOUT_MS'),
    };
  }
}

/**
 * Singleton instance of SecretManager
 *
 * Use this instance throughout the application to ensure a single source
 * of truth for credentials.
 */
export const secretManager = new SecretManager();
