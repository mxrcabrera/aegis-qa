#!/usr/bin/env node

/**
 * Aegis QA - CLI Entry Point
 *
 * This is the executable entry point for npx aegis-qa
 *
 * @since 2.0.0
 */

import { main } from '../dist/cli.js';

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
