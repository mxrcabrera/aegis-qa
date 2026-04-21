# Aegis QA - Partial Report
Generated: 2026-04-16T21:15:11.761Z


## Phase 0: Setup - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:15:11.761Z
- **Findings:** 0
- **Execution Time:** 1.39s


## Phase 0: Setup - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:16:19.303Z
- **Findings:** 0
- **Execution Time:** 1.40s


## Phase 0: Setup - PASSED
- **Timestamp:** 2026-04-16T21:17:41.360Z
- **Execution Time:** 3625ms

### Environment Validation
- **Dependencies:**  Valid
  - node_modules:  Present
  - Lockfile: npm
  - Warnings: 0
- **Critical Files:**  Complete
  - Present: package.json, tsconfig.json, .gitignore
  - Missing: None
- **Syntax Check:**  Valid
  - Files Checked: 81
  - Error Files: 0

### Hardware Diagnostic
- **Status:**  Passed
- **Temperature Rise Rate:** 0┬░C/min

### Hardware Profile
- **Recommended Batch Size:** 20
- **Recommended Cooldown:** 15000ms

---


## Phase 0: Setup - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:41.361Z
- **Findings:** 0
- **Execution Time:** 3.63s


## Phase 1: Code Quality - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:43.501Z
- **Files analyzed:** 104
- **Total findings:** 2449
- **Critical files:** 90
- **Average quality score:** 16.4/100

### Critical Files (Low Score)
- C:\repos\aegis-qa\src\cli.ts
- C:\repos\aegis-qa\src\orchestration\qa-orchestrator.ts
- C:\repos\aegis-qa\src\orchestration\phase-orchestrator.ts
- C:\repos\aegis-qa\src\processing\batch-processor.ts
- C:\repos\aegis-qa\src\phases\phase-refactor.ts
- C:\repos\aegis-qa\src\phases\phase-compare-reports.ts
- C:\repos\aegis-qa\src\phases\phase-cleanup.ts
- C:\repos\aegis-qa\src\phases\phase-api-contracts.ts
- C:\repos\aegis-qa\src\phases\phase-9-i18n-a11y.ts
- C:\repos\aegis-qa\src\phases\phase-9-dead-code-dependencies.ts
- C:\repos\aegis-qa\src\phases\phase-8-performance.ts
- C:\repos\aegis-qa\src\phases\phase-8-performance-seo.ts
- C:\repos\aegis-qa\src\phases\phase-7-ux-accessibility.ts
- C:\repos\aegis-qa\src\phases\phase-7-testing-strategy.ts
- C:\repos\aegis-qa\src\phases\phase-6-ui-components.ts
- C:\repos\aegis-qa\src\phases\phase-6-api-contracts.ts
- C:\repos\aegis-qa\src\phases\phase-5-clean-code.ts
- C:\repos\aegis-qa\src\phases\phase-4-database.ts
- C:\repos\aegis-qa\src\phases\phase-3h-xss-injection-security.ts
- C:\repos\aegis-qa\src\phases\phase-3g-data-privacy-pii.ts
- C:\repos\aegis-qa\src\phases\phase-3f-webhook-security.ts
- C:\repos\aegis-qa\src\phases\phase-3e-baas-platform-security.ts
- C:\repos\aegis-qa\src\phases\phase-3c-secure-dev-methodology.ts
- C:\repos\aegis-qa\src\phases\phase-3b-ai-api-security.ts
- C:\repos\aegis-qa\src\phases\phase-3-security.ts
- C:\repos\aegis-qa\src\phases\phase-20-intelligent-roi-report.ts
- C:\repos\aegis-qa\src\phases\phase-20-intelligent-report-comparison.ts
- C:\repos\aegis-qa\src\phases\phase-2-business-logic.ts
- C:\repos\aegis-qa\src\phases\phase-19-incremental-review.ts
- C:\repos\aegis-qa\src\phases\phase-18-post-fix-validation.ts
- C:\repos\aegis-qa\src\phases\phase-17-multi-fix-execution.ts
- C:\repos\aegis-qa\src\phases\phase-16-fix-strategy.ts
- C:\repos\aegis-qa\src\phases\phase-16-fix-strategy-generation.ts
- C:\repos\aegis-qa\src\phases\phase-15d-containerization.ts
- C:\repos\aegis-qa\src\phases\phase-15c-cloud-infra.ts
- C:\repos\aegis-qa\src\phases\phase-15b-security-sca.ts
- C:\repos\aegis-qa\src\phases\phase-15a-cicd-devops.ts
- C:\repos\aegis-qa\src\phases\phase-15-devops-suite.ts
- C:\repos\aegis-qa\src\phases\phase-14b-git-repo-hygiene.ts
- C:\repos\aegis-qa\src\phases\phase-14b-git-hygiene.ts
- C:\repos\aegis-qa\src\phases\phase-14a-cloud-cost.ts
- C:\repos\aegis-qa\src\phases\phase-14a-cloud-cost-detection.ts
- C:\repos\aegis-qa\src\phases\phase-13b-predictive-bugs.ts
- C:\repos\aegis-qa\src\phases\phase-13a-i18n-l10n.ts
- C:\repos\aegis-qa\src\phases\phase-12-resilience-obs.ts
- C:\repos\aegis-qa\src\phases\phase-12-error-handling.ts
- C:\repos\aegis-qa\src\phases\phase-11-ci-cd.ts
- C:\repos\aegis-qa\src\phases\phase-11-atomic-fixes.ts
- C:\repos\aegis-qa\src\phases\phase-10-testing.ts
- C:\repos\aegis-qa\src\phases\phase-10-env-cicd.ts
- C:\repos\aegis-qa\src\phases\phase-1-code-quality.ts
- C:\repos\aegis-qa\src\phases\phase-0-setup.ts
- C:\repos\aegis-qa\src\modules\test-security.ts
- C:\repos\aegis-qa\src\modules\security-scanner.ts
- C:\repos\aegis-qa\src\modules\report-aggregator.ts
- C:\repos\aegis-qa\src\modules\ollama-processor.ts
- C:\repos\aegis-qa\src\modules\domain-inference.ts
- C:\repos\aegis-qa\src\modules\db-seeder.ts
- C:\repos\aegis-qa\src\modules\code-reader.ts
- C:\repos\aegis-qa\src\modules\auto-fixer.ts
- C:\repos\aegis-qa\src\modules\atomic-fixer.ts
- C:\repos\aegis-qa\src\inference\domain-analyzer.ts
- C:\repos\aegis-qa\src\lib\atomic-fixer.ts
- C:\repos\aegis-qa\src\core\thermal-controller.ts
- C:\repos\aegis-qa\src\core\state-persistence.ts
- C:\repos\aegis-qa\src\core\secret-manager.ts
- C:\repos\aegis-qa\src\core\reporter.ts
- C:\repos\aegis-qa\src\core\ignore-handler.ts
- C:\repos\aegis-qa\src\core\file-filter.ts
- C:\repos\aegis-qa\src\core\cache-manager.ts
- C:\repos\aegis-qa\lib\test-security.ts
- C:\repos\aegis-qa\lib\style-auditor.ts
- C:\repos\aegis-qa\lib\state-persistence.ts
- C:\repos\aegis-qa\lib\setup-wizard.ts
- C:\repos\aegis-qa\lib\security-scanner.ts
- C:\repos\aegis-qa\lib\secret-manager.ts
- C:\repos\aegis-qa\lib\report-aggregator.ts
- C:\repos\aegis-qa\lib\progress-bar.ts
- C:\repos\aegis-qa\lib\orchestrator.ts
- C:\repos\aegis-qa\lib\ollama-processor.ts
- C:\repos\aegis-qa\lib\hardware-awareness.ts
- C:\repos\aegis-qa\lib\domain-inference.ts
- C:\repos\aegis-qa\lib\deployment-hardening.ts
- C:\repos\aegis-qa\lib\db-seeder.ts
- C:\repos\aegis-qa\lib\css-global-indexer.ts
- C:\repos\aegis-qa\lib\code-reader.ts
- C:\repos\aegis-qa\lib\auto-fixer.ts
- C:\repos\aegis-qa\lib\auto-documentation.ts
- C:\repos\aegis-qa\lib\atomic-fixer.ts
- C:\repos\aegis-qa\lib\admin-wrapper.ts

### Findings by File

