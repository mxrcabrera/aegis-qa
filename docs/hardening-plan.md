# Hardening Plan - Aegis QA

## Overview

This document outlines the hardening strategy for all implemented phases of Aegis QA. The goal is to ensure security, reliability, and robustness across all components.

## Priority Levels

- **High**: Critical security vulnerabilities that could lead to data exposure, system compromise, or data loss
- **Medium**: Important reliability and security improvements that should be addressed

## Phase-by-Phase Hardening

### Fase 1: Safety por Defecto

#### hardening-1: Validate dry-run cannot be bypassed
**Priority:** High  
**Risk:** High - Could lead to unintended modifications  
**Strategy:**
- Add validation layer that enforces dry-run at multiple levels (CLI, Orchestrator, Phase)
- Add checksum verification before any write operation
- Implement "dry-run lock" that prevents any file modifications when dry-run is active
- Add audit logging for any attempt to bypass dry-run

**Implementation:**
```typescript
// In PhaseOrchestrator
private enforceDryRun(): void {
  if (this.dryRunMode && this.config.applyMode) {
    throw new Error('Cannot apply changes in dry-run mode. Use --apply flag to disable dry-run.');
  }
}
```

#### hardening-2: Validate auto-backup always occurs before changes
**Priority:** High  
**Risk:** High - Could lead to data loss  
**Strategy:**
- Add pre-flight check that verifies backup exists before any modification
- Implement backup integrity verification (checksum comparison)
- Add rollback capability if backup fails
- Add backup logging with timestamps

**Implementation:**
```typescript
// In Phase11AtomicFixes
private async verifyBackupExists(): Promise<void> {
  const backupExists = await this.gitCheckpointManager.hasRecentBackup();
  if (!backupExists) {
    throw new Error('No recent backup found. Cannot proceed with fixes.');
  }
}
```

#### hardening-3: Validate interactive confirmation cannot be bypassed with --yes in destructive operations
**Priority:** High  
**Risk:** High - Could lead to unintended destructive changes  
**Strategy:**
- Implement "destructive operation whitelist" that always requires confirmation
- Add special confirmation for core path modifications
- Add audit trail for all destructive operations
- Implement "destructive lock" that requires explicit confirmation for certain operations

**Implementation:**
```typescript
// In Phase11AtomicFixes
private async requireDestructiveConfirmation(fix: any): Promise<boolean> {
  const isDestructive = this.isDestructiveOperation(fix);
  if (isDestructive) {
    // Always require confirmation, even with --yes
    return this.showInteractiveConfirmation(fix, true);
  }
  return this.yesMode;
}
```

### Fase 2: Graceful Degradation

#### hardening-4: Validate retry does not cause infinite loops
**Priority:** High  
**Risk:** High - Could cause application hang  
**Strategy:**
- Add maximum retry limit with hard cap
- Implement exponential backoff with jitter
- Add timeout for entire retry operation
- Add circuit breaker pattern for persistent failures

**Implementation:**
```typescript
// In RetryHelper
private readonly MAX_RETRY_ATTEMPTS = 5;
private readonly MAX_TOTAL_RETRY_TIME = 60000; // 1 minute

async executeWithRetry<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  const startTime = Date.now();
  let attempt = 0;
  
  while (attempt < this.MAX_RETRY_ATTEMPTS) {
    if (Date.now() - startTime > this.MAX_TOTAL_RETRY_TIME) {
      throw new Error(`Retry timeout exceeded for ${context}`);
    }
    // ... retry logic
  }
}
```

#### hardening-5: Validate AST fallback does not cause false positives
**Priority:** Medium  
**Risk:** Medium - Could report non-existent errors  
**Strategy:**
- Add confidence score to AST-detected errors
- Implement whitelist of known false positives
- Add manual review flag for low-confidence errors
- Add AST parser validation against known patterns

