/**
 * Secret Types - Type-safe secret management for Aegis QA
 *
 * This module defines the interfaces for project secrets, ensuring type safety
 * and preventing accidental exposure of sensitive credentials.
 *
 * @module types/secrets
 * @since 1.0.0
 */

/**
 * Available secret keys for the project
 *
 * Each secret key corresponds to an environment variable that the project
 * may need for operation. Required secrets must be provided for full functionality,
 * while optional secrets enable additional features.
 */
export type SecretKey =
  | 'SUPABASE_URL'
  | 'SUPABASE_ANON_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'TEST_USER_EMAIL'
  | 'TEST_USER_PASSWORD'
  | 'TEST_ADMIN_EMAIL'
  | 'TEST_ADMIN_PASSWORD'
  | 'OPENAI_API_KEY'
  | 'ANTHROPIC_API_KEY'
  | 'TEST_BASE_URL'
  | 'TEST_TIMEOUT_MS';

/**
 * Project secrets configuration
 *
 * This interface defines all the secrets that Aegis QA may need to operate.
 * Secrets are loaded from environment variables and validated before use.
 */
export interface ProjectSecrets {
  /** Supabase project URL (required for database operations) */
  SUPABASE_URL: string;

  /** Supabase anonymous key (required for client-side operations) */
  SUPABASE_ANON_KEY: string;

  /** Supabase service role key (required for admin operations) */
  SUPABASE_SERVICE_ROLE_KEY: string;

  /** Test user email for E2E testing (required for test execution) */
  TEST_USER_EMAIL: string;

  /** Test user password for E2E testing (required for test execution) */
  TEST_USER_PASSWORD: string;

  /** Test admin email for E2E testing (optional) */
  TEST_ADMIN_EMAIL?: string;

  /** Test admin password for E2E testing (optional) */
  TEST_ADMIN_PASSWORD?: string;

  /** OpenAI API key for AI features (optional) */
  OPENAI_API_KEY?: string;

  /** Anthropic API key for AI features (optional) */
  ANTHROPIC_API_KEY?: string;

  /** Base URL for testing (default: http://localhost:3000) */
  TEST_BASE_URL?: string;

  /** Timeout for test operations in milliseconds (default: 30000) */
  TEST_TIMEOUT_MS?: string;
}

/**
 * Secret validation result
 *
 * Represents the result of validating a secret or connection.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  success: boolean;

  /** Error message if validation failed */
  error?: string;

  /** Additional context about the validation */
  details?: string;
}

/**
 * Secret manager configuration
 *
 * Configuration options for the SecretManager behavior.
 */
export interface SecretManagerConfig {
  /** Whether to enable mock mode for development without real secrets */
  mockMode: boolean;

  /** Whether to validate connections on initialization */
  validateOnInit: boolean;

  /** Custom environment file paths to search */
  envPaths?: string[];
}
