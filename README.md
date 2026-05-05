# Aegis QA

> Advanced Quality Assurance Orchestrator with Hardware Protection and Multi-Phase Analysis

Aegis QA is a sophisticated autonomous QA framework designed for comprehensive code quality analysis. It combines intelligent domain inference, automated code auditing, robust hardware protection, and multi-phase analysis to deliver enterprise-grade code quality without risking your system resources.

## 🎯 Vision

Traditional QA tools either lack business context or require manual intervention. Aegis QA solves this by:

1. **Understanding Your Domain** - Analyzes your database schema and Server Actions to comprehend your business logic
2. **Protecting Your Hardware** - Monitors system resources in real-time and automatically applies thermal management
3. **Automating Quality** - Audits code across 20 phases, applies atomic fixes, and validates changes with strict type checking
4. **Intelligent ROI** - Provides actionable insights with time-saved metrics weighted by complexity

## 🚀 Features

### Multi-Phase Analysis (20 Phases)

**Block I: Sentinel Scan (Deep Audit)**
- **Phase 0:** Setup - Hotel Check-in (dependencies, critical files, syntax, hardware lock)
- **Phase 1:** Code Quality - Basic linting and code style
- **Phase 2:** Business Logic - Domain inference and business context
- **Phase 3:** Security - Security vulnerability scanning
- **Phase 4:** Database - Database schema validation
- **Phase 5:** Clean Code - Code smells and complexity analysis
- **Phase 6:** API Contracts - API contract validation
- **Phase 7:** Testing Strategy - Test coverage and strategy
- **Phase 8:** Performance & Scalability - Performance optimization
- **Phase 9:** i18n & a11y - Internationalization and accessibility
- **Phase 10:** Environment & CI/CD - Environment configuration
- **Phase 11:** Atomic Fixes - Automated code fixes
- **Phase 12:** Error Handling, Observability & Resilience [CONSOLIDATED]
- **Phase 13:** Global & Pattern - i18n/l10n and Predictive Bugs
- **Phase 14:** Ops & Hygiene - Cloud Cost Detection and Git/Repo Hygiene
- **Phase 15:** DevOps Suite - CI/CD, SCA Security, Cloud Infra, Containerization

**Block II: Atomic Fixer (Intelligent Remediation)**
- **Phase 16:** Fix Strategy Generation - Dependency Blast Radius protection
- **Phase 17:** Multi-Fix Execution - Batch processing with Dynamic Thermal Throttle

**Block III: Quality Gate & ROI (Final Validation)**
- **Phase 18:** Post-Fix Validation - Global Integrity Check
- **Phase 19:** Incremental Review - Hash-Validation for changed files only
- **Phase 20:** Intelligent ROI Report - Executive summary with time-saved metrics

### Hardware Protection

- **ThermalController** - System resource monitoring and automatic cooldowns
- **Hardware Detection** - Automatic configuration based on CPU cores, RAM, and GPU
- **Adaptive Cooling** - Dynamic throttling based on system load
- **Memory Flush** - Automatic memory cleanup after heavy phases

### Advanced Features

- **State Persistence** - Resume capability for interrupted sessions
- **Partial Reports** - Progress tracking after each phase
- **Hash-Validation** - Efficient incremental analysis
- **Secret Censoring** - Automatic redaction in reports
- **Zombie Hunter** - Automatic cleanup of temporary files

### Safety & Compliance Features

- **Sandbox Mode** - Isolated environment for safe fix execution with syntax validation
- **Multi-Level Rollback** - Git hard reset, stash pop, and directory snapshot for recovery
- **Operation Guard** - Controls which operations can be performed (read, write, delete, execute)
- **File Whitelist** - Restricts modifications to specific file types and safe paths
- **Interactive Fix Approval** - Per-fix approval with diff preview (yes/no/all/quit)
- **Batch Diff Preview** - Review all proposed changes before applying any fixes
- **Audit-Only Mode** - Detailed logging for compliance with audit trail generation
- **Success/Failure Metrics** - Comprehensive statistics on fix application rates
- **Safe-Only Mode** - Report-only mode without any file modifications

## 🛠️ Technology Stack

### Core
- **Runtime:** Node.js 20+ (ESM native)
- **Language:** TypeScript 5.5+ (Strict Mode)
- **Package Manager:** npm

### Quality & Testing
- **Type Checking:** tsc --noEmit
- **Linting:** ESLint (TypeScript)
- **Formatting:** Prettier

### Dependencies
- **glob** - File pattern matching
- **systeminformation** - System metrics and hardware detection
- **dotenv** - Environment variable management

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/mxrcabrera/aegis-qa.git
cd aegis-qa

# Install dependencies
npm install

# Build the project
npm run build

# Run type checking
npm run type-check
```

## 🎮 Usage

### CLI Commands

```bash
# Full review (phases 0-15)
node dist/cli.js review [directory]

# Atomic fixes (phases 16-18)
node dist/cli.js fix [directory]

# Incremental review (phase 19)
node dist/cli.js incremental [directory]

# Show help
node dist/cli.js help
```

### CLI Flags

```bash
# Apply fixes (default: dry-run mode)
--apply

# Skip confirmation prompts (for CI/CD)
--yes, -y

# Enable verbose logging
--verbose, -v

# Safe-only mode (report only, no modifications)
--safe-only

# Show batch diff preview before applying fixes
--preview-diffs

# Enable audit-only mode for compliance
--audit-only

# Enable per-fix interactive approval
--interactive-fix

# Run in CI mode (skip non-essential output)
--ci
```

### Examples

```bash
# Review current directory
node dist/cli.js review .

