#!/usr/bin/env node

/**
 * Aegis QA - Portable Entry Point
 * 
 * This is the portable entry point used by pkg to create standalone executables.
 * It imports and runs the CLI with proper error handling.
 */

// 🔒 MARIANELLA CABRERA AHUMADA - PROTECCIÓN DE ENTRADA
import { main } from './cli.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main CLI function
main().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});