**Implementation:**
```typescript
// In ErrorBaseline
private filterLowConfidenceErrors(errors: any[]): any[] {
  return errors.filter(error => 
    error.confidence >= 0.7 || error.source === 'tsc'
  );
}
```

### Fase 3: Error Messages Accionables

#### hardening-6: Validate error messages do not expose secrets
**Priority:** High  
**Risk:** High - Could leak sensitive information  
**Strategy:**
- Integrate SecretSanitizer into all error logging
- Add secret detection in error messages
- Implement safe error message templates
- Add audit logging for secret exposure attempts

**Implementation:**
```typescript
// In ErrorMessages
static logError(error: Error, context: string): void {
  const sanitizedMessage = SecretSanitizer.sanitize(error.message);
  const sanitizedStack = SecretSanitizer.sanitize(error.stack || '');
  console.error(`[${context}] ${sanitizedMessage}`);
  if (verboseMode) {
    console.error(sanitizedStack);
  }
}
```

#### hardening-7: Validate verbose mode does not log secrets
**Priority:** High  
**Risk:** High - Could leak sensitive information  
**Strategy:**
- Add secret sanitization to all verbose logging
- Implement secret detection in debug output
- Add safe verbose mode that excludes sensitive data
- Add audit logging for secret exposure in verbose mode

**Implementation:**
```typescript
// In PhaseOrchestrator
private logVerbose(message: string, data?: any): void {
  if (!this.verboseMode) return;
  
  const sanitizedMessage = SecretSanitizer.sanitize(message);
  const sanitizedData = data ? SecretSanitizer.sanitize(JSON.stringify(data)) : undefined;
  
  console.log(`[VERBOSE] ${sanitizedMessage}`);
  if (sanitizedData) {
    console.log(sanitizedData);
  }
}
```

### Fase 4: Installation y Setup

#### hardening-8: Validate bin entry point has secure permissions
**Priority:** Medium  
**Risk:** Medium - Could allow unauthorized modifications  
**Strategy:**
- Add permission validation in bin script
- Implement integrity check for bin script
- Add secure file permissions (755)
- Add signature verification if possible

**Implementation:**
```bash
# In bin/aegis-qa.js
# Add permission check
if (process.getuid && process.getuid() === 0) {
  console.error('Do not run as root');
  process.exit(1);
}
```

#### hardening-9: Validate stack detection does not execute arbitrary code
**Priority:** High  
**Risk:** High - Could lead to code injection  
**Strategy:**
- Add package.json parsing validation
- Implement whitelist of safe dependencies
- Add sandbox for dependency analysis
- Add validation of file paths before reading

**Implementation:**
```typescript
// In StackDetector
private safeReadJSON(filePath: string): any {
  // Validate path is within project root
  const resolvedPath = path.resolve(this.projectRoot, filePath);
  if (!resolvedPath.startsWith(this.projectRoot)) {
    throw new Error('Path traversal attempt detected');
  }
  
  // Safe JSON parse with size limit
  const content = fs.readFileSync(resolvedPath, 'utf-8');
  if (content.length > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File too large');
  }
  
  return JSON.parse(content);
}
```

#### hardening-10: Validate smart config does not overwrite critical configs without permission
**Priority:** Medium  
**Risk:** Medium - Could overwrite important settings  
**Strategy:**
- Add config merge strategy that preserves critical settings
- Implement config validation before write
- Add backup of existing config before overwrite
- Add explicit confirmation for config overwrite

**Implementation:**
```typescript
// In SmartConfig
private mergeConfigs(generated: AegisConfig, existing: AegisConfig): AegisConfig {
  const criticalFields = ['phaseTimeoutMs', 'maxMemoryBytes'];
  
  // Preserve critical fields from existing config
  for (const field of criticalFields) {
    if (existing[field] !== undefined) {
      generated[field] = existing[field];
    }
  }
  
  return { ...generated, ...existing };
}
```

### Fase 5: Performance Predictible

