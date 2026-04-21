# Aegis QA - Architecture Documentation

## Product Requirements Document (PRD)

### Vision

Aegis QA is a high-end QA orchestrator for Next.js/Supabase that audits, infers business context, and applies automatic corrections while guaranteeing zero risk of hardware damage through a native thermal control system.

### The Three Pillars of Architecture

#### A. The Shield (Hardware Protection Layer)

**Purpose:** Protect GPU hardware during intensive AI processing operations.

**Components:**
- **VRAM Detection:** Before each process, the system determines which model to use (7B vs 32B) based on actual available VRAM
- **Thermal Throttling:** A central controller that halts execution if GPU temperature exceeds 70°C
- **Mandatory Cooldown:** Integrated cooldown cycles (15s/20s) in the orchestrator core, not as external patches

**Safety Thresholds:**
- **CRITICAL:** 70°C - System halts execution immediately
- **WARNING:** 60°C - System applies extended cooldown
- **SAFE:** < 60°C - Normal operation

#### B. The Brain (Domain & Logic)

**Purpose:** Understand business context to avoid generic suggestions that break logic.

**Components:**
- **Domain Inference (CRITICAL):** Analyzes database schemas and Server Actions to understand that, for example, "Reservation" is the central entity. This prevents the AI from suggesting generic changes that break business logic.
- **Security First:** A rewritten SecretManager that validates Supabase connection before attempting any seed or audit operations.

#### C. The Muscle (Audit & Fix)

**Purpose:** Execute specialized audits and apply validated fixes.

**Components:**
- **Specialized Auditors:** Reuse of CodeReader, StyleAuditor, and SecurityScanner
- **Atomic Auto-Fixer:** Apply patches with immediate validation via npx tsc and unit tests

## Folder Structure

```
/aegis-qa
├── /src
│   ├── /core
│   │   ├── thermal-controller.ts
│   │   ├── secret-manager.ts
│   │   └── reporter.ts
│   ├── /inference
│   │   └── domain-analyzer.ts
│   ├── /modules
│   │   ├── code-reader.ts
│   │   ├── style-auditor.ts
│   │   └── security-scanner.ts
│   └── /types
│       ├── audit.ts
│       ├── domain.ts
│       └── secrets.ts
├── /tests
├── /docs
├── package.json
└── tsconfig.json
```

## Hardware Protection Rules

### VRAM-Based Model Selection

| VRAM Capacity | Concurrent Processes | Recommended Model |
|--------------|---------------------|-------------------|
| < 8GB        | 1                   | 7B                |
| 8-12GB       | 2                   | 7B                |
| 12-16GB      | 3                   | 32B               |
| > 16GB       | 4                   | 32B               |

### Cooldown Rules

1. **Base Cooldown:** 15 seconds after EACH file (integrated in orchestrator core)
2. **Golden Rule:** 20 seconds after every 3 files processed
3. **Dynamic Mode:** 15 seconds for files > 500 lines
4. **Critical Mode:** 30-60 seconds if temperature exceeds 60°C

### Temperature Monitoring

- **Check Frequency:** Before each file processing operation
- **Detection Method:** nvidia-smi command-line tool
- **Response Time:** Immediate halt if temperature > 70°C
- **Logging:** All temperature readings logged with timestamps

## Execution Phases

### Phase 1: The Chassis (Days 1-2)
- Setup new repo with TypeScript Strict Mode
- Develop HardwareThermalController: test load detection and forced waits
- Develop SecretManager: validate .env and connectivity

### Phase 2: The Intelligence (Days 3-4)
- Implement DomainInference: read database files and define "Entities"
- Refactor OllamaProcessor: connect to ThermalController for "breathing" between files

### Phase 3: Muscle Integration (Days 5-6)
- Migrate original auditors (CodeReader, StyleAuditor)
- Adjust types to eliminate all residual `any` types

### Phase 4: Dogfooding & Delivery (Day 7)
- Complete execution on itself
- Generate final thermal performance report

## Definition of Done (DoD)

- ✅ **Zero Errors:** `npx tsc --noEmit` must return 0 errors
- ✅ **Thermal Safety:** GPU must never exceed 70°C during execution
- ✅ **Integrity:** Secrets must never be exposed in logs or reports
- ✅ **Quality:** Final report must list both errors and inferred business context

## Technology Stack

### Core
- **Runtime:** Node.js 20+ (ESM native)
- **Language:** TypeScript 5.5+ (Strict Mode)
- **Package Manager:** npm

### AI & Hardware
- **AI Engine:** Ollama (local LLMs)
- **Hardware Monitoring:** nvidia-smi (VRAM, temperature)

### Quality & Testing
- **Testing:** Vitest
- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** tsc --noEmit

### Dependencies
- **@clack/prompts** - Interactive CLI
- **systeminformation** - System metrics
- **@supabase/supabase-js** - Supabase client
- **dotenv** - Environment management

---

*This architecture document is the single source of truth for Aegis QA's design and implementation.*
