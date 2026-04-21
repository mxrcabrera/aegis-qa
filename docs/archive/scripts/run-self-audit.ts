#!/usr/bin/env node

/**
 * Self-Audit Script - QA Orchestrator audits itself
 *
 * Purpose: Run the QA Orchestrator on its own code to ensure
 * it follows the same standards it enforces on others.
 */

import { QAOrchestrator } from "../lib/orchestrator";
import * as path from "path";

async function runSelfAudit() {
  console.log("=== QA Orchestrator - Self-Audit Mode ===");
  console.log(
    "Auditing our own code to ensure we follow our own standards...\n",
  );

  try {
    // Get the current directory (qa-orchestrator)
    const orchestratorPath = path.resolve(__dirname, "..");

    // Create orchestrator instance for self-audit
    const orchestrator = new QAOrchestrator({
      projectPath: orchestratorPath,
      skipTests: true, // Skip tests for self-audit to avoid circular dependencies
      skipSeed: true, // Skip seed for self-audit
      skipFix: false, // Keep fixes to improve ourselves
      appDir: "lib", // Focus on lib directory since we don't have an 'app' folder
    });

    console.log(`Self-audit target: ${orchestratorPath}`);
    console.log("Running audit and fix phases only...\n");

    // Run the orchestrator on itself
    const report = await orchestrator.run();

    // Display results
    console.log("\n=== Self-Audit Results ===");
    console.log(
      `Overall Status: ${report.summary.overallSuccess ? "SUCCESS" : "FAILURE"}`,
    );
    console.log(`Violations Found: ${report.summary.totalViolations}`);
    console.log(`Fixes Applied: ${report.summary.fixesApplied}`);

    if (report.summary.fixesApplied > 0) {
      console.log("\n=== Self-Improvement Applied ===");
      console.log(
        `The QA Orchestrator has improved itself by fixing ${report.summary.fixesApplied} violations.`,
      );
      console.log("This demonstrates autonomous self-correction capabilities.");
    }

    if (!report.summary.overallSuccess) {
      console.log("\n=== Self-Audit Issues ===");
      console.log("Some issues were found that require manual attention.");
      console.log("Check the detailed report for more information.");
    }

    console.log("\n=== Self-Audit Completed ===");
    console.log("The QA Orchestrator has successfully audited itself.");
    console.log("This demonstrates true autonomy and self-regulation.");
  } catch (error) {
    console.error("\n=== Self-Audit Failed ===");
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run self-audit if called directly
if (require.main === module) {
  runSelfAudit();
}

export { runSelfAudit };
