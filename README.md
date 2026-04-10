# Aegis QA

> High-end QA orchestrator for Next.js/Supabase with hardware protection

Aegis QA is a sophisticated autonomous QA framework designed for developers building Next.js applications with Supabase. It combines intelligent domain inference, automated code auditing, and robust hardware protection to deliver enterprise-grade code quality without risking your GPU.

## Vision

Traditional QA tools either lack business context or require manual intervention. Aegis QA solves this by:

1. **Understanding Your Domain** - Analyzes your database schema and Server Actions to comprehend your business logic
2. **Protecting Your Hardware** - Monitors GPU temperature in real-time and automatically applies cooldowns to prevent thermal damage
3. **Automating Quality** - Audits code, applies fixes, and validates changes with strict type checking

## Why ThermalController is the Heart of the System

The `ThermalController` is not an afterthought—it's the foundation upon which all AI processing is built. Every file processed by Aegis QA passes through this controller, ensuring that:

- **GPU temperature never exceeds 70°C** (critical threshold)
- **Cooldowns are applied automatically** based on operation intensity
- **Execution halts immediately** if thermal safety is compromised

This hardware-first approach makes Aegis QA unique among QA tools: it protects your investment while delivering high-quality code audits.

## Technology Stack

### Core
- **Runtime:** Node.js 20+ (ESM native)
- **Language:** TypeScript 5.5+ (Strict Mode)
- **Package Manager:** npm

### AI & Hardware
- **AI Engine:** Ollama (local LLMs: 7B/32B models)
- **Hardware Monitoring:** nvidia-smi (VRAM, temperature)

### Quality & Testing
- **Testing:** Vitest (fast, ESM-native)
- **Linting:** ESLint (TypeScript)
- **Formatting:** Prettier
- **Type Checking:** tsc --noEmit

### Dependencies
- **@clack/prompts** - Interactive CLI prompts
- **systeminformation** - System metrics and hardware detection
- **@supabase/supabase-js** - Supabase client for database operations
- **dotenv** - Environment variable management

## Architecture

Aegis QA is built around three core pillars:

### 1. The Shield (Hardware Protection Layer)
- **ThermalController** - GPU temperature monitoring and automatic cooldowns
- **VRAM Detection** - Automatic model selection based on available memory
- **Thermal Throttling** - Execution halts if GPU exceeds 70°C

### 2. The Brain (Domain & Logic)
- **Domain Analyzer** - Understands your business domain from database schemas
- **Comment Processor** - Intelligent code comment cleanup
- **Context Inference** - Preserves business logic during automated fixes

### 3. The Muscle (Audit & Fix)
- **Code Reader** - Next.js App Router analysis
- **Style Auditor** - Tailwind and style violation detection
- **Security Scanner** - Supabase RLS validation
- **Atomic Auto-Fixer** - Safe, validated code modifications

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/sovereign-qa.git
cd sovereign-qa

# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm test
```

## Usage

```typescript
import { ThermalController } from './src/core/thermal-controller';

const controller = new ThermalController();

// Check temperature before processing
await controller.checkAndCooldown(15000);

// Your AI processing here...

// Apply cooldown after processing
await controller.applyCooldown(15000);
```

## Safety Thresholds

- **CRITICAL:** 70°C - System halts execution immediately
- **WARNING:** 60°C - System applies extended cooldown
- **SAFE:** < 60°C - Normal operation

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to Aegis QA.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Roadmap

- [x] Thermal Controller (hardware protection)
- [ ] Domain Analyzer (business context inference)
- [ ] Code Reader (Next.js route analysis)
- [ ] Style Auditor (Tailwind validation)
- [ ] Security Scanner (Supabase RLS)
- [ ] Atomic Auto-Fixer (safe code modifications)

---
