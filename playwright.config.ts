import { defineConfig, devices } from "@playwright/test";
import SecretManager from "./lib/secret-manager";

/**
 * Playwright Configuration for QA Orchestrator
 *
 * Uses SecretManager to load TEST_BASE_URL from environment variables.
 * This ensures secrets are never hardcoded in configuration files.
 */

// Load environment variables from .env file
require("dotenv").config();

// Validate secrets before starting tests
try {
  SecretManager.validate();
} catch (error) {
  console.warn("Warning: Some required secrets are missing. Tests may fail.");
  console.warn(
    "Create a .env file from .env.example to configure test secrets.",
  );
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    // Base URL from SecretManager (fallback to localhost if not set)
    baseURL: SecretManager.get("TEST_BASE_URL"),

    // Trace on retry for debugging
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