#### hardening-11: Validate memory limits do not cause OOM on system
**Priority:** High  
**Risk:** High - Could crash the system  
**Strategy:**
- Add system memory check before setting limits
- Implement dynamic memory limit based on available system memory
- Add memory pressure monitoring
- Add graceful degradation when memory is low

**Implementation:**
```typescript
// In MemoryMonitor
constructor(config: MemoryMonitorConfig = {}) {
  const systemMemory = os.totalmem();
  const availableMemory = systemMemory - os.freemem();
  
  // Limit max memory to 80% of available system memory
  const safeMaxMemory = Math.min(
    config.maxMemoryBytes || 2 * 1024 * 1024 * 1024,
    availableMemory * 0.8
  );
  
  this.config = {
    ...config,
    maxMemoryBytes: safeMaxMemory,
  };
}
```

#### hardening-12: Validate timeout cleanup does not leave orphaned resources
**Priority:** High  
**Risk:** High - Could cause resource leaks  
**Strategy:**
- Add resource tracking for all operations
- Implement cleanup verification
- Add timeout for cleanup operations
- Add force cleanup if normal cleanup fails

**Implementation:**
```typescript
// In PhaseOrchestrator
private performTimeoutCleanup(context: string): void {
  const resources = this.getActiveResources();
  
  for (const resource of resources) {
    try {
      await this.cleanupResource(resource);
    } catch (error) {
      console.warn(`Failed to cleanup resource: ${resource.id}`);
      // Force cleanup
      await this.forceCleanupResource(resource);
    }
  }
}
```

#### hardening-13: Validate progress tracker does not cause memory leaks
**Priority:** Medium  
**Risk:** Medium - Could cause memory growth over time  
**Strategy:**
- Add automatic cleanup of completed trackers
- Implement object pooling for progress items
- Add memory limit for progress data
- Add periodic garbage collection

**Implementation:**
```typescript
// In ProgressTracker
private cleanup(): void {
  this.currentProgress = null;
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
    this.updateInterval = null;
  }
}
```

### Fase 6: Testing E2E

#### hardening-14: Validate E2E tests do not expose secrets in reports
**Priority:** High  
**Risk:** High - Could leak secrets in test reports  
**Strategy:**
- Add secret sanitization to all report generation
- Implement secret detection in test output
- Add safe report templates
- Add audit logging for secret exposure in reports

**Implementation:**
```typescript
// In E2ETestSuite
generateReport(): string {
  const sanitizedResults = this.results.map(result => ({
    ...result,
    error: result.error ? SecretSanitizer.sanitize(result.error) : undefined,
  }));
  
  // Generate report with sanitized data
  // ...
}
```

#### hardening-15: Validate stress test cleanup is 100% reliable
**Priority:** High  
**Risk:** High - Could leave test artifacts  
**Strategy:**
- Add cleanup verification
- Implement rollback for failed cleanup
- Add force cleanup if normal cleanup fails
- Add cleanup logging with verification

**Implementation:**
```typescript
// In StressTest
private async cleanupSyntheticFiles(repoPath: string): Promise<void> {
  const syntheticDir = path.join(repoPath, '.aegis-synthetic');
  
  try {
    await fs.promises.rm(syntheticDir, { recursive: true, force: true });
    
    // Verify cleanup
    if (fs.existsSync(syntheticDir)) {
      throw new Error('Cleanup verification failed');
    }
  } catch (error) {
    // Force cleanup
    await this.forceCleanup(syntheticDir);
  }
}
```

#### hardening-16: Validate compatibility test does not modify filesystem
**Priority:** Medium  
**Risk:** Medium - Could modify system state  
**Strategy:**
- Add filesystem monitoring during test
- Implement sandbox for test operations
- Add rollback capability for any changes
- Add audit logging for filesystem modifications

