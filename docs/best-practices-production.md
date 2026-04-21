# Best Practices for Production Use

This document provides guidelines for safely using Aegis QA in production environments to minimize risks and ensure code integrity.

## Overview

Aegis QA is designed with multiple safety mechanisms to prevent unintended changes to your codebase. When used in production, follow these best practices to maximize security and reliability.

## Safety Modes

### 1. Safe-Only Mode (Recommended for Initial Scans)

Use `--safe-only` flag to run Aegis QA in reporting mode without applying any changes:

```bash
aegis-qa review . --safe-only
```

**When to use:**
- Initial scans of new codebases
- Compliance audits
- Pre-deployment reviews
- CI/CD pipelines where automated fixes are not desired

**Benefits:**
- No file modifications
- Full audit trail of potential issues
- Zero risk to production code

### 2. Interactive Fix Mode (Recommended for Manual Review)

Use `--interactive-fix` flag to require approval for each individual fix:

```bash
aegis-qa review . --apply --interactive-fix
```

**When to use:**
- Small to medium codebases
- Teams with manual review capacity
- Critical infrastructure projects
- Learning and evaluation phases

**Benefits:**
- Per-fix approval with diff preview
- Full control over which changes are applied
- Opportunity to review each modification

### 3. Sandbox Mode (Recommended for Automated Fixes)

Sandbox mode is automatically enabled when not in safe-only mode. It creates an isolated environment for fix validation:

```bash
aegis-qa review . --apply
```

**When to use:**
- Automated CI/CD pipelines with validation
- Non-critical projects with high confidence
- Development environments

**Benefits:**
- Isolated execution environment
- Automatic syntax validation (TypeScript, ESLint)
- Rollback capability via git checkpoint

## Risk Mitigation Features

### Operation Guard

The Operation Guard controls which operations can be performed:

```typescript
{
  allowRead: true,
  allowWrite: true,
  allowDelete: false,
  allowExecuteCommands: false,
  blockedPaths: ['.git', 'node_modules', 'dist'],
  allowedPaths: ['src/']
}
```

**Best Practices:**
- Keep `allowDelete: false` in production
- Keep `allowExecuteCommands: false` unless absolutely necessary
- Block sensitive directories like `.git`, `node_modules`, `.env`
- Only allow operations on specific trusted paths

### File Whitelist

The File Whitelist controls which files can be modified:

```typescript
{
  allowedExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  blockedPatterns: ['.git', 'node_modules', 'dist', '.env'],
  allowAllIfEmpty: false
}
```

**Best Practices:**
- Restrict to source code extensions (`.ts`, `.tsx`, `.js`, `.jsx`)
- Block configuration files (`.env`, package-lock.json)
- Never set `allowAllIfEmpty: true` in production
- Review blocked patterns regularly

### Multi-Level Rollback

Aegis QA provides three levels of rollback:

1. **Level 1: Git Hard Reset** - Fastest rollback using git
2. **Level 2: Git Stash Pop** - Fallback if hard reset fails
3. **Level 3: Directory Snapshot** - Ultimate fallback using file system snapshot

**Best Practices:**
- Always ensure git is initialized in your project
- Commit all changes before running Aegis QA
- Verify rollback capability in test environment first

## Pre-Flight Checklist

Before running Aegis QA in production:

- [ ] **Git Status Clean**: Ensure no uncommitted changes
- [ ] **Backup Created**: Create a manual backup if possible
- [ ] **Configuration Reviewed**: Verify operation guard and file whitelist settings
- [ ] **Test Environment**: Test in staging/dev environment first
- [ ] **Team Notification**: Inform team about upcoming changes
- [ ] **Rollback Plan**: Know how to rollback if needed
- [ ] **Monitoring**: Set up monitoring for post-execution

## CI/CD Integration

### Example GitHub Actions Workflow