# Review specific project
node dist/cli.js review ./my-project

# Apply fixes to current directory
node dist/cli.js fix .

# Incremental review of git changes
node dist/cli.js incremental .

# Safe-only mode (report only, no modifications)
node dist/cli.js review . --safe-only

# Apply fixes with interactive approval
node dist/cli.js fix . --apply --interactive-fix

# Apply fixes with batch diff preview
node dist/cli.js fix . --apply --preview-diffs

# Compliance audit mode (detailed logging)
node dist/cli.js review . --audit-only

# CI/CD mode (auto-apply with no prompts)
node dist/cli.js fix . --apply --yes --ci
```

### Programmatic Usage

```typescript
import { PhaseOrchestrator } from './src/orchestration/phase-orchestrator.js';
import { ThermalController } from './src/core/thermal-controller.js';
import { DomainAnalyzer } from './src/inference/domain-analyzer.js';
import { ReportAggregator } from './src/core/reporter.js';
import { StatePersistence } from './src/core/state-persistence.js';

// Initialize components
const thermalController = new ThermalController();
const domainAnalyzer = new DomainAnalyzer({ projectRoot: './', useDatabase: false, useAI: false });
const reportAggregator = new ReportAggregator();
const statePersistence = new StatePersistence('./');

// Create orchestrator
const orchestrator = new PhaseOrchestrator({
  projectRoot: './',
  thermalController,
  domainAnalyzer,
  reportAggregator,
  statePersistence,
  currentState: statePersistence.createInitialState(20),
  applyCooldowns: true,
  phaseTimeoutMs: 300000,
  enableMemoryFlush: true,
  enablePartialReports: true,
});

// Run full review
const result = await orchestrator.runFullReview();
console.log(`Total findings: ${result.totalFindings}`);
```

## ⚙️ Configuration

### TypeScript Configuration

The project uses strict TypeScript configuration with:
- `moduleResolution: "bundler"` - Modern module resolution
- `strict: true` - All strict type checking enabled
- `noUnusedLocals: true` - No unused local variables
- `noUnusedParameters: true` - No unused parameters

### Hardware Thresholds

- **CRITICAL:** CPU > 70% or RAM > 90% - System halts execution
- **WARNING:** CPU > 50% or RAM > 70% - System applies extended cooldown
- **SAFE:** CPU < 50% and RAM < 70% - Normal operation

### Phase Timeout

Each phase has a default timeout of 5 minutes (300,000ms) to prevent hanging operations.

## 📊 Reports

Aegis QA generates two types of reports:

### Partial Reports
Generated after each phase to track progress:
- `qa-report.partial.md` - Progress tracking
- `.aegis-state.json` - Execution state for resume capability

### Final Report
Generated after Phase 20:
- `qa-report.md` - Complete analysis with findings and fixes

### Audit Reports
When using `--audit-only` mode:
- `.aegis-cache/audit/audit-{timestamp}.json` - Detailed audit trail for compliance

## 📚 Documentation

- **[Best Practices for Production Use](docs/best-practices-production.md)** - Comprehensive guide for safe production deployment
- **[Architecture Documentation](docs/architecture.md)** - System architecture and design decisions
- `qa-report.md` - Comprehensive analysis report with ROI metrics
- Automatic secret redaction for security
- Time-saved metrics weighted by complexity

## 🔒 Data Privacy & Security

### 100% Local Analysis

Aegis QA performs **all analysis locally** on your machine. **No source code, database schema, business logic, or any intellectual property ever leaves your environment**.

- **No Telemetry**: No usage statistics, error reports, or performance metrics are transmitted
- **No Cloud Processing**: All analysis happens on your local machine
- **No Data Collection**: No files, code snippets, or analysis results are sent externally
- **Offline Operation**: Full functionality without internet connection required

### Security Features

- **Secret Censoring** - Automatic redaction of secrets in reports
- **State Persistence** - Secure state management
- **File Filtering** - Respect for .gitignore and .aegisignore
- **Atomic Fixes** - Safe, validated code modifications
- **Dependency Blast Radius** - Protection for high-traffic files
- **🆕 Branch Isolation** - Original branch protection through automatic branching

## �️ Technology Stack

## 🧪 Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run type checking
npm run type-check

# Run tests (when available)
npm test

# Format code
npm run format

# Lint code
npm run lint
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to Aegis QA.

## 📄 License

Proprietary License - see [LICENSE](LICENSE) for details.

**Important**: This software is the exclusive property of Marianella Cabrera Ahumada. Download and execution are permitted for personal use or technical evaluation purposes only. Modification, redistribution, sublicensing, or sale of the source code or its derivatives is strictly prohibited without express written permission.

## 🗺️ Roadmap

- [x] Phase 0-15: Sentinel Scan (Deep Audit)
- [x] Phase 16-18: Atomic Fixer (Intelligent Remediation)
- [x] Phase 19-20: Quality Gate & ROI
- [x] Hardware Protection (ThermalController)
- [x] State Persistence (Resume capability)
- [x] Hash-Validation (Incremental analysis)
- [ ] Enhanced AI integration (Ollama models)
- [ ] Web Dashboard for real-time monitoring
- [ ] Plugin system for custom phases
- [ ] Multi-language support (Python, Rust, Go)

## 📞 Support

For issues, questions, or contributions, please visit:
- GitHub Issues: https://github.com/mxrcabrera/aegis-qa/issues
- Documentation: https://github.com/mxrcabrera/aegis-qa/wiki

---

**Aegis QA v1.0** - Advanced Quality Assurance Orchestrator
