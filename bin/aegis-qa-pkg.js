#!/usr/bin/env node

/**
 * Aegis QA - CLI Entry Point (Pure CommonJS for pkg)
 *
 * This is the executable entry point for pkg binary compatibility
 * Uses require() to load the compiled CLI as CommonJS
 *
 * @since 2.0.0
 */

try {
  // Load the CLI module compiled to CommonJS
  const cliModule = require('./../dist/cli-cjs.js');
  
  // Check if it exports main function
  if (cliModule && typeof cliModule.main === 'function') {
    cliModule.main().catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  } else {
    console.error('CLI module does not export main function');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to load CLI module:', error);
  process.exit(1);
}
