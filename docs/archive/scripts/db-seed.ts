#!/usr/bin/env ts-node
import dotenv from "dotenv";
import DBSeeder from "../lib/db-seeder";

dotenv.config();

const action = process.argv[2] || "seed";

async function main() {
  console.log("\n=== DB Seeder ===");
  console.log(`Action: ${action}`);

  const seeder = new DBSeeder();
  const { success, message } = seeder[action]();

  if (!success) {
    console.error(
      "\n❌ Error:",
      typeof message === "error" ? message.message : message,
    );
    process.exit(1);
  }

  console.log(message);
}

main();
