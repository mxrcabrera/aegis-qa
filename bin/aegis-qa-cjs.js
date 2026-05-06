#!/usr/bin/env node

/**
 * Aegis QA - CLI Entry Point (CommonJS for pkg)
 *
 * This is the executable entry point for pkg binary compatibility
 * Uses dynamic import() to load the ESM module
 *
 * @since 2.0.0
 */

// Import the ESM module dynamically and run it
import('../dist/cli.js')
  .then(({ main }) => {
    main().catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('Failed to load CLI module:', error);
    process.exit(1);
  });