**Implementation:**
```typescript
// In CompatibilityMatrix
private async testFSOperations(platform: PlatformInfo): Promise<boolean> {
  const testDir = path.join(os.tmpdir(), 'aegis-compat-test');
  
  try {
    // ... test operations
  } finally {
    // Ensure cleanup always runs
    await this.cleanupTestDir(testDir);
  }
}
```

### General Hardening

#### hardening-17: Add input validation to all CLI arguments
**Priority:** High  
**Risk:** High - Could lead to injection attacks  
**Strategy:**
- Add argument validation schema
- Implement type checking for all arguments
- Add path validation for file arguments
- Add sanitization for string arguments

**Implementation:**
```typescript
// In CLI
private validateArguments(args: CLIConfig): void {
  // Validate project root exists and is accessible
  if (!fs.existsSync(args.projectRoot)) {
    throw new Error(`Project root does not exist: ${args.projectRoot}`);
  }
  
  // Validate phase numbers
  if (args.phasesToRun) {
    for (const phase of args.phasesToRun) {
      if (phase < 0 || phase > 20) {
        throw new Error(`Invalid phase number: ${phase}`);
      }
    }
  }
  
  // ... more validation
}
```

#### hardening-18: Add rate limiting to I/O operations
**Priority:** Medium  
**Risk:** Medium - Could cause resource exhaustion  
**Strategy:**
- Implement rate limiting for file operations
- Add concurrent operation limits
- Implement backpressure for heavy operations
- Add monitoring for I/O spikes

**Implementation:**
```typescript
// Create IOLimiter class
class IOLimiter {
  private queue: Array<() => Promise<void>> = [];
  private active = 0;
  private readonly maxConcurrent = 10;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.active >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
    }
  }
}
```

#### hardening-19: Add checksum validation to critical files
**Priority:** Medium  
**Risk:** Medium - Could allow tampering  
**Strategy:**
- Implement SHA-256 checksum for critical files
- Add integrity verification on load
- Implement checksum update on write
- Add tamper detection

**Implementation:**
```typescript
// Create IntegrityChecker class
class IntegrityChecker {
  static async calculateChecksum(filePath: string): Promise<string> {
    const content = await fs.promises.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }
  
  static async verifyIntegrity(filePath: string, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.calculateChecksum(filePath);
    return actualChecksum === expectedChecksum;
  }
}
```

#### hardening-20: Create security audit checklist document
**Priority:** Medium  
**Risk:** Low - Documentation  
**Strategy:**
- Create comprehensive security checklist
- Add automated security scanning
- Implement periodic security audits
- Add security review process

**Implementation:**
- Create `docs/security-audit-checklist.md`
- Include OWASP Top 10 checks
- Add dependency vulnerability scanning
- Add secret scanning integration

## Implementation Timeline

### Phase 1: Critical Security (Week 1)
- hardening-1, hardening-2, hardening-3 (Safety)
- hardening-6, hardening-7 (Error Messages)
- hardening-9 (Installation - code execution)
- hardening-11, hardening-12 (Performance - system safety)
- hardening-14, hardening-15 (Testing - secret exposure)
- hardening-17 (General - input validation)

### Phase 2: Reliability & Robustness (Week 2)
- hardening-4, hardening-5 (Graceful Degradation)
- hardening-8, hardening-10 (Installation)
- hardening-13 (Performance - memory leaks)
- hardening-16 (Testing - filesystem)
- hardening-18, hardening-19 (General - I/O & integrity)

### Phase 3: Documentation & Process (Week 3)
- hardening-20 (Security audit checklist)
- Security review process
- Automated security scanning
- Incident response plan

## Success Criteria

- All high-priority hardening tasks completed
- Security audit passes with no critical findings
- Penetration testing shows no vulnerabilities
- Performance benchmarks maintained after hardening
- No regressions in functionality

## Monitoring & Maintenance

- Monthly security scans
- Quarterly penetration testing
- Annual security audit
- Continuous dependency vulnerability monitoring
- Secret scanning integration in CI/CD
