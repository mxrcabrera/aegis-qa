# Build Instructions v2

## Prerequisites

- Node.js 18+ 
- npm or yarn
- (Optional) Ollama for AI-powered features

## Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the required environment variables:

```env
# Supabase Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test User Credentials (Required)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password

# Optional API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Test Configuration
TEST_BASE_URL=http://localhost:3000
TEST_TIMEOUT_MS=30000
```

## Running the Orchestrator

```bash
# Run the full QA pipeline
npm run sovereign

# This executes: npx tsx src/index.ts
```

## Development

### Run TypeScript Compiler (Check Only)

```bash
npx tsc --noEmit
```

Note: This may show errors in node_modules dependencies, which are not related to the SovereignQA v2 codebase.

### Run Individual Auditors

```bash
# Code Reader (Route Mapping)
npx tsx lib/code-reader.ts

# Style Auditor
npx tsx lib/style-auditor.ts

# Security Scanner
npx tsx lib/security-scanner.ts
```

## Testing

```bash
# Run tests
npm test

# Run with Playwright
npx playwright test
```

## Build for Production

v2 uses ESM modules and tsx for runtime compilation. No separate build step is required.

## Hardware Requirements

### Minimum
- 4GB VRAM
- GPU with thermal monitoring support
- Node.js 18+

### Recommended
- 8GB+ VRAM
- GPU with nvidia-smi support
- Node.js 20+

## Troubleshooting

### SecretManager Issues

If you see warnings about missing secrets, SecretManager will automatically activate Mock Mode for development.

### Thermal Controller Issues

If GPU temperature monitoring fails, the orchestrator will run without thermal protection (not recommended for long sessions).

### Domain Inference Issues

If DomainInference cannot find entities in your project, the Empty Project Guard will cancel the audit with a message.

## CI/CD Integration

### GitHub Actions

```yaml
name: QA Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run sovereign
```

### Vercel

Add environment variables in the Vercel dashboard and run the sovereign script during build.
