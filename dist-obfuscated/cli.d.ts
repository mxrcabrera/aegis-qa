#!/usr/bin/env node
/**
 * Aegis QA - CLI Entry Point
 *
 * This is the main CLI interface for Aegis QA, supporting multiple commands
 * for review, fix, and incremental analysis modes.
 *
 * Commands:
 * - review: Full review of all 20 phases
 * - fix: Atomic fixes with mandatory verification
 * - incremental: Review only git diff changes
 */
declare function main(): Promise<void>;
export { main };
//# sourceMappingURL=cli.d.ts.map