// Fix, Cleanup & Tracking Phases

function behaviorDuringFixes() {
return [
{
title: "Read these rules BEFORE executing any fix phase.",
content: [
"Fix findings in order (C1, C2... then H1, H2... etc). Do NOT jump [K
around.",
"For each finding: read the current file → apply the fix → verify →[1D[K
→ commit. That's it.",
// ...
],
},
{
title: "Phase 16: Auto-Fix Findings",
content: [
"Read qa-report.md",
"Fix in order: 🔴 Critical → 🟠 High → 🟡 Medium → 🔵 Low",
// ...
],
},
// ...
];
}

function phase16AutoFixFindings() {
return [
{
title: "Process:",
content: [
"For EACH finding:",
"a. Read the CURRENT file content",
"b. Apply the fix exactly as described in the report",
"c. Run `npx tsc --noEmit` to verify no type errors",
// ...
],
},
{
title: "Phase 16B: Post-Fix Verification (MANDATORY)",
content: [
"Run ALL of these in order.",
// ...
],
},
// ...
];
}

function phase17Refactor() {
return [
{
title: "Process:",
content: [
"For each refactoring:",
"a. Create branch: `refactor/qa-{description}`",
"b. Apply refactoring in small steps",
"c. Run tests after each step",
// ...
],
},
{
title: "Common refactorings:",
content: [
"Extract Service",
"Extract Helper",
// ...
],
},
// ...
];
}

function phase18Cleanup() {
return [
{
title: "18A Dead Code Removal",
content: [
"Run detection tools:",
// ...
"Delete it",
"Run tests",
// ...
],
},
{
title: "18B Dependency Cleanup",
content: [
"Remove unused dependencies",
"Update outdated packages",
"Fix known CVEs",
// ...
],
},
{
title: "18C Project Structure",
content: [
"Move misplaced files to correct directories",
"Remove orphaned config files",
// ...
],
},
// ...
];
}

function phase19IncrementalReview() {
return [
{
title: "Get changed files:",
content: [
// ...
],
},
{
title: "Show changes:",
content: [
// ...
],
},
// ...
];
}
