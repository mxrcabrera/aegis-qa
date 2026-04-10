/**
 * State Persistence - Final Seal for Sentinel
 *
 * Saves the final state of the Sovereign Sentinel run,
 * including audit results, fixes applied, and documentation.
 * Implements Truth Synchronization Hardening with checksums.
 *
 * @module state-persistence
 * @since 2.0.0
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SentinelState {
  timestamp: string;
  readyForAudit: boolean;
  qualityScore: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  remediationSummary: {
    applied: number;
    suggested: number;
    total: number;
  };
  documentationGenerated: string[];
  checksum?: string; // SHA-256 checksum for integrity verification
}

export class StatePersistence {
  private projectRoot: string;
  private sentinelPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.sentinelPath = path.join(projectRoot, '.sentinel');
  }

  /**
   * Save the final state of Sentinel run with checksum for integrity
   */
  async saveState(state: SentinelState): Promise<void> {
    await fs.ensureDir(this.sentinelPath);

    // Generate checksum for truth synchronization
    const stateWithoutChecksum = { ...state };
    delete stateWithoutChecksum.checksum;
    const checksum = this.generateChecksum(stateWithoutChecksum);
    state.checksum = checksum;

    const statePath = path.join(this.sentinelPath, 'state.json');
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');

    // Create a human-readable summary
    const summaryPath = path.join(this.sentinelPath, 'SUMMARY.md');
    const summary = this.generateSummary(state);
    await fs.writeFile(summaryPath, summary, 'utf-8');

    // Create TRUTH_OF_SOURCE.md - The absolute source of truth
    const truthPath = path.join(this.sentinelPath, 'TRUTH_OF_SOURCE.md');
    const truthDoc = this.generateTruthDocument(state, checksum);
    await fs.writeFile(truthPath, truthDoc, 'utf-8');
  }

  /**
   * Load the previous state and verify integrity
   */
  async loadState(): Promise<SentinelState | null> {
    const statePath = path.join(this.sentinelPath, 'state.json');

    if (!await fs.pathExists(statePath)) {
      return null;
    }

    const content = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(content) as SentinelState;

    // Verify checksum for truth synchronization
    if (state.checksum) {
      const stateWithoutChecksum = { ...state };
      delete stateWithoutChecksum.checksum;
      const computedChecksum = this.generateChecksum(stateWithoutChecksum);
      
      if (computedChecksum !== state.checksum) {
        console.error('⚠️  TRUTH INTEGRITY VIOLATION: State checksum mismatch!');
        console.error('The documentation may not be the source of truth.');
      }
    }

    return state;
  }

  /**
   * Generate SHA-256 checksum for integrity verification
   */
  private generateChecksum(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(state: SentinelState): string {
    let summary = '# Sovereign Sentinel - Run Summary\n\n';
    summary += `**Timestamp:** ${state.timestamp}\n\n`;
    summary += `**Ready for Audit:** ${state.readyForAudit ? '✅ YES' : '🚨 NO'}\n\n`;
    summary += `**Integrity Checksum:** \`${state.checksum || 'N/A'}\`\n\n`;
    
    summary += '## Quality Score\n\n';
    summary += '| Severity | Count |\n';
    summary += '|----------|-------|\n';
    summary += `| 🔴 Critical | ${state.qualityScore.critical} |\n`;
    summary += `| 🟠 High | ${state.qualityScore.high} |\n`;
    summary += `| 🟡 Medium | ${state.qualityScore.medium} |\n`;
    summary += `| 🔵 Low | ${state.qualityScore.low} |\n`;
    summary += `| **Total** | **${state.qualityScore.total}** |\n\n`;

    summary += '## Remediation Summary\n\n';
    summary += `**Applied Fixes:** ${state.remediationSummary.applied}\n`;
    summary += `**Suggested Fixes:** ${state.remediationSummary.suggested}\n`;
    summary += `**Total Fixes:** ${state.remediationSummary.total}\n\n`;

    if (state.documentationGenerated.length > 0) {
      summary += '## Documentation Generated\n\n';
      for (const doc of state.documentationGenerated) {
        summary += `- ${doc}\n`;
      }
      summary += '\n';
    }

    return summary;
  }

  /**
   * Generate Truth of Source document - The absolute source of truth
   */
  private generateTruthDocument(state: SentinelState, checksum: string): string {
    let doc = '# TRUTH OF SOURCE\n\n';
    doc += '**Status:** BLINDADO • DOCUMENTADO • AUTOMATIZADO\n\n';
    doc += `**Operation:** Sovereign Sentinel v2\n`;
    doc += `**Timestamp:** ${state.timestamp}\n`;
    doc += `**Integrity Checksum (SHA-256):** \`${checksum}\`\n\n`;
    
    doc += '## Declaration of Truth\n\n';
    doc += 'This document serves as the absolute source of truth for this Sovereign Sentinel run.\n';
    doc += 'The documentation in `docs/` is the single source of truth for:\n';
    doc += '- Environment variables configuration\n';
    doc += '- Architecture and module dependencies\n';
    doc += '- API contracts (if applicable)\n';
    doc += '- Changelog and remediation history\n';
    doc += '- JSDoc suggestions for code documentation\n\n';

    doc += '## Verification Protocol\n\n';
    doc += 'To verify truth synchronization:\n';
    doc += '```bash\n';
    doc += '# Verify state integrity\n';
    doc += 'cat .sentinel/state.json | jq -c .\n';
    doc += '# Compare checksum\n';
    doc += '# Expected: ' + checksum + '\n';
    doc += '```\n\n';

    doc += '## Final State\n\n';
    doc += `- **Ready for Audit:** ${state.readyForAudit ? 'YES ' : 'NO '}${state.readyForAudit ? '✅' : '🚨'}\n`;
    doc += `- **Critical Issues:** ${state.qualityScore.critical}\n`;
    doc += `- **High Issues:** ${state.qualityScore.high}\n`;
    doc += `- **Fixes Applied:** ${state.remediationSummary.applied}\n`;
    doc += `- **Documentation Files:** ${state.documentationGenerated.length}\n\n`;

    doc += '---\n\n';
    doc += '*Generated by Sovereign Sentinel v2 - Operation Sovereign*\n';
    doc += '*Documentation is the source of truth. Code must align with docs.*\n';

    return doc;
  }
}

export default StatePersistence;