```yaml
name: Aegis QA Review
on: [push, pull_request]

jobs:
  aegis-qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Aegis QA
        run: npm install -g aegis-qa
        
      - name: Run Safe-Only Review
        run: aegis-qa review . --safe-only --ci
        
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: aegis-report
          path: qa-report.md
```

### Example with Interactive Approval (Local)

For local development with manual approval:

```bash
# 1. Ensure clean git state
git status

# 2. Create a feature branch
git checkout -b aegis-fixes

# 3. Run with interactive approval
aegis-qa review . --apply --interactive-fix

# 4. Review changes
git diff

# 5. Commit if satisfied
git add .
git commit -m "Apply Aegis QA fixes"

# 6. Create PR for review
git push origin aegis-fixes
```

## Monitoring and Validation

### Post-Execution Validation

After running Aegis QA:

1. **Review the Report**: Check `qa-report.md` for summary
2. **Run Tests**: Execute your test suite
3. **Build Project**: Ensure build succeeds
4. **Lint Check**: Run your linter to verify code quality
5. **Git Diff**: Review actual changes made

### Metrics to Track

- Number of fixes applied
- Number of fixes skipped (user rejected)
- Number of fixes with collisions
- Syntax validation failures
- Rollback events (if any)

## Common Pitfalls

### 1. Running on Dirty Git State

**Problem**: Uncommitted changes can interfere with rollback.

**Solution**: Always commit or stash changes before running Aegis QA.

### 2. Overly Permissive Configuration

**Problem**: Allowing delete operations or command execution can be dangerous.

**Solution**: Keep restrictive defaults, only relax if absolutely necessary.

### 3. Ignoring Warnings

**Problem**: Syntax validation failures or collision warnings indicate potential issues.

**Solution**: Review and address all warnings before proceeding.

### 4. Skipping Test Environment

**Problem**: Running directly in production without testing.

**Solution**: Always test in staging/dev environment first.

## Emergency Procedures

### If Fixes Break the Build

1. **Immediate Rollback**:
   ```bash
   git reset --hard HEAD
   ```

2. **Verify Rollback**:
   ```bash
   git status
   npm run build
   ```

3. **Report Issue**: Document what went wrong for future prevention

### If Rollback Fails

1. **Use Directory Snapshot**: If available, restore from `.aegis-snapshot`
2. **Manual Restore**: Use your manual backup
3. **Contact Support**: If automated rollbacks fail

## Configuration Examples

### Strict Production Configuration

```typescript
{
  safeOnly: false,
  interactiveFix: true,
  dryRun: false,
  autoApply: false,
  allowCorePathFixes: false,
  operationGuardConfig: {
    allowRead: true,
    allowWrite: true,
    allowDelete: false,
    allowExecuteCommands: false,
    blockedPaths: ['.git', 'node_modules', 'dist', 'build', '.env'],
    allowedPaths: ['src/']
  },
  fileWhitelistConfig: {
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    blockedPatterns: ['.git', 'node_modules', 'dist', 'build', '.env', '.env.*'],
    allowAllIfEmpty: false
  }
}
```

### Development Configuration

```typescript
{
  safeOnly: false,
  interactiveFix: false,
  dryRun: false,
  autoApply: true,
  allowCorePathFixes: false,
  operationGuardConfig: {
    allowRead: true,
    allowWrite: true,
    allowDelete: false,
    allowExecuteCommands: false,
    blockedPaths: ['.git', 'node_modules']
  },
  fileWhitelistConfig: {
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    blockedPatterns: ['.git', 'node_modules'],
    allowAllIfEmpty: false
  }
}
```

## Support and Resources

- **Documentation**: See main README for detailed feature documentation
- **Issues**: Report bugs or feature requests on GitHub
- **Security**: Report security vulnerabilities privately

## Version History

- **v2.0.0**: Added sandbox mode, operation guard, file whitelist, interactive fix approval
- **v1.0.0**: Initial release with basic fix capabilities

---

**Last Updated**: 2024
**Version**: 2.0.0
