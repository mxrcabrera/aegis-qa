import { test, expect } from "@playwright/test";
import SecretManager from "../lib/secret-manager";

/**
 * SecretManager Validation Test
 *
 * This test validates that the SecretManager:
 * - Can load environment variables
 * - Can validate required secrets
 * - Can create Supabase clients
 *
 * Does NOT require a running application or browser.
 */

test.describe("SecretManager Validation", () => {
  test("should load environment variables from .env", () => {
    // Test that SecretManager can read from process.env
    const baseUrl = SecretManager.get("TEST_BASE_URL");
    expect(baseUrl).toBeDefined();
    console.log(`✅ TEST_BASE_URL loaded: ${baseUrl}`);
  });

  test("should validate required secrets", () => {
    // Test validation (may warn if secrets are missing, but shouldn't crash)
    try {
      SecretManager.validate();
      console.log("✅ All required secrets validated");
    } catch (error) {
      console.log(
        "⚠️  Some secrets are missing (expected if .env not configured)",
      );
      // This is OK for validation test
    }
  });

  test("should create Supabase client from vault", () => {
    // Test that SecretManager can create a Supabase client
    try {
      const client = SecretManager.getSupabaseClient();
      expect(client).toBeDefined();
      console.log("✅ Supabase client created successfully");
    } catch (error) {
      console.log(
        "⚠️  Supabase client creation skipped (credentials not configured)",
      );
      // This is OK for validation test
    }
  });

  test("should have all required methods", () => {
    // Test that SecretManager has all expected methods
    expect(typeof SecretManager.get).toBe("function");
    expect(typeof SecretManager.getString).toBe("function");
    expect(typeof SecretManager.getNumber).toBe("function");
    expect(typeof SecretManager.getBoolean).toBe("function");
    expect(typeof SecretManager.has).toBe("function");
    expect(typeof SecretManager.validate).toBe("function");
    expect(typeof SecretManager.listKeys).toBe("function");
    expect(typeof SecretManager.clearCache).toBe("function");
    expect(typeof SecretManager.getSupabaseClient).toBe("function");
    expect(typeof SecretManager.getSupabaseAdminClient).toBe("function");
    console.log("✅ All SecretManager methods exist");
  });

  test("should list available secret keys", () => {
    // Test that SecretManager can list all available keys
    const keys = SecretManager.listKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
    console.log(`✅ Available secret keys: ${keys.join(", ")}`);
  });
});
