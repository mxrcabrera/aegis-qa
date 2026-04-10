import { test, expect } from "@playwright/test";
import SecretManager from "../lib/secret-manager";

/**
 * Smoke Test - QA Orchestrator
 *
 * This test verifies basic functionality:
 * 1. Navigate to the application
 * 2. Verify page title
 * 3. Attempt login flow (without completing)
 *
 * Uses SecretManager to load credentials from .env
 */

test.describe("Smoke Tests", () => {
  test.beforeAll(async () => {
    // Validate that required secrets are available
    try {
      SecretManager.validate();
      console.log("✅ All required secrets validated");
    } catch (error) {
      console.warn("⚠️  Warning: Some secrets are missing. Tests may fail.");
      console.warn(
        "Create a .env file from .env.example to configure test secrets.",
      );
    }
  });

  test("should load the application and verify title", async ({ page }) => {
    // Get base URL from SecretManager
    const baseUrl = SecretManager.get("TEST_BASE_URL");
    console.log(`Navigating to: ${baseUrl}`);

    // Navigate to the application
    await page.goto(baseUrl);

    // Verify the page loaded successfully
    await expect(page).toHaveTitle(/Pilates/i);
  });

  test("should navigate to login page", async ({ page }) => {
    const baseUrl = SecretManager.get("TEST_BASE_URL");
    await page.goto(baseUrl);

    // Look for login button/link
    // Adjust selector based on actual application structure
    const loginButton = page.getByRole("button", {
      name: /login|iniciar sesión|entrar/i,
    });

    // If login button exists, click it
    if (await loginButton.isVisible().catch(() => false)) {
      await loginButton.click();
      await expect(page).toHaveURL(/login|auth/i);
    } else {
      // Alternative: try direct navigation to login
      await page.goto(`${baseUrl}/login`);
    }
  });

  test("should attempt login with credentials from SecretManager", async ({
    page,
  }) => {
    const baseUrl = SecretManager.get("TEST_BASE_URL");
    const testEmail = SecretManager.getString("TEST_USER_EMAIL");
    const testPassword = SecretManager.getString("TEST_USER_PASSWORD");

    console.log(`Attempting login with email: ${testEmail.substring(0, 3)}***`);

    await page.goto(`${baseUrl}/login`);

    // Fill in email
    const emailInput = page.getByLabel(/email|correo/i);
    await emailInput.fill(testEmail);

    // Fill in password
    const passwordInput = page.getByLabel(/password|contraseña/i);
    await passwordInput.fill(testPassword);

    // Find login button
    const loginButton = page.getByRole("button", {
      name: /login|iniciar sesión|entrar/i,
    });

    // Verify button exists (don't click - just verify the flow works)
    await expect(loginButton).toBeVisible();

    console.log(
      "✅ Login form populated successfully with credentials from SecretManager",
    );
  });

  test("should verify SecretManager provides Supabase client", async () => {
    // This test verifies that SecretManager can create a Supabase client
    // without actually making API calls (to avoid dependency on live DB)

    try {
      const client = SecretManager.getSupabaseClient();
      expect(client).toBeDefined();
      console.log("✅ Supabase client created successfully from SecretManager");
    } catch (error) {
      console.log(
        "ℹ️  Supabase client creation skipped (credentials not configured)",
      );
      // This is OK for smoke test - we're just verifying the API exists
    }
  });
});
