#!/usr/bin/env ts-node
import CodeReader from "../lib/code-reader";
import path from "path";

const projectPath = process.argv[2] || path.join(__dirname, "..", "..");

async function main() {
  console.log("\n=== Code Reader - Route Mapping ===");
  console.log(`Project Path: ${projectPath}\n`);

  const reader = new CodeReader({ projectPath });

  try {
    const routeTree = await reader.scanAppRouter();
    console.log("\nRoute Tree:");
    console.log(routeTree);
    console.log("\n");

    const stats = await reader.getProjectStats(projectPath);
    console.log("\nProject Stats:");
    console.log(stats);
    console.log("\n");

    console.log("✅ Route mapping completed successfully");
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

main();
