# SecretSanitizer Integration Example

## Example: Report Before Sanitization

```markdown
# SOVEREIGNQA - SECURITY AUDIT REPORT

**Generated:** 2026-04-16T21:00:00.000Z

## Overall Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 5 |
| 🟡 Medium | 10 |
| 🔵 Low | 20 |
| **Total** | **38** |

## Auditor Reports

### Security Scanner

**Total Violations:** 3

| Severity | File | Line | Rule | Message |
|----------|------|------|------|----------|
| 🔴 critical | src/auth/auth.ts | 45 | hardcoded-secret | API key detected: sk_live_PLACEHOLDER_SECRET_KEY |
| 🔴 critical | src/db/connection.ts | 12 | hardcoded-secret | Database URL: postgres://admin:P@ssw0rd123@db.example.com:5432/mydb |
| 🟠 high | src/api/stripe.ts | 89 | exposed-secret | Stripe key in logs: pk_test_51XYZ9876543210zyxwvutsrqponmlkjihg |

## Deployment Readiness

| Status | Value |
|--------|-------|
| READY_FOR_AUDIT | 🚨 FALSE |

## Hardware Safety Metrics

| Metric | Value |
|--------|-------|
| Current Temperature | 45°C |
| Threshold | 70°C |
| Status | ✅ Safe |
```

## Example: Report After Sanitization

```markdown
# SOVEREIGNQA - SECURITY AUDIT REPORT

**Generated:** 2026-04-16T21:00:00.000Z

## Overall Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 5 |
| 🟡 Medium | 10 |
| 🔵 Low | 20 |
| **Total** | **38** |

## Auditor Reports

### Security Scanner

**Total Violations:** 3

| Severity | File | Line | Rule | Message |
|----------|------|------|------|----------|
| 🔴 critical | src/auth/auth.ts | 45 | hardcoded-secret | API key detected: [REDACTED_0] |
| 🔴 critical | src/db/connection.ts | 12 | hardcoded-secret | Database URL: [REDACTED_1] |
| 🟠 high | src/api/stripe.ts | 89 | exposed-secret | Stripe key in logs: [REDACTED_2] |

## Deployment Readiness

| Status | Value |
|--------|-------|
| READY_FOR_AUDIT | 🚨 FALSE |

## Hardware Safety Metrics

| Metric | Value |
|--------|-------|
| Current Temperature | 45°C |
| Threshold | 70°C |
| Status | ✅ Safe |

---

**SECURITY NOTICE:** This report has been automatically sanitized for GDPR/CCPA/SOC2 compliance.
- **3** sensitive patterns redacted
- Original values are not logged or stored
- Contact security team if you need to review original data
- Sanitization mode: STANDARD
```

## Patterns Detected and Redacted

1. `sk_live_PLACEHOLDER_SECRET_KEY` → `[REDACTED_0]` (Stripe Secret Key)
2. `postgres://admin:P@ssw0rd123@db.example.com:5432/mydb` → `[REDACTED_1]` (Database URL with credentials)
3. `pk_test_51XYZ9876543210zyxwvutsrqponmlkjihg` → `[REDACTED_2]` (Stripe Publishable Key)

## Integration in ReportAggregator

```typescript
class ReportAggregator {
  private sanitizer: SecretSanitizer;

  constructor() {
    this.sanitizer = new SecretSanitizer({
      sanitizeLogs: true,
      sanitizeReports: true,
      allowedPatterns: ['TEST_API_KEY', 'MOCK_SECRET', 'DEMO_KEY'],
      logLevel: 'warn',
      complianceMode: false,
    });
  }

  generateMarkdownReport(): string {
    // ... build report ...

    // Sanitize the report to remove sensitive data (GDPR/CCPA/SOC2 compliance)
    const sanitizedReport = this.sanitizer.sanitizeReport(report);

    return sanitizedReport;
  }
}
```

## Next Steps

1. ✅ SecretSanitizer class created
2. ✅ Integration in ReportAggregator completed
3. ⏳ Implement Safe Level 4 (calculateRisk)
4. ⏳ Implement global console.log middleware