### cli.ts
- [0c169dfe-939-complexity-length] **complexity** (critical): Function 'anonymous' is too long (195 lines, max: 50)
- [0c169dfe-939-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [0c169dfe-42-console] **inconsistency** (low): Console statement found (log) (line 42)
- [0c169dfe-43-console] **inconsistency** (low): Console statement found (log) (line 43)
- [0c169dfe-60-console] **inconsistency** (low): Console statement found (log) (line 60)
- [0c169dfe-62-console] **inconsistency** (low): Console statement found (log) (line 62)
- [0c169dfe-63-console] **inconsistency** (low): Console statement found (log) (line 63)
- [0c169dfe-64-console] **inconsistency** (low): Console statement found (log) (line 64)
- [0c169dfe-65-console] **inconsistency** (low): Console statement found (log) (line 65)
- [0c169dfe-89-console] **inconsistency** (low): Console statement found (log) (line 89)
- [0c169dfe-91-console] **inconsistency** (low): Console statement found (log) (line 91)
- [0c169dfe-92-console] **inconsistency** (low): Console statement found (log) (line 92)
- [0c169dfe-93-console] **inconsistency** (low): Console statement found (log) (line 93)
- [0c169dfe-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [0c169dfe-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [0c169dfe-96-console] **inconsistency** (low): Console statement found (log) (line 96)
- [0c169dfe-97-console] **inconsistency** (low): Console statement found (log) (line 97)
- [0c169dfe-142-console] **inconsistency** (low): Console statement found (log) (line 142)
- [0c169dfe-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [0c169dfe-156-console] **inconsistency** (low): Console statement found (log) (line 156)
- [0c169dfe-161-console] **inconsistency** (low): Console statement found (log) (line 161)
- [0c169dfe-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [0c169dfe-163-console] **inconsistency** (low): Console statement found (log) (line 163)
- [0c169dfe-165-console] **inconsistency** (low): Console statement found (log) (line 165)
- [0c169dfe-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [0c169dfe-176-console] **inconsistency** (low): Console statement found (log) (line 176)
- [0c169dfe-177-console] **inconsistency** (low): Console statement found (log) (line 177)
- [0c169dfe-178-console] **inconsistency** (low): Console statement found (log) (line 178)
- [0c169dfe-179-console] **inconsistency** (low): Console statement found (log) (line 179)
- [0c169dfe-180-console] **inconsistency** (low): Console statement found (log) (line 180)
- [0c169dfe-182-console] **inconsistency** (low): Console statement found (log) (line 182)
- [0c169dfe-188-console] **inconsistency** (low): Console statement found (log) (line 188)
- [0c169dfe-193-console] **inconsistency** (low): Console statement found (log) (line 193)
- [0c169dfe-194-console] **inconsistency** (low): Console statement found (log) (line 194)
- [0c169dfe-195-console] **inconsistency** (low): Console statement found (log) (line 195)
- [0c169dfe-197-console] **inconsistency** (low): Console statement found (log) (line 197)
- [0c169dfe-203-console] **inconsistency** (low): Console statement found (log) (line 203)
- [0c169dfe-233-console] **inconsistency** (low): Console statement found (error) (line 233)
- [0c169dfe-234-console] **inconsistency** (low): Console statement found (log) (line 234)
- [0c169dfe-247-console] **inconsistency** (low): Console statement found (error) (line 247)

### qa-orchestrator.ts
- [edfb8c21-1312-complexity-length] **complexity** (critical): Function 'anonymous' is too long (159 lines, max: 50)
- [edfb8c21-1312-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [edfb8c21-82-console] **inconsistency** (low): Console statement found (log) (line 82)
- [edfb8c21-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [edfb8c21-121-console] **inconsistency** (low): Console statement found (log) (line 121)
- [edfb8c21-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [edfb8c21-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [edfb8c21-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [edfb8c21-149-console] **inconsistency** (low): Console statement found (log) (line 149)
- [edfb8c21-157-console] **inconsistency** (low): Console statement found (log) (line 157)
- [edfb8c21-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [edfb8c21-169-console] **inconsistency** (low): Console statement found (log) (line 169)
- [edfb8c21-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [edfb8c21-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [edfb8c21-174-console] **inconsistency** (low): Console statement found (error) (line 174)
- [edfb8c21-192-console] **inconsistency** (low): Console statement found (log) (line 192)
- [edfb8c21-198-console] **inconsistency** (low): Console statement found (log) (line 198)

### phase-orchestrator.ts
- [eb11a0b8-5349-complexity-length] **complexity** (critical): Function 'anonymous' is too long (1967 lines, max: 50)
- [eb11a0b8-5349-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 10, max: 4)
- [eb11a0b8-111-any] **any** (medium): Unnecessary use of "any" type (line 111)
- [eb11a0b8-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [eb11a0b8-159-console] **inconsistency** (low): Console statement found (log) (line 159)
- [eb11a0b8-160-console] **inconsistency** (low): Console statement found (log) (line 160)
- [eb11a0b8-168-console] **inconsistency** (low): Console statement found (log) (line 168)
- [eb11a0b8-192-console] **inconsistency** (low): Console statement found (error) (line 192)
- [eb11a0b8-193-console] **inconsistency** (low): Console statement found (error) (line 193)
- [eb11a0b8-220-console] **inconsistency** (low): Console statement found (log) (line 220)
- [eb11a0b8-243-console] **inconsistency** (low): Console statement found (error) (line 243)
- [eb11a0b8-271-console] **inconsistency** (low): Console statement found (log) (line 271)
- [eb11a0b8-295-console] **inconsistency** (low): Console statement found (error) (line 295)
- [eb11a0b8-296-console] **inconsistency** (low): Console statement found (error) (line 296)
- [eb11a0b8-317-console] **inconsistency** (low): Console statement found (log) (line 317)
- [eb11a0b8-318-console] **inconsistency** (low): Console statement found (log) (line 318)
- [eb11a0b8-319-console] **inconsistency** (low): Console statement found (log) (line 319)
- [eb11a0b8-320-console] **inconsistency** (low): Console statement found (log) (line 320)
- [eb11a0b8-321-console] **inconsistency** (low): Console statement found (log) (line 321)
- [eb11a0b8-348-console] **inconsistency** (low): Console statement found (error) (line 348)
- [eb11a0b8-349-console] **inconsistency** (low): Console statement found (error) (line 349)
- [eb11a0b8-372-console] **inconsistency** (low): Console statement found (log) (line 372)
- [eb11a0b8-390-console] **inconsistency** (low): Console statement found (error) (line 390)
- [eb11a0b8-391-console] **inconsistency** (low): Console statement found (error) (line 391)
- [eb11a0b8-412-console] **inconsistency** (low): Console statement found (log) (line 412)
- [eb11a0b8-413-console] **inconsistency** (low): Console statement found (log) (line 413)
- [eb11a0b8-414-console] **inconsistency** (low): Console statement found (log) (line 414)
- [eb11a0b8-415-console] **inconsistency** (low): Console statement found (log) (line 415)
- [eb11a0b8-416-console] **inconsistency** (low): Console statement found (log) (line 416)
- [eb11a0b8-451-console] **inconsistency** (low): Console statement found (error) (line 451)
- [eb11a0b8-452-console] **inconsistency** (low): Console statement found (error) (line 452)
- [eb11a0b8-475-console] **inconsistency** (low): Console statement found (log) (line 475)
- [eb11a0b8-493-console] **inconsistency** (low): Console statement found (error) (line 493)
- [eb11a0b8-494-console] **inconsistency** (low): Console statement found (error) (line 494)
- [eb11a0b8-515-console] **inconsistency** (low): Console statement found (log) (line 515)
- [eb11a0b8-516-console] **inconsistency** (low): Console statement found (log) (line 516)
- [eb11a0b8-517-console] **inconsistency** (low): Console statement found (log) (line 517)
- [eb11a0b8-518-console] **inconsistency** (low): Console statement found (log) (line 518)
- [eb11a0b8-535-console] **inconsistency** (low): Console statement found (error) (line 535)
- [eb11a0b8-536-console] **inconsistency** (low): Console statement found (error) (line 536)
- [eb11a0b8-537-console] **inconsistency** (low): Console statement found (error) (line 537)
- [eb11a0b8-553-console] **inconsistency** (low): Console statement found (error) (line 553)
- [eb11a0b8-554-console] **inconsistency** (low): Console statement found (error) (line 554)
- [eb11a0b8-577-console] **inconsistency** (low): Console statement found (log) (line 577)
- [eb11a0b8-596-console] **inconsistency** (low): Console statement found (error) (line 596)
- [eb11a0b8-597-console] **inconsistency** (low): Console statement found (error) (line 597)
- [eb11a0b8-618-console] **inconsistency** (low): Console statement found (log) (line 618)
- [eb11a0b8-619-console] **inconsistency** (low): Console statement found (log) (line 619)
- [eb11a0b8-620-console] **inconsistency** (low): Console statement found (log) (line 620)
- [eb11a0b8-621-console] **inconsistency** (low): Console statement found (log) (line 621)
- [eb11a0b8-622-console] **inconsistency** (low): Console statement found (log) (line 622)
- [eb11a0b8-650-console] **inconsistency** (low): Console statement found (error) (line 650)
- [eb11a0b8-651-console] **inconsistency** (low): Console statement found (error) (line 651)
- [eb11a0b8-674-console] **inconsistency** (low): Console statement found (log) (line 674)
- [eb11a0b8-693-console] **inconsistency** (low): Console statement found (error) (line 693)
- [eb11a0b8-694-console] **inconsistency** (low): Console statement found (error) (line 694)
- [eb11a0b8-715-console] **inconsistency** (low): Console statement found (log) (line 715)
- [eb11a0b8-716-console] **inconsistency** (low): Console statement found (log) (line 716)
- [eb11a0b8-717-console] **inconsistency** (low): Console statement found (log) (line 717)
- [eb11a0b8-718-console] **inconsistency** (low): Console statement found (log) (line 718)
- [eb11a0b8-719-console] **inconsistency** (low): Console statement found (log) (line 719)
- [eb11a0b8-746-console] **inconsistency** (low): Console statement found (error) (line 746)
- [eb11a0b8-747-console] **inconsistency** (low): Console statement found (error) (line 747)
- [eb11a0b8-770-console] **inconsistency** (low): Console statement found (log) (line 770)
- [eb11a0b8-788-console] **inconsistency** (low): Console statement found (error) (line 788)
- [eb11a0b8-789-console] **inconsistency** (low): Console statement found (error) (line 789)
- [eb11a0b8-810-console] **inconsistency** (low): Console statement found (log) (line 810)
- [eb11a0b8-811-console] **inconsistency** (low): Console statement found (log) (line 811)
- [eb11a0b8-812-console] **inconsistency** (low): Console statement found (log) (line 812)
- [eb11a0b8-813-console] **inconsistency** (low): Console statement found (log) (line 813)
- [eb11a0b8-814-console] **inconsistency** (low): Console statement found (log) (line 814)
- [eb11a0b8-841-console] **inconsistency** (low): Console statement found (error) (line 841)
- [eb11a0b8-842-console] **inconsistency** (low): Console statement found (error) (line 842)
- [eb11a0b8-865-console] **inconsistency** (low): Console statement found (log) (line 865)
- [eb11a0b8-883-console] **inconsistency** (low): Console statement found (error) (line 883)
- [eb11a0b8-884-console] **inconsistency** (low): Console statement found (error) (line 884)
- [eb11a0b8-905-console] **inconsistency** (low): Console statement found (log) (line 905)
- [eb11a0b8-906-console] **inconsistency** (low): Console statement found (log) (line 906)
- [eb11a0b8-907-console] **inconsistency** (low): Console statement found (log) (line 907)
- [eb11a0b8-908-console] **inconsistency** (low): Console statement found (log) (line 908)
- [eb11a0b8-909-console] **inconsistency** (low): Console statement found (log) (line 909)
- [eb11a0b8-936-console] **inconsistency** (low): Console statement found (error) (line 936)
- [eb11a0b8-937-console] **inconsistency** (low): Console statement found (error) (line 937)
- [eb11a0b8-960-console] **inconsistency** (low): Console statement found (log) (line 960)
- [eb11a0b8-978-console] **inconsistency** (low): Console statement found (error) (line 978)
- [eb11a0b8-979-console] **inconsistency** (low): Console statement found (error) (line 979)
- [eb11a0b8-1000-console] **inconsistency** (low): Console statement found (log) (line 1000)
- [eb11a0b8-1001-console] **inconsistency** (low): Console statement found (log) (line 1001)
- [eb11a0b8-1002-console] **inconsistency** (low): Console statement found (log) (line 1002)
- [eb11a0b8-1003-console] **inconsistency** (low): Console statement found (log) (line 1003)
- [eb11a0b8-1030-console] **inconsistency** (low): Console statement found (error) (line 1030)
- [eb11a0b8-1031-console] **inconsistency** (low): Console statement found (error) (line 1031)
- [eb11a0b8-1054-console] **inconsistency** (low): Console statement found (log) (line 1054)
- [eb11a0b8-1072-console] **inconsistency** (low): Console statement found (error) (line 1072)
- [eb11a0b8-1073-console] **inconsistency** (low): Console statement found (error) (line 1073)
- [eb11a0b8-1094-console] **inconsistency** (low): Console statement found (log) (line 1094)
- [eb11a0b8-1095-console] **inconsistency** (low): Console statement found (log) (line 1095)
- [eb11a0b8-1096-console] **inconsistency** (low): Console statement found (log) (line 1096)
- [eb11a0b8-1097-console] **inconsistency** (low): Console statement found (log) (line 1097)
- [eb11a0b8-1124-console] **inconsistency** (low): Console statement found (error) (line 1124)
- [eb11a0b8-1125-console] **inconsistency** (low): Console statement found (error) (line 1125)
- [eb11a0b8-1148-console] **inconsistency** (low): Console statement found (log) (line 1148)
- [eb11a0b8-1166-console] **inconsistency** (low): Console statement found (error) (line 1166)
- [eb11a0b8-1167-console] **inconsistency** (low): Console statement found (error) (line 1167)
- [eb11a0b8-1188-console] **inconsistency** (low): Console statement found (log) (line 1188)
- [eb11a0b8-1189-console] **inconsistency** (low): Console statement found (log) (line 1189)
- [eb11a0b8-1190-console] **inconsistency** (low): Console statement found (log) (line 1190)
- [eb11a0b8-1191-console] **inconsistency** (low): Console statement found (log) (line 1191)
- [eb11a0b8-1218-console] **inconsistency** (low): Console statement found (error) (line 1218)
- [eb11a0b8-1219-console] **inconsistency** (low): Console statement found (error) (line 1219)
- [eb11a0b8-1242-console] **inconsistency** (low): Console statement found (log) (line 1242)
- [eb11a0b8-1264-console] **inconsistency** (low): Console statement found (error) (line 1264)
- [eb11a0b8-1265-console] **inconsistency** (low): Console statement found (error) (line 1265)
- [eb11a0b8-1286-console] **inconsistency** (low): Console statement found (log) (line 1286)
- [eb11a0b8-1287-console] **inconsistency** (low): Console statement found (log) (line 1287)
- [eb11a0b8-1288-console] **inconsistency** (low): Console statement found (log) (line 1288)
- [eb11a0b8-1289-console] **inconsistency** (low): Console statement found (log) (line 1289)
- [eb11a0b8-1314-console] **inconsistency** (low): Console statement found (error) (line 1314)
- [eb11a0b8-1315-console] **inconsistency** (low): Console statement found (error) (line 1315)
- [eb11a0b8-1338-console] **inconsistency** (low): Console statement found (log) (line 1338)
- [eb11a0b8-1362-console] **inconsistency** (low): Console statement found (error) (line 1362)
- [eb11a0b8-1363-console] **inconsistency** (low): Console statement found (log) (line 1363)
- [eb11a0b8-1384-console] **inconsistency** (low): Console statement found (log) (line 1384)
- [eb11a0b8-1385-console] **inconsistency** (low): Console statement found (log) (line 1385)
- [eb11a0b8-1386-console] **inconsistency** (low): Console statement found (log) (line 1386)
- [eb11a0b8-1387-console] **inconsistency** (low): Console statement found (log) (line 1387)
- [eb11a0b8-1414-console] **inconsistency** (low): Console statement found (error) (line 1414)
- [eb11a0b8-1415-console] **inconsistency** (low): Console statement found (error) (line 1415)
- [eb11a0b8-1438-console] **inconsistency** (low): Console statement found (log) (line 1438)
- [eb11a0b8-1462-console] **inconsistency** (low): Console statement found (error) (line 1462)
- [eb11a0b8-1463-console] **inconsistency** (low): Console statement found (log) (line 1463)
- [eb11a0b8-1484-console] **inconsistency** (low): Console statement found (log) (line 1484)
- [eb11a0b8-1485-console] **inconsistency** (low): Console statement found (log) (line 1485)
- [eb11a0b8-1486-console] **inconsistency** (low): Console statement found (log) (line 1486)
- [eb11a0b8-1487-console] **inconsistency** (low): Console statement found (log) (line 1487)
- [eb11a0b8-1488-console] **inconsistency** (low): Console statement found (log) (line 1488)
- [eb11a0b8-1515-console] **inconsistency** (low): Console statement found (error) (line 1515)
- [eb11a0b8-1516-console] **inconsistency** (low): Console statement found (error) (line 1516)
- [eb11a0b8-1539-console] **inconsistency** (low): Console statement found (log) (line 1539)
- [eb11a0b8-1558-console] **inconsistency** (low): Console statement found (error) (line 1558)
- [eb11a0b8-1559-console] **inconsistency** (low): Console statement found (log) (line 1559)
- [eb11a0b8-1580-console] **inconsistency** (low): Console statement found (log) (line 1580)
- [eb11a0b8-1581-console] **inconsistency** (low): Console statement found (log) (line 1581)
- [eb11a0b8-1582-console] **inconsistency** (low): Console statement found (log) (line 1582)
- [eb11a0b8-1583-console] **inconsistency** (low): Console statement found (log) (line 1583)
- [eb11a0b8-1584-console] **inconsistency** (low): Console statement found (log) (line 1584)
- [eb11a0b8-1611-console] **inconsistency** (low): Console statement found (error) (line 1611)
- [eb11a0b8-1612-console] **inconsistency** (low): Console statement found (error) (line 1612)
- [eb11a0b8-1635-console] **inconsistency** (low): Console statement found (log) (line 1635)
- [eb11a0b8-1654-console] **inconsistency** (low): Console statement found (error) (line 1654)
- [eb11a0b8-1655-console] **inconsistency** (low): Console statement found (log) (line 1655)
- [eb11a0b8-1676-console] **inconsistency** (low): Console statement found (log) (line 1676)
- [eb11a0b8-1677-console] **inconsistency** (low): Console statement found (log) (line 1677)
- [eb11a0b8-1678-console] **inconsistency** (low): Console statement found (log) (line 1678)
- [eb11a0b8-1679-console] **inconsistency** (low): Console statement found (log) (line 1679)
- [eb11a0b8-1680-console] **inconsistency** (low): Console statement found (log) (line 1680)
- [eb11a0b8-1707-console] **inconsistency** (low): Console statement found (error) (line 1707)
- [eb11a0b8-1708-console] **inconsistency** (low): Console statement found (error) (line 1708)
- [eb11a0b8-1731-console] **inconsistency** (low): Console statement found (log) (line 1731)
- [eb11a0b8-1750-console] **inconsistency** (low): Console statement found (error) (line 1750)
- [eb11a0b8-1751-console] **inconsistency** (low): Console statement found (log) (line 1751)
- [eb11a0b8-1772-console] **inconsistency** (low): Console statement found (log) (line 1772)
- [eb11a0b8-1773-console] **inconsistency** (low): Console statement found (log) (line 1773)
- [eb11a0b8-1774-console] **inconsistency** (low): Console statement found (log) (line 1774)
- [eb11a0b8-1775-console] **inconsistency** (low): Console statement found (log) (line 1775)
- [eb11a0b8-1776-console] **inconsistency** (low): Console statement found (log) (line 1776)
- [eb11a0b8-1803-console] **inconsistency** (low): Console statement found (error) (line 1803)
- [eb11a0b8-1804-console] **inconsistency** (low): Console statement found (log) (line 1804)
- [eb11a0b8-1827-console] **inconsistency** (low): Console statement found (log) (line 1827)
- [eb11a0b8-1846-console] **inconsistency** (low): Console statement found (error) (line 1846)
- [eb11a0b8-1847-console] **inconsistency** (low): Console statement found (log) (line 1847)
- [eb11a0b8-1868-console] **inconsistency** (low): Console statement found (log) (line 1868)
- [eb11a0b8-1869-console] **inconsistency** (low): Console statement found (log) (line 1869)
- [eb11a0b8-1870-console] **inconsistency** (low): Console statement found (log) (line 1870)
- [eb11a0b8-1871-console] **inconsistency** (low): Console statement found (log) (line 1871)
- [eb11a0b8-1872-console] **inconsistency** (low): Console statement found (log) (line 1872)
- [eb11a0b8-1899-console] **inconsistency** (low): Console statement found (error) (line 1899)
- [eb11a0b8-1900-console] **inconsistency** (low): Console statement found (log) (line 1900)
- [eb11a0b8-1927-console] **inconsistency** (low): Console statement found (log) (line 1927)
- [eb11a0b8-1928-console] **inconsistency** (low): Console statement found (log) (line 1928)
- [eb11a0b8-1929-console] **inconsistency** (low): Console statement found (log) (line 1929)
- [eb11a0b8-1988-console] **inconsistency** (low): Console statement found (log) (line 1988)
- [eb11a0b8-1992-console] **inconsistency** (low): Console statement found (log) (line 1992)
- [eb11a0b8-1996-console] **inconsistency** (low): Console statement found (warn) (line 1996)
- [eb11a0b8-2042-console] **inconsistency** (low): Console statement found (log) (line 2042)
- [eb11a0b8-2045-console] **inconsistency** (low): Console statement found (warn) (line 2045)
- [eb11a0b8-2055-console] **inconsistency** (low): Console statement found (log) (line 2055)
- [eb11a0b8-2061-console] **inconsistency** (low): Console statement found (log) (line 2061)
- [eb11a0b8-2081-console] **inconsistency** (low): Console statement found (log) (line 2081)
- [eb11a0b8-2082-console] **inconsistency** (low): Console statement found (log) (line 2082)
- [eb11a0b8-2088-console] **inconsistency** (low): Console statement found (log) (line 2088)
- [eb11a0b8-2106-console] **inconsistency** (low): Console statement found (log) (line 2106)
- [eb11a0b8-2110-console] **inconsistency** (low): Console statement found (log) (line 2110)

### batch-processor.ts
- [14823333-3029-complexity-length] **complexity** (critical): Function 'anonymous' is too long (278 lines, max: 50)
- [14823333-3029-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [14823333-7978-complexity-length] **complexity** (high): Function 'to' is too long (63 lines, max: 50)
- [14823333-7978-complexity-nesting] **complexity** (high): Function 'to' has excessive nesting (depth: 6, max: 4)
- [14823333-54-any] **any** (medium): Unnecessary use of "any" type (line 54)
- [14823333-137-console] **inconsistency** (low): Console statement found (log) (line 137)
- [14823333-189-console] **inconsistency** (low): Console statement found (log) (line 189)
- [14823333-195-console] **inconsistency** (low): Console statement found (log) (line 195)
- [14823333-203-console] **inconsistency** (low): Console statement found (log) (line 203)
- [14823333-224-console] **inconsistency** (low): Console statement found (log) (line 224)
- [14823333-261-console] **inconsistency** (low): Console statement found (log) (line 261)
- [14823333-297-console] **inconsistency** (low): Console statement found (error) (line 297)
- [14823333-328-console] **inconsistency** (low): Console statement found (warn) (line 328)
- [14823333-351-console] **inconsistency** (low): Console statement found (log) (line 351)
- [14823333-355-console] **inconsistency** (low): Console statement found (log) (line 355)
- [14823333-375-console] **inconsistency** (low): Console statement found (log) (line 375)

### phase-refactor.ts
- [355d90a8-1771-complexity-length] **complexity** (critical): Function 'anonymous' is too long (422 lines, max: 50)
- [355d90a8-1771-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 13, max: 4)
- [355d90a8-12946-complexity-nesting] **complexity** (critical): Function 'or' has excessive nesting (depth: 10, max: 4)
- [355d90a8-13580-complexity-nesting] **complexity** (critical): Function 'definitions' has excessive nesting (depth: 9, max: 4)
- [355d90a8-15626-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [355d90a8-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [355d90a8-75-console] **inconsistency** (low): Console statement found (log) (line 75)
- [355d90a8-77-console] **inconsistency** (low): Console statement found (log) (line 77)
- [355d90a8-78-console] **inconsistency** (low): Console statement found (log) (line 78)
- [355d90a8-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [355d90a8-85-console] **inconsistency** (low): Console statement found (log) (line 85)
- [355d90a8-90-console] **inconsistency** (low): Console statement found (log) (line 90)
- [355d90a8-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [355d90a8-98-console] **inconsistency** (low): Console statement found (log) (line 98)
- [355d90a8-102-console] **inconsistency** (low): Console statement found (log) (line 102)
- [355d90a8-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [355d90a8-109-console] **inconsistency** (low): Console statement found (log) (line 109)
- [355d90a8-112-console] **inconsistency** (low): Console statement found (log) (line 112)
- [355d90a8-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [355d90a8-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [355d90a8-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [355d90a8-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [355d90a8-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [355d90a8-156-console] **inconsistency** (low): Console statement found (error) (line 156)
- [355d90a8-212-console] **inconsistency** (low): Console statement found (warn) (line 212)
- [355d90a8-266-console] **inconsistency** (low): Console statement found (warn) (line 266)
- [355d90a8-316-console] **inconsistency** (low): Console statement found (warn) (line 316)
- [355d90a8-354-console] **inconsistency** (low): Console statement found (warn) (line 354)
- [355d90a8-428-console] **inconsistency** (low): Console statement found (warn) (line 428)
- [355d90a8-463-console] **inconsistency** (low): Console statement found (warn) (line 463)

### phase-compare-reports.ts
- [9d969561-1842-complexity-length] **complexity** (critical): Function 'anonymous' is too long (368 lines, max: 50)
- [9d969561-1842-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 11, max: 4)
- [9d969561-205-any] **any** (medium): Unnecessary use of "any" type (line 205)
- [9d969561-219-any] **any** (medium): Unnecessary use of "any" type (line 219)
- [9d969561-226-any] **any** (medium): Unnecessary use of "any" type (line 226)
- [9d969561-227-any] **any** (medium): Unnecessary use of "any" type (line 227)
- [9d969561-273-any] **any** (medium): Unnecessary use of "any" type (line 273)
- [9d969561-273-any] **any** (medium): Unnecessary use of "any" type (line 273)
- [9d969561-315-any] **any** (medium): Unnecessary use of "any" type (line 315)
- [9d969561-315-any] **any** (medium): Unnecessary use of "any" type (line 315)
- [9d969561-351-any] **any** (medium): Unnecessary use of "any" type (line 351)
- [9d969561-351-any] **any** (medium): Unnecessary use of "any" type (line 351)
- [9d969561-387-any] **any** (medium): Unnecessary use of "any" type (line 387)
- [9d969561-387-any] **any** (medium): Unnecessary use of "any" type (line 387)
- [9d969561-76-console] **inconsistency** (low): Console statement found (log) (line 76)
- [9d969561-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [9d969561-81-console] **inconsistency** (low): Console statement found (log) (line 81)
- [9d969561-82-console] **inconsistency** (low): Console statement found (log) (line 82)
- [9d969561-83-console] **inconsistency** (low): Console statement found (log) (line 83)
- [9d969561-89-console] **inconsistency** (low): Console statement found (log) (line 89)
- [9d969561-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [9d969561-98-console] **inconsistency** (low): Console statement found (log) (line 98)
- [9d969561-103-console] **inconsistency** (low): Console statement found (log) (line 103)
- [9d969561-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [9d969561-115-console] **inconsistency** (low): Console statement found (log) (line 115)
- [9d969561-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [9d969561-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [9d969561-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [9d969561-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [9d969561-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [9d969561-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [9d969561-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [9d969561-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [9d969561-149-console] **inconsistency** (low): Console statement found (log) (line 149)
- [9d969561-150-console] **inconsistency** (low): Console statement found (log) (line 150)
- [9d969561-151-console] **inconsistency** (low): Console statement found (log) (line 151)
- [9d969561-176-console] **inconsistency** (low): Console statement found (error) (line 176)
- [9d969561-200-console] **inconsistency** (low): Console statement found (warn) (line 200)
- [9d969561-214-console] **inconsistency** (low): Console statement found (warn) (line 214)

### phase-cleanup.ts
- [8bc4cd58-1706-complexity-length] **complexity** (critical): Function 'anonymous' is too long (476 lines, max: 50)
- [8bc4cd58-1706-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 13, max: 4)
- [8bc4cd58-5822-complexity-nesting] **complexity** (high): Function 'definitions' has excessive nesting (depth: 5, max: 4)
- [8bc4cd58-6489-complexity-nesting] **complexity** (high): Function 'is' has excessive nesting (depth: 5, max: 4)
- [8bc4cd58-9485-complexity-nesting] **complexity** (critical): Function 'scanDirectory' has excessive nesting (depth: 9, max: 4)
- [8bc4cd58-16646-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [8bc4cd58-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [8bc4cd58-75-console] **inconsistency** (low): Console statement found (log) (line 75)
- [8bc4cd58-77-console] **inconsistency** (low): Console statement found (log) (line 77)
- [8bc4cd58-78-console] **inconsistency** (low): Console statement found (log) (line 78)
- [8bc4cd58-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [8bc4cd58-85-console] **inconsistency** (low): Console statement found (log) (line 85)
- [8bc4cd58-90-console] **inconsistency** (low): Console statement found (log) (line 90)
- [8bc4cd58-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [8bc4cd58-98-console] **inconsistency** (low): Console statement found (log) (line 98)
- [8bc4cd58-102-console] **inconsistency** (low): Console statement found (log) (line 102)
- [8bc4cd58-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [8bc4cd58-110-console] **inconsistency** (low): Console statement found (log) (line 110)
- [8bc4cd58-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [8bc4cd58-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [8bc4cd58-117-console] **inconsistency** (low): Console statement found (log) (line 117)
- [8bc4cd58-118-console] **inconsistency** (low): Console statement found (log) (line 118)
- [8bc4cd58-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [8bc4cd58-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [8bc4cd58-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [8bc4cd58-160-console] **inconsistency** (low): Console statement found (error) (line 160)
- [8bc4cd58-214-console] **inconsistency** (low): Console statement found (warn) (line 214)
- [8bc4cd58-275-console] **inconsistency** (low): Console statement found (warn) (line 275)
- [8bc4cd58-325-console] **inconsistency** (low): Console statement found (warn) (line 325)
- [8bc4cd58-359-console] **inconsistency** (low): Console statement found (warn) (line 359)
- [8bc4cd58-449-console] **inconsistency** (low): Console statement found (warn) (line 449)
- [8bc4cd58-492-console] **inconsistency** (low): Console statement found (warn) (line 492)
- [8bc4cd58-517-console] **inconsistency** (low): Console statement found (warn) (line 517)

### phase-api-contracts.ts
- [88c08022-14935-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [88c08022-73-console] **inconsistency** (low): Console statement found (log) (line 73)
- [88c08022-76-console] **inconsistency** (low): Console statement found (log) (line 76)
- [88c08022-78-console] **inconsistency** (low): Console statement found (log) (line 78)
- [88c08022-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [88c08022-80-console] **inconsistency** (low): Console statement found (log) (line 80)
- [88c08022-86-console] **inconsistency** (low): Console statement found (log) (line 86)
- [88c08022-91-console] **inconsistency** (low): Console statement found (log) (line 91)
- [88c08022-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [88c08022-99-console] **inconsistency** (low): Console statement found (log) (line 99)
- [88c08022-103-console] **inconsistency** (low): Console statement found (log) (line 103)
- [88c08022-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [88c08022-109-console] **inconsistency** (low): Console statement found (log) (line 109)
- [88c08022-110-console] **inconsistency** (low): Console statement found (log) (line 110)
- [88c08022-111-console] **inconsistency** (low): Console statement found (log) (line 111)
- [88c08022-127-console] **inconsistency** (low): Console statement found (log) (line 127)
- [88c08022-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [88c08022-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [88c08022-154-console] **inconsistency** (low): Console statement found (error) (line 154)
- [88c08022-208-console] **inconsistency** (low): Console statement found (warn) (line 208)
- [88c08022-292-console] **inconsistency** (low): Console statement found (warn) (line 292)
- [88c08022-341-console] **inconsistency** (low): Console statement found (warn) (line 341)
- [88c08022-397-console] **inconsistency** (low): Console statement found (warn) (line 397)
- [88c08022-435-console] **inconsistency** (low): Console statement found (warn) (line 435)

### phase-9-i18n-a11y.ts
- [e089226c-109-console] **inconsistency** (low): Console statement found (log) (line 109)
- [e089226c-118-console] **inconsistency** (low): Console statement found (log) (line 118)
- [e089226c-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [e089226c-125-console] **inconsistency** (low): Console statement found (log) (line 125)
- [e089226c-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [e089226c-197-console] **inconsistency** (low): Console statement found (log) (line 197)
- [e089226c-198-console] **inconsistency** (low): Console statement found (log) (line 198)
- [e089226c-199-console] **inconsistency** (low): Console statement found (log) (line 199)
- [e089226c-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [e089226c-205-console] **inconsistency** (low): Console statement found (error) (line 205)
- [e089226c-311-console] **inconsistency** (low): Console statement found (warn) (line 311)
- [e089226c-341-console] **inconsistency** (low): Console statement found (log) (line 341)
- [e089226c-351-console] **inconsistency** (low): Console statement found (log) (line 351)
- [e089226c-660-console] **inconsistency** (low): Console statement found (log) (line 660)
- [e089226c-662-console] **inconsistency** (low): Console statement found (warn) (line 662)

### phase-9-dead-code-dependencies.ts
- [36e0326b-3268-complexity-length] **complexity** (critical): Function 'anonymous' is too long (249 lines, max: 50)
- [36e0326b-3268-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [36e0326b-6860-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [36e0326b-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [36e0326b-107-console] **inconsistency** (low): Console statement found (log) (line 107)
- [36e0326b-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [36e0326b-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [36e0326b-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [36e0326b-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [36e0326b-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [36e0326b-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [36e0326b-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [36e0326b-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [36e0326b-150-console] **inconsistency** (low): Console statement found (log) (line 150)
- [36e0326b-154-console] **inconsistency** (low): Console statement found (log) (line 154)
- [36e0326b-155-console] **inconsistency** (low): Console statement found (log) (line 155)
- [36e0326b-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [36e0326b-173-console] **inconsistency** (low): Console statement found (log) (line 173)
- [36e0326b-174-console] **inconsistency** (low): Console statement found (log) (line 174)
- [36e0326b-198-console] **inconsistency** (low): Console statement found (error) (line 198)
- [36e0326b-254-console] **inconsistency** (low): Console statement found (warn) (line 254)
- [36e0326b-262-console] **inconsistency** (low): Console statement found (warn) (line 262)
- [36e0326b-274-console] **inconsistency** (low): Console statement found (warn) (line 274)

### phase-8-performance.ts
- [28a6fb01-2755-complexity-length] **complexity** (critical): Function 'anonymous' is too long (562 lines, max: 50)
- [28a6fb01-2755-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 27, max: 4)
- [28a6fb01-12162-complexity-length] **complexity** (critical): Function 'immediately' is too long (103 lines, max: 50)
- [28a6fb01-12162-complexity-nesting] **complexity** (critical): Function 'immediately' has excessive nesting (depth: 16, max: 4)
- [28a6fb01-12279-complexity-length] **complexity** (critical): Function 'to' is too long (103 lines, max: 50)
- [28a6fb01-12279-complexity-nesting] **complexity** (critical): Function 'to' has excessive nesting (depth: 16, max: 4)
- [28a6fb01-269-any] **any** (medium): Unnecessary use of "any" type (line 269)
- [28a6fb01-504-any] **any** (medium): Unnecessary use of "any" type (line 504)
- [28a6fb01-109-console] **inconsistency** (low): Console statement found (log) (line 109)
- [28a6fb01-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [28a6fb01-127-console] **inconsistency** (low): Console statement found (log) (line 127)
- [28a6fb01-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [28a6fb01-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [28a6fb01-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [28a6fb01-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [28a6fb01-178-console] **inconsistency** (low): Console statement found (log) (line 178)
- [28a6fb01-179-console] **inconsistency** (low): Console statement found (log) (line 179)
- [28a6fb01-180-console] **inconsistency** (low): Console statement found (log) (line 180)
- [28a6fb01-181-console] **inconsistency** (low): Console statement found (log) (line 181)
- [28a6fb01-186-console] **inconsistency** (low): Console statement found (error) (line 186)
- [28a6fb01-290-console] **inconsistency** (low): Console statement found (warn) (line 290)
- [28a6fb01-651-console] **inconsistency** (low): Console statement found (log) (line 651)
- [28a6fb01-653-console] **inconsistency** (low): Console statement found (warn) (line 653)

### phase-8-performance-seo.ts
- [6dcc1da0-3212-complexity-length] **complexity** (critical): Function 'anonymous' is too long (394 lines, max: 50)
- [6dcc1da0-3212-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [6dcc1da0-6753-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [6dcc1da0-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [6dcc1da0-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [6dcc1da0-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [6dcc1da0-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [6dcc1da0-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [6dcc1da0-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [6dcc1da0-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [6dcc1da0-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [6dcc1da0-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [6dcc1da0-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [6dcc1da0-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [6dcc1da0-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [6dcc1da0-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [6dcc1da0-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [6dcc1da0-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [6dcc1da0-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [6dcc1da0-195-console] **inconsistency** (low): Console statement found (error) (line 195)
- [6dcc1da0-251-console] **inconsistency** (low): Console statement found (warn) (line 251)
- [6dcc1da0-259-console] **inconsistency** (low): Console statement found (warn) (line 259)
- [6dcc1da0-271-console] **inconsistency** (low): Console statement found (warn) (line 271)

### phase-7-ux-accessibility.ts
- [6f2c1bc9-3236-complexity-length] **complexity** (critical): Function 'anonymous' is too long (269 lines, max: 50)
- [6f2c1bc9-3236-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [6f2c1bc9-6769-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [6f2c1bc9-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [6f2c1bc9-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [6f2c1bc9-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [6f2c1bc9-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [6f2c1bc9-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [6f2c1bc9-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [6f2c1bc9-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [6f2c1bc9-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [6f2c1bc9-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [6f2c1bc9-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [6f2c1bc9-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [6f2c1bc9-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [6f2c1bc9-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [6f2c1bc9-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [6f2c1bc9-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [6f2c1bc9-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [6f2c1bc9-195-console] **inconsistency** (low): Console statement found (error) (line 195)
- [6f2c1bc9-251-console] **inconsistency** (low): Console statement found (warn) (line 251)
- [6f2c1bc9-259-console] **inconsistency** (low): Console statement found (warn) (line 259)
- [6f2c1bc9-271-console] **inconsistency** (low): Console statement found (warn) (line 271)

### phase-7-testing-strategy.ts
- [44b4e04a-2961-complexity-length] **complexity** (critical): Function 'anonymous' is too long (607 lines, max: 50)
- [44b4e04a-2961-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 25, max: 4)
- [44b4e04a-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [44b4e04a-122-console] **inconsistency** (low): Console statement found (log) (line 122)
- [44b4e04a-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [44b4e04a-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [44b4e04a-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [44b4e04a-173-console] **inconsistency** (low): Console statement found (log) (line 173)
- [44b4e04a-174-console] **inconsistency** (low): Console statement found (log) (line 174)
- [44b4e04a-175-console] **inconsistency** (low): Console statement found (log) (line 175)
- [44b4e04a-176-console] **inconsistency** (low): Console statement found (log) (line 176)
- [44b4e04a-181-console] **inconsistency** (low): Console statement found (error) (line 181)
- [44b4e04a-496-console] **inconsistency** (low): Console statement found (warn) (line 496)
- [44b4e04a-700-console] **inconsistency** (low): Console statement found (log) (line 700)
- [44b4e04a-702-console] **inconsistency** (low): Console statement found (warn) (line 702)

### phase-6-ui-components.ts
- [f94356bf-6812-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [f94356bf-15226-complexity-nesting] **complexity** (high): Function 'in' has excessive nesting (depth: 5, max: 4)
- [f94356bf-15326-complexity-nesting] **complexity** (high): Function 'outside' has excessive nesting (depth: 5, max: 4)
- [f94356bf-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [f94356bf-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [f94356bf-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [f94356bf-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [f94356bf-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [f94356bf-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [f94356bf-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [f94356bf-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [f94356bf-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [f94356bf-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [f94356bf-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [f94356bf-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [f94356bf-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [f94356bf-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [f94356bf-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [f94356bf-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [f94356bf-195-console] **inconsistency** (low): Console statement found (error) (line 195)
- [f94356bf-262-console] **inconsistency** (low): Console statement found (warn) (line 262)
- [f94356bf-270-console] **inconsistency** (low): Console statement found (warn) (line 270)
- [f94356bf-282-console] **inconsistency** (low): Console statement found (warn) (line 282)

### phase-6-api-contracts.ts
- [27057d44-2813-complexity-length] **complexity** (critical): Function 'anonymous' is too long (591 lines, max: 50)
- [27057d44-2813-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [27057d44-127-any] **any** (medium): Unnecessary use of "any" type (line 127)
- [27057d44-128-any] **any** (medium): Unnecessary use of "any" type (line 128)
- [27057d44-134-any] **any** (medium): Unnecessary use of "any" type (line 134)
- [27057d44-135-any] **any** (medium): Unnecessary use of "any" type (line 135)
- [27057d44-579-any] **any** (medium): Unnecessary use of "any" type (line 579)
- [27057d44-111-console] **inconsistency** (low): Console statement found (log) (line 111)
- [27057d44-120-console] **inconsistency** (low): Console statement found (log) (line 120)
- [27057d44-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [27057d44-138-console] **inconsistency** (low): Console statement found (log) (line 138)
- [27057d44-139-console] **inconsistency** (low): Console statement found (log) (line 139)
- [27057d44-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [27057d44-163-console] **inconsistency** (low): Console statement found (log) (line 163)
- [27057d44-188-console] **inconsistency** (low): Console statement found (log) (line 188)
- [27057d44-189-console] **inconsistency** (low): Console statement found (log) (line 189)
- [27057d44-190-console] **inconsistency** (low): Console statement found (log) (line 190)
- [27057d44-191-console] **inconsistency** (low): Console statement found (log) (line 191)
- [27057d44-196-console] **inconsistency** (low): Console statement found (error) (line 196)
- [27057d44-306-console] **inconsistency** (low): Console statement found (log) (line 306)
- [27057d44-328-console] **inconsistency** (low): Console statement found (warn) (line 328)
- [27057d44-682-console] **inconsistency** (low): Console statement found (log) (line 682)
- [27057d44-684-console] **inconsistency** (low): Console statement found (warn) (line 684)

### phase-5-clean-code.ts
- [cc7890e7-2784-complexity-length] **complexity** (critical): Function 'anonymous' is too long (321 lines, max: 50)
- [cc7890e7-2784-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [cc7890e7-14679-complexity-length] **complexity** (high): Function 'has' is too long (77 lines, max: 50)
- [cc7890e7-20441-complexity-nesting] **complexity** (high): Function 'signature' has excessive nesting (depth: 5, max: 4)
- [cc7890e7-21123-complexity-nesting] **complexity** (high): Function 'into' has excessive nesting (depth: 6, max: 4)
- [cc7890e7-112-console] **inconsistency** (low): Console statement found (log) (line 112)
- [cc7890e7-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [cc7890e7-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [cc7890e7-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [cc7890e7-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [cc7890e7-142-console] **inconsistency** (low): Console statement found (log) (line 142)
- [cc7890e7-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [cc7890e7-176-console] **inconsistency** (low): Console statement found (log) (line 176)
- [cc7890e7-180-console] **inconsistency** (low): Console statement found (log) (line 180)
- [cc7890e7-205-console] **inconsistency** (low): Console statement found (log) (line 205)
- [cc7890e7-206-console] **inconsistency** (low): Console statement found (log) (line 206)
- [cc7890e7-207-console] **inconsistency** (low): Console statement found (log) (line 207)
- [cc7890e7-208-console] **inconsistency** (low): Console statement found (log) (line 208)
- [cc7890e7-213-console] **inconsistency** (low): Console statement found (error) (line 213)
- [cc7890e7-334-console] **inconsistency** (low): Console statement found (warn) (line 334)
- [cc7890e7-635-console] **inconsistency** (low): Console statement found (log) (line 635)
- [cc7890e7-637-console] **inconsistency** (low): Console statement found (warn) (line 637)

### phase-4-database.ts
- [ea33f050-2969-complexity-length] **complexity** (critical): Function 'anonymous' is too long (659 lines, max: 50)
- [ea33f050-2969-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [ea33f050-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [ea33f050-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [ea33f050-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [ea33f050-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [ea33f050-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [ea33f050-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [ea33f050-156-console] **inconsistency** (low): Console statement found (log) (line 156)
- [ea33f050-174-console] **inconsistency** (low): Console statement found (log) (line 174)
- [ea33f050-199-console] **inconsistency** (low): Console statement found (log) (line 199)
- [ea33f050-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [ea33f050-201-console] **inconsistency** (low): Console statement found (log) (line 201)
- [ea33f050-202-console] **inconsistency** (low): Console statement found (log) (line 202)
- [ea33f050-207-console] **inconsistency** (low): Console statement found (error) (line 207)
- [ea33f050-407-console] **inconsistency** (low): Console statement found (warn) (line 407)
- [ea33f050-755-console] **inconsistency** (low): Console statement found (log) (line 755)
- [ea33f050-757-console] **inconsistency** (low): Console statement found (warn) (line 757)

### phase-3h-xss-injection-security.ts
- [033fd823-2269-complexity-length] **complexity** (critical): Function 'anonymous' is too long (172 lines, max: 50)
- [033fd823-2269-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [033fd823-25989-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [033fd823-81-console] **inconsistency** (low): Console statement found (log) (line 81)
- [033fd823-84-console] **inconsistency** (low): Console statement found (log) (line 84)
- [033fd823-86-console] **inconsistency** (low): Console statement found (log) (line 86)
- [033fd823-87-console] **inconsistency** (low): Console statement found (log) (line 87)
- [033fd823-88-console] **inconsistency** (low): Console statement found (log) (line 88)
- [033fd823-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [033fd823-99-console] **inconsistency** (low): Console statement found (log) (line 99)
- [033fd823-103-console] **inconsistency** (low): Console statement found (log) (line 103)
- [033fd823-107-console] **inconsistency** (low): Console statement found (log) (line 107)
- [033fd823-111-console] **inconsistency** (low): Console statement found (log) (line 111)
- [033fd823-115-console] **inconsistency** (low): Console statement found (log) (line 115)
- [033fd823-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [033fd823-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [033fd823-127-console] **inconsistency** (low): Console statement found (log) (line 127)
- [033fd823-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [033fd823-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [033fd823-138-console] **inconsistency** (low): Console statement found (log) (line 138)
- [033fd823-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [033fd823-142-console] **inconsistency** (low): Console statement found (log) (line 142)
- [033fd823-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [033fd823-144-console] **inconsistency** (low): Console statement found (log) (line 144)
- [033fd823-160-console] **inconsistency** (low): Console statement found (log) (line 160)
- [033fd823-161-console] **inconsistency** (low): Console statement found (log) (line 161)
- [033fd823-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [033fd823-191-console] **inconsistency** (low): Console statement found (error) (line 191)
- [033fd823-238-console] **inconsistency** (low): Console statement found (warn) (line 238)
- [033fd823-286-console] **inconsistency** (low): Console statement found (warn) (line 286)
- [033fd823-358-console] **inconsistency** (low): Console statement found (warn) (line 358)
- [033fd823-415-console] **inconsistency** (low): Console statement found (warn) (line 415)
- [033fd823-468-console] **inconsistency** (low): Console statement found (warn) (line 468)
- [033fd823-518-console] **inconsistency** (low): Console statement found (warn) (line 518)
- [033fd823-568-console] **inconsistency** (low): Console statement found (warn) (line 568)
- [033fd823-616-console] **inconsistency** (low): Console statement found (warn) (line 616)
- [033fd823-669-console] **inconsistency** (low): Console statement found (warn) (line 669)
- [033fd823-717-console] **inconsistency** (low): Console statement found (warn) (line 717)
- [033fd823-742-console] **inconsistency** (low): Console statement found (warn) (line 742)

### phase-3g-data-privacy-pii.ts
- [5ae8530f-1874-complexity-length] **complexity** (critical): Function 'anonymous' is too long (497 lines, max: 50)
- [5ae8530f-1874-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 14, max: 4)
- [5ae8530f-17343-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 5, max: 4)
- [5ae8530f-18146-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [5ae8530f-73-console] **inconsistency** (low): Console statement found (log) (line 73)
- [5ae8530f-76-console] **inconsistency** (low): Console statement found (log) (line 76)
- [5ae8530f-78-console] **inconsistency** (low): Console statement found (log) (line 78)
- [5ae8530f-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [5ae8530f-80-console] **inconsistency** (low): Console statement found (log) (line 80)
- [5ae8530f-86-console] **inconsistency** (low): Console statement found (log) (line 86)
- [5ae8530f-91-console] **inconsistency** (low): Console statement found (log) (line 91)
- [5ae8530f-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [5ae8530f-99-console] **inconsistency** (low): Console statement found (log) (line 99)
- [5ae8530f-103-console] **inconsistency** (low): Console statement found (log) (line 103)
- [5ae8530f-107-console] **inconsistency** (low): Console statement found (log) (line 107)
- [5ae8530f-111-console] **inconsistency** (low): Console statement found (log) (line 111)
- [5ae8530f-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [5ae8530f-117-console] **inconsistency** (low): Console statement found (log) (line 117)
- [5ae8530f-118-console] **inconsistency** (low): Console statement found (log) (line 118)
- [5ae8530f-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [5ae8530f-120-console] **inconsistency** (low): Console statement found (log) (line 120)
- [5ae8530f-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [5ae8530f-137-console] **inconsistency** (low): Console statement found (log) (line 137)
- [5ae8530f-138-console] **inconsistency** (low): Console statement found (log) (line 138)
- [5ae8530f-163-console] **inconsistency** (low): Console statement found (error) (line 163)
- [5ae8530f-220-console] **inconsistency** (low): Console statement found (warn) (line 220)
- [5ae8530f-258-console] **inconsistency** (low): Console statement found (warn) (line 258)
- [5ae8530f-317-console] **inconsistency** (low): Console statement found (warn) (line 317)
- [5ae8530f-379-console] **inconsistency** (low): Console statement found (log) (line 379)
- [5ae8530f-392-console] **inconsistency** (low): Console statement found (warn) (line 392)
- [5ae8530f-446-console] **inconsistency** (low): Console statement found (warn) (line 446)
- [5ae8530f-478-console] **inconsistency** (low): Console statement found (warn) (line 478)
- [5ae8530f-512-console] **inconsistency** (low): Console statement found (warn) (line 512)
- [5ae8530f-538-console] **inconsistency** (low): Console statement found (warn) (line 538)

### phase-3f-webhook-security.ts
- [6892d3e4-16745-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [6892d3e4-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [6892d3e4-75-console] **inconsistency** (low): Console statement found (log) (line 75)
- [6892d3e4-77-console] **inconsistency** (low): Console statement found (log) (line 77)
- [6892d3e4-78-console] **inconsistency** (low): Console statement found (log) (line 78)
- [6892d3e4-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [6892d3e4-85-console] **inconsistency** (low): Console statement found (log) (line 85)
- [6892d3e4-90-console] **inconsistency** (low): Console statement found (log) (line 90)
- [6892d3e4-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [6892d3e4-98-console] **inconsistency** (low): Console statement found (log) (line 98)
- [6892d3e4-102-console] **inconsistency** (low): Console statement found (log) (line 102)
- [6892d3e4-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [6892d3e4-109-console] **inconsistency** (low): Console statement found (log) (line 109)
- [6892d3e4-112-console] **inconsistency** (low): Console statement found (log) (line 112)
- [6892d3e4-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [6892d3e4-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [6892d3e4-115-console] **inconsistency** (low): Console statement found (log) (line 115)
- [6892d3e4-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [6892d3e4-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [6892d3e4-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [6892d3e4-157-console] **inconsistency** (low): Console statement found (error) (line 157)
- [6892d3e4-221-console] **inconsistency** (low): Console statement found (warn) (line 221)
- [6892d3e4-277-console] **inconsistency** (low): Console statement found (warn) (line 277)
- [6892d3e4-348-console] **inconsistency** (low): Console statement found (warn) (line 348)
- [6892d3e4-403-console] **inconsistency** (low): Console statement found (warn) (line 403)
- [6892d3e4-453-console] **inconsistency** (low): Console statement found (warn) (line 453)
- [6892d3e4-488-console] **inconsistency** (low): Console statement found (warn) (line 488)

### phase-3e-baas-platform-security.ts
- [0a91870a-1926-complexity-length] **complexity** (critical): Function 'anonymous' is too long (487 lines, max: 50)
- [0a91870a-1926-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 13, max: 4)
- [0a91870a-16331-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 5, max: 4)
- [0a91870a-17134-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [0a91870a-17999-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [0a91870a-74-console] **inconsistency** (low): Console statement found (log) (line 74)
- [0a91870a-77-console] **inconsistency** (low): Console statement found (log) (line 77)
- [0a91870a-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [0a91870a-80-console] **inconsistency** (low): Console statement found (log) (line 80)
- [0a91870a-81-console] **inconsistency** (low): Console statement found (log) (line 81)
- [0a91870a-87-console] **inconsistency** (low): Console statement found (log) (line 87)
- [0a91870a-92-console] **inconsistency** (low): Console statement found (log) (line 92)
- [0a91870a-96-console] **inconsistency** (low): Console statement found (log) (line 96)
- [0a91870a-100-console] **inconsistency** (low): Console statement found (log) (line 100)
- [0a91870a-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [0a91870a-108-console] **inconsistency** (low): Console statement found (log) (line 108)
- [0a91870a-111-console] **inconsistency** (low): Console statement found (log) (line 111)
- [0a91870a-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [0a91870a-115-console] **inconsistency** (low): Console statement found (log) (line 115)
- [0a91870a-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [0a91870a-117-console] **inconsistency** (low): Console statement found (log) (line 117)
- [0a91870a-118-console] **inconsistency** (low): Console statement found (log) (line 118)
- [0a91870a-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [0a91870a-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [0a91870a-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [0a91870a-160-console] **inconsistency** (low): Console statement found (error) (line 160)
- [0a91870a-210-console] **inconsistency** (low): Console statement found (warn) (line 210)
- [0a91870a-264-console] **inconsistency** (low): Console statement found (warn) (line 264)
- [0a91870a-317-console] **inconsistency** (low): Console statement found (warn) (line 317)
- [0a91870a-383-console] **inconsistency** (low): Console statement found (warn) (line 383)
- [0a91870a-441-console] **inconsistency** (low): Console statement found (warn) (line 441)
- [0a91870a-464-console] **inconsistency** (low): Console statement found (warn) (line 464)
- [0a91870a-490-console] **inconsistency** (low): Console statement found (warn) (line 490)
- [0a91870a-516-console] **inconsistency** (low): Console statement found (warn) (line 516)

### phase-3c-secure-dev-methodology.ts
- [46255427-1860-complexity-length] **complexity** (critical): Function 'anonymous' is too long (442 lines, max: 50)
- [46255427-1860-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 13, max: 4)
- [46255427-17907-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [46255427-73-console] **inconsistency** (low): Console statement found (log) (line 73)
- [46255427-76-console] **inconsistency** (low): Console statement found (log) (line 76)
- [46255427-78-console] **inconsistency** (low): Console statement found (log) (line 78)
- [46255427-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [46255427-80-console] **inconsistency** (low): Console statement found (log) (line 80)
- [46255427-86-console] **inconsistency** (low): Console statement found (log) (line 86)
- [46255427-91-console] **inconsistency** (low): Console statement found (log) (line 91)
- [46255427-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [46255427-99-console] **inconsistency** (low): Console statement found (log) (line 99)
- [46255427-103-console] **inconsistency** (low): Console statement found (log) (line 103)
- [46255427-107-console] **inconsistency** (low): Console statement found (log) (line 107)
- [46255427-110-console] **inconsistency** (low): Console statement found (log) (line 110)
- [46255427-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [46255427-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [46255427-115-console] **inconsistency** (low): Console statement found (log) (line 115)
- [46255427-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [46255427-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [46255427-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [46255427-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [46255427-158-console] **inconsistency** (low): Console statement found (error) (line 158)
- [46255427-211-console] **inconsistency** (low): Console statement found (warn) (line 211)
- [46255427-283-console] **inconsistency** (low): Console statement found (warn) (line 283)
- [46255427-339-console] **inconsistency** (low): Console statement found (warn) (line 339)
- [46255427-405-console] **inconsistency** (low): Console statement found (warn) (line 405)
- [46255427-484-console] **inconsistency** (low): Console statement found (warn) (line 484)

### phase-3b-ai-api-security.ts
- [a5636ca5-1867-complexity-length] **complexity** (critical): Function 'anonymous' is too long (296 lines, max: 50)
- [a5636ca5-1867-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [a5636ca5-4918-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 6, max: 4)
- [a5636ca5-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [a5636ca5-75-console] **inconsistency** (low): Console statement found (log) (line 75)
- [a5636ca5-77-console] **inconsistency** (low): Console statement found (log) (line 77)
- [a5636ca5-78-console] **inconsistency** (low): Console statement found (log) (line 78)
- [a5636ca5-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [a5636ca5-85-console] **inconsistency** (low): Console statement found (log) (line 85)
- [a5636ca5-87-console] **inconsistency** (low): Console statement found (log) (line 87)
- [a5636ca5-90-console] **inconsistency** (low): Console statement found (log) (line 90)
- [a5636ca5-93-console] **inconsistency** (low): Console statement found (log) (line 93)
- [a5636ca5-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [a5636ca5-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [a5636ca5-96-console] **inconsistency** (low): Console statement found (log) (line 96)
- [a5636ca5-112-console] **inconsistency** (low): Console statement found (log) (line 112)
- [a5636ca5-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [a5636ca5-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [a5636ca5-138-console] **inconsistency** (low): Console statement found (error) (line 138)
- [a5636ca5-161-console] **inconsistency** (low): Console statement found (warn) (line 161)
- [a5636ca5-175-console] **inconsistency** (low): Console statement found (warn) (line 175)
- [a5636ca5-181-console] **inconsistency** (low): Console statement found (warn) (line 181)
- [a5636ca5-191-console] **inconsistency** (low): Console statement found (warn) (line 191)

### phase-3-security.ts
- [8908ecfa-3042-complexity-length] **complexity** (critical): Function 'anonymous' is too long (635 lines, max: 50)
- [8908ecfa-3042-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [8908ecfa-5-console] **inconsistency** (low): Console statement found (log) (line 5)
- [8908ecfa-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [8908ecfa-122-console] **inconsistency** (low): Console statement found (log) (line 122)
- [8908ecfa-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [8908ecfa-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [8908ecfa-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [8908ecfa-188-console] **inconsistency** (low): Console statement found (log) (line 188)
- [8908ecfa-199-console] **inconsistency** (low): Console statement found (log) (line 199)
- [8908ecfa-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [8908ecfa-201-console] **inconsistency** (low): Console statement found (log) (line 201)
- [8908ecfa-202-console] **inconsistency** (low): Console statement found (log) (line 202)
- [8908ecfa-207-console] **inconsistency** (low): Console statement found (error) (line 207)
- [8908ecfa-293-console] **inconsistency** (low): Console statement found (log) (line 293)
- [8908ecfa-312-console] **inconsistency** (low): Console statement found (warn) (line 312)
- [8908ecfa-555-console] **inconsistency** (low): Console statement found (log) (line 555)
- [8908ecfa-575-console] **inconsistency** (low): Console statement found (log) (line 575)
- [8908ecfa-602-console] **inconsistency** (low): Console statement found (log) (line 602)
- [8908ecfa-603-console] **inconsistency** (low): Console statement found (log) (line 603)
- [8908ecfa-607-console] **inconsistency** (low): Console statement found (log) (line 607)
- [8908ecfa-729-console] **inconsistency** (low): Console statement found (log) (line 729)
- [8908ecfa-731-console] **inconsistency** (low): Console statement found (warn) (line 731)

### phase-20-intelligent-roi-report.ts
- [068b175d-2843-complexity-length] **complexity** (critical): Function 'anonymous' is too long (295 lines, max: 50)
- [068b175d-2843-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [068b175d-48-any] **any** (medium): Unnecessary use of "any" type (line 48)
- [068b175d-50-any] **any** (medium): Unnecessary use of "any" type (line 50)
- [068b175d-141-any] **any** (medium): Unnecessary use of "any" type (line 141)
- [068b175d-215-any] **any** (medium): Unnecessary use of "any" type (line 215)
- [068b175d-275-any] **any** (medium): Unnecessary use of "any" type (line 275)
- [068b175d-297-any] **any** (medium): Unnecessary use of "any" type (line 297)
- [068b175d-300-any] **any** (medium): Unnecessary use of "any" type (line 300)
- [068b175d-301-any] **any** (medium): Unnecessary use of "any" type (line 301)
- [068b175d-302-any] **any** (medium): Unnecessary use of "any" type (line 302)
- [068b175d-337-any] **any** (medium): Unnecessary use of "any" type (line 337)
- [068b175d-338-any] **any** (medium): Unnecessary use of "any" type (line 338)
- [068b175d-87-console] **inconsistency** (low): Console statement found (log) (line 87)
- [068b175d-88-console] **inconsistency** (low): Console statement found (log) (line 88)
- [068b175d-109-console] **inconsistency** (low): Console statement found (log) (line 109)
- [068b175d-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [068b175d-115-console] **inconsistency** (low): Console statement found (log) (line 115)
- [068b175d-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [068b175d-117-console] **inconsistency** (low): Console statement found (log) (line 117)
- [068b175d-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [068b175d-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [068b175d-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [068b175d-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [068b175d-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [068b175d-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [068b175d-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [068b175d-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [068b175d-149-console] **inconsistency** (low): Console statement found (log) (line 149)
- [068b175d-167-console] **inconsistency** (low): Console statement found (error) (line 167)

### phase-20-intelligent-report-comparison.ts
- [c9206721-3336-complexity-length] **complexity** (critical): Function 'anonymous' is too long (534 lines, max: 50)
- [c9206721-3336-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [c9206721-397-any] **any** (medium): Unnecessary use of "any" type (line 397)
- [c9206721-424-any] **any** (medium): Unnecessary use of "any" type (line 424)
- [c9206721-425-any] **any** (medium): Unnecessary use of "any" type (line 425)
- [c9206721-444-any] **any** (medium): Unnecessary use of "any" type (line 444)
- [c9206721-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [c9206721-174-console] **inconsistency** (low): Console statement found (log) (line 174)
- [c9206721-192-console] **inconsistency** (low): Console statement found (log) (line 192)
- [c9206721-193-console] **inconsistency** (low): Console statement found (log) (line 193)
- [c9206721-194-console] **inconsistency** (low): Console statement found (log) (line 194)
- [c9206721-195-console] **inconsistency** (low): Console statement found (log) (line 195)
- [c9206721-196-console] **inconsistency** (low): Console statement found (log) (line 196)
- [c9206721-197-console] **inconsistency** (low): Console statement found (log) (line 197)
- [c9206721-198-console] **inconsistency** (low): Console statement found (log) (line 198)
- [c9206721-199-console] **inconsistency** (low): Console statement found (log) (line 199)
- [c9206721-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [c9206721-201-console] **inconsistency** (low): Console statement found (log) (line 201)
- [c9206721-202-console] **inconsistency** (low): Console statement found (log) (line 202)
- [c9206721-207-console] **inconsistency** (low): Console statement found (error) (line 207)
- [c9206721-235-console] **inconsistency** (low): Console statement found (log) (line 235)
- [c9206721-242-console] **inconsistency** (low): Console statement found (log) (line 242)
- [c9206721-252-console] **inconsistency** (low): Console statement found (log) (line 252)
- [c9206721-265-console] **inconsistency** (low): Console statement found (log) (line 265)
- [c9206721-267-console] **inconsistency** (low): Console statement found (warn) (line 267)
- [c9206721-322-console] **inconsistency** (low): Console statement found (log) (line 322)
- [c9206721-372-console] **inconsistency** (low): Console statement found (log) (line 372)
- [c9206721-373-console] **inconsistency** (low): Console statement found (log) (line 373)
- [c9206721-384-console] **inconsistency** (low): Console statement found (log) (line 384)
- [c9206721-409-console] **inconsistency** (low): Console statement found (log) (line 409)
- [c9206721-414-console] **inconsistency** (low): Console statement found (log) (line 414)
- [c9206721-465-console] **inconsistency** (low): Console statement found (log) (line 465)
- [c9206721-502-console] **inconsistency** (low): Console statement found (log) (line 502)
- [c9206721-504-console] **inconsistency** (low): Console statement found (log) (line 504)
- [c9206721-526-console] **inconsistency** (low): Console statement found (log) (line 526)
- [c9206721-528-console] **inconsistency** (low): Console statement found (warn) (line 528)
- [c9206721-546-console] **inconsistency** (low): Console statement found (log) (line 546)
- [c9206721-551-console] **inconsistency** (low): Console statement found (log) (line 551)
- [c9206721-562-console] **inconsistency** (low): Console statement found (log) (line 562)
- [c9206721-592-console] **inconsistency** (low): Console statement found (log) (line 592)
- [c9206721-597-console] **inconsistency** (low): Console statement found (log) (line 597)
- [c9206721-615-console] **inconsistency** (low): Console statement found (log) (line 615)
- [c9206721-619-console] **inconsistency** (low): Console statement found (log) (line 619)
- [c9206721-646-console] **inconsistency** (low): Console statement found (log) (line 646)
- [c9206721-649-console] **inconsistency** (low): Console statement found (log) (line 649)
- [c9206721-652-console] **inconsistency** (low): Console statement found (warn) (line 652)

### phase-2-business-logic.ts
- [c28578d9-6258-complexity-length] **complexity** (critical): Function 'anonymous' is too long (807 lines, max: 50)
- [c28578d9-6258-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [c28578d9-24757-complexity-nesting] **complexity** (high): Function 'walkDir' has excessive nesting (depth: 5, max: 4)
- [c28578d9-284-console] **inconsistency** (low): Console statement found (log) (line 284)
- [c28578d9-288-console] **inconsistency** (low): Console statement found (log) (line 288)
- [c28578d9-290-console] **inconsistency** (low): Console statement found (log) (line 290)
- [c28578d9-293-console] **inconsistency** (low): Console statement found (log) (line 293)
- [c28578d9-295-console] **inconsistency** (low): Console statement found (log) (line 295)
- [c28578d9-299-console] **inconsistency** (low): Console statement found (log) (line 299)
- [c28578d9-302-console] **inconsistency** (low): Console statement found (log) (line 302)
- [c28578d9-304-console] **inconsistency** (low): Console statement found (log) (line 304)
- [c28578d9-307-console] **inconsistency** (low): Console statement found (log) (line 307)
- [c28578d9-309-console] **inconsistency** (low): Console statement found (log) (line 309)
- [c28578d9-314-console] **inconsistency** (low): Console statement found (log) (line 314)
- [c28578d9-315-console] **inconsistency** (low): Console statement found (log) (line 315)
- [c28578d9-320-console] **inconsistency** (low): Console statement found (log) (line 320)
- [c28578d9-324-console] **inconsistency** (low): Console statement found (log) (line 324)
- [c28578d9-328-console] **inconsistency** (low): Console statement found (log) (line 328)
- [c28578d9-352-console] **inconsistency** (low): Console statement found (log) (line 352)
- [c28578d9-353-console] **inconsistency** (low): Console statement found (log) (line 353)
- [c28578d9-354-console] **inconsistency** (low): Console statement found (log) (line 354)
- [c28578d9-355-console] **inconsistency** (low): Console statement found (log) (line 355)
- [c28578d9-356-console] **inconsistency** (low): Console statement found (log) (line 356)
- [c28578d9-357-console] **inconsistency** (low): Console statement found (log) (line 357)
- [c28578d9-358-console] **inconsistency** (low): Console statement found (log) (line 358)
- [c28578d9-367-console] **inconsistency** (low): Console statement found (error) (line 367)
- [c28578d9-402-console] **inconsistency** (low): Console statement found (log) (line 402)
- [c28578d9-447-console] **inconsistency** (low): Console statement found (log) (line 447)
- [c28578d9-448-console] **inconsistency** (low): Console statement found (log) (line 448)
- [c28578d9-452-console] **inconsistency** (low): Console statement found (warn) (line 452)
- [c28578d9-479-console] **inconsistency** (low): Console statement found (log) (line 479)
- [c28578d9-519-console] **inconsistency** (low): Console statement found (log) (line 519)
- [c28578d9-590-console] **inconsistency** (low): Console statement found (log) (line 590)
- [c28578d9-705-console] **inconsistency** (low): Console statement found (log) (line 705)
- [c28578d9-712-console] **inconsistency** (low): Console statement found (log) (line 712)
- [c28578d9-715-console] **inconsistency** (low): Console statement found (log) (line 715)
- [c28578d9-718-console] **inconsistency** (low): Console statement found (log) (line 718)
- [c28578d9-721-console] **inconsistency** (low): Console statement found (log) (line 721)
- [c28578d9-724-console] **inconsistency** (low): Console statement found (log) (line 724)
- [c28578d9-727-console] **inconsistency** (low): Console statement found (log) (line 727)
- [c28578d9-747-console] **inconsistency** (low): Console statement found (log) (line 747)
- [c28578d9-755-console] **inconsistency** (low): Console statement found (log) (line 755)
- [c28578d9-759-console] **inconsistency** (low): Console statement found (log) (line 759)
- [c28578d9-763-console] **inconsistency** (low): Console statement found (log) (line 763)
- [c28578d9-767-console] **inconsistency** (low): Console statement found (log) (line 767)
- [c28578d9-772-console] **inconsistency** (low): Console statement found (log) (line 772)
- [c28578d9-1071-console] **inconsistency** (low): Console statement found (log) (line 1071)
- [c28578d9-1073-console] **inconsistency** (low): Console statement found (warn) (line 1073)

### phase-19-incremental-review.ts
- [334fb098-2805-complexity-length] **complexity** (critical): Function 'anonymous' is too long (627 lines, max: 50)
- [334fb098-2805-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 11, max: 4)
- [334fb098-10480-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 5, max: 4)
- [334fb098-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [334fb098-120-console] **inconsistency** (low): Console statement found (log) (line 120)
- [334fb098-122-console] **inconsistency** (low): Console statement found (log) (line 122)
- [334fb098-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [334fb098-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [334fb098-127-console] **inconsistency** (low): Console statement found (log) (line 127)
- [334fb098-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [334fb098-137-console] **inconsistency** (low): Console statement found (log) (line 137)
- [334fb098-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [334fb098-159-console] **inconsistency** (low): Console statement found (log) (line 159)
- [334fb098-160-console] **inconsistency** (low): Console statement found (log) (line 160)
- [334fb098-161-console] **inconsistency** (low): Console statement found (log) (line 161)
- [334fb098-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [334fb098-204-console] **inconsistency** (low): Console statement found (log) (line 204)
- [334fb098-205-console] **inconsistency** (low): Console statement found (log) (line 205)
- [334fb098-206-console] **inconsistency** (low): Console statement found (log) (line 206)
- [334fb098-207-console] **inconsistency** (low): Console statement found (log) (line 207)
- [334fb098-208-console] **inconsistency** (low): Console statement found (log) (line 208)
- [334fb098-209-console] **inconsistency** (low): Console statement found (log) (line 209)
- [334fb098-210-console] **inconsistency** (low): Console statement found (log) (line 210)
- [334fb098-211-console] **inconsistency** (low): Console statement found (log) (line 211)
- [334fb098-212-console] **inconsistency** (low): Console statement found (log) (line 212)
- [334fb098-222-console] **inconsistency** (low): Console statement found (error) (line 222)
- [334fb098-269-console] **inconsistency** (low): Console statement found (warn) (line 269)
- [334fb098-285-console] **inconsistency** (low): Console statement found (log) (line 285)
- [334fb098-443-console] **inconsistency** (low): Console statement found (log) (line 443)
- [334fb098-454-console] **inconsistency** (low): Console statement found (log) (line 454)
- [334fb098-465-console] **inconsistency** (low): Console statement found (log) (line 465)
- [334fb098-471-console] **inconsistency** (low): Console statement found (log) (line 471)
- [334fb098-489-console] **inconsistency** (low): Console statement found (log) (line 489)
- [334fb098-556-console] **inconsistency** (low): Console statement found (log) (line 556)
- [334fb098-576-console] **inconsistency** (low): Console statement found (log) (line 576)
- [334fb098-589-console] **inconsistency** (low): Console statement found (log) (line 589)
- [334fb098-600-console] **inconsistency** (low): Console statement found (log) (line 600)
- [334fb098-651-console] **inconsistency** (low): Console statement found (log) (line 651)
- [334fb098-676-console] **inconsistency** (low): Console statement found (log) (line 676)
- [334fb098-682-console] **inconsistency** (low): Console statement found (warn) (line 682)
- [334fb098-696-console] **inconsistency** (low): Console statement found (log) (line 696)
- [334fb098-701-console] **inconsistency** (low): Console statement found (log) (line 701)
- [334fb098-706-console] **inconsistency** (low): Console statement found (log) (line 706)

### phase-18-post-fix-validation.ts
- [172f8d25-2666-complexity-length] **complexity** (critical): Function 'anonymous' is too long (670 lines, max: 50)
- [172f8d25-2666-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 11, max: 4)
- [172f8d25-22015-complexity-nesting] **complexity** (high): Function 'findFoldersRecursive' has excessive nesting (depth: 5, max: 4)
- [172f8d25-26628-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 5, max: 4)
- [172f8d25-407-any] **any** (medium): Unnecessary use of "any" type (line 407)
- [172f8d25-407-any] **any** (medium): Unnecessary use of "any" type (line 407)
- [172f8d25-443-any] **any** (medium): Unnecessary use of "any" type (line 443)
- [172f8d25-443-any] **any** (medium): Unnecessary use of "any" type (line 443)
- [172f8d25-537-any] **any** (medium): Unnecessary use of "any" type (line 537)
- [172f8d25-112-console] **inconsistency** (low): Console statement found (log) (line 112)
- [172f8d25-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [172f8d25-118-console] **inconsistency** (low): Console statement found (log) (line 118)
- [172f8d25-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [172f8d25-120-console] **inconsistency** (low): Console statement found (log) (line 120)
- [172f8d25-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [172f8d25-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [172f8d25-168-console] **inconsistency** (low): Console statement found (log) (line 168)
- [172f8d25-169-console] **inconsistency** (low): Console statement found (log) (line 169)
- [172f8d25-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [172f8d25-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [172f8d25-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [172f8d25-173-console] **inconsistency** (low): Console statement found (log) (line 173)
- [172f8d25-174-console] **inconsistency** (low): Console statement found (log) (line 174)
- [172f8d25-175-console] **inconsistency** (low): Console statement found (log) (line 175)
- [172f8d25-176-console] **inconsistency** (low): Console statement found (log) (line 176)
- [172f8d25-177-console] **inconsistency** (low): Console statement found (log) (line 177)
- [172f8d25-186-console] **inconsistency** (low): Console statement found (error) (line 186)
- [172f8d25-213-console] **inconsistency** (low): Console statement found (log) (line 213)
- [172f8d25-219-console] **inconsistency** (low): Console statement found (log) (line 219)
- [172f8d25-225-console] **inconsistency** (low): Console statement found (log) (line 225)
- [172f8d25-249-console] **inconsistency** (low): Console statement found (log) (line 249)
- [172f8d25-250-console] **inconsistency** (low): Console statement found (log) (line 250)
- [172f8d25-258-console] **inconsistency** (low): Console statement found (log) (line 258)
- [172f8d25-264-console] **inconsistency** (low): Console statement found (log) (line 264)
- [172f8d25-267-console] **inconsistency** (low): Console statement found (log) (line 267)
- [172f8d25-268-console] **inconsistency** (low): Console statement found (log) (line 268)
- [172f8d25-270-console] **inconsistency** (low): Console statement found (log) (line 270)
- [172f8d25-275-console] **inconsistency** (low): Console statement found (log) (line 275)
- [172f8d25-282-console] **inconsistency** (low): Console statement found (log) (line 282)
- [172f8d25-288-console] **inconsistency** (low): Console statement found (log) (line 288)
- [172f8d25-291-console] **inconsistency** (low): Console statement found (log) (line 291)
- [172f8d25-358-console] **inconsistency** (low): Console statement found (log) (line 358)
- [172f8d25-364-console] **inconsistency** (low): Console statement found (log) (line 364)
- [172f8d25-369-console] **inconsistency** (low): Console statement found (log) (line 369)
- [172f8d25-373-console] **inconsistency** (low): Console statement found (log) (line 373)
- [172f8d25-396-console] **inconsistency** (low): Console statement found (log) (line 396)
- [172f8d25-470-console] **inconsistency** (low): Console statement found (log) (line 470)
- [172f8d25-476-console] **inconsistency** (low): Console statement found (log) (line 476)
- [172f8d25-496-console] **inconsistency** (low): Console statement found (log) (line 496)
- [172f8d25-517-console] **inconsistency** (low): Console statement found (log) (line 517)
- [172f8d25-522-console] **inconsistency** (low): Console statement found (warn) (line 522)
- [172f8d25-526-console] **inconsistency** (low): Console statement found (log) (line 526)
- [172f8d25-563-console] **inconsistency** (low): Console statement found (log) (line 563)
- [172f8d25-570-console] **inconsistency** (low): Console statement found (log) (line 570)
- [172f8d25-576-console] **inconsistency** (low): Console statement found (log) (line 576)
- [172f8d25-578-console] **inconsistency** (low): Console statement found (warn) (line 578)
- [172f8d25-584-console] **inconsistency** (low): Console statement found (log) (line 584)
- [172f8d25-590-console] **inconsistency** (low): Console statement found (log) (line 590)
- [172f8d25-592-console] **inconsistency** (low): Console statement found (warn) (line 592)
- [172f8d25-596-console] **inconsistency** (low): Console statement found (log) (line 596)
- [172f8d25-598-console] **inconsistency** (low): Console statement found (error) (line 598)
- [172f8d25-671-console] **inconsistency** (low): Console statement found (log) (line 671)
- [172f8d25-687-console] **inconsistency** (low): Console statement found (log) (line 687)
- [172f8d25-689-console] **inconsistency** (low): Console statement found (log) (line 689)
- [172f8d25-692-console] **inconsistency** (low): Console statement found (error) (line 692)
- [172f8d25-710-console] **inconsistency** (low): Console statement found (log) (line 710)
- [172f8d25-714-console] **inconsistency** (low): Console statement found (log) (line 714)
- [172f8d25-715-console] **inconsistency** (low): Console statement found (log) (line 715)
- [172f8d25-722-console] **inconsistency** (low): Console statement found (log) (line 722)
- [172f8d25-723-console] **inconsistency** (low): Console statement found (log) (line 723)
- [172f8d25-728-console] **inconsistency** (low): Console statement found (log) (line 728)
- [172f8d25-729-console] **inconsistency** (low): Console statement found (log) (line 729)
- [172f8d25-730-console] **inconsistency** (low): Console statement found (log) (line 730)
- [172f8d25-732-console] **inconsistency** (low): Console statement found (log) (line 732)
- [172f8d25-735-console] **inconsistency** (low): Console statement found (warn) (line 735)

### phase-17-multi-fix-execution.ts
- [6f6ed35c-2529-complexity-length] **complexity** (critical): Function 'anonymous' is too long (553 lines, max: 50)
- [6f6ed35c-2529-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [6f6ed35c-52-any] **any** (medium): Unnecessary use of "any" type (line 52)
- [6f6ed35c-200-any] **any** (medium): Unnecessary use of "any" type (line 200)
- [6f6ed35c-245-any] **any** (medium): Unnecessary use of "any" type (line 245)
- [6f6ed35c-260-any] **any** (medium): Unnecessary use of "any" type (line 260)
- [6f6ed35c-261-any] **any** (medium): Unnecessary use of "any" type (line 261)
- [6f6ed35c-262-any] **any** (medium): Unnecessary use of "any" type (line 262)
- [6f6ed35c-411-any] **any** (medium): Unnecessary use of "any" type (line 411)
- [6f6ed35c-450-any] **any** (medium): Unnecessary use of "any" type (line 450)
- [6f6ed35c-466-any] **any** (medium): Unnecessary use of "any" type (line 466)
- [6f6ed35c-482-any] **any** (medium): Unnecessary use of "any" type (line 482)
- [6f6ed35c-508-any] **any** (medium): Unnecessary use of "any" type (line 508)
- [6f6ed35c-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [6f6ed35c-118-console] **inconsistency** (low): Console statement found (log) (line 118)
- [6f6ed35c-120-console] **inconsistency** (low): Console statement found (log) (line 120)
- [6f6ed35c-121-console] **inconsistency** (low): Console statement found (log) (line 121)
- [6f6ed35c-122-console] **inconsistency** (low): Console statement found (log) (line 122)
- [6f6ed35c-125-console] **inconsistency** (low): Console statement found (log) (line 125)
- [6f6ed35c-139-console] **inconsistency** (low): Console statement found (log) (line 139)
- [6f6ed35c-140-console] **inconsistency** (low): Console statement found (log) (line 140)
- [6f6ed35c-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [6f6ed35c-142-console] **inconsistency** (low): Console statement found (log) (line 142)
- [6f6ed35c-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [6f6ed35c-144-console] **inconsistency** (low): Console statement found (log) (line 144)
- [6f6ed35c-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [6f6ed35c-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [6f6ed35c-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [6f6ed35c-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [6f6ed35c-157-console] **inconsistency** (low): Console statement found (error) (line 157)
- [6f6ed35c-196-console] **inconsistency** (low): Console statement found (log) (line 196)
- [6f6ed35c-218-console] **inconsistency** (low): Console statement found (log) (line 218)
- [6f6ed35c-225-console] **inconsistency** (low): Console statement found (log) (line 225)
- [6f6ed35c-315-console] **inconsistency** (low): Console statement found (log) (line 315)
- [6f6ed35c-332-console] **inconsistency** (low): Console statement found (log) (line 332)
- [6f6ed35c-342-console] **inconsistency** (low): Console statement found (error) (line 342)
- [6f6ed35c-395-console] **inconsistency** (low): Console statement found (error) (line 395)
- [6f6ed35c-554-console] **inconsistency** (low): Console statement found (log) (line 554)
- [6f6ed35c-557-console] **inconsistency** (low): Console statement found (warn) (line 557)
- [6f6ed35c-563-console] **inconsistency** (low): Console statement found (log) (line 563)
- [6f6ed35c-566-console] **inconsistency** (low): Console statement found (warn) (line 566)
- [6f6ed35c-573-console] **inconsistency** (low): Console statement found (log) (line 573)
- [6f6ed35c-577-console] **inconsistency** (low): Console statement found (warn) (line 577)
- [6f6ed35c-587-console] **inconsistency** (low): Console statement found (error) (line 587)
- [6f6ed35c-604-console] **inconsistency** (low): Console statement found (log) (line 604)
- [6f6ed35c-630-console] **inconsistency** (low): Console statement found (log) (line 630)
- [6f6ed35c-637-console] **inconsistency** (low): Console statement found (warn) (line 637)

### phase-16-fix-strategy.ts
- [bf10998f-3168-complexity-length] **complexity** (critical): Function 'anonymous' is too long (731 lines, max: 50)
- [bf10998f-3168-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 11, max: 4)
- [bf10998f-15841-complexity-nesting] **complexity** (high): Function 'references' has excessive nesting (depth: 8, max: 4)
- [bf10998f-16066-complexity-nesting] **complexity** (high): Function 'names' has excessive nesting (depth: 7, max: 4)
- [bf10998f-17333-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 5, max: 4)
- [bf10998f-279-any] **any** (medium): Unnecessary use of "any" type (line 279)
- [bf10998f-279-any] **any** (medium): Unnecessary use of "any" type (line 279)
- [bf10998f-280-any] **any** (medium): Unnecessary use of "any" type (line 280)
- [bf10998f-326-any] **any** (medium): Unnecessary use of "any" type (line 326)
- [bf10998f-447-any] **any** (medium): Unnecessary use of "any" type (line 447)
- [bf10998f-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [bf10998f-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [bf10998f-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [bf10998f-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [bf10998f-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [bf10998f-139-console] **inconsistency** (low): Console statement found (log) (line 139)
- [bf10998f-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [bf10998f-154-console] **inconsistency** (low): Console statement found (log) (line 154)
- [bf10998f-155-console] **inconsistency** (low): Console statement found (log) (line 155)
- [bf10998f-156-console] **inconsistency** (low): Console statement found (log) (line 156)
- [bf10998f-157-console] **inconsistency** (low): Console statement found (log) (line 157)
- [bf10998f-158-console] **inconsistency** (low): Console statement found (log) (line 158)
- [bf10998f-159-console] **inconsistency** (low): Console statement found (log) (line 159)
- [bf10998f-160-console] **inconsistency** (low): Console statement found (log) (line 160)
- [bf10998f-169-console] **inconsistency** (low): Console statement found (error) (line 169)
- [bf10998f-219-console] **inconsistency** (low): Console statement found (log) (line 219)
- [bf10998f-227-console] **inconsistency** (low): Console statement found (log) (line 227)
- [bf10998f-232-console] **inconsistency** (low): Console statement found (log) (line 232)
- [bf10998f-632-console] **inconsistency** (low): Console statement found (log) (line 632)
- [bf10998f-699-console] **inconsistency** (low): Console statement found (log) (line 699)
- [bf10998f-824-console] **inconsistency** (low): Console statement found (log) (line 824)
- [bf10998f-826-console] **inconsistency** (low): Console statement found (warn) (line 826)
- [bf10998f-838-console] **inconsistency** (low): Console statement found (log) (line 838)

### phase-16-fix-strategy-generation.ts
- [aa31257c-3573-complexity-length] **complexity** (critical): Function 'anonymous' is too long (221 lines, max: 50)
- [aa31257c-3573-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [aa31257c-6966-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [aa31257c-83-any] **any** (medium): Unnecessary use of "any" type (line 83)
- [aa31257c-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [aa31257c-117-console] **inconsistency** (low): Console statement found (log) (line 117)
- [aa31257c-138-console] **inconsistency** (low): Console statement found (log) (line 138)
- [aa31257c-142-console] **inconsistency** (low): Console statement found (log) (line 142)
- [aa31257c-144-console] **inconsistency** (low): Console statement found (log) (line 144)
- [aa31257c-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [aa31257c-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [aa31257c-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [aa31257c-155-console] **inconsistency** (low): Console statement found (log) (line 155)
- [aa31257c-158-console] **inconsistency** (low): Console statement found (log) (line 158)
- [aa31257c-160-console] **inconsistency** (low): Console statement found (log) (line 160)
- [aa31257c-163-console] **inconsistency** (low): Console statement found (log) (line 163)
- [aa31257c-165-console] **inconsistency** (low): Console statement found (log) (line 165)
- [aa31257c-181-console] **inconsistency** (low): Console statement found (log) (line 181)
- [aa31257c-182-console] **inconsistency** (low): Console statement found (log) (line 182)
- [aa31257c-183-console] **inconsistency** (low): Console statement found (log) (line 183)
- [aa31257c-199-console] **inconsistency** (low): Console statement found (error) (line 199)
- [aa31257c-353-console] **inconsistency** (low): Console statement found (warn) (line 353)
- [aa31257c-361-console] **inconsistency** (low): Console statement found (warn) (line 361)
- [aa31257c-374-console] **inconsistency** (low): Console statement found (warn) (line 374)

### phase-15d-containerization.ts
- [f563a721-2978-complexity-length] **complexity** (critical): Function 'anonymous' is too long (606 lines, max: 50)
- [f563a721-2978-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 10, max: 4)
- [f563a721-9735-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 5, max: 4)
- [f563a721-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [f563a721-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [f563a721-122-console] **inconsistency** (low): Console statement found (log) (line 122)
- [f563a721-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [f563a721-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [f563a721-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [f563a721-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [f563a721-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [f563a721-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [f563a721-137-console] **inconsistency** (low): Console statement found (log) (line 137)
- [f563a721-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [f563a721-163-console] **inconsistency** (low): Console statement found (log) (line 163)
- [f563a721-164-console] **inconsistency** (low): Console statement found (log) (line 164)
- [f563a721-165-console] **inconsistency** (low): Console statement found (log) (line 165)
- [f563a721-166-console] **inconsistency** (low): Console statement found (log) (line 166)
- [f563a721-167-console] **inconsistency** (low): Console statement found (log) (line 167)
- [f563a721-168-console] **inconsistency** (low): Console statement found (log) (line 168)
- [f563a721-181-console] **inconsistency** (low): Console statement found (error) (line 181)
- [f563a721-234-console] **inconsistency** (low): Console statement found (log) (line 234)
- [f563a721-240-console] **inconsistency** (low): Console statement found (log) (line 240)
- [f563a721-252-console] **inconsistency** (low): Console statement found (log) (line 252)
- [f563a721-688-console] **inconsistency** (low): Console statement found (log) (line 688)
- [f563a721-690-console] **inconsistency** (low): Console statement found (warn) (line 690)

### phase-15c-cloud-infra.ts
- [d7bdabc7-3101-complexity-length] **complexity** (critical): Function 'anonymous' is too long (555 lines, max: 50)
- [d7bdabc7-3101-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 10, max: 4)
- [d7bdabc7-10150-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 5, max: 4)
- [d7bdabc7-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [d7bdabc7-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [d7bdabc7-125-console] **inconsistency** (low): Console statement found (log) (line 125)
- [d7bdabc7-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [d7bdabc7-127-console] **inconsistency** (low): Console statement found (log) (line 127)
- [d7bdabc7-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [d7bdabc7-155-console] **inconsistency** (low): Console statement found (log) (line 155)
- [d7bdabc7-156-console] **inconsistency** (low): Console statement found (log) (line 156)
- [d7bdabc7-157-console] **inconsistency** (low): Console statement found (log) (line 157)
- [d7bdabc7-158-console] **inconsistency** (low): Console statement found (log) (line 158)
- [d7bdabc7-159-console] **inconsistency** (low): Console statement found (log) (line 159)
- [d7bdabc7-160-console] **inconsistency** (low): Console statement found (log) (line 160)
- [d7bdabc7-161-console] **inconsistency** (low): Console statement found (log) (line 161)
- [d7bdabc7-174-console] **inconsistency** (low): Console statement found (error) (line 174)
- [d7bdabc7-241-console] **inconsistency** (low): Console statement found (log) (line 241)
- [d7bdabc7-247-console] **inconsistency** (low): Console statement found (log) (line 247)
- [d7bdabc7-259-console] **inconsistency** (low): Console statement found (log) (line 259)
- [d7bdabc7-640-console] **inconsistency** (low): Console statement found (log) (line 640)
- [d7bdabc7-642-console] **inconsistency** (low): Console statement found (warn) (line 642)

### phase-15b-security-sca.ts
- [a9883f37-2258-complexity-length] **complexity** (critical): Function 'anonymous' is too long (290 lines, max: 50)
- [a9883f37-2258-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [a9883f37-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [a9883f37-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [a9883f37-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [a9883f37-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [a9883f37-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [a9883f37-149-console] **inconsistency** (low): Console statement found (log) (line 149)
- [a9883f37-154-console] **inconsistency** (low): Console statement found (error) (line 154)
- [a9883f37-185-console] **inconsistency** (low): Console statement found (log) (line 185)
- [a9883f37-221-console] **inconsistency** (low): Console statement found (log) (line 221)
- [a9883f37-224-console] **inconsistency** (low): Console statement found (warn) (line 224)
- [a9883f37-281-console] **inconsistency** (low): Console statement found (warn) (line 281)
- [a9883f37-365-console] **inconsistency** (low): Console statement found (log) (line 365)
- [a9883f37-367-console] **inconsistency** (low): Console statement found (warn) (line 367)

### phase-15a-cicd-devops.ts
- [4126bd0b-125-console] **inconsistency** (low): Console statement found (log) (line 125)
- [4126bd0b-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [4126bd0b-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [4126bd0b-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [4126bd0b-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [4126bd0b-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [4126bd0b-161-console] **inconsistency** (low): Console statement found (log) (line 161)
- [4126bd0b-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [4126bd0b-163-console] **inconsistency** (low): Console statement found (log) (line 163)
- [4126bd0b-164-console] **inconsistency** (low): Console statement found (log) (line 164)
- [4126bd0b-165-console] **inconsistency** (low): Console statement found (log) (line 165)
- [4126bd0b-166-console] **inconsistency** (low): Console statement found (log) (line 166)
- [4126bd0b-167-console] **inconsistency** (low): Console statement found (log) (line 167)
- [4126bd0b-180-console] **inconsistency** (low): Console statement found (error) (line 180)
- [4126bd0b-687-console] **inconsistency** (low): Console statement found (log) (line 687)
- [4126bd0b-689-console] **inconsistency** (low): Console statement found (warn) (line 689)

### phase-15-devops-suite.ts
- [af3f651c-3161-complexity-length] **complexity** (critical): Function 'anonymous' is too long (448 lines, max: 50)
- [af3f651c-3161-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [af3f651c-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [af3f651c-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [af3f651c-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [af3f651c-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [af3f651c-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [af3f651c-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [af3f651c-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [af3f651c-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [af3f651c-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [af3f651c-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [af3f651c-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [af3f651c-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [af3f651c-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [af3f651c-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [af3f651c-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [af3f651c-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [af3f651c-195-console] **inconsistency** (low): Console statement found (error) (line 195)
- [af3f651c-282-console] **inconsistency** (low): Console statement found (warn) (line 282)
- [af3f651c-290-console] **inconsistency** (low): Console statement found (warn) (line 290)
- [af3f651c-302-console] **inconsistency** (low): Console statement found (warn) (line 302)

### phase-14b-git-repo-hygiene.ts
- [595aeb50-3150-complexity-length] **complexity** (critical): Function 'anonymous' is too long (283 lines, max: 50)
- [595aeb50-3150-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [595aeb50-7628-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [595aeb50-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [595aeb50-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [595aeb50-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [595aeb50-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [595aeb50-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [595aeb50-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [595aeb50-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [595aeb50-167-console] **inconsistency** (low): Console statement found (log) (line 167)
- [595aeb50-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [595aeb50-174-console] **inconsistency** (low): Console statement found (log) (line 174)
- [595aeb50-177-console] **inconsistency** (low): Console statement found (log) (line 177)
- [595aeb50-179-console] **inconsistency** (low): Console statement found (log) (line 179)
- [595aeb50-183-console] **inconsistency** (low): Console statement found (log) (line 183)
- [595aeb50-184-console] **inconsistency** (low): Console statement found (log) (line 184)
- [595aeb50-201-console] **inconsistency** (low): Console statement found (log) (line 201)
- [595aeb50-202-console] **inconsistency** (low): Console statement found (log) (line 202)
- [595aeb50-203-console] **inconsistency** (low): Console statement found (log) (line 203)
- [595aeb50-226-console] **inconsistency** (low): Console statement found (error) (line 226)
- [595aeb50-294-console] **inconsistency** (low): Console statement found (warn) (line 294)
- [595aeb50-312-console] **inconsistency** (low): Console statement found (warn) (line 312)

### phase-14b-git-hygiene.ts
- [11a992de-4445-complexity-length] **complexity** (critical): Function 'anonymous' is too long (789 lines, max: 50)
- [11a992de-4445-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 10, max: 4)
- [11a992de-10061-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 5, max: 4)
- [11a992de-158-console] **inconsistency** (low): Console statement found (log) (line 158)
- [11a992de-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [11a992de-164-console] **inconsistency** (low): Console statement found (log) (line 164)
- [11a992de-165-console] **inconsistency** (low): Console statement found (log) (line 165)
- [11a992de-166-console] **inconsistency** (low): Console statement found (log) (line 166)
- [11a992de-169-console] **inconsistency** (low): Console statement found (log) (line 169)
- [11a992de-175-console] **inconsistency** (low): Console statement found (log) (line 175)
- [11a992de-233-console] **inconsistency** (low): Console statement found (log) (line 233)
- [11a992de-234-console] **inconsistency** (low): Console statement found (log) (line 234)
- [11a992de-235-console] **inconsistency** (low): Console statement found (log) (line 235)
- [11a992de-236-console] **inconsistency** (low): Console statement found (log) (line 236)
- [11a992de-237-console] **inconsistency** (low): Console statement found (log) (line 237)
- [11a992de-238-console] **inconsistency** (low): Console statement found (log) (line 238)
- [11a992de-239-console] **inconsistency** (low): Console statement found (log) (line 239)
- [11a992de-252-console] **inconsistency** (low): Console statement found (error) (line 252)
- [11a992de-913-console] **inconsistency** (low): Console statement found (log) (line 913)
- [11a992de-915-console] **inconsistency** (low): Console statement found (warn) (line 915)

### phase-14a-cloud-cost.ts
- [90d4ed0a-2176-complexity-length] **complexity** (critical): Function 'anonymous' is too long (139 lines, max: 50)
- [90d4ed0a-2176-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [90d4ed0a-86-console] **inconsistency** (low): Console statement found (log) (line 86)
- [90d4ed0a-92-console] **inconsistency** (low): Console statement found (log) (line 92)
- [90d4ed0a-111-console] **inconsistency** (low): Console statement found (log) (line 111)
- [90d4ed0a-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [90d4ed0a-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [90d4ed0a-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [90d4ed0a-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [90d4ed0a-137-console] **inconsistency** (low): Console statement found (log) (line 137)
- [90d4ed0a-142-console] **inconsistency** (low): Console statement found (error) (line 142)
- [90d4ed0a-203-console] **inconsistency** (low): Console statement found (log) (line 203)
- [90d4ed0a-205-console] **inconsistency** (low): Console statement found (warn) (line 205)

### phase-14a-cloud-cost-detection.ts
- [21a93f70-3132-complexity-length] **complexity** (critical): Function 'anonymous' is too long (413 lines, max: 50)
- [21a93f70-3132-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [21a93f70-102-console] **inconsistency** (low): Console statement found (log) (line 102)
- [21a93f70-103-console] **inconsistency** (low): Console statement found (log) (line 103)
- [21a93f70-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [21a93f70-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [21a93f70-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [21a93f70-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [21a93f70-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [21a93f70-139-console] **inconsistency** (low): Console statement found (log) (line 139)
- [21a93f70-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [21a93f70-144-console] **inconsistency** (low): Console statement found (log) (line 144)
- [21a93f70-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [21a93f70-150-console] **inconsistency** (low): Console statement found (log) (line 150)
- [21a93f70-151-console] **inconsistency** (low): Console statement found (log) (line 151)
- [21a93f70-168-console] **inconsistency** (low): Console statement found (log) (line 168)
- [21a93f70-169-console] **inconsistency** (low): Console statement found (log) (line 169)
- [21a93f70-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [21a93f70-192-console] **inconsistency** (low): Console statement found (error) (line 192)
- [21a93f70-279-console] **inconsistency** (low): Console statement found (warn) (line 279)
- [21a93f70-287-console] **inconsistency** (low): Console statement found (warn) (line 287)
- [21a93f70-299-console] **inconsistency** (low): Console statement found (warn) (line 299)

### phase-13b-predictive-bugs.ts
- [79660b39-2010-complexity-length] **complexity** (critical): Function 'anonymous' is too long (193 lines, max: 50)
- [79660b39-2010-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [79660b39-84-console] **inconsistency** (low): Console statement found (log) (line 84)
- [79660b39-90-console] **inconsistency** (low): Console statement found (log) (line 90)
- [79660b39-108-console] **inconsistency** (low): Console statement found (log) (line 108)
- [79660b39-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [79660b39-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [79660b39-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [79660b39-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [79660b39-136-console] **inconsistency** (low): Console statement found (error) (line 136)
- [79660b39-255-console] **inconsistency** (low): Console statement found (log) (line 255)
- [79660b39-257-console] **inconsistency** (low): Console statement found (warn) (line 257)

### phase-13a-i18n-l10n.ts
- [d8c76e10-3420-complexity-length] **complexity** (critical): Function 'anonymous' is too long (846 lines, max: 50)
- [d8c76e10-3420-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [d8c76e10-11060-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 7, max: 4)
- [d8c76e10-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [d8c76e10-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [d8c76e10-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [d8c76e10-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [d8c76e10-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [d8c76e10-137-console] **inconsistency** (low): Console statement found (log) (line 137)
- [d8c76e10-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [d8c76e10-192-console] **inconsistency** (low): Console statement found (log) (line 192)
- [d8c76e10-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [d8c76e10-208-console] **inconsistency** (low): Console statement found (log) (line 208)
- [d8c76e10-212-console] **inconsistency** (low): Console statement found (log) (line 212)
- [d8c76e10-214-console] **inconsistency** (low): Console statement found (log) (line 214)
- [d8c76e10-253-console] **inconsistency** (low): Console statement found (log) (line 253)
- [d8c76e10-254-console] **inconsistency** (low): Console statement found (log) (line 254)
- [d8c76e10-255-console] **inconsistency** (low): Console statement found (log) (line 255)
- [d8c76e10-256-console] **inconsistency** (low): Console statement found (log) (line 256)
- [d8c76e10-257-console] **inconsistency** (low): Console statement found (log) (line 257)
- [d8c76e10-258-console] **inconsistency** (low): Console statement found (log) (line 258)
- [d8c76e10-259-console] **inconsistency** (low): Console statement found (log) (line 259)
- [d8c76e10-260-console] **inconsistency** (low): Console statement found (log) (line 260)
- [d8c76e10-273-console] **inconsistency** (low): Console statement found (error) (line 273)
- [d8c76e10-906-console] **inconsistency** (low): Console statement found (log) (line 906)
- [d8c76e10-908-console] **inconsistency** (low): Console statement found (warn) (line 908)
- [d8c76e10-948-console] **inconsistency** (low): Console statement found (log) (line 948)
- [d8c76e10-949-console] **inconsistency** (low): Console statement found (log) (line 949)
- [d8c76e10-951-console] **inconsistency** (low): Console statement found (log) (line 951)
- [d8c76e10-954-console] **inconsistency** (low): Console statement found (log) (line 954)

### phase-12-resilience-obs.ts
- [cc2b641e-3290-complexity-length] **complexity** (critical): Function 'anonymous' is too long (407 lines, max: 50)
- [cc2b641e-3290-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 11, max: 4)
- [cc2b641e-6874-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [cc2b641e-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [cc2b641e-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [cc2b641e-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [cc2b641e-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [cc2b641e-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [cc2b641e-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [cc2b641e-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [cc2b641e-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [cc2b641e-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [cc2b641e-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [cc2b641e-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [cc2b641e-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [cc2b641e-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [cc2b641e-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [cc2b641e-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [cc2b641e-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [cc2b641e-195-console] **inconsistency** (low): Console statement found (error) (line 195)
- [cc2b641e-251-console] **inconsistency** (low): Console statement found (warn) (line 251)
- [cc2b641e-259-console] **inconsistency** (low): Console statement found (warn) (line 259)
- [cc2b641e-271-console] **inconsistency** (low): Console statement found (warn) (line 271)
- [cc2b641e-320-console] **inconsistency** (low): Console statement found (error) (line 320)
- [cc2b641e-321-console] **inconsistency** (low): Console statement found (error) (line 321)
- [cc2b641e-385-console] **inconsistency** (low): Console statement found (log) (line 385)
- [cc2b641e-396-console] **inconsistency** (low): Console statement found (log) (line 396)

### phase-12-error-handling.ts
- [c9adeb82-4466-complexity-length] **complexity** (critical): Function 'anonymous' is too long (426 lines, max: 50)
- [c9adeb82-4466-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 11, max: 4)
- [c9adeb82-12857-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 7, max: 4)
- [c9adeb82-137-console] **inconsistency** (low): Console statement found (log) (line 137)
- [c9adeb82-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [c9adeb82-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [c9adeb82-144-console] **inconsistency** (low): Console statement found (log) (line 144)
- [c9adeb82-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [c9adeb82-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [c9adeb82-154-console] **inconsistency** (low): Console statement found (log) (line 154)
- [c9adeb82-219-console] **inconsistency** (low): Console statement found (log) (line 219)
- [c9adeb82-227-console] **inconsistency** (low): Console statement found (log) (line 227)
- [c9adeb82-233-console] **inconsistency** (low): Console statement found (log) (line 233)
- [c9adeb82-235-console] **inconsistency** (low): Console statement found (log) (line 235)
- [c9adeb82-280-console] **inconsistency** (low): Console statement found (log) (line 280)
- [c9adeb82-281-console] **inconsistency** (low): Console statement found (log) (line 281)
- [c9adeb82-282-console] **inconsistency** (low): Console statement found (log) (line 282)
- [c9adeb82-283-console] **inconsistency** (low): Console statement found (log) (line 283)
- [c9adeb82-284-console] **inconsistency** (low): Console statement found (log) (line 284)
- [c9adeb82-285-console] **inconsistency** (low): Console statement found (log) (line 285)
- [c9adeb82-286-console] **inconsistency** (low): Console statement found (log) (line 286)
- [c9adeb82-287-console] **inconsistency** (low): Console statement found (log) (line 287)
- [c9adeb82-288-console] **inconsistency** (low): Console statement found (log) (line 288)
- [c9adeb82-289-console] **inconsistency** (low): Console statement found (log) (line 289)
- [c9adeb82-302-console] **inconsistency** (low): Console statement found (error) (line 302)
- [c9adeb82-404-console] **inconsistency** (low): Console statement found (log) (line 404)
- [c9adeb82-421-console] **inconsistency** (low): Console statement found (log) (line 421)
- [c9adeb82-427-console] **inconsistency** (low): Console statement found (log) (line 427)
- [c9adeb82-435-console] **inconsistency** (low): Console statement found (log) (line 435)
- [c9adeb82-826-console] **inconsistency** (low): Console statement found (log) (line 826)
- [c9adeb82-828-console] **inconsistency** (low): Console statement found (warn) (line 828)
- [c9adeb82-882-console] **inconsistency** (low): Console statement found (log) (line 882)
- [c9adeb82-883-console] **inconsistency** (low): Console statement found (log) (line 883)
- [c9adeb82-885-console] **inconsistency** (low): Console statement found (log) (line 885)
- [c9adeb82-888-console] **inconsistency** (low): Console statement found (log) (line 888)

### phase-11-ci-cd.ts
- [5d3b5ac4-3085-complexity-length] **complexity** (critical): Function 'anonymous' is too long (425 lines, max: 50)
- [5d3b5ac4-3085-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [5d3b5ac4-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [5d3b5ac4-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [5d3b5ac4-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [5d3b5ac4-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [5d3b5ac4-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [5d3b5ac4-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [5d3b5ac4-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [5d3b5ac4-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [5d3b5ac4-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [5d3b5ac4-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [5d3b5ac4-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [5d3b5ac4-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [5d3b5ac4-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [5d3b5ac4-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [5d3b5ac4-171-console] **inconsistency** (low): Console statement found (log) (line 171)
- [5d3b5ac4-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [5d3b5ac4-195-console] **inconsistency** (low): Console statement found (error) (line 195)
- [5d3b5ac4-273-console] **inconsistency** (low): Console statement found (warn) (line 273)
- [5d3b5ac4-281-console] **inconsistency** (low): Console statement found (warn) (line 281)
- [5d3b5ac4-293-console] **inconsistency** (low): Console statement found (warn) (line 293)

### phase-11-atomic-fixes.ts
- [5d35f977-3713-complexity-length] **complexity** (critical): Function 'anonymous' is too long (887 lines, max: 50)
- [5d35f977-3713-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [5d35f977-39427-complexity-nesting] **complexity** (high): Function 'findFilesRecursive' has excessive nesting (depth: 5, max: 4)
- [5d35f977-654-any] **any** (medium): Unnecessary use of "any" type (line 654)
- [5d35f977-140-console] **inconsistency** (low): Console statement found (log) (line 140)
- [5d35f977-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [5d35f977-142-console] **inconsistency** (low): Console statement found (log) (line 142)
- [5d35f977-143-console] **inconsistency** (low): Console statement found (log) (line 143)
- [5d35f977-146-console] **inconsistency** (low): Console statement found (log) (line 146)
- [5d35f977-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [5d35f977-181-console] **inconsistency** (low): Console statement found (log) (line 181)
- [5d35f977-190-console] **inconsistency** (low): Console statement found (log) (line 190)
- [5d35f977-203-console] **inconsistency** (low): Console statement found (log) (line 203)
- [5d35f977-204-console] **inconsistency** (low): Console statement found (log) (line 204)
- [5d35f977-205-console] **inconsistency** (low): Console statement found (log) (line 205)
- [5d35f977-206-console] **inconsistency** (low): Console statement found (log) (line 206)
- [5d35f977-207-console] **inconsistency** (low): Console statement found (log) (line 207)
- [5d35f977-208-console] **inconsistency** (low): Console statement found (log) (line 208)
- [5d35f977-209-console] **inconsistency** (low): Console statement found (log) (line 209)
- [5d35f977-220-console] **inconsistency** (low): Console statement found (error) (line 220)
- [5d35f977-273-console] **inconsistency** (low): Console statement found (log) (line 273)
- [5d35f977-402-console] **inconsistency** (low): Console statement found (log) (line 402)
- [5d35f977-404-console] **inconsistency** (low): Console statement found (log) (line 404)
- [5d35f977-407-console] **inconsistency** (low): Console statement found (log) (line 407)
- [5d35f977-409-console] **inconsistency** (low): Console statement found (log) (line 409)
- [5d35f977-496-console] **inconsistency** (low): Console statement found (log) (line 496)
- [5d35f977-498-console] **inconsistency** (low): Console statement found (log) (line 498)
- [5d35f977-501-console] **inconsistency** (low): Console statement found (log) (line 501)
- [5d35f977-503-console] **inconsistency** (low): Console statement found (log) (line 503)
- [5d35f977-520-console] **inconsistency** (low): Console statement found (log) (line 520)
- [5d35f977-526-console] **inconsistency** (low): Console statement found (log) (line 526)
- [5d35f977-533-console] **inconsistency** (low): Console statement found (log) (line 533)
- [5d35f977-568-console] **inconsistency** (low): Console statement found (log) (line 568)
- [5d35f977-582-console] **inconsistency** (low): Console statement found (log) (line 582)
- [5d35f977-706-console] **inconsistency** (low): Console statement found (log) (line 706)
- [5d35f977-708-console] **inconsistency** (low): Console statement found (log) (line 708)
- [5d35f977-711-console] **inconsistency** (low): Console statement found (log) (line 711)
- [5d35f977-713-console] **inconsistency** (low): Console statement found (log) (line 713)
- [5d35f977-829-console] **inconsistency** (low): Console statement found (log) (line 829)
- [5d35f977-838-console] **inconsistency** (low): Console statement found (log) (line 838)
- [5d35f977-841-console] **inconsistency** (low): Console statement found (log) (line 841)
- [5d35f977-844-console] **inconsistency** (low): Console statement found (warn) (line 844)
- [5d35f977-990-console] **inconsistency** (low): Console statement found (error) (line 990)
- [5d35f977-999-console] **inconsistency** (low): Console statement found (log) (line 999)
- [5d35f977-1002-console] **inconsistency** (low): Console statement found (error) (line 1002)
- [5d35f977-1019-console] **inconsistency** (low): Console statement found (log) (line 1019)
- [5d35f977-1024-console] **inconsistency** (low): Console statement found (log) (line 1024)
- [5d35f977-1027-console] **inconsistency** (low): Console statement found (log) (line 1027)
- [5d35f977-1031-console] **inconsistency** (low): Console statement found (log) (line 1031)
- [5d35f977-1036-console] **inconsistency** (low): Console statement found (log) (line 1036)
- [5d35f977-1040-console] **inconsistency** (low): Console statement found (log) (line 1040)
- [5d35f977-1067-console] **inconsistency** (low): Console statement found (log) (line 1067)
- [5d35f977-1081-console] **inconsistency** (low): Console statement found (log) (line 1081)
- [5d35f977-1083-console] **inconsistency** (low): Console statement found (log) (line 1083)
- [5d35f977-1096-console] **inconsistency** (low): Console statement found (error) (line 1096)
- [5d35f977-1104-console] **inconsistency** (low): Console statement found (log) (line 1104)
- [5d35f977-1106-console] **inconsistency** (low): Console statement found (error) (line 1106)
- [5d35f977-1253-console] **inconsistency** (low): Console statement found (log) (line 1253)
- [5d35f977-1255-console] **inconsistency** (low): Console statement found (warn) (line 1255)

### phase-10-testing.ts
- [d338c9f5-6682-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [d338c9f5-7915-complexity-nesting] **complexity** (high): Function 'searchDir' has excessive nesting (depth: 6, max: 4)
- [d338c9f5-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [d338c9f5-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [d338c9f5-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [d338c9f5-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [d338c9f5-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [d338c9f5-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [d338c9f5-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [d338c9f5-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [d338c9f5-144-console] **inconsistency** (low): Console statement found (log) (line 144)
- [d338c9f5-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [d338c9f5-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [d338c9f5-150-console] **inconsistency** (low): Console statement found (log) (line 150)
- [d338c9f5-154-console] **inconsistency** (low): Console statement found (log) (line 154)
- [d338c9f5-155-console] **inconsistency** (low): Console statement found (log) (line 155)
- [d338c9f5-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [d338c9f5-173-console] **inconsistency** (low): Console statement found (log) (line 173)
- [d338c9f5-174-console] **inconsistency** (low): Console statement found (log) (line 174)
- [d338c9f5-197-console] **inconsistency** (low): Console statement found (error) (line 197)
- [d338c9f5-310-console] **inconsistency** (low): Console statement found (warn) (line 310)
- [d338c9f5-318-console] **inconsistency** (low): Console statement found (warn) (line 318)
- [d338c9f5-330-console] **inconsistency** (low): Console statement found (warn) (line 330)

### phase-10-env-cicd.ts
- [9d618eb5-2683-complexity-length] **complexity** (critical): Function 'anonymous' is too long (519 lines, max: 50)
- [9d618eb5-2683-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 10, max: 4)
- [9d618eb5-318-any] **any** (medium): Unnecessary use of "any" type (line 318)
- [9d618eb5-322-any] **any** (medium): Unnecessary use of "any" type (line 322)
- [9d618eb5-102-console] **inconsistency** (low): Console statement found (log) (line 102)
- [9d618eb5-109-console] **inconsistency** (low): Console statement found (log) (line 109)
- [9d618eb5-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [9d618eb5-149-console] **inconsistency** (low): Console statement found (log) (line 149)
- [9d618eb5-150-console] **inconsistency** (low): Console statement found (log) (line 150)
- [9d618eb5-151-console] **inconsistency** (low): Console statement found (log) (line 151)
- [9d618eb5-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [9d618eb5-157-console] **inconsistency** (low): Console statement found (error) (line 157)
- [9d618eb5-601-console] **inconsistency** (low): Console statement found (log) (line 601)
- [9d618eb5-603-console] **inconsistency** (low): Console statement found (warn) (line 603)

### phase-1-code-quality.ts
- [34dd7ef5-12232-complexity-length] **complexity** (high): Function 'definitions' is too long (58 lines, max: 50)
- [34dd7ef5-12232-complexity-nesting] **complexity** (high): Function 'definitions' has excessive nesting (depth: 6, max: 4)
- [34dd7ef5-13224-complexity-nesting] **complexity** (high): Function 'length' has excessive nesting (depth: 5, max: 4)
- [34dd7ef5-19885-complexity-nesting] **complexity** (high): Function 'names' has excessive nesting (depth: 5, max: 4)
- [34dd7ef5-142-console] **inconsistency** (low): Console statement found (log) (line 142)
- [34dd7ef5-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [34dd7ef5-213-console] **inconsistency** (low): Console statement found (log) (line 213)
- [34dd7ef5-214-console] **inconsistency** (low): Console statement found (log) (line 214)
- [34dd7ef5-215-console] **inconsistency** (low): Console statement found (log) (line 215)
- [34dd7ef5-216-console] **inconsistency** (low): Console statement found (log) (line 216)
- [34dd7ef5-217-console] **inconsistency** (low): Console statement found (log) (line 217)
- [34dd7ef5-230-console] **inconsistency** (low): Console statement found (error) (line 230)
- [34dd7ef5-329-console] **inconsistency** (low): Console statement found (log) (line 329)
- [34dd7ef5-368-console] **inconsistency** (low): Console statement found (warn) (line 368)
- [34dd7ef5-544-console] **inconsistency** (low): Console statement found (log) (line 544)
- [34dd7ef5-715-console] **inconsistency** (low): Console statement found (log) (line 715)
- [34dd7ef5-717-console] **inconsistency** (low): Console statement found (warn) (line 717)

### phase-0-setup.ts
- [d2b63928-3781-complexity-length] **complexity** (critical): Function 'anonymous' is too long (525 lines, max: 50)
- [d2b63928-3781-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [d2b63928-290-any] **any** (medium): Unnecessary use of "any" type (line 290)
- [d2b63928-136-console] **inconsistency** (low): Console statement found (error) (line 136)
- [d2b63928-155-console] **inconsistency** (low): Console statement found (log) (line 155)
- [d2b63928-159-console] **inconsistency** (low): Console statement found (log) (line 159)
- [d2b63928-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [d2b63928-175-console] **inconsistency** (low): Console statement found (log) (line 175)
- [d2b63928-188-console] **inconsistency** (low): Console statement found (log) (line 188)
- [d2b63928-191-console] **inconsistency** (low): Console statement found (log) (line 191)
- [d2b63928-204-console] **inconsistency** (low): Console statement found (log) (line 204)
- [d2b63928-207-console] **inconsistency** (low): Console statement found (log) (line 207)
- [d2b63928-212-console] **inconsistency** (low): Console statement found (error) (line 212)
- [d2b63928-215-console] **inconsistency** (low): Console statement found (error) (line 215)
- [d2b63928-217-console] **inconsistency** (low): Console statement found (error) (line 217)
- [d2b63928-222-console] **inconsistency** (low): Console statement found (error) (line 222)
- [d2b63928-226-console] **inconsistency** (low): Console statement found (error) (line 226)
- [d2b63928-336-console] **inconsistency** (low): Console statement found (log) (line 336)
- [d2b63928-338-console] **inconsistency** (low): Console statement found (warn) (line 338)
- [d2b63928-527-console] **inconsistency** (low): Console statement found (warn) (line 527)

### test-security.ts
- [92941ab6-5624-complexity-nesting] **complexity** (high): Function 'createInsecureConfig' has excessive nesting (depth: 5, max: 4)
- [92941ab6-6680-complexity-length] **complexity** (critical): Function 'runSecurityScannerTests' is too long (189 lines, max: 50)
- [92941ab6-6680-complexity-nesting] **complexity** (high): Function 'runSecurityScannerTests' has excessive nesting (depth: 6, max: 4)
- [92941ab6-21-any] **any** (medium): Unnecessary use of "any" type (line 21)
- [92941ab6-27-any] **any** (medium): Unnecessary use of "any" type (line 27)
- [92941ab6-132-any] **any** (medium): Unnecessary use of "any" type (line 132)
- [92941ab6-105-unused] **unused** (low): Variable 'fetchData' might be unused (line 105)
- [92941ab6-253-console] **inconsistency** (low): Console statement found (log) (line 253)
- [92941ab6-263-console] **inconsistency** (low): Console statement found (log) (line 263)
- [92941ab6-283-console] **inconsistency** (low): Console statement found (log) (line 283)
- [92941ab6-291-console] **inconsistency** (low): Console statement found (log) (line 291)
- [92941ab6-295-console] **inconsistency** (low): Console statement found (log) (line 295)
- [92941ab6-314-console] **inconsistency** (low): Console statement found (log) (line 314)
- [92941ab6-322-console] **inconsistency** (low): Console statement found (log) (line 322)
- [92941ab6-326-console] **inconsistency** (low): Console statement found (log) (line 326)
- [92941ab6-346-console] **inconsistency** (low): Console statement found (log) (line 346)
- [92941ab6-354-console] **inconsistency** (low): Console statement found (log) (line 354)
- [92941ab6-358-console] **inconsistency** (low): Console statement found (log) (line 358)
- [92941ab6-368-console] **inconsistency** (low): Console statement found (log) (line 368)
- [92941ab6-376-console] **inconsistency** (low): Console statement found (log) (line 376)
- [92941ab6-382-console] **inconsistency** (low): Console statement found (log) (line 382)
- [92941ab6-384-console] **inconsistency** (low): Console statement found (log) (line 384)
- [92941ab6-404-console] **inconsistency** (low): Console statement found (log) (line 404)
- [92941ab6-412-console] **inconsistency** (low): Console statement found (log) (line 412)
- [92941ab6-421-console] **inconsistency** (low): Console statement found (log) (line 421)
- [92941ab6-422-console] **inconsistency** (low): Console statement found (log) (line 422)
- [92941ab6-423-console] **inconsistency** (low): Console statement found (log) (line 423)
- [92941ab6-424-console] **inconsistency** (low): Console statement found (log) (line 424)
- [92941ab6-428-console] **inconsistency** (low): Console statement found (log) (line 428)
- [92941ab6-430-console] **inconsistency** (low): Console statement found (log) (line 430)
- [92941ab6-436-console] **inconsistency** (low): Console statement found (log) (line 436)
- [92941ab6-438-console] **inconsistency** (low): Console statement found (log) (line 438)
- [92941ab6-443-console] **inconsistency** (low): Console statement found (error) (line 443)
- [92941ab6-103-naming-pascal] **naming** (medium): Function 'ClientComponent' uses PascalCase instead of camelCase (line 103)

### style-auditor.ts
- [ea520cc0-559-console] **inconsistency** (low): Console statement found (log) (line 559)
- [ea520cc0-565-console] **inconsistency** (low): Console statement found (warn) (line 565)
- [ea520cc0-574-console] **inconsistency** (low): Console statement found (log) (line 574)
- [ea520cc0-595-console] **inconsistency** (low): Console statement found (log) (line 595)
- [ea520cc0-654-console] **inconsistency** (low): Console statement found (warn) (line 654)
- [ea520cc0-708-console] **inconsistency** (low): Console statement found (warn) (line 708)

### security-scanner.ts
- [836790dc-2695-complexity-length] **complexity** (critical): Function 'anonymous' is too long (602 lines, max: 50)
- [836790dc-2695-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [836790dc-151-console] **inconsistency** (low): Console statement found (log) (line 151)
- [836790dc-157-console] **inconsistency** (low): Console statement found (warn) (line 157)
- [836790dc-166-console] **inconsistency** (low): Console statement found (log) (line 166)
- [836790dc-173-console] **inconsistency** (low): Console statement found (log) (line 173)
- [836790dc-180-console] **inconsistency** (low): Console statement found (log) (line 180)
- [836790dc-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [836790dc-209-console] **inconsistency** (low): Console statement found (log) (line 209)
- [836790dc-266-console] **inconsistency** (low): Console statement found (warn) (line 266)
- [836790dc-307-console] **inconsistency** (low): Console statement found (warn) (line 307)
- [836790dc-368-console] **inconsistency** (low): Console statement found (warn) (line 368)

### report-aggregator.ts
- [34a63c8b-1050-complexity-length] **complexity** (critical): Function 'anonymous' is too long (295 lines, max: 50)
- [34a63c8b-1050-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [34a63c8b-17-any] **any** (medium): Unnecessary use of "any" type (line 17)
- [34a63c8b-50-any] **any** (medium): Unnecessary use of "any" type (line 50)
- [34a63c8b-51-any] **any** (medium): Unnecessary use of "any" type (line 51)

### predictive-bug-detection.ts
- [595fe317-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [595fe317-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [595fe317-156-console] **inconsistency** (low): Console statement found (log) (line 156)
- [595fe317-167-console] **inconsistency** (low): Console statement found (log) (line 167)

### ollama-processor.ts
- [add9c74f-55-console] **inconsistency** (low): Console statement found (log) (line 55)
- [add9c74f-58-console] **inconsistency** (low): Console statement found (log) (line 58)
- [add9c74f-59-console] **inconsistency** (low): Console statement found (log) (line 59)
- [add9c74f-61-console] **inconsistency** (low): Console statement found (error) (line 61)
- [add9c74f-62-console] **inconsistency** (low): Console statement found (error) (line 62)
- [add9c74f-65-console] **inconsistency** (low): Console statement found (log) (line 65)
- [add9c74f-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [add9c74f-73-console] **inconsistency** (low): Console statement found (log) (line 73)
- [add9c74f-74-console] **inconsistency** (low): Console statement found (log) (line 74)
- [add9c74f-83-console] **inconsistency** (low): Console statement found (log) (line 83)
- [add9c74f-84-console] **inconsistency** (low): Console statement found (log) (line 84)
- [add9c74f-93-console] **inconsistency** (low): Console statement found (log) (line 93)
- [add9c74f-115-console] **inconsistency** (low): Console statement found (error) (line 115)
- [add9c74f-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [add9c74f-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [add9c74f-125-console] **inconsistency** (low): Console statement found (log) (line 125)
- [add9c74f-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [add9c74f-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [add9c74f-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [add9c74f-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [add9c74f-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [add9c74f-183-console] **inconsistency** (low): Console statement found (warn) (line 183)
- [add9c74f-192-console] **inconsistency** (low): Console statement found (log) (line 192)
- [add9c74f-219-console] **inconsistency** (low): Console statement found (warn) (line 219)
- [add9c74f-228-console] **inconsistency** (low): Console statement found (warn) (line 228)
- [add9c74f-262-console] **inconsistency** (low): Console statement found (warn) (line 262)
- [add9c74f-268-console] **inconsistency** (low): Console statement found (warn) (line 268)
- [add9c74f-322-console] **inconsistency** (low): Console statement found (log) (line 322)
- [add9c74f-323-console] **inconsistency** (low): Console statement found (log) (line 323)
- [add9c74f-324-console] **inconsistency** (low): Console statement found (log) (line 324)
- [add9c74f-325-console] **inconsistency** (low): Console statement found (log) (line 325)
- [add9c74f-328-console] **inconsistency** (low): Console statement found (log) (line 328)
- [add9c74f-337-console] **inconsistency** (low): Console statement found (log) (line 337)
- [add9c74f-345-console] **inconsistency** (low): Console statement found (log) (line 345)
- [add9c74f-357-console] **inconsistency** (low): Console statement found (log) (line 357)
- [add9c74f-364-console] **inconsistency** (low): Console statement found (log) (line 364)
- [add9c74f-376-console] **inconsistency** (low): Console statement found (error) (line 376)
- [add9c74f-385-console] **inconsistency** (low): Console statement found (log) (line 385)
- [add9c74f-410-console] **inconsistency** (low): Console statement found (error) (line 410)
- [add9c74f-411-console] **inconsistency** (low): Console statement found (error) (line 411)
- [add9c74f-412-console] **inconsistency** (low): Console statement found (error) (line 412)
- [add9c74f-415-console] **inconsistency** (low): Console statement found (error) (line 415)
- [add9c74f-418-console] **inconsistency** (low): Console statement found (error) (line 418)
- [add9c74f-421-console] **inconsistency** (low): Console statement found (error) (line 421)
- [add9c74f-470-console] **inconsistency** (low): Console statement found (log) (line 470)
- [add9c74f-471-console] **inconsistency** (low): Console statement found (log) (line 471)
- [add9c74f-472-console] **inconsistency** (low): Console statement found (log) (line 472)
- [add9c74f-473-console] **inconsistency** (low): Console statement found (log) (line 473)
- [add9c74f-474-console] **inconsistency** (low): Console statement found (log) (line 474)
- [add9c74f-475-console] **inconsistency** (low): Console statement found (log) (line 475)
- [add9c74f-479-console] **inconsistency** (low): Console statement found (log) (line 479)
- [add9c74f-482-console] **inconsistency** (low): Console statement found (log) (line 482)
- [add9c74f-483-console] **inconsistency** (low): Console statement found (log) (line 483)
- [add9c74f-485-console] **inconsistency** (low): Console statement found (error) (line 485)
- [add9c74f-486-console] **inconsistency** (low): Console statement found (error) (line 486)
- [add9c74f-487-console] **inconsistency** (low): Console statement found (error) (line 487)
- [add9c74f-491-console] **inconsistency** (low): Console statement found (error) (line 491)
- [add9c74f-494-console] **inconsistency** (low): Console statement found (error) (line 494)
- [add9c74f-562-console] **inconsistency** (low): Console statement found (log) (line 562)

### domain-inference.ts
- [05dc362a-996-complexity-length] **complexity** (critical): Function 'anonymous' is too long (460 lines, max: 50)
- [05dc362a-996-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [05dc362a-56-console] **inconsistency** (low): Console statement found (log) (line 56)
- [05dc362a-63-console] **inconsistency** (low): Console statement found (log) (line 63)
- [05dc362a-90-console] **inconsistency** (low): Console statement found (log) (line 90)
- [05dc362a-91-console] **inconsistency** (low): Console statement found (log) (line 91)
- [05dc362a-92-console] **inconsistency** (low): Console statement found (log) (line 92)
- [05dc362a-148-console] **inconsistency** (low): Console statement found (warn) (line 148)

### db-seeder.ts
- [eb932e54-1079-complexity-length] **complexity** (critical): Function 'anonymous' is too long (271 lines, max: 50)
- [eb932e54-1079-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [eb932e54-135-console] **inconsistency** (low): Console statement found (warn) (line 135)
- [eb932e54-153-console] **inconsistency** (low): Console statement found (warn) (line 153)
- [eb932e54-160-console] **inconsistency** (low): Console statement found (log) (line 160)
- [eb932e54-161-console] **inconsistency** (low): Console statement found (log) (line 161)
- [eb932e54-162-console] **inconsistency** (low): Console statement found (log) (line 162)
- [eb932e54-201-console] **inconsistency** (low): Console statement found (error) (line 201)
- [eb932e54-205-console] **inconsistency** (low): Console statement found (log) (line 205)
- [eb932e54-208-console] **inconsistency** (low): Console statement found (error) (line 208)
- [eb932e54-254-console] **inconsistency** (low): Console statement found (log) (line 254)
- [eb932e54-255-console] **inconsistency** (low): Console statement found (log) (line 255)
- [eb932e54-256-console] **inconsistency** (low): Console statement found (log) (line 256)
- [eb932e54-257-console] **inconsistency** (low): Console statement found (log) (line 257)
- [eb932e54-297-console] **inconsistency** (low): Console statement found (log) (line 297)
- [eb932e54-298-console] **inconsistency** (low): Console statement found (log) (line 298)
- [eb932e54-299-console] **inconsistency** (low): Console statement found (log) (line 299)
- [eb932e54-303-console] **inconsistency** (low): Console statement found (error) (line 303)

### code-reader.ts
- [4afa4386-2602-complexity-length] **complexity** (critical): Function 'anonymous' is too long (318 lines, max: 50)
- [4afa4386-2602-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [4afa4386-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [4afa4386-150-console] **inconsistency** (low): Console statement found (log) (line 150)
- [4afa4386-157-console] **inconsistency** (low): Console statement found (log) (line 157)
- [4afa4386-182-console] **inconsistency** (low): Console statement found (warn) (line 182)
- [4afa4386-187-console] **inconsistency** (low): Console statement found (warn) (line 187)
- [4afa4386-191-console] **inconsistency** (low): Console statement found (warn) (line 191)
- [4afa4386-195-console] **inconsistency** (low): Console statement found (log) (line 195)
- [4afa4386-217-console] **inconsistency** (low): Console statement found (warn) (line 217)
- [4afa4386-222-console] **inconsistency** (low): Console statement found (warn) (line 222)
- [4afa4386-225-console] **inconsistency** (low): Console statement found (log) (line 225)
- [4afa4386-422-console] **inconsistency** (low): Console statement found (warn) (line 422)
- [4afa4386-545-console] **inconsistency** (low): Console statement found (warn) (line 545)

### cloud-cost-detection.ts
- [fa8193e0-243-console] **inconsistency** (low): Console statement found (log) (line 243)
- [fa8193e0-398-console] **inconsistency** (low): Console statement found (log) (line 398)
- [fa8193e0-401-console] **inconsistency** (low): Console statement found (log) (line 401)

### auto-fixer.ts
- [b65581eb-689-complexity-length] **complexity** (critical): Function 'anonymous' is too long (424 lines, max: 50)
- [b65581eb-689-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 12, max: 4)
- [b65581eb-32-any] **any** (medium): Unnecessary use of "any" type (line 32)
- [b65581eb-33-any] **any** (medium): Unnecessary use of "any" type (line 33)
- [b65581eb-34-any] **any** (medium): Unnecessary use of "any" type (line 34)
- [b65581eb-97-any] **any** (medium): Unnecessary use of "any" type (line 97)
- [b65581eb-236-any] **any** (medium): Unnecessary use of "any" type (line 236)
- [b65581eb-339-any] **any** (medium): Unnecessary use of "any" type (line 339)
- [b65581eb-345-any] **any** (medium): Unnecessary use of "any" type (line 345)
- [b65581eb-49-console] **inconsistency** (low): Console statement found (log) (line 49)
- [b65581eb-62-console] **inconsistency** (low): Console statement found (log) (line 62)
- [b65581eb-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [b65581eb-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [b65581eb-82-console] **inconsistency** (low): Console statement found (log) (line 82)
- [b65581eb-110-console] **inconsistency** (low): Console statement found (log) (line 110)
- [b65581eb-148-console] **inconsistency** (low): Console statement found (log) (line 148)
- [b65581eb-161-console] **inconsistency** (low): Console statement found (warn) (line 161)
- [b65581eb-173-console] **inconsistency** (low): Console statement found (error) (line 173)
- [b65581eb-188-console] **inconsistency** (low): Console statement found (log) (line 188)
- [b65581eb-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [b65581eb-208-console] **inconsistency** (low): Console statement found (log) (line 208)
- [b65581eb-217-console] **inconsistency** (low): Console statement found (log) (line 217)
- [b65581eb-220-console] **inconsistency** (low): Console statement found (log) (line 220)
- [b65581eb-228-console] **inconsistency** (low): Console statement found (error) (line 228)
- [b65581eb-242-console] **inconsistency** (low): Console statement found (warn) (line 242)
- [b65581eb-289-console] **inconsistency** (low): Console statement found (log) (line 289)
- [b65581eb-310-console] **inconsistency** (low): Console statement found (log) (line 310)
- [b65581eb-321-console] **inconsistency** (low): Console statement found (error) (line 321)
- [b65581eb-373-console] **inconsistency** (low): Console statement found (log) (line 373)
- [b65581eb-379-console] **inconsistency** (low): Console statement found (error) (line 379)
- [b65581eb-396-console] **inconsistency** (low): Console statement found (log) (line 396)

### atomic-fixer.ts
- [0e00d379-61-any] **any** (medium): Unnecessary use of "any" type (line 61)
- [0e00d379-61-any] **any** (medium): Unnecessary use of "any" type (line 61)
- [0e00d379-93-any] **any** (medium): Unnecessary use of "any" type (line 93)
- [0e00d379-93-any] **any** (medium): Unnecessary use of "any" type (line 93)
- [0e00d379-147-any] **any** (medium): Unnecessary use of "any" type (line 147)
- [0e00d379-204-any] **any** (medium): Unnecessary use of "any" type (line 204)
- [0e00d379-233-any] **any** (medium): Unnecessary use of "any" type (line 233)
- [0e00d379-267-any] **any** (medium): Unnecessary use of "any" type (line 267)
- [0e00d379-321-console] **inconsistency** (low): Console statement found (log) (line 321)
- [0e00d379-327-console] **inconsistency** (low): Console statement found (log) (line 327)
- [0e00d379-482-console] **inconsistency** (low): Console statement found (error) (line 482)
- [0e00d379-499-console] **inconsistency** (low): Console statement found (error) (line 499)

### domain-analyzer.ts
- [3c2919c2-1748-complexity-length] **complexity** (critical): Function 'anonymous' is too long (395 lines, max: 50)
- [3c2919c2-1748-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [3c2919c2-16732-complexity-nesting] **complexity** (high): Function 'definitions' has excessive nesting (depth: 5, max: 4)
- [3c2919c2-20758-complexity-nesting] **complexity** (high): Function 'name' has excessive nesting (depth: 5, max: 4)
- [3c2919c2-330-any] **any** (medium): Unnecessary use of "any" type (line 330)
- [3c2919c2-53-console] **inconsistency** (low): Console statement found (log) (line 53)
- [3c2919c2-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [3c2919c2-992-console] **inconsistency** (low): Console statement found (warn) (line 992)
- [3c2919c2-999-console] **inconsistency** (low): Console statement found (warn) (line 999)

### predictive-bug-detection.ts
- [3f0a52af-221-console] **inconsistency** (low): Console statement found (warn) (line 221)

### cloud-cost-detection.ts
- [9f8f9354-229-console] **inconsistency** (low): Console statement found (warn) (line 229)

### atomic-fixer.ts
- [c3f87cbd-5136-complexity-nesting] **complexity** (high): Function 'declarations' has excessive nesting (depth: 5, max: 4)
- [c3f87cbd-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [c3f87cbd-120-console] **inconsistency** (low): Console statement found (log) (line 120)
- [c3f87cbd-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [c3f87cbd-129-console] **inconsistency** (low): Console statement found (error) (line 129)
- [c3f87cbd-129-console] **inconsistency** (low): Console statement found (warn) (line 129)
- [c3f87cbd-239-console] **inconsistency** (low): Console statement found (warn) (line 239)
- [c3f87cbd-250-console] **inconsistency** (low): Console statement found (error) (line 250)
- [c3f87cbd-266-console] **inconsistency** (low): Console statement found (warn) (line 266)

### thermal-controller.ts
- [dd83671e-3537-complexity-length] **complexity** (critical): Function 'anonymous' is too long (540 lines, max: 50)
- [dd83671e-3537-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [dd83671e-149-console] **inconsistency** (low): Console statement found (log) (line 149)
- [dd83671e-151-console] **inconsistency** (low): Console statement found (error) (line 151)
- [dd83671e-187-console] **inconsistency** (low): Console statement found (warn) (line 187)
- [dd83671e-230-console] **inconsistency** (low): Console statement found (log) (line 230)
- [dd83671e-235-console] **inconsistency** (low): Console statement found (warn) (line 235)
- [dd83671e-242-console] **inconsistency** (low): Console statement found (log) (line 242)
- [dd83671e-247-console] **inconsistency** (low): Console statement found (log) (line 247)
- [dd83671e-276-console] **inconsistency** (low): Console statement found (warn) (line 276)
- [dd83671e-346-console] **inconsistency** (low): Console statement found (log) (line 346)
- [dd83671e-348-console] **inconsistency** (low): Console statement found (error) (line 348)
- [dd83671e-381-console] **inconsistency** (low): Console statement found (warn) (line 381)
- [dd83671e-396-console] **inconsistency** (low): Console statement found (warn) (line 396)
- [dd83671e-431-console] **inconsistency** (low): Console statement found (log) (line 431)
- [dd83671e-535-console] **inconsistency** (low): Console statement found (warn) (line 535)
- [dd83671e-542-console] **inconsistency** (low): Console statement found (warn) (line 542)
- [dd83671e-579-console] **inconsistency** (low): Console statement found (log) (line 579)
- [dd83671e-580-console] **inconsistency** (low): Console statement found (log) (line 580)
- [dd83671e-588-console] **inconsistency** (low): Console statement found (log) (line 588)
- [dd83671e-597-console] **inconsistency** (low): Console statement found (log) (line 597)
- [dd83671e-613-console] **inconsistency** (low): Console statement found (log) (line 613)
- [dd83671e-618-console] **inconsistency** (low): Console statement found (log) (line 618)
- [dd83671e-623-console] **inconsistency** (low): Console statement found (warn) (line 623)
- [dd83671e-629-console] **inconsistency** (low): Console statement found (log) (line 629)
- [dd83671e-641-console] **inconsistency** (low): Console statement found (error) (line 641)

### system-resource-monitor.ts
- [93a9d460-85-console] **inconsistency** (low): Console statement found (log) (line 85)
- [93a9d460-88-console] **inconsistency** (low): Console statement found (log) (line 88)
- [93a9d460-119-console] **inconsistency** (low): Console statement found (warn) (line 119)
- [93a9d460-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [93a9d460-145-console] **inconsistency** (low): Console statement found (log) (line 145)
- [93a9d460-318-console] **inconsistency** (low): Console statement found (warn) (line 318)
- [93a9d460-339-console] **inconsistency** (low): Console statement found (warn) (line 339)
- [93a9d460-356-console] **inconsistency** (low): Console statement found (warn) (line 356)
- [93a9d460-373-console] **inconsistency** (low): Console statement found (warn) (line 373)

### state-persistence.ts
- [a3fb9cf4-3280-complexity-length] **complexity** (critical): Function 'anonymous' is too long (393 lines, max: 50)
- [a3fb9cf4-3280-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [a3fb9cf4-450-any] **any** (medium): Unnecessary use of "any" type (line 450)
- [a3fb9cf4-473-any] **any** (medium): Unnecessary use of "any" type (line 473)
- [a3fb9cf4-117-unused] **unused** (low): Variable 'restored' might be unused (line 117)
- [a3fb9cf4-410-unused] **unused** (low): Variable 'initialState' might be unused (line 410)
- [a3fb9cf4-166-console] **inconsistency** (low): Console statement found (log) (line 166)
- [a3fb9cf4-168-console] **inconsistency** (low): Console statement found (error) (line 168)
- [a3fb9cf4-185-console] **inconsistency** (low): Console statement found (log) (line 185)
- [a3fb9cf4-187-console] **inconsistency** (low): Console statement found (log) (line 187)
- [a3fb9cf4-200-console] **inconsistency** (low): Console statement found (log) (line 200)
- [a3fb9cf4-201-console] **inconsistency** (low): Console statement found (log) (line 201)
- [a3fb9cf4-202-console] **inconsistency** (low): Console statement found (log) (line 202)
- [a3fb9cf4-203-console] **inconsistency** (low): Console statement found (log) (line 203)
- [a3fb9cf4-207-console] **inconsistency** (low): Console statement found (error) (line 207)
- [a3fb9cf4-233-console] **inconsistency** (low): Console statement found (log) (line 233)
- [a3fb9cf4-236-console] **inconsistency** (low): Console statement found (error) (line 236)
- [a3fb9cf4-396-console] **inconsistency** (low): Console statement found (log) (line 396)
- [a3fb9cf4-469-console] **inconsistency** (low): Console statement found (log) (line 469)

### security-utils.ts
- [86172338-4712-complexity-nesting] **complexity** (high): Function 'createTimeout' has excessive nesting (depth: 6, max: 4)
- [86172338-5502-complexity-nesting] **complexity** (high): Function 'validateFilename' has excessive nesting (depth: 6, max: 4)
- [86172338-166-any] **any** (medium): Unnecessary use of "any" type (line 166)

### secret-manager.ts
- [68423f16-1395-complexity-length] **complexity** (critical): Function 'anonymous' is too long (480 lines, max: 50)
- [68423f16-1395-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [68423f16-44-unused] **unused** (low): Variable 'isValid' might be unused (line 44)
- [68423f16-534-unused] **unused** (low): Variable 'secretManager' might be unused (line 534)
- [68423f16-98-console] **inconsistency** (low): Console statement found (error) (line 98)
- [68423f16-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [68423f16-397-console] **inconsistency** (low): Console statement found (log) (line 397)
- [68423f16-398-console] **inconsistency** (low): Console statement found (log) (line 398)

### reporter.ts
- [0af849cf-1541-complexity-length] **complexity** (critical): Function 'anonymous' is too long (307 lines, max: 50)
- [0af849cf-1541-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [0af849cf-67-any] **any** (medium): Unnecessary use of "any" type (line 67)
- [0af849cf-121-any] **any** (medium): Unnecessary use of "any" type (line 121)

### ignore-handler.ts
- [7f8a53f7-1455-complexity-length] **complexity** (critical): Function 'anonymous' is too long (264 lines, max: 50)
- [7f8a53f7-1455-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [7f8a53f7-97-console] **inconsistency** (low): Console statement found (log) (line 97)
- [7f8a53f7-104-console] **inconsistency** (low): Console statement found (log) (line 104)
- [7f8a53f7-111-console] **inconsistency** (low): Console statement found (log) (line 111)
- [7f8a53f7-115-console] **inconsistency** (low): Console statement found (log) (line 115)
- [7f8a53f7-270-console] **inconsistency** (low): Console statement found (log) (line 270)
- [7f8a53f7-272-console] **inconsistency** (low): Console statement found (log) (line 272)
- [7f8a53f7-275-console] **inconsistency** (low): Console statement found (log) (line 275)

### file-filter.ts
- [43101027-1659-complexity-length] **complexity** (critical): Function 'anonymous' is too long (213 lines, max: 50)
- [43101027-1659-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [43101027-58-console] **inconsistency** (low): Console statement found (log) (line 58)
- [43101027-227-console] **inconsistency** (low): Console statement found (log) (line 227)
- [43101027-229-console] **inconsistency** (low): Console statement found (log) (line 229)
- [43101027-232-console] **inconsistency** (low): Console statement found (log) (line 232)

### cache-manager.ts
- [15a9f253-2730-complexity-length] **complexity** (critical): Function 'anonymous' is too long (416 lines, max: 50)
- [15a9f253-2730-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [15a9f253-161-any] **any** (medium): Unnecessary use of "any" type (line 161)
- [15a9f253-235-any] **any** (medium): Unnecessary use of "any" type (line 235)
- [15a9f253-307-any] **any** (medium): Unnecessary use of "any" type (line 307)
- [15a9f253-121-console] **inconsistency** (low): Console statement found (log) (line 121)
- [15a9f253-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [15a9f253-148-console] **inconsistency** (low): Console statement found (warn) (line 148)
- [15a9f253-183-console] **inconsistency** (low): Console statement found (warn) (line 183)
- [15a9f253-256-console] **inconsistency** (low): Console statement found (warn) (line 256)
- [15a9f253-324-console] **inconsistency** (low): Console statement found (warn) (line 324)
- [15a9f253-393-console] **inconsistency** (low): Console statement found (log) (line 393)
- [15a9f253-429-console] **inconsistency** (low): Console statement found (error) (line 429)
- [15a9f253-453-console] **inconsistency** (low): Console statement found (log) (line 453)
- [15a9f253-455-console] **inconsistency** (low): Console statement found (warn) (line 455)

### thermal-controller.ts
- [2fdce380-460-complexity-length] **complexity** (high): Function 'anonymous' is too long (53 lines, max: 50)

### test-security.ts
- [49c978ce-5830-complexity-nesting] **complexity** (high): Function 'createInsecureConfig' has excessive nesting (depth: 5, max: 4)
- [49c978ce-6931-complexity-length] **complexity** (critical): Function 'runSecurityScannerTests' is too long (189 lines, max: 50)
- [49c978ce-6931-complexity-nesting] **complexity** (high): Function 'runSecurityScannerTests' has excessive nesting (depth: 6, max: 4)
- [49c978ce-21-any] **any** (medium): Unnecessary use of "any" type (line 21)
- [49c978ce-27-any] **any** (medium): Unnecessary use of "any" type (line 27)
- [49c978ce-132-any] **any** (medium): Unnecessary use of "any" type (line 132)
- [49c978ce-105-unused] **unused** (low): Variable 'fetchData' might be unused (line 105)
- [49c978ce-253-console] **inconsistency** (low): Console statement found (log) (line 253)
- [49c978ce-263-console] **inconsistency** (low): Console statement found (log) (line 263)
- [49c978ce-283-console] **inconsistency** (low): Console statement found (log) (line 283)
- [49c978ce-291-console] **inconsistency** (low): Console statement found (log) (line 291)
- [49c978ce-295-console] **inconsistency** (low): Console statement found (log) (line 295)
- [49c978ce-314-console] **inconsistency** (low): Console statement found (log) (line 314)
- [49c978ce-322-console] **inconsistency** (low): Console statement found (log) (line 322)
- [49c978ce-326-console] **inconsistency** (low): Console statement found (log) (line 326)
- [49c978ce-346-console] **inconsistency** (low): Console statement found (log) (line 346)
- [49c978ce-354-console] **inconsistency** (low): Console statement found (log) (line 354)
- [49c978ce-358-console] **inconsistency** (low): Console statement found (log) (line 358)
- [49c978ce-368-console] **inconsistency** (low): Console statement found (log) (line 368)
- [49c978ce-376-console] **inconsistency** (low): Console statement found (log) (line 376)
- [49c978ce-382-console] **inconsistency** (low): Console statement found (log) (line 382)
- [49c978ce-384-console] **inconsistency** (low): Console statement found (log) (line 384)
- [49c978ce-404-console] **inconsistency** (low): Console statement found (log) (line 404)
- [49c978ce-412-console] **inconsistency** (low): Console statement found (log) (line 412)
- [49c978ce-421-console] **inconsistency** (low): Console statement found (log) (line 421)
- [49c978ce-422-console] **inconsistency** (low): Console statement found (log) (line 422)
- [49c978ce-423-console] **inconsistency** (low): Console statement found (log) (line 423)
- [49c978ce-424-console] **inconsistency** (low): Console statement found (log) (line 424)
- [49c978ce-428-console] **inconsistency** (low): Console statement found (log) (line 428)
- [49c978ce-430-console] **inconsistency** (low): Console statement found (log) (line 430)
- [49c978ce-436-console] **inconsistency** (low): Console statement found (log) (line 436)
- [49c978ce-438-console] **inconsistency** (low): Console statement found (log) (line 438)
- [49c978ce-443-console] **inconsistency** (low): Console statement found (error) (line 443)
- [49c978ce-103-naming-pascal] **naming** (medium): Function 'ClientComponent' uses PascalCase instead of camelCase (line 103)

### style-auditor.ts
- [8044acaa-63-console] **inconsistency** (low): Console statement found (warn) (line 63)
- [8044acaa-378-console] **inconsistency** (low): Console statement found (log) (line 378)
- [8044acaa-379-console] **inconsistency** (low): Console statement found (log) (line 379)
- [8044acaa-380-console] **inconsistency** (low): Console statement found (log) (line 380)
- [8044acaa-381-console] **inconsistency** (low): Console statement found (log) (line 381)
- [8044acaa-384-console] **inconsistency** (low): Console statement found (log) (line 384)
- [8044acaa-385-console] **inconsistency** (low): Console statement found (log) (line 385)
- [8044acaa-386-console] **inconsistency** (low): Console statement found (log) (line 386)
- [8044acaa-404-console] **inconsistency** (low): Console statement found (log) (line 404)
- [8044acaa-405-console] **inconsistency** (low): Console statement found (log) (line 405)
- [8044acaa-406-console] **inconsistency** (low): Console statement found (log) (line 406)
- [8044acaa-407-console] **inconsistency** (low): Console statement found (log) (line 407)
- [8044acaa-409-console] **inconsistency** (low): Console statement found (log) (line 409)
- [8044acaa-410-console] **inconsistency** (low): Console statement found (log) (line 410)
- [8044acaa-411-console] **inconsistency** (low): Console statement found (log) (line 411)
- [8044acaa-412-console] **inconsistency** (low): Console statement found (log) (line 412)
- [8044acaa-413-console] **inconsistency** (low): Console statement found (log) (line 413)
- [8044acaa-416-console] **inconsistency** (low): Console statement found (log) (line 416)
- [8044acaa-418-console] **inconsistency** (low): Console statement found (log) (line 418)
- [8044acaa-421-console] **inconsistency** (low): Console statement found (log) (line 421)
- [8044acaa-422-console] **inconsistency** (low): Console statement found (log) (line 422)
- [8044acaa-425-console] **inconsistency** (low): Console statement found (log) (line 425)

### state-persistence.ts
- [a5a9cfc9-823-complexity-length] **complexity** (critical): Function 'anonymous' is too long (147 lines, max: 50)
- [a5a9cfc9-823-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 5, max: 4)
- [a5a9cfc9-101-any] **any** (medium): Unnecessary use of "any" type (line 101)
- [a5a9cfc9-90-console] **inconsistency** (low): Console statement found (error) (line 90)
- [a5a9cfc9-91-console] **inconsistency** (low): Console statement found (error) (line 91)

### setup-wizard.ts
- [619b9873-245-unused] **unused** (low): Variable 'privilegios' might be unused (line 245)
- [619b9873-61-console] **inconsistency** (low): Console statement found (log) (line 61)
- [619b9873-62-console] **inconsistency** (low): Console statement found (log) (line 62)
- [619b9873-63-console] **inconsistency** (low): Console statement found (log) (line 63)
- [619b9873-64-console] **inconsistency** (low): Console statement found (log) (line 64)
- [619b9873-65-console] **inconsistency** (low): Console statement found (log) (line 65)
- [619b9873-66-console] **inconsistency** (low): Console statement found (log) (line 66)
- [619b9873-67-console] **inconsistency** (low): Console statement found (log) (line 67)
- [619b9873-68-console] **inconsistency** (low): Console statement found (log) (line 68)
- [619b9873-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [619b9873-73-console] **inconsistency** (low): Console statement found (log) (line 73)
- [619b9873-77-console] **inconsistency** (low): Console statement found (log) (line 77)
- [619b9873-81-console] **inconsistency** (low): Console statement found (log) (line 81)
- [619b9873-85-console] **inconsistency** (low): Console statement found (log) (line 85)
- [619b9873-92-console] **inconsistency** (low): Console statement found (log) (line 92)
- [619b9873-94-console] **inconsistency** (low): Console statement found (error) (line 94)
- [619b9873-100-console] **inconsistency** (low): Console statement found (log) (line 100)
- [619b9873-103-console] **inconsistency** (low): Console statement found (log) (line 103)
- [619b9873-105-console] **inconsistency** (low): Console statement found (log) (line 105)
- [619b9873-108-console] **inconsistency** (low): Console statement found (log) (line 108)
- [619b9873-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [619b9873-114-console] **inconsistency** (low): Console statement found (log) (line 114)
- [619b9873-116-console] **inconsistency** (low): Console statement found (log) (line 116)
- [619b9873-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [619b9873-120-console] **inconsistency** (low): Console statement found (log) (line 120)
- [619b9873-122-console] **inconsistency** (low): Console statement found (log) (line 122)
- [619b9873-125-console] **inconsistency** (low): Console statement found (log) (line 125)
- [619b9873-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [619b9873-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [619b9873-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [619b9873-131-console] **inconsistency** (low): Console statement found (log) (line 131)
- [619b9873-132-console] **inconsistency** (low): Console statement found (log) (line 132)
- [619b9873-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [619b9873-134-console] **inconsistency** (low): Console statement found (log) (line 134)
- [619b9873-135-console] **inconsistency** (low): Console statement found (log) (line 135)
- [619b9873-136-console] **inconsistency** (low): Console statement found (log) (line 136)
- [619b9873-140-console] **inconsistency** (low): Console statement found (error) (line 140)
- [619b9873-141-console] **inconsistency** (low): Console statement found (error) (line 141)
- [619b9873-142-console] **inconsistency** (low): Console statement found (error) (line 142)
- [619b9873-143-console] **inconsistency** (low): Console statement found (error) (line 143)
- [619b9873-150-console] **inconsistency** (low): Console statement found (error) (line 150)
- [619b9873-151-console] **inconsistency** (low): Console statement found (error) (line 151)
- [619b9873-152-console] **inconsistency** (low): Console statement found (error) (line 152)
- [619b9873-153-console] **inconsistency** (low): Console statement found (error) (line 153)
- [619b9873-155-console] **inconsistency** (low): Console statement found (error) (line 155)
- [619b9873-162-console] **inconsistency** (low): Console statement found (error) (line 162)
- [619b9873-163-console] **inconsistency** (low): Console statement found (error) (line 163)
- [619b9873-165-console] **inconsistency** (low): Console statement found (error) (line 165)
- [619b9873-166-console] **inconsistency** (low): Console statement found (error) (line 166)
- [619b9873-168-console] **inconsistency** (low): Console statement found (error) (line 168)
- [619b9873-169-console] **inconsistency** (low): Console statement found (error) (line 169)
- [619b9873-174-console] **inconsistency** (low): Console statement found (error) (line 174)
- [619b9873-175-console] **inconsistency** (low): Console statement found (error) (line 175)
- [619b9873-177-console] **inconsistency** (low): Console statement found (error) (line 177)
- [619b9873-178-console] **inconsistency** (low): Console statement found (error) (line 178)
- [619b9873-181-console] **inconsistency** (low): Console statement found (error) (line 181)
- [619b9873-182-console] **inconsistency** (low): Console statement found (error) (line 182)
- [619b9873-183-console] **inconsistency** (low): Console statement found (error) (line 183)
- [619b9873-184-console] **inconsistency** (low): Console statement found (error) (line 184)
- [619b9873-185-console] **inconsistency** (low): Console statement found (error) (line 185)
- [619b9873-186-console] **inconsistency** (low): Console statement found (error) (line 186)
- [619b9873-187-console] **inconsistency** (low): Console statement found (error) (line 187)
- [619b9873-223-console] **inconsistency** (low): Console statement found (log) (line 223)
- [619b9873-224-console] **inconsistency** (low): Console statement found (log) (line 224)
- [619b9873-225-console] **inconsistency** (low): Console statement found (log) (line 225)
- [619b9873-226-console] **inconsistency** (low): Console statement found (log) (line 226)
- [619b9873-227-console] **inconsistency** (low): Console statement found (log) (line 227)
- [619b9873-228-console] **inconsistency** (low): Console statement found (log) (line 228)
- [619b9873-229-console] **inconsistency** (low): Console statement found (log) (line 229)
- [619b9873-235-console] **inconsistency** (low): Console statement found (log) (line 235)
- [619b9873-240-console] **inconsistency** (low): Console statement found (log) (line 240)
- [619b9873-241-console] **inconsistency** (low): Console statement found (log) (line 241)
- [619b9873-245-console] **inconsistency** (low): Console statement found (log) (line 245)
- [619b9873-249-console] **inconsistency** (low): Console statement found (log) (line 249)
- [619b9873-283-console] **inconsistency** (low): Console statement found (log) (line 283)
- [619b9873-287-console] **inconsistency** (low): Console statement found (warn) (line 287)
- [619b9873-298-console] **inconsistency** (low): Console statement found (log) (line 298)
- [619b9873-299-console] **inconsistency** (low): Console statement found (log) (line 299)
- [619b9873-300-console] **inconsistency** (low): Console statement found (log) (line 300)
- [619b9873-304-console] **inconsistency** (low): Console statement found (log) (line 304)
- [619b9873-306-console] **inconsistency** (low): Console statement found (log) (line 306)
- [619b9873-311-console] **inconsistency** (low): Console statement found (log) (line 311)
- [619b9873-312-console] **inconsistency** (low): Console statement found (log) (line 312)
- [619b9873-318-console] **inconsistency** (low): Console statement found (log) (line 318)
- [619b9873-323-console] **inconsistency** (low): Console statement found (log) (line 323)
- [619b9873-326-console] **inconsistency** (low): Console statement found (log) (line 326)
- [619b9873-327-console] **inconsistency** (low): Console statement found (log) (line 327)
- [619b9873-330-console] **inconsistency** (low): Console statement found (log) (line 330)
- [619b9873-337-console] **inconsistency** (low): Console statement found (log) (line 337)
- [619b9873-361-console] **inconsistency** (low): Console statement found (log) (line 361)
- [619b9873-365-console] **inconsistency** (low): Console statement found (error) (line 365)
- [619b9873-368-console] **inconsistency** (low): Console statement found (error) (line 368)
- [619b9873-369-console] **inconsistency** (low): Console statement found (error) (line 369)
- [619b9873-370-console] **inconsistency** (low): Console statement found (error) (line 370)
- [619b9873-373-console] **inconsistency** (low): Console statement found (log) (line 373)
- [619b9873-392-console] **inconsistency** (low): Console statement found (log) (line 392)
- [619b9873-395-console] **inconsistency** (low): Console statement found (log) (line 395)
- [619b9873-398-console] **inconsistency** (low): Console statement found (log) (line 398)
- [619b9873-401-console] **inconsistency** (low): Console statement found (log) (line 401)
- [619b9873-405-console] **inconsistency** (low): Console statement found (log) (line 405)
- [619b9873-415-console] **inconsistency** (low): Console statement found (log) (line 415)
- [619b9873-418-console] **inconsistency** (low): Console statement found (log) (line 418)
- [619b9873-419-console] **inconsistency** (low): Console statement found (log) (line 419)
- [619b9873-422-console] **inconsistency** (low): Console statement found (log) (line 422)
- [619b9873-425-console] **inconsistency** (low): Console statement found (log) (line 425)
- [619b9873-434-console] **inconsistency** (low): Console statement found (log) (line 434)
- [619b9873-435-console] **inconsistency** (low): Console statement found (log) (line 435)
- [619b9873-436-console] **inconsistency** (low): Console statement found (log) (line 436)
- [619b9873-441-console] **inconsistency** (low): Console statement found (log) (line 441)
- [619b9873-447-console] **inconsistency** (low): Console statement found (log) (line 447)
- [619b9873-453-console] **inconsistency** (low): Console statement found (log) (line 453)
- [619b9873-464-console] **inconsistency** (low): Console statement found (log) (line 464)
- [619b9873-465-console] **inconsistency** (low): Console statement found (log) (line 465)
- [619b9873-468-console] **inconsistency** (low): Console statement found (log) (line 468)
- [619b9873-470-console] **inconsistency** (low): Console statement found (log) (line 470)
- [619b9873-475-console] **inconsistency** (low): Console statement found (error) (line 475)
- [619b9873-479-console] **inconsistency** (low): Console statement found (log) (line 479)
- [619b9873-480-console] **inconsistency** (low): Console statement found (log) (line 480)
- [619b9873-481-console] **inconsistency** (low): Console statement found (log) (line 481)
- [619b9873-482-console] **inconsistency** (low): Console statement found (log) (line 482)
- [619b9873-483-console] **inconsistency** (low): Console statement found (log) (line 483)
- [619b9873-492-console] **inconsistency** (low): Console statement found (log) (line 492)
- [619b9873-493-console] **inconsistency** (low): Console statement found (log) (line 493)
- [619b9873-494-console] **inconsistency** (low): Console statement found (log) (line 494)
- [619b9873-495-console] **inconsistency** (low): Console statement found (log) (line 495)
- [619b9873-507-console] **inconsistency** (low): Console statement found (log) (line 507)
- [619b9873-517-console] **inconsistency** (low): Console statement found (log) (line 517)
- [619b9873-522-console] **inconsistency** (low): Console statement found (log) (line 522)
- [619b9873-523-console] **inconsistency** (low): Console statement found (log) (line 523)
- [619b9873-524-console] **inconsistency** (low): Console statement found (log) (line 524)
- [619b9873-525-console] **inconsistency** (low): Console statement found (log) (line 525)
- [619b9873-526-console] **inconsistency** (low): Console statement found (log) (line 526)
- [619b9873-527-console] **inconsistency** (low): Console statement found (log) (line 527)
- [619b9873-531-console] **inconsistency** (low): Console statement found (error) (line 531)
- [619b9873-637-console] **inconsistency** (low): Console statement found (log) (line 637)
- [619b9873-638-console] **inconsistency** (low): Console statement found (log) (line 638)
- [619b9873-667-console] **inconsistency** (low): Console statement found (log) (line 667)
- [619b9873-668-console] **inconsistency** (low): Console statement found (log) (line 668)
- [619b9873-681-console] **inconsistency** (low): Console statement found (log) (line 681)
- [619b9873-682-console] **inconsistency** (low): Console statement found (log) (line 682)
- [619b9873-683-console] **inconsistency** (low): Console statement found (log) (line 683)
- [619b9873-699-console] **inconsistency** (low): Console statement found (log) (line 699)
- [619b9873-700-console] **inconsistency** (low): Console statement found (log) (line 700)
- [619b9873-701-console] **inconsistency** (low): Console statement found (log) (line 701)
- [619b9873-702-console] **inconsistency** (low): Console statement found (log) (line 702)
- [619b9873-703-console] **inconsistency** (low): Console statement found (log) (line 703)
- [619b9873-704-console] **inconsistency** (low): Console statement found (log) (line 704)
- [619b9873-705-console] **inconsistency** (low): Console statement found (log) (line 705)
- [619b9873-706-console] **inconsistency** (low): Console statement found (log) (line 706)
- [619b9873-707-console] **inconsistency** (low): Console statement found (log) (line 707)
- [619b9873-708-console] **inconsistency** (low): Console statement found (log) (line 708)
- [619b9873-710-console] **inconsistency** (low): Console statement found (error) (line 710)
- [619b9873-785-console] **inconsistency** (low): Console statement found (log) (line 785)
- [619b9873-787-console] **inconsistency** (low): Console statement found (log) (line 787)
- [619b9873-803-console] **inconsistency** (low): Console statement found (log) (line 803)
- [619b9873-805-console] **inconsistency** (low): Console statement found (log) (line 805)
- [619b9873-806-console] **inconsistency** (low): Console statement found (log) (line 806)
- [619b9873-818-console] **inconsistency** (low): Console statement found (log) (line 818)

### security-scanner.ts
- [ce50f37a-2782-complexity-length] **complexity** (critical): Function 'anonymous' is too long (587 lines, max: 50)
- [ce50f37a-2782-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [ce50f37a-40-any] **any** (medium): Unnecessary use of "any" type (line 40)
- [ce50f37a-43-any] **any** (medium): Unnecessary use of "any" type (line 43)
- [ce50f37a-46-any] **any** (medium): Unnecessary use of "any" type (line 46)
- [ce50f37a-113-any] **any** (medium): Unnecessary use of "any" type (line 113)
- [ce50f37a-114-any] **any** (medium): Unnecessary use of "any" type (line 114)
- [ce50f37a-115-any] **any** (medium): Unnecessary use of "any" type (line 115)
- [ce50f37a-258-any] **any** (medium): Unnecessary use of "any" type (line 258)
- [ce50f37a-290-any] **any** (medium): Unnecessary use of "any" type (line 290)
- [ce50f37a-384-any] **any** (medium): Unnecessary use of "any" type (line 384)
- [ce50f37a-384-any] **any** (medium): Unnecessary use of "any" type (line 384)
- [ce50f37a-385-any] **any** (medium): Unnecessary use of "any" type (line 385)
- [ce50f37a-492-any] **any** (medium): Unnecessary use of "any" type (line 492)
- [ce50f37a-493-any] **any** (medium): Unnecessary use of "any" type (line 493)
- [ce50f37a-512-any] **any** (medium): Unnecessary use of "any" type (line 512)
- [ce50f37a-578-any] **any** (medium): Unnecessary use of "any" type (line 578)
- [ce50f37a-588-any] **any** (medium): Unnecessary use of "any" type (line 588)
- [ce50f37a-24-unused] **unused** (low): Variable 'execAsync' might be unused (line 24)
- [ce50f37a-150-console] **inconsistency** (low): Console statement found (log) (line 150)
- [ce50f37a-156-console] **inconsistency** (low): Console statement found (warn) (line 156)
- [ce50f37a-165-console] **inconsistency** (low): Console statement found (log) (line 165)
- [ce50f37a-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [ce50f37a-179-console] **inconsistency** (low): Console statement found (log) (line 179)
- [ce50f37a-199-console] **inconsistency** (low): Console statement found (log) (line 199)
- [ce50f37a-208-console] **inconsistency** (low): Console statement found (log) (line 208)
- [ce50f37a-265-console] **inconsistency** (low): Console statement found (warn) (line 265)
- [ce50f37a-306-console] **inconsistency** (low): Console statement found (warn) (line 306)
- [ce50f37a-367-console] **inconsistency** (low): Console statement found (warn) (line 367)

### secret-manager.ts
- [fab4f895-1772-complexity-length] **complexity** (critical): Function 'anonymous' is too long (150 lines, max: 50)
- [fab4f895-1772-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [fab4f895-22-unused] **unused** (low): Variable 'SECRET_REGISTRY' might be unused (line 22)
- [fab4f895-129-console] **inconsistency** (low): Console statement found (warn) (line 129)
- [fab4f895-141-console] **inconsistency** (low): Console statement found (log) (line 141)
- [fab4f895-145-console] **inconsistency** (low): Console statement found (warn) (line 145)
- [fab4f895-151-console] **inconsistency** (low): Console statement found (log) (line 151)
- [fab4f895-155-console] **inconsistency** (low): Console statement found (warn) (line 155)
- [fab4f895-160-console] **inconsistency** (low): Console statement found (warn) (line 160)
- [fab4f895-163-console] **inconsistency** (low): Console statement found (warn) (line 163)
- [fab4f895-195-console] **inconsistency** (low): Console statement found (warn) (line 195)

### report-aggregator.ts
- [0b5fe5f9-1104-complexity-length] **complexity** (critical): Function 'anonymous' is too long (248 lines, max: 50)
- [0b5fe5f9-1104-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [0b5fe5f9-17-any] **any** (medium): Unnecessary use of "any" type (line 17)
- [0b5fe5f9-50-any] **any** (medium): Unnecessary use of "any" type (line 50)
- [0b5fe5f9-51-any] **any** (medium): Unnecessary use of "any" type (line 51)

### progress-bar.ts
- [84363a11-236-complexity-length] **complexity** (high): Function 'anonymous' is too long (81 lines, max: 50)
- [84363a11-236-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [84363a11-65-console] **inconsistency** (low): Console statement found (log) (line 65)
- [84363a11-68-console] **inconsistency** (low): Console statement found (log) (line 68)
- [84363a11-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [84363a11-74-console] **inconsistency** (low): Console statement found (log) (line 74)
- [84363a11-84-console] **inconsistency** (low): Console statement found (log) (line 84)
- [84363a11-85-console] **inconsistency** (low): Console statement found (log) (line 85)
- [84363a11-86-console] **inconsistency** (low): Console statement found (log) (line 86)

### orchestrator.ts
- [1d44057e-1688-complexity-length] **complexity** (critical): Function 'anonymous' is too long (573 lines, max: 50)
- [1d44057e-1688-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [1d44057e-32-any] **any** (medium): Unnecessary use of "any" type (line 32)
- [1d44057e-33-any] **any** (medium): Unnecessary use of "any" type (line 33)
- [1d44057e-34-any] **any** (medium): Unnecessary use of "any" type (line 34)
- [1d44057e-55-any] **any** (medium): Unnecessary use of "any" type (line 55)
- [1d44057e-57-any] **any** (medium): Unnecessary use of "any" type (line 57)
- [1d44057e-59-any] **any** (medium): Unnecessary use of "any" type (line 59)
- [1d44057e-395-any] **any** (medium): Unnecessary use of "any" type (line 395)
- [1d44057e-117-console] **inconsistency** (low): Console statement found (log) (line 117)
- [1d44057e-118-console] **inconsistency** (low): Console statement found (log) (line 118)
- [1d44057e-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [1d44057e-128-console] **inconsistency** (low): Console statement found (log) (line 128)
- [1d44057e-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [1d44057e-139-console] **inconsistency** (low): Console statement found (log) (line 139)
- [1d44057e-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [1d44057e-166-console] **inconsistency** (low): Console statement found (log) (line 166)
- [1d44057e-167-console] **inconsistency** (low): Console statement found (log) (line 167)
- [1d44057e-173-console] **inconsistency** (low): Console statement found (error) (line 173)
- [1d44057e-174-console] **inconsistency** (low): Console statement found (error) (line 174)
- [1d44057e-184-console] **inconsistency** (low): Console statement found (log) (line 184)
- [1d44057e-188-console] **inconsistency** (low): Console statement found (log) (line 188)
- [1d44057e-196-console] **inconsistency** (low): Console statement found (warn) (line 196)
- [1d44057e-222-console] **inconsistency** (low): Console statement found (log) (line 222)
- [1d44057e-225-console] **inconsistency** (low): Console statement found (log) (line 225)
- [1d44057e-228-console] **inconsistency** (low): Console statement found (log) (line 228)
- [1d44057e-241-console] **inconsistency** (low): Console statement found (log) (line 241)
- [1d44057e-256-console] **inconsistency** (low): Console statement found (log) (line 256)
- [1d44057e-266-console] **inconsistency** (low): Console statement found (log) (line 266)
- [1d44057e-274-console] **inconsistency** (low): Console statement found (log) (line 274)
- [1d44057e-280-console] **inconsistency** (low): Console statement found (log) (line 280)
- [1d44057e-296-console] **inconsistency** (low): Console statement found (log) (line 296)
- [1d44057e-297-console] **inconsistency** (low): Console statement found (log) (line 297)
- [1d44057e-312-console] **inconsistency** (low): Console statement found (log) (line 312)
- [1d44057e-330-console] **inconsistency** (low): Console statement found (log) (line 330)
- [1d44057e-338-console] **inconsistency** (low): Console statement found (error) (line 338)
- [1d44057e-347-console] **inconsistency** (low): Console statement found (log) (line 347)
- [1d44057e-367-console] **inconsistency** (low): Console statement found (log) (line 367)
- [1d44057e-382-console] **inconsistency** (low): Console statement found (log) (line 382)
- [1d44057e-392-console] **inconsistency** (low): Console statement found (log) (line 392)
- [1d44057e-398-console] **inconsistency** (low): Console statement found (log) (line 398)
- [1d44057e-424-console] **inconsistency** (low): Console statement found (log) (line 424)

### ollama-processor.ts
- [a2c754e6-55-console] **inconsistency** (low): Console statement found (log) (line 55)
- [a2c754e6-58-console] **inconsistency** (low): Console statement found (log) (line 58)
- [a2c754e6-59-console] **inconsistency** (low): Console statement found (log) (line 59)
- [a2c754e6-61-console] **inconsistency** (low): Console statement found (error) (line 61)
- [a2c754e6-62-console] **inconsistency** (low): Console statement found (error) (line 62)
- [a2c754e6-65-console] **inconsistency** (low): Console statement found (log) (line 65)
- [a2c754e6-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [a2c754e6-73-console] **inconsistency** (low): Console statement found (log) (line 73)
- [a2c754e6-74-console] **inconsistency** (low): Console statement found (log) (line 74)
- [a2c754e6-83-console] **inconsistency** (low): Console statement found (log) (line 83)
- [a2c754e6-84-console] **inconsistency** (low): Console statement found (log) (line 84)
- [a2c754e6-93-console] **inconsistency** (low): Console statement found (log) (line 93)
- [a2c754e6-115-console] **inconsistency** (low): Console statement found (error) (line 115)
- [a2c754e6-119-console] **inconsistency** (low): Console statement found (log) (line 119)
- [a2c754e6-124-console] **inconsistency** (low): Console statement found (log) (line 124)
- [a2c754e6-125-console] **inconsistency** (low): Console statement found (log) (line 125)
- [a2c754e6-126-console] **inconsistency** (low): Console statement found (log) (line 126)
- [a2c754e6-129-console] **inconsistency** (low): Console statement found (log) (line 129)
- [a2c754e6-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [a2c754e6-133-console] **inconsistency** (low): Console statement found (log) (line 133)
- [a2c754e6-147-console] **inconsistency** (low): Console statement found (log) (line 147)
- [a2c754e6-183-console] **inconsistency** (low): Console statement found (warn) (line 183)
- [a2c754e6-192-console] **inconsistency** (low): Console statement found (log) (line 192)
- [a2c754e6-219-console] **inconsistency** (low): Console statement found (warn) (line 219)
- [a2c754e6-228-console] **inconsistency** (low): Console statement found (warn) (line 228)
- [a2c754e6-262-console] **inconsistency** (low): Console statement found (warn) (line 262)
- [a2c754e6-268-console] **inconsistency** (low): Console statement found (warn) (line 268)
- [a2c754e6-322-console] **inconsistency** (low): Console statement found (log) (line 322)
- [a2c754e6-323-console] **inconsistency** (low): Console statement found (log) (line 323)
- [a2c754e6-324-console] **inconsistency** (low): Console statement found (log) (line 324)
- [a2c754e6-325-console] **inconsistency** (low): Console statement found (log) (line 325)
- [a2c754e6-328-console] **inconsistency** (low): Console statement found (log) (line 328)
- [a2c754e6-337-console] **inconsistency** (low): Console statement found (log) (line 337)
- [a2c754e6-345-console] **inconsistency** (low): Console statement found (log) (line 345)
- [a2c754e6-357-console] **inconsistency** (low): Console statement found (log) (line 357)
- [a2c754e6-364-console] **inconsistency** (low): Console statement found (log) (line 364)
- [a2c754e6-376-console] **inconsistency** (low): Console statement found (error) (line 376)
- [a2c754e6-385-console] **inconsistency** (low): Console statement found (log) (line 385)
- [a2c754e6-410-console] **inconsistency** (low): Console statement found (error) (line 410)
- [a2c754e6-411-console] **inconsistency** (low): Console statement found (error) (line 411)
- [a2c754e6-412-console] **inconsistency** (low): Console statement found (error) (line 412)
- [a2c754e6-415-console] **inconsistency** (low): Console statement found (error) (line 415)
- [a2c754e6-418-console] **inconsistency** (low): Console statement found (error) (line 418)
- [a2c754e6-421-console] **inconsistency** (low): Console statement found (error) (line 421)
- [a2c754e6-470-console] **inconsistency** (low): Console statement found (log) (line 470)
- [a2c754e6-471-console] **inconsistency** (low): Console statement found (log) (line 471)
- [a2c754e6-472-console] **inconsistency** (low): Console statement found (log) (line 472)
- [a2c754e6-473-console] **inconsistency** (low): Console statement found (log) (line 473)
- [a2c754e6-474-console] **inconsistency** (low): Console statement found (log) (line 474)
- [a2c754e6-475-console] **inconsistency** (low): Console statement found (log) (line 475)
- [a2c754e6-479-console] **inconsistency** (low): Console statement found (log) (line 479)
- [a2c754e6-482-console] **inconsistency** (low): Console statement found (log) (line 482)
- [a2c754e6-483-console] **inconsistency** (low): Console statement found (log) (line 483)
- [a2c754e6-485-console] **inconsistency** (low): Console statement found (error) (line 485)
- [a2c754e6-486-console] **inconsistency** (low): Console statement found (error) (line 486)
- [a2c754e6-487-console] **inconsistency** (low): Console statement found (error) (line 487)
- [a2c754e6-491-console] **inconsistency** (low): Console statement found (error) (line 491)
- [a2c754e6-494-console] **inconsistency** (low): Console statement found (error) (line 494)
- [a2c754e6-562-console] **inconsistency** (low): Console statement found (log) (line 562)

### hardware-awareness.ts
- [1153809d-683-complexity-length] **complexity** (critical): Function 'anonymous' is too long (164 lines, max: 50)
- [1153809d-683-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 6, max: 4)
- [1153809d-42-console] **inconsistency** (low): Console statement found (warn) (line 42)
- [1153809d-92-console] **inconsistency** (low): Console statement found (log) (line 92)
- [1153809d-93-console] **inconsistency** (low): Console statement found (log) (line 93)
- [1153809d-94-console] **inconsistency** (low): Console statement found (log) (line 94)
- [1153809d-97-console] **inconsistency** (low): Console statement found (log) (line 97)
- [1153809d-100-console] **inconsistency** (low): Console statement found (log) (line 100)
- [1153809d-101-console] **inconsistency** (low): Console statement found (log) (line 101)
- [1153809d-102-console] **inconsistency** (low): Console statement found (log) (line 102)
- [1153809d-158-console] **inconsistency** (low): Console statement found (log) (line 158)
- [1153809d-161-console] **inconsistency** (low): Console statement found (log) (line 161)
- [1153809d-165-console] **inconsistency** (low): Console statement found (log) (line 165)
- [1153809d-172-console] **inconsistency** (low): Console statement found (log) (line 172)
- [1153809d-175-console] **inconsistency** (low): Console statement found (log) (line 175)
- [1153809d-179-console] **inconsistency** (low): Console statement found (log) (line 179)

### domain-inference.ts
- [254be0e8-1075-complexity-length] **complexity** (critical): Function 'anonymous' is too long (458 lines, max: 50)
- [254be0e8-1075-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 8, max: 4)
- [254be0e8-57-console] **inconsistency** (low): Console statement found (log) (line 57)
- [254be0e8-64-console] **inconsistency** (low): Console statement found (log) (line 64)
- [254be0e8-91-console] **inconsistency** (low): Console statement found (log) (line 91)
- [254be0e8-92-console] **inconsistency** (low): Console statement found (log) (line 92)
- [254be0e8-93-console] **inconsistency** (low): Console statement found (log) (line 93)
- [254be0e8-147-console] **inconsistency** (low): Console statement found (warn) (line 147)

### deployment-hardening.ts
- [e86d81c9-636-complexity-length] **complexity** (critical): Function 'anonymous' is too long (273 lines, max: 50)
- [e86d81c9-636-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [e86d81c9-9495-complexity-nesting] **complexity** (high): Function 'scanDirectory' has excessive nesting (depth: 5, max: 4)

### db-seeder.ts
- [10085a5a-1124-complexity-length] **complexity** (critical): Function 'anonymous' is too long (264 lines, max: 50)
- [10085a5a-1124-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [10085a5a-128-console] **inconsistency** (low): Console statement found (warn) (line 128)
- [10085a5a-146-console] **inconsistency** (low): Console statement found (warn) (line 146)
- [10085a5a-153-console] **inconsistency** (low): Console statement found (log) (line 153)
- [10085a5a-154-console] **inconsistency** (low): Console statement found (log) (line 154)
- [10085a5a-155-console] **inconsistency** (low): Console statement found (log) (line 155)
- [10085a5a-194-console] **inconsistency** (low): Console statement found (error) (line 194)
- [10085a5a-198-console] **inconsistency** (low): Console statement found (log) (line 198)
- [10085a5a-201-console] **inconsistency** (low): Console statement found (error) (line 201)
- [10085a5a-247-console] **inconsistency** (low): Console statement found (log) (line 247)
- [10085a5a-248-console] **inconsistency** (low): Console statement found (log) (line 248)
- [10085a5a-249-console] **inconsistency** (low): Console statement found (log) (line 249)
- [10085a5a-250-console] **inconsistency** (low): Console statement found (log) (line 250)
- [10085a5a-290-console] **inconsistency** (low): Console statement found (log) (line 290)
- [10085a5a-291-console] **inconsistency** (low): Console statement found (log) (line 291)
- [10085a5a-292-console] **inconsistency** (low): Console statement found (log) (line 292)
- [10085a5a-296-console] **inconsistency** (low): Console statement found (error) (line 296)

### css-global-indexer.ts
- [d014b2c6-1022-complexity-length] **complexity** (critical): Function 'anonymous' is too long (338 lines, max: 50)
- [d014b2c6-1022-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 11, max: 4)
- [d014b2c6-55-console] **inconsistency** (low): Console statement found (log) (line 55)
- [d014b2c6-56-console] **inconsistency** (low): Console statement found (log) (line 56)
- [d014b2c6-61-console] **inconsistency** (low): Console statement found (warn) (line 61)
- [d014b2c6-71-console] **inconsistency** (low): Console statement found (log) (line 71)
- [d014b2c6-74-console] **inconsistency** (low): Console statement found (log) (line 74)
- [d014b2c6-76-console] **inconsistency** (low): Console statement found (log) (line 76)
- [d014b2c6-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [d014b2c6-81-console] **inconsistency** (low): Console statement found (log) (line 81)
- [d014b2c6-95-console] **inconsistency** (low): Console statement found (error) (line 95)
- [d014b2c6-164-console] **inconsistency** (low): Console statement found (log) (line 164)
- [d014b2c6-190-console] **inconsistency** (low): Console statement found (log) (line 190)
- [d014b2c6-200-console] **inconsistency** (low): Console statement found (error) (line 200)
- [d014b2c6-208-console] **inconsistency** (low): Console statement found (log) (line 208)
- [d014b2c6-247-console] **inconsistency** (low): Console statement found (warn) (line 247)
- [d014b2c6-248-console] **inconsistency** (low): Console statement found (error) (line 248)
- [d014b2c6-312-console] **inconsistency** (low): Console statement found (log) (line 312)
- [d014b2c6-313-console] **inconsistency** (low): Console statement found (log) (line 313)
- [d014b2c6-316-console] **inconsistency** (low): Console statement found (log) (line 316)
- [d014b2c6-320-console] **inconsistency** (low): Console statement found (log) (line 320)
- [d014b2c6-322-console] **inconsistency** (low): Console statement found (log) (line 322)
- [d014b2c6-323-console] **inconsistency** (low): Console statement found (log) (line 323)
- [d014b2c6-326-console] **inconsistency** (low): Console statement found (log) (line 326)
- [d014b2c6-330-console] **inconsistency** (low): Console statement found (log) (line 330)
- [d014b2c6-333-console] **inconsistency** (low): Console statement found (log) (line 333)

### comment-analyzer.ts
- [997ec1f1-859-complexity-length] **complexity** (critical): Function 'anonymous' is too long (581 lines, max: 50)
- [997ec1f1-859-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 12, max: 4)

### code-reader.ts
- [8487eda6-955-complexity-length] **complexity** (critical): Function 'anonymous' is too long (165 lines, max: 50)
- [8487eda6-955-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [8487eda6-53-console] **inconsistency** (low): Console statement found (log) (line 53)
- [8487eda6-61-console] **inconsistency** (low): Console statement found (warn) (line 61)
- [8487eda6-194-console] **inconsistency** (low): Console statement found (warn) (line 194)
- [8487eda6-262-console] **inconsistency** (low): Console statement found (log) (line 262)

### auto-fixer.ts
- [c6681efa-731-complexity-length] **complexity** (critical): Function 'anonymous' is too long (427 lines, max: 50)
- [c6681efa-731-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 12, max: 4)
- [c6681efa-32-any] **any** (medium): Unnecessary use of "any" type (line 32)
- [c6681efa-33-any] **any** (medium): Unnecessary use of "any" type (line 33)
- [c6681efa-34-any] **any** (medium): Unnecessary use of "any" type (line 34)
- [c6681efa-97-any] **any** (medium): Unnecessary use of "any" type (line 97)
- [c6681efa-239-any] **any** (medium): Unnecessary use of "any" type (line 239)
- [c6681efa-342-any] **any** (medium): Unnecessary use of "any" type (line 342)
- [c6681efa-348-any] **any** (medium): Unnecessary use of "any" type (line 348)
- [c6681efa-49-console] **inconsistency** (low): Console statement found (log) (line 49)
- [c6681efa-62-console] **inconsistency** (low): Console statement found (log) (line 62)
- [c6681efa-72-console] **inconsistency** (low): Console statement found (log) (line 72)
- [c6681efa-79-console] **inconsistency** (low): Console statement found (log) (line 79)
- [c6681efa-82-console] **inconsistency** (low): Console statement found (log) (line 82)
- [c6681efa-113-console] **inconsistency** (low): Console statement found (log) (line 113)
- [c6681efa-151-console] **inconsistency** (low): Console statement found (log) (line 151)
- [c6681efa-164-console] **inconsistency** (low): Console statement found (warn) (line 164)
- [c6681efa-176-console] **inconsistency** (low): Console statement found (error) (line 176)
- [c6681efa-191-console] **inconsistency** (low): Console statement found (log) (line 191)
- [c6681efa-203-console] **inconsistency** (low): Console statement found (log) (line 203)
- [c6681efa-211-console] **inconsistency** (low): Console statement found (log) (line 211)
- [c6681efa-220-console] **inconsistency** (low): Console statement found (log) (line 220)
- [c6681efa-223-console] **inconsistency** (low): Console statement found (log) (line 223)
- [c6681efa-231-console] **inconsistency** (low): Console statement found (error) (line 231)
- [c6681efa-245-console] **inconsistency** (low): Console statement found (warn) (line 245)
- [c6681efa-292-console] **inconsistency** (low): Console statement found (log) (line 292)
- [c6681efa-313-console] **inconsistency** (low): Console statement found (log) (line 313)
- [c6681efa-324-console] **inconsistency** (low): Console statement found (error) (line 324)
- [c6681efa-376-console] **inconsistency** (low): Console statement found (log) (line 376)
- [c6681efa-382-console] **inconsistency** (low): Console statement found (error) (line 382)
- [c6681efa-399-console] **inconsistency** (low): Console statement found (log) (line 399)

### auto-documentation.ts
- [a011243b-480-complexity-length] **complexity** (critical): Function 'anonymous' is too long (414 lines, max: 50)
- [a011243b-480-complexity-nesting] **complexity** (critical): Function 'anonymous' has excessive nesting (depth: 9, max: 4)
- [a011243b-7977-complexity-nesting] **complexity** (high): Function 'declaration' has excessive nesting (depth: 6, max: 4)
- [a011243b-35-any] **any** (medium): Unnecessary use of "any" type (line 35)
- [a011243b-36-any] **any** (medium): Unnecessary use of "any" type (line 36)
- [a011243b-37-any] **any** (medium): Unnecessary use of "any" type (line 37)
- [a011243b-170-any] **any** (medium): Unnecessary use of "any" type (line 170)
- [a011243b-320-any] **any** (medium): Unnecessary use of "any" type (line 320)

### atomic-fixer.ts
- [324d968b-63-any] **any** (medium): Unnecessary use of "any" type (line 63)
- [324d968b-63-any] **any** (medium): Unnecessary use of "any" type (line 63)
- [324d968b-93-any] **any** (medium): Unnecessary use of "any" type (line 93)
- [324d968b-93-any] **any** (medium): Unnecessary use of "any" type (line 93)
- [324d968b-147-any] **any** (medium): Unnecessary use of "any" type (line 147)
- [324d968b-204-any] **any** (medium): Unnecessary use of "any" type (line 204)
- [324d968b-233-any] **any** (medium): Unnecessary use of "any" type (line 233)
- [324d968b-267-any] **any** (medium): Unnecessary use of "any" type (line 267)
- [324d968b-491-console] **inconsistency** (low): Console statement found (error) (line 491)
- [324d968b-509-console] **inconsistency** (low): Console statement found (error) (line 509)

### admin-wrapper.ts
- [561866bf-590-complexity-length] **complexity** (critical): Function 'anonymous' is too long (277 lines, max: 50)
- [561866bf-590-complexity-nesting] **complexity** (high): Function 'anonymous' has excessive nesting (depth: 7, max: 4)
- [561866bf-49-console] **inconsistency** (low): Console statement found (log) (line 49)
- [561866bf-53-console] **inconsistency** (low): Console statement found (log) (line 53)
- [561866bf-95-console] **inconsistency** (low): Console statement found (log) (line 95)
- [561866bf-96-console] **inconsistency** (low): Console statement found (log) (line 96)
- [561866bf-97-console] **inconsistency** (low): Console statement found (log) (line 97)
- [561866bf-98-console] **inconsistency** (low): Console statement found (log) (line 98)
- [561866bf-99-console] **inconsistency** (low): Console statement found (log) (line 99)
- [561866bf-100-console] **inconsistency** (low): Console statement found (log) (line 100)
- [561866bf-101-console] **inconsistency** (low): Console statement found (log) (line 101)
- [561866bf-102-console] **inconsistency** (low): Console statement found (log) (line 102)
- [561866bf-106-console] **inconsistency** (low): Console statement found (log) (line 106)
- [561866bf-107-console] **inconsistency** (low): Console statement found (log) (line 107)
- [561866bf-123-console] **inconsistency** (low): Console statement found (log) (line 123)
- [561866bf-130-console] **inconsistency** (low): Console statement found (log) (line 130)
- [561866bf-151-console] **inconsistency** (low): Console statement found (log) (line 151)
- [561866bf-152-console] **inconsistency** (low): Console statement found (log) (line 152)
- [561866bf-157-console] **inconsistency** (low): Console statement found (log) (line 157)
- [561866bf-166-console] **inconsistency** (low): Console statement found (log) (line 166)
- [561866bf-170-console] **inconsistency** (low): Console statement found (log) (line 170)
- [561866bf-177-console] **inconsistency** (low): Console statement found (log) (line 177)
- [561866bf-183-console] **inconsistency** (low): Console statement found (log) (line 183)
- [561866bf-184-console] **inconsistency** (low): Console statement found (log) (line 184)
- [561866bf-193-console] **inconsistency** (low): Console statement found (log) (line 193)
- [561866bf-195-console] **inconsistency** (low): Console statement found (warn) (line 195)
- [561866bf-262-console] **inconsistency** (low): Console statement found (warn) (line 262)
- [561866bf-298-console] **inconsistency** (low): Console statement found (log) (line 298)
- [561866bf-300-console] **inconsistency** (low): Console statement found (warn) (line 300)


## Phase 1: Code Quality - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:43.509Z
- **Findings:** 2449
- **Execution Time:** 2.15s


## Phase 2: Business Logic - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:43.605Z
- **Execution Time:** 0ms

### Business Understanding
- **Domain:** Tooling
- **Sensitivity Level:** HIGH
- **Core Flow:** User Management, API Layer, Database Layer, Data Analytics, Authentication Flow, E-commerce Flow, Payment Flow, Context API
- **Aegis Assessment:** Nicho: Developer Tools / QA Infrastructure. Core: Hardware Monitoring & Static Analysis. Priorizando integridad del motor de análisis.

### Business Domain Analysis
- **Confidence:** 45.402504472271914%
- **Stack Dependencies:** 13

### Core Paths Identified
- C:\repos\aegis-qa\lib
- C:\repos\aegis-qa\src\core
- C:\repos\aegis-qa\src\lib

### Business Risk Findings
- **Total Risk Findings:** 31
- **Critical Modules:** 28


### Risk Details
- **[HIGH] C:\repos\aegis-qa\src\lib\atomic-fixer.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 45/100
- **[CRITICAL] C:\repos\aegis-qa\src\core\thermal-controller.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[MEDIUM] C:\repos\aegis-qa\src\core\system-resource-monitor.ts**
  - Reason: Core path file with moderate quality score
  - Quality Score: 55/100
- **[CRITICAL] C:\repos\aegis-qa\src\core\state-persistence.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[MEDIUM] C:\repos\aegis-qa\src\core\security-utils.ts**
  - Reason: Core path file with moderate quality score
  - Quality Score: 60/100
- **[HIGH] C:\repos\aegis-qa\src\core\secret-manager.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 30/100
- **[HIGH] C:\repos\aegis-qa\src\core\reporter.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 40/100
- **[CRITICAL] C:\repos\aegis-qa\src\core\ignore-handler.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 25/100
- **[HIGH] C:\repos\aegis-qa\src\core\file-filter.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 40/100
- **[CRITICAL] C:\repos\aegis-qa\src\core\cache-manager.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\test-security.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\style-auditor.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[HIGH] C:\repos\aegis-qa\lib\state-persistence.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 40/100
- **[CRITICAL] C:\repos\aegis-qa\lib\setup-wizard.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\security-scanner.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\secret-manager.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 5/100
- **[HIGH] C:\repos\aegis-qa\lib\report-aggregator.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 30/100
- **[HIGH] C:\repos\aegis-qa\lib\progress-bar.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 35/100
- **[CRITICAL] C:\repos\aegis-qa\lib\orchestrator.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\ollama-processor.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\hardware-awareness.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[HIGH] C:\repos\aegis-qa\lib\domain-inference.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 30/100
- **[HIGH] C:\repos\aegis-qa\lib\deployment-hardening.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 35/100
- **[CRITICAL] C:\repos\aegis-qa\lib\db-seeder.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\css-global-indexer.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[MEDIUM] C:\repos\aegis-qa\lib\comment-analyzer.ts**
  - Reason: Core path file with moderate quality score
  - Quality Score: 50/100
- **[HIGH] C:\repos\aegis-qa\lib\code-reader.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 40/100
- **[CRITICAL] C:\repos\aegis-qa\lib\auto-fixer.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\auto-documentation.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100
- **[CRITICAL] C:\repos\aegis-qa\lib\atomic-fixer.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 10/100
- **[CRITICAL] C:\repos\aegis-qa\lib\admin-wrapper.ts**
  - Reason: Core path file with low quality score
  - Quality Score: 0/100



### Recommended Focus for Subsequent Phases
- Phase 5: Clean Code (High)
- Phase 9: Dead Code (High)
- Phase 11: Tests (Medium)
- Phase 1: Code Quality (Critical - Re-review)
- Phase 1: Code Quality (High Priority)

### Priority Phase
- **Phase 5:** Most critical phase for this business domain

### Untouchable Folders (Atomic Fixer)
- /src/orchestration
- /src/core
- /src/inference
- /src/modules

### Self-Audit Mode
- **Status:** Active - Aegis QA is auditing itself
- **Adjusted Context:** Developer Tools / QA Infrastructure
- **Core Focus:** Hardware Monitoring & Static Analysis


---


## Phase 2: Business Logic - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:43.606Z
- **Findings:** 31
- **Execution Time:** 0.09s


## Phase 3: Security - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:43.657Z
- **Execution Time:** 34ms
- **Context Domain:** General
- **Critical Modules:** 0

### Security Summary
- **Total Findings:** 0
- **Critical Findings:** 0
- **High Severity Findings:** 0

### Findings by Type
No security vulnerabilities detected.

---


## Phase 3: Security - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:43.668Z
- **Findings:** 0
- **Execution Time:** 0.03s


## Phase 4: Database - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:43.996Z
- **Findings:** 0
- **Execution Time:** 0.32s
- **Error:** CRITICAL: System resources critical (CPU: 2788%, RAM: 42%). Execution halted to prevent system instability.

## Phase 5: Clean Code - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:44.266Z
- **Findings:** 0
- **Execution Time:** 0.27s
- **Error:** CRITICAL: System resources critical (CPU: 1610%, RAM: 42%). Execution halted to prevent system instability.

## Phase 6: API & Contracts - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.276Z
- **Execution Time:** 5ms
- **Domain:** General

### API Summary
- **Total Findings:** 0
- **Critical Findings:** 0
- **High Severity Findings:** 0

### Findings by Type
No API issues detected.

---


## Phase 6: API & Contracts - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.282Z
- **Findings:** 0
- **Execution Time:** 0.01s


## Phase 7: Testing Strategy - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.364Z
- **Execution Time:** 72ms
- **Domain:** General

### Testing Summary
- **Total Findings:** 0
- **Critical Findings:** 0
- **High Severity Findings:** 0
- **Source Files:** 104
- **Test Files:** 6

### Findings by Type
No testing issues detected.

---


## Phase 7: Testing Strategy - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.370Z
- **Findings:** 0
- **Execution Time:** 0.07s


## Phase 8: Performance & Scalability - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.415Z
- **Execution Time:** 36ms

### Performance Summary
- **Total Findings:** 0
- **Critical Findings:** 0
- **High Severity Findings:** 0

### Findings by Type
No performance issues detected.

---


## Phase 8: Performance & Scalability - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.419Z
- **Findings:** 0
- **Execution Time:** 0.04s


## Phase 9: Internationalization & Accessibility (i18n & a11y) - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.433Z
- **Execution Time:** 5ms

### i18n & a11y Summary
- **Total Findings:** 0
- **Critical Findings:** 0
- **High Severity Findings:** 0

### Findings by Type
No i18n & a11y issues detected.

---


## Phase 9: Internationalization & Accessibility - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.438Z
- **Findings:** 0
- **Execution Time:** 0.01s


## Phase 10: Environment & CI/CD - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.451Z
- **Execution Time:** 3ms

### Environment & CI/CD Summary
- **Total Findings:** 3
- **Critical Findings:** 1
- **High Severity Findings:** 1

### Findings by Type

### Missing env example (1)
- [project-0-missing-env-example] **CRITICAL** .env
  - ­ƒÜ¿ CRITICAL: .env exists but .env.example is missing - BLOCKING DEPLOY

### Engines mismatch (1)
- [C:\repos-0-engines-mismatch] **MEDIUM** C:\repos\aegis-qa\package.json
  - package.json missing "engines" field

### Infrastructure drift (1)
- [C:\repos-0-infrastructure-drift] **HIGH** C:\repos\aegis-qa\package-lock.json
  - ­ƒÜ¿ INFRASTRUCTURE_DRIFT: package-lock.json lockfileVersion mismatch - potential synchronization issue


---


## Phase 10: Environment & CI/CD - Ô£à PASSED
- **Timestamp:** 2026-04-16T21:17:44.462Z
- **Findings:** 3
- **Execution Time:** 0.00s


## Phase 11: Testing Deep Audit - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:44.475Z
- **Findings:** 0
- **Execution Time:** 0.01s
- **Error:** Cannot read properties of undefined (reading 'split')

## Phase 12: Error Handling & Observability - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:44.736Z
- **Findings:** 0
- **Execution Time:** 0.26s
- **Error:** CRITICAL: System resources critical (CPU: 2041%, RAM: 42%). Execution halted to prevent system instability.

## Phase 13: i18n & l10n - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:45.002Z
- **Findings:** 0
- **Execution Time:** 0.27s
- **Error:** CRITICAL: System resources critical (CPU: 1956%, RAM: 42%). Execution halted to prevent system instability.

## Phase 14: Git, Repo & Documentation Hygiene - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:45.279Z
- **Findings:** 0
- **Execution Time:** 0.28s
- **Error:** CRITICAL: System resources critical (CPU: 2113%, RAM: 42%). Execution halted to prevent system instability.

## Phase 15: CI/CD & DevOps - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:45.556Z
- **Findings:** 0
- **Execution Time:** 0.28s
- **Error:** CRITICAL: System resources critical (CPU: 2613%, RAM: 42%). Execution halted to prevent system instability.

## Phase 15: Cloud Infrastructure - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:45.834Z
- **Findings:** 0
- **Execution Time:** 0.28s
- **Error:** CRITICAL: System resources critical (CPU: 1982%, RAM: 42%). Execution halted to prevent system instability.

## Phase 15: Containerization - ÔØî FAILED
- **Timestamp:** 2026-04-16T21:17:46.139Z
- **Findings:** 0
- **Execution Time:** 0.30s
- **Error:** CRITICAL: System resources critical (CPU: 3265%, RAM: 42%). Execution halted to prevent system instability.
