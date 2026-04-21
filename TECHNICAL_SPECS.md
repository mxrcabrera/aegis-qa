# Aegis QA - Technical Specifications

## Arquitectura General

### Patrón de Diseño

**Modular Monolith con Orquestación por Fases**

Aegis QA implementa un patrón **Modular Monolith** con una arquitectura basada en **Phase Orchestration**. El sistema está organizado en 20 fases secuenciales que ejecutan auditorías especializadas, coordinadas por un orquestador central (`PhaseOrchestrator`). Cada fase es un módulo independiente con responsabilidad única, siguiendo el principio de **Single Responsibility Principle (SRP)**.

**Características arquitectónicas clave:**

- **Separación de Concerns:** Los módulos están organizados en capas: `core/` (infraestructura), `inference/` (análisis de dominio), `orchestration/` (coordinación), `modules/` (auditorías especializadas), `phases/` (implementaciones de fases), y `types/` (definiciones de tipos).
- **Dependency Injection:** Los componentes reciben sus dependencias a través del constructor, permitiendo fácil testing y mock.
- **State Persistence:** El estado de ejecución se persiste en disco (`.aegis-state.json`) con ACID properties usando SHA-256 checksums para integridad.
- **Hardware Protection Layer:** `ThermalController` actúa como un middleware que intercepta todas las operaciones intensivas para monitorear GPU/CPU/RAM y aplicar cooldowns dinámicos.
- **Dry-Run Mode por Defecto:** Todas las operaciones de escritura están protegidas por un flag `dryRunMode` que requiere el flag `--apply` explícito para modificar archivos.

### Stack Tecnológico

**Runtime y Lenguaje:**
- **Node.js 20+** con **ESM native modules** (`"type": "module"` en package.json)
- **TypeScript 5.5+** en modo strict con todas las verificaciones habilitadas (`strict: true`, `noImplicitAny`, `strictNullChecks`, etc.)
- **Module Resolution:** `bundler` (resolución moderna compatible con bundlers)

**Dependencias Principales:**

**Core Runtime:**
- `@clack/prompts` (v1.2.0) - Interfaz de línea de comandos interactiva para confirmaciones
- `dotenv` (v17.4.1) - Gestión de variables de entorno
- `fs-extra` (v11.2.0) - Operaciones de filesystem extendidas
- `glob` (v13.0.6) - Pattern matching de archivos
- `systeminformation` (v5.31.5) - Monitoreo de hardware (CPU, RAM, GPU, temperatura)
- `@supabase/supabase-js` (v2.103.0) - Cliente de Supabase para análisis de base de datos

**Development:**
- `typescript` (v6.0.2) - Compilador TypeScript
- `tsx` (v4.21.0) - Ejecución directa de TypeScript
- `ts-morph` (v28.0.0) - Manipulación de AST TypeScript
- `eslint` (v10.2.0) - Linting
- `prettier` (v3.8.1) - Formateo
- `vitest` (v4.1.4) - Testing framework

**Configuración de TypeScript:**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

## Core Business Logic

### Servicios Principales

Aegis QA es un **Quality Assurance Orchestrator** que automatiza auditorías de código en 20 fases secuenciales. El negocio central es:

1. **Auditoría Profunda de Código (Sentinel Scan):** Análisis multidimensional que incluye calidad, lógica de negocio, seguridad, base de datos, clean code, APIs, testing, performance, i18n/a11y, CI/CD, y atomic fixes.
2. **Remediación Inteligente (Atomic Fixer):** Generación y aplicación automática de parches con validación de sintaxis, rollback atómico, y collision avoidance.
3. **Validación de Calidad (Quality Gate):** Comparación de firmas de error TSC (baseline vs post-fix), análisis incremental con hash-validation SHA-256, y reportes de ROI ejecutivos.

### Casos de Uso Principales

**Caso de Uso 1: Full Review (Auditoría Completa)**
- **Comando:** `aegis-qa review [directory]`
- **Fases:** 0-15 (Sentinel Scan)
- **Objetivo:** Ejecutar auditoría completa sin aplicar cambios, generando reporte de violaciones y riesgos de negocio.

**Caso de Uso 2: Atomic Fixes (Remediación)**
- **Comando:** `aegis-qa fix [directory] --apply`
- **Fases:** 16-18 (Atomic Fixer)
- **Objetivo:** Aplicar parches automáticos con validación pre-flight, rollback atómico, y aprobación interactiva.

**Caso de Uso 3: Incremental Review (Análisis Diferencial)**
- **Comando:** `aegis-qa incremental [directory]`
- **Fases:** 19 (Incremental Review)
- **Objetivo:** Analizar solo archivos modificados usando hash-validation SHA-256 para ignorar archivos sin cambios reales.

## Data Flow

### Flujo de Información desde CLI hasta Persistencia

**1. Inicialización (CLI → PhaseOrchestrator)**

```
Usuario ejecuta: aegis-qa review .
    ↓
src/cli.ts: AegisCLI.validateInput() - Validación de seguridad (path traversal, directorios del sistema)
    ↓
src/cli.ts: AegisCLI.run() - Inicialización de componentes
    ↓
ThermalController() - Detección de hardware (GPU, CPU, RAM) y ejecución de self-diagnostic
    ↓
SecretManager({ mockMode: true }) - Gestión de secretos en modo mock
    ↓
ReportAggregator({ projectRoot }) - Agregador central de violaciones
    ↓
StatePersistence(projectRoot) - Persistencia de estado con ACID properties
    ↓
DomainAnalyzer({ projectRoot, useDatabase: false, useAI: false }) - Analizador de dominio
    ↓
PhaseOrchestrator(config) - Orquestador principal con configuración completa
```

**2. Establecimiento de Baseline de Errores**

```
PhaseOrchestrator.runFullReview()
    ↓
ReportAggregator.establishBaseline()
    ↓
Ejecuta: tsc --noEmit
    ↓
Parsea errores TSC y genera firma de baseline
    ↓
Almacena en ErrorBaseline para comparación delta
```

**3. Ejecución de Fases (Phase 0-15)**

```
Para cada fase (0-15):
    ↓
PhaseOrchestrator.checkThermalLock() - Verifica temperatura GPU/CPU/RAM
    ↓
Si CRITICAL: ThermalLock.acquire() → Espera 5s max → ThermalLock.release()
    ↓
PhaseN.execute() - Ejecuta fase específica
    ↓
PhaseN reporta violaciones a ReportAggregator.addViolations()
    ↓
ReportAggregator.autoEscalate() - Escala severidad basado en critical path y dominio de negocio
    ↓
StatePersistence.recordPhase() - Guarda progreso de fase
    ↓
Si fase pesada: PhaseOrchestrator.triggerGarbageCollection() - Limpia memoria
    ↓
Si applyCooldowns: ThermalController.applyCooldown() - Aplica cooldown térmico
    ↓
StatePersistence.saveState() - Persiste estado con SHA-256 checksum
    ↓
PhaseOrchestrator.writePartialReport() - Escribe reporte parcial
```

**4. Generación de Reporte Final**

```
Todas las fases completadas
    ↓
ReportAggregator.separateViolations() - Separa violaciones nuevas vs heredadas
    ↓
Compara con baseline de ErrorBaseline
    ↓
ReportAggregator.generateSummary() - Genera Markdown con delta de errores
    ↓
SecretSanitizer.sanitizeReport() - Censura secretos en reporte
    ↓
Escribe: qa-report.md
```

### Flujo de Datos en Atomic Fixer (Fases 16-18)

```
Phase16: Fix Strategy Generation
    ↓
AtomicFixer.generateFixes(violations) - Genera parches basados en violaciones
    ↓
Collision detection: Detecta múltiples fixes en la misma línea
    ↓
Si collision detected: marca como manualMergeRequired = true
    ↓
Dependency Blast Radius: Protege archivos "high-traffic" con Safe Level 4
    ↓
Phase17: Multi-Fix Execution
    ↓
Para cada fix:
    ↓
AtomicFixer.applyFix(fix)
    ↓
Genera patch file en .sentinel/diffs/
    ↓
Syntax Pre-flight: validateSyntax() - Verifica sintaxis antes de aplicar
    ↓
Si dry-run: skip aplicación
    ↓
Si autoApply o interactive: crea backup → aplica fix → addTraceabilityComment
    ↓
Validation Loop: re-ejecuta auditoría específica
    ↓
Si validation failed: rollbackFix() - Revierte a backup
    ↓
Phase18: Post-Fix Validation
    ↓
Global Integrity Check: Compara firma TSC baseline vs post-fix
    ↓
Zombie Hunter: Limpia archivos .backup.*.tmp
    ↓
Reporta: fixedCount, needsHumanReview, failedCount
```

## Mapa de Endpoints / API

### CLI Commands (Interfaz Principal)

Aegis QA es una herramienta CLI, no tiene API REST. La interfaz principal es a través de comandos de terminal:

**Comando: `aegis-qa review [directory]`**
- **Descripción:** Ejecuta auditoría completa (fases 0-15)
- **Flags:**
  - `--verbose, -v` - Logging detallado
  - `--ci` - Modo CI (output minimalista, thermal locks permisivos)
  - `--safe-only` - Modo seguro (solo reporte, sin modificaciones)
  - `--audit-only` - Modo auditoría (logging detallado para compliance)

**Comando: `aegis-qa fix [directory]`**
- **Descripción:** Aplica atomic fixes (fases 16-18)
- **Flags:**
  - `--apply` - Aplica cambios (default: dry-run mode)
  - `--yes, -y` - Skip confirmaciones (para CI/CD)
  - `--preview-diffs` - Muestra batch diff preview antes de aplicar
  - `--interactive-fix` - Aprobación interactiva por fix

**Comando: `aegis-qa incremental [directory]`**
- **Descripción:** Análisis incremental de cambios git (fase 19)
- **Flags:** Mismos que `review`

**Comando: `aegis-qa help`**
- **Descripción:** Muestra ayuda

### Servicios Internos

**ThermalController Services:**
- `checkTemperature()` - Monitorea temperatura GPU vía nvidia-smi
- `checkSystemResources()` - Monitorea CPU/RAM vía systeminformation
- `applyCooldown(durationMs)` - Aplica cooldown dinámico
- `runSelfDiagnostic(durationMs)` - Ejecuta stress test de 5s
- `detectHardwareCapabilities()` - Detecta GPU, CPU, RAM

**StatePersistence Services:**
- `saveState(state)` - Persiste estado con SHA-256 checksum (ACID)
- `loadState()` - Carga estado con validación de checksum
- `recordFile(filePath, processed, error, state)` - Registra progreso de archivo
- `recordPhase(phaseNumber, phaseName, completed, findingsCount, executionTimeMs, state)` - Registra progreso de fase
- `recordThermalEvent(gpuTemp, cpuUsage, ramUsage, event, message, state)` - Registra evento térmico
- `markInterrupted(reason, state)` - Marca ejecución como interrumpida

**ReportAggregator Services:**
- `addViolation(auditorName, violation)` - Agrega violación individual
- `addViolations(auditorName, violations)` - Agrega múltiples violaciones
- `setBusinessRiskFindings(riskFindings)` - Establece hallazgos de riesgo de negocio
- `establishBaseline()` - Establece baseline ejecutando tsc --noEmit
- `separateViolations()` - Separa violaciones nuevas vs heredadas
- `getNewViolationCount()` - Retorna count de violaciones nuevas
- `getInheritedViolationCount()` - Retorna count de violaciones heredadas
- `generateSummary()` - Genera Markdown summary

**DomainAnalyzer Services:**
- `analyze()` - Analiza dominio del proyecto
- `performStaticAnalysis()` - Análisis estático de schemas SQL, Prisma, TypeScript
- `performDatabaseAnalysis()` - Conecta a Supabase para analizar schema real
- `inferCriticalPaths(entities, serverActions)` - Infiere paths críticos de negocio
- `reconcileEntities(entities)` - Reconcilia entidades de múltiples fuentes

### Modelos de Datos

**ExecutionState (Estado de Ejecución):**
```typescript
{
  projectRoot: string;
  currentPhase: number;
  totalPhases: number;
  phases: PhaseState[];
  files: FileState[];
  thermalLogs: ThermalLogEntry[];
  totalFindings: number;
  startTime: string;
  lastSaveTime: string;
  interrupted: boolean;
  interruptionReason?: string;
  analysisResults?: Record<string, any>;
  highRiskBlocker?: boolean;
  contextStore?: Record<string, any>;
  readyForAudit?: boolean;
  _checksum?: string; // SHA-256 para integridad
}
```

**Violation (Violación de Código):**
```typescript
{
  id: string;
  type: ViolationType; // 'style' | 'security' | 'performance' | 'accessibility' | 'seo' | 'type' | 'unknown'
  severity: Severity; // 'critical' | 'high' | 'medium' | 'low' | 'none'
  file: FileMetadata;
  location: ViolationLocation;
  message: string;
  suggestion?: string;
  rule: string;
  autoFixable: boolean;
  confidence: number; // 0-1
}
```

**Fix (Parche Atómico):**
```typescript
{
  id: string;
  violationId?: string;
  type: 'i18n' | 'a11y' | 'environment' | 'clean-code';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  originalContent: string;
  proposedContent: string;
  autoApply: boolean;
  requiresConfirmation: boolean;
  isCorePath: boolean;
  collisionDetected?: boolean;
  manualMergeRequired?: boolean;
}
```

**DomainMap (Mapa de Dominio):**
```typescript
{
  entities: Entity[];
  relationships: Relationship[];
  criticalPaths: CriticalPath[];
  serverActions: ServerAction[];
  overallConfidence: number;
  metadata: {
    method: 'static' | 'database' | 'hybrid';
    aiAssisted: boolean;
    timestamp: string;
    sourceFiles: string[];
  };
}
```

## Componentes/Módulos Clave

### 1. PhaseOrchestrator (`src/orchestration/phase-orchestrator.ts`)

**Responsabilidad:** Coordinador central que orquesta la ejecución de las 20 fases, asegurando protección de hardware y manejo de errores.

**Implementación Clave:**
- Constructor inicializa `ThermalController`, `DomainAnalyzer`, `ReportAggregator`, `StatePersistence`, `GitCheckpointManager`, `ErrorBaseline`, `ThermalLock`, `MemoryMonitor`
- Método `runFullReview()` ejecuta fases 0-15 secuencialmente con thermal checks entre cada fase
- Método `runFixes()` ejecuta fases 16-18 para remediación
- Método `runIncrementalReview()` ejecuta fase 19 para análisis diferencial
- `checkThermalLock()` verifica temperatura y recursos antes de cada fase, adquiriendo lock si CRITICAL
- `triggerGarbageCollection()` ejecuta GC manual si heap > 1.5GB threshold
- `runWithTimeout()` wrapper para ejecutar fases con timeout de 5 minutos (300,000ms)
- `enforceDryRun()` valida que dry-run mode sea respetado antes de cualquier operación de escritura
- `writePartialReport()` escribe reporte parcial después de cada fase

**Código representativo:**
```typescript
async runFullReview(): Promise<ReviewResult> {
  // Hardware lock check
  await this.checkThermalLock();
  
  // Phase 0: Setup
  const phase0Setup = new Phase0Setup({...});
  const phase0Result = await this.runWithTimeout(() => phase0Setup.execute(), 300000, 'Phase 0: Setup');
  
  // Atomic state sync
  await this.config.statePersistence.saveState(this.config.currentState);
  
  // Memory flush after heavy phase
  if (this.isHeavyPhase(0)) {
    await this.flushMemory();
  }
  
  // ... repeat for phases 1-15
}
```

### 2. ThermalController (`src/core/thermal-controller.ts`)

**Responsabilidad:** Capa de protección de hardware que monitorea GPU/CPU/RAM y aplica cooldowns dinámicos para prevenir daño físico.

**Implementación Clave:**
- `checkTemperature()` ejecuta `nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits` para obtener temperatura GPU
- Si temperatura >= 70°C (CRITICAL): throw error y detiene ejecución
- Si temperatura >= 60°C (WARNING): aplica cooldown extendido
- `checkSystemResources()` usa `systeminformation` para obtener CPU load y RAM usage
- Si CPU >= 90% o RAM >= 95% (CRITICAL): throw error
- `applyCooldown(durationMs)` crea delay para enfriar GPU/CPU
- `applyAdaptiveCooldown(intensity)` aplica cooldown basado en intensidad de operación (low: 10s, medium: 15s, high: 30s)
- `runSelfDiagnostic(durationMs)` ejecuta stress test de 5s calculando rise rate de temperatura y ajustando thresholds dinámicamente
- `detectHardwareCapabilities()` detecta GPU (nvidia-smi), CPU cores, RAM total, y recomienda batch size y cooldown

**Código representativo:**
```typescript
async checkTemperature(): Promise<TemperatureReading> {
  const { stdout } = await execSafe('nvidia-smi', ['--query-gpu=temperature.gpu', '--format=csv,noheader,nounits']);
  const temperature = parseFloat(stdout.trim());
  
  if (temperature >= this.config.criticalThreshold) {
    throw new Error(`CRITICAL: GPU temperature (${temperature}°C) exceeds safe threshold`);
  }
  
  return { current: temperature, isSafe: temperature < this.config.criticalThreshold, category: this.categorizeTemperature(temperature) };
}

async runSelfDiagnostic(durationMs: number = 5000) {
  const initialTemp = (await this.checkTemperature()).current;
  
  // CPU-intensive stress test
  while (Date.now() - startTime < durationMs) {
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += Math.sqrt(i) * Math.random();
    }
  }
  
  const finalTemp = (await this.checkTemperature()).current;
  const temperatureRiseRate = (finalTemp - initialTemp) / (durationMs / 1000);
  
  if (temperatureRiseRate > 2.0) {
    this.config.criticalThreshold = Math.max(60, this.config.criticalThreshold - 5);
    this.config.warningThreshold = Math.max(50, this.config.warningThreshold - 5);
  }
}
```

### 3. StatePersistence (`src/core/state-persistence.ts`)

**Responsabilidad:** "Black box" que persiste estado de ejecución con ACID properties, permitiendo resume capability después de interrupciones (SIGINT, thermal shutdown, crash).

**Implementación Clave:**
- `saveState(state)` escribe estado a `.aegis-state.json` con atomic write pattern:
  1. Genera SHA-256 checksum del contenido
  2. Escribe a archivo temporal `.tmp`
  3. Valida JSON del archivo temporal
  4. Verifica checksum del archivo temporal
  5. Atomic rename de `.tmp` a `.aegis-state.json`
- `loadState()` carga estado y valida checksum, intentando restore desde backup si checksum mismatch
- `createBackup()` crea backup rotativo (mantiene últimos 5 backups)
- `restoreFromBackup()` intenta restore desde backup más reciente con checksum válido
- `recordFile(filePath, processed, error, state)` registra progreso de archivo, guardando cada 50 archivos
- `recordPhase(phaseNumber, phaseName, completed, findingsCount, executionTimeMs, state)` registra progreso de fase
- `recordThermalEvent(gpuTemp, cpuUsage, ramUsage, event, message, state)` registra eventos térmicos
- `markInterrupted(reason, state)` marca ejecución como interrumpida (SIGINT handler)
- `storeAnalysisResults(phase, results, state)` almacena resultados de análisis por fase
- `getFileHash(filePath, state)` cache de hashes SHA-1 para Phase 1

**Código representativo:**
```typescript
async saveState(state: ExecutionState): Promise<void> {
  const stateJson = JSON.stringify(stateToSave, null, 2);
  const checksum = this.generateChecksum(stateJson);
  stateToSave._checksum = checksum;
  const stateJsonWithChecksum = JSON.stringify(stateToSave, null, 2);

  const tmpFilePath = this.stateFilePath + '.tmp';
  
  if (fs.existsSync(this.stateFilePath)) {
    await this.createBackup();
  }

  fs.writeFileSync(tmpFilePath, stateJsonWithChecksum, 'utf-8');
  
  if (!this.isValidJSON(stateJsonWithChecksum)) {
    throw new Error('Generated invalid JSON');
  }

  const tmpParsed = JSON.parse(fs.readFileSync(tmpFilePath, 'utf-8'));
  if (tmpParsed._checksum !== checksum) {
    throw new Error('Checksum mismatch in temp file');
  }

  fs.renameSync(tmpFilePath, this.stateFilePath); // Atomic commit point
}
```

### 4. ReportAggregator (`src/core/reporter.ts`)

**Responsabilidad:** Sistema centralizado para recolectar y gestionar violaciones de todos los auditors, con error delta reporting (separa nuevas vs heredadas) y auto-escalation de severidad basado en contexto de negocio.

**Implementación Clave:**
- `addViolation(auditorName, violation)` agrega violación individual con auto-escalation
- `addViolations(auditorName, violations)` agrega múltiples violaciones
- `setBusinessRiskFindings(riskFindings)` establece hallazgos de riesgo de negocio desde Phase 2
- `autoEscalate(violation)` escala severidad basado en:
  - Critical path: si file.inCriticalPath === true, escala severity
  - Business domain: si Fintech/Health y medium → critical
- `establishBaseline()` ejecuta tsc --noEmit para establecer baseline de errores TSC
- `separateViolations()` separa violaciones en nuevas (no en baseline) vs heredadas (en baseline)
- `getNewViolationCount()` retorna count de violaciones nuevas
- `getInheritedViolationCount()` retorna count de violaciones heredadas
- `generateSummary()` genera Markdown summary con delta de errores, breakdown por severidad/categoría
- `sanitizeReport(content)` usa SecretSanitizer para censurar secretos en reporte

**Código representativo:**
```typescript
private autoEscalate(violation: Violation): Violation {
  let escalateReason = '';
  const currentSeverity = violation.severity as string;
  let escalatedSeverity = this.config.escalationMap.get(currentSeverity);

  // Critical path escalation
  if (violation.file.inCriticalPath) {
    escalateReason = 'File in critical path';
  }

  // Business context escalation
  if (this.businessDomain === 'Fintech' && currentSeverity === 'medium') {
    escalatedSeverity = 'critical';
    escalateReason = escalateReason ? `${escalateReason} + Fintech domain` : 'Fintech domain';
  }

  if (escalatedSeverity && escalatedSeverity !== currentSeverity) {
    return {
      ...violation,
      severity: escalatedSeverity as any,
      message: `${violation.message} (ESCALATED: ${escalateReason})`,
    };
  }

  return violation;
}

separateViolations(): { newViolations: Violation[]; inheritedViolations: Violation[] } {
  const baseline = this.errorBaseline.getBaseline();
  const currentTSCErrors = allViolations.map(v => ({
    file: v.file.path,
    line: v.location.line,
    column: v.location.column || 0,
    code: v.type || 'UNKNOWN',
    message: v.message,
  }));

  const newTSCErrors = this.errorBaseline.compareWithBaseline(currentTSCErrors);
  const newErrorSet = new Set(newTSCErrors.map(e => `${e.file}:${e.line}:${e.column}:${e.code}`));

  for (const violation of allViolations) {
    const errorKey = `${violation.file.path}:${violation.location.line}:${violation.location.column || 0}:${violation.type || 'UNKNOWN'}`;
    if (newErrorSet.has(errorKey)) {
      newViolations.push(violation);
    } else {
      inheritedViolations.push(violation);
    }
  }
}
```

### 5. DomainAnalyzer (`src/inference/domain-analyzer.ts`)

**Responsabilidad:** Motor de inferencia de dominio de negocio que analiza schemas SQL, Prisma, TypeScript types y Server Actions para entender el contexto de negocio y prevenir cambios genéricos que rompan lógica de negocio.

**Implementación Clave:**
- `analyze()` ejecuta análisis completo combinando static analysis y database analysis
- `performStaticAnalysis()` analiza archivos de schema:
  - SQL: parsea `CREATE TABLE` statements usando regex
  - Prisma: parsea `model` definitions
  - TypeScript: parsea interfaces/types que parecen entidades de DB (tienen campo `id`)
- `performDatabaseAnalysis()` conecta a Supabase (si credentials disponibles) y queryea `information_schema.tables` y `information_schema.columns`
- `parseServerActions(content, filePath)` parsea Server Actions Next.js ("use server") detectando funciones
- `inferRelationships(entities)` infiere relaciones basado en foreign keys (campos que terminan en `_id`)
- `inferCriticalPaths(entities, serverActions)` infiere paths críticos de negocio (Authentication, Booking, Payment)
- `reconcileEntities(entities)` reconcilia entidades de múltiples fuentes (SQL, Prisma, TypeScript) detectando singular/plural matches (User vs users)
- `isCoreEntity(entityName)` determina si entidad es core basado en keywords (user, customer, booking, order, payment, etc.)
- `loadSovereignMap()` carga `sovereign.map.json` si existe para override manual del mapa de dominio

**Código representativo:**
```typescript
private parseSQLSchema(content: string, filePath: string): Entity[] {
  const entities: Entity[] = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  const matches = content.match(tableRegex);

  for (const match of matches) {
    const tableNameMatch = match.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
    if (tableNameMatch) {
      const tableName = tableNameMatch[1];
      const fields = this.extractFieldsFromSQL(content, tableName);

      entities.push({
        name: tableName,
        type: 'table',
        fieldCount: fields.length,
        isCore: this.isCoreEntity(tableName),
        confidence: 0.8,
        fields,
        description: `Table defined in ${path.basename(filePath)}`,
        source: 'sql',
      });
    }
  }

  return entities;
}

private inferRelationships(entities: Entity[]): Relationship[] {
  const relationships: Relationship[] = [];

  for (const entity of entities) {
    for (const field of entity.fields) {
      if (field.endsWith('_id')) {
        const referencedEntityName = field.replace('_id', '');
        const referencedEntity = entities.find(e => e.name.toLowerCase() === referencedEntityName.toLowerCase());

        if (referencedEntity) {
          relationships.push({
            from: entity.name,
            to: referencedEntity.name,
            type: 'many-to-one',
            foreignKey: field,
            confidence: 0.7,
          });
        }
      }
    }
  }

  return relationships;
}
```

## Dependencias Críticas

### Dependencias de Runtime

**@clack/prompts (v1.2.0)**
- **Uso:** Interfaz interactiva de línea de comandos para confirmaciones del usuario
- **Implementación:** Usado en CLI para confirmaciones como "Apply fix?" y prompts de selección
- **Archivos que lo usan:** `src/cli.ts` (implícito en comandos interactivos)

**systeminformation (v5.31.5)**
- **Uso:** Monitoreo de hardware (CPU, RAM, GPU, temperatura)
- **Implementación:** `ThermalController.checkSystemResources()` usa `si.currentLoad()` y `si.mem()` para obtener CPU usage y RAM usage
- **Archivos que lo usan:** `src/core/thermal-controller.ts`

**glob (v13.0.6)**
- **Uso:** Pattern matching de archivos para encontrar archivos a analizar
- **Implementación:** Usado en todos los modules/scanners para encontrar archivos por patrones (ej: `**/*.ts`, `src/**/*.tsx`)
- **Archivos que lo usan:** `src/inference/domain-analyzer.ts`, `src/modules/security-scanner.ts`, fases individuales

**dotenv (v17.4.1)**
- **Uso:** Gestión de variables de entorno
- **Implementación:** Carga variables de entorno desde archivos `.env`
- **Archivos que lo usan:** Usado indirectamente via `SecretManager` para cargar Supabase credentials

**fs-extra (v11.2.0)**
- **Uso:** Operaciones de filesystem extendidas
- **Implementación:** Proporciona métodos como `ensureDir`, `readJSON`, `writeJSON` que simplifican operaciones de filesystem
- **Archivos que lo usan:** Múltiples archivos para operaciones de filesystem

**@supabase/supabase-js (v2.103.0)**
- **Uso:** Cliente de Supabase para análisis de base de datos
- **Implementación:** `DomainAnalyzer.performDatabaseAnalysis()` usa Supabase client para queryear `information_schema`
- **Archivos que lo usan:** `src/inference/domain-analyzer.ts`, `src/core/secret-manager.ts`

### Dependencias de Development

**typescript (v6.0.2)**
- **Uso:** Compilador TypeScript para type checking y compilación
- **Implementación:** Usado para compilar el proyecto a JavaScript (`npm run build`) y para syntax checking en fases (`tsc --noEmit`)
- **Archivos que lo usan:** Todo el proyecto (TypeScript source files)

**tsx (v4.21.0)**
- **Uso:** Ejecución directa de TypeScript sin compilación previa
- **Implementación:** Permite ejecutar archivos `.ts` directamente con Node.js
- **Archivos que lo usan:** Usado en scripts de development

**ts-morph (v28.0.0)**
- **Uso:** Manipulación de AST TypeScript
- **Implementación:** Usado para análisis de código a nivel AST (no directamente visible en los archivos leídos, pero probablemente usado en fases avanzadas)
- **Archivos que lo usan:** Probablemente usado en fases de análisis de código

**eslint (v10.2.0)**
- **Uso:** Linting de código
- **Implementación:** Usado para enforce code quality standards
- **Archivos que lo usa:** `eslint.config.js`

**prettier (v3.8.1)**
- **Uso:** Formateo de código
- **Implementación:** Usado para formatear código consistentemente
- **Archivos que lo usa:** Configuración Prettier (no visible en archivos leídos)

**vitest (v4.1.4)**
- **Uso:** Testing framework
- **Implementación:** Usado para ejecutar tests unitarios
- **Archivos que lo usa:** `tests/` directory

## User Journey Técnico

### Journey 1: Full Review (Auditoría Completa)

**Paso 1: Usuario ejecuta comando**
```bash
node dist/cli.js review .
```

**Paso 2: CLI Validation**
- `AegisCLI.validateInput()` valida:
  - Comando es válido ('review', 'fix', 'incremental', 'help')
  - Target directory no contiene path traversal (no '..')
  - Target directory existe y es un directorio
  - Target directory no es un directorio del sistema (Windows: C:\Windows, /etc, /usr)
  - Flag `--yes` requiere `--apply`

**Paso 3: Inicialización de Componentes**
- `ThermalController()` inicializado con config desde `.aegisrc.json` si existe
- `SecretManager({ mockMode: true })` inicializado en modo mock
- `ReportAggregator({ projectRoot })` inicializado
- `StatePersistence(projectRoot)` inicializado
- `ExecutionState` inicializado con `createInitialState(20)`

**Paso 4: Self-Diagnostic Stress Test**
- `ThermalController.runSelfDiagnostic(5000)` ejecuta stress test de 5s
- Calcula temperature rise rate
- Ajusta thresholds si rise rate > 2.0°C/s
- Verifica cleanup y ejecuta GC manual si disponible
- Output: `Diagnostic passed: true/false, Temperature rise rate: X°C/s, Thresholds adjusted: true/false`

**Paso 5: Hardware Detection**
- `ThermalController.detectHardwareCapabilities()` detecta:
  - GPU via nvidia-smi (model, VRAM)
  - CPU cores
  - RAM total
  - Recomienda batch size y cooldown basado en hardware

**Paso 6: Error Baseline Establishment**
- `ReportAggregator.establishBaseline()` ejecuta `tsc --noEmit`
- Parsea errores TSC y genera firma de baseline
- Almacena en `ErrorBaseline` para comparación delta

**Paso 7: Phase 0 - Setup**
- `Phase0Setup.execute()` ejecuta:
  - Hardware Lock (ya ejecutado en paso 4)
  - Dependencies Check: verifica node_modules y lockfile
  - Critical Files Check: verifica package.json, tsconfig.json, .gitignore
  - Syntax Check: ejecuta `tsc --noEmit` o fallback a basic syntax check
- Si algún check falla: detiene ejecución y retorna error
- Si todos pasan: guarda resultado en `StatePersistence` y escribe partial report

**Paso 8: Phase 1 - Code Quality**
- `Phase1CodeQuality.execute()` analiza archivos TypeScript/JavaScript
- Calcula quality scores por archivo
- Identifica critical files (bajo quality score o en paths críticos)
- Reporta violaciones a `ReportAggregator`
- `StatePersistence.recordPhase()` guarda progreso
- `StatePersistence.saveState()` persiste estado con SHA-256 checksum
- Si fase pesada: `PhaseOrchestrator.triggerGarbageCollection()` ejecuta GC

**Paso 9: Phase 2 - Business Logic**
- `Phase2BusinessLogic.execute()` analiza:
  - `package.json` para detectar dominio de negocio (Fintech, Health, E-Commerce, SaaS, etc.)
  - `README.md` para keywords de dominio
  - Combina detecciones y calcula confidence score
  - Identifica core paths (/services, /api/v1, /core, /lib)
  - Cross-reference con Phase 1 quality scores para identificar risk findings
  - Detecta self-audit (Aegis QA auditándose a sí mismo)
  - Analiza core flow patterns (useContext, Cart, Auth, Payment)
  - Calcula sensitivity level (high/medium/low)
  - Genera business understanding (descripción human-readable)
  - Genera untouchable folders para Atomic Fixer
- `ReportAggregator.setBusinessRiskFindings(riskFindings)` establece hallazgos
- `StatePersistence.recordPhase()` guarda progreso

**Paso 10: Phase 3 - Security**
- `Phase3Security.execute()` ejecuta:
  - `SecurityScanner.scan()` escanea archivos para violaciones de seguridad
  - Detecta RLS policies en archivos SQL
  - Detecta service role key abuse en código cliente
  - Cross-check con DomainMap para missing policies en tablas críticas
- Reporta violaciones a `ReportAggregator`
- Si critical findings detected: set `highRiskBlocker = true` en ExecutionState
- `StatePersistence.recordPhase()` guarda progreso

**Paso 11: Phases 4-15 (System Integrity)**
- Repite patrón para fases 4-15:
  - Phase 4: Database - Schema validation
  - Phase 5: Clean Code - Code smells y complexity
  - Phase 6: API Contracts - Validación de contratos API
  - Phase 7: Testing Strategy - Cobertura de tests
  - Phase 8: Performance - Optimización de performance
  - Phase 9: i18n & a11y - Internacionalización y accesibilidad
  - Phase 10: Environment & CI/CD - Configuración de entorno
  - Phase 11: Atomic Fixes - Generación de fixes (sin aplicar)
  - Phase 12: Error Handling, Observability & Resilience - Manejo de errores
  - Phase 13: Global & Pattern - i18n/l10n y Predictive Bugs
  - Phase 14: Ops & Hygiene - Cloud Cost Detection y Git Hygiene
  - Phase 15: DevOps Suite - CI/CD, SCA Security, Cloud Infra, Containerization

**Paso 12: Generación de Reporte Final**
- `ReportAggregator.separateViolations()` separa violaciones:
  - Compara violaciones actuales con baseline de TSC
  - Genera error key: `file:line:column:code`
  - Violaciones con key en baseline = heredadas
  - Violaciones con key no en baseline = nuevas
- `ReportAggregator.generateSummary()` genera Markdown:
  - Sección URGENT BUSINESS RISK (si hay hallazgos de riesgo)
  - Sección Error Delta (new vs inherited)
  - Sección Applied/Suggested Fixes
- `SecretSanitizer.sanitizeReport()` censura secretos
- Escribe `qa-report.md`

**Paso 13: Smart Exit Code**
- Si newViolationCount > 0: exit code 1 (failure)
- Si inheritedViolationCount > 0 y newViolationCount == 0: exit code 0 (success)
- Si error en ejecución: exit code 1

**Paso 14: Cleanup**
- `StatePersistence.clearState()` limpia `.aegis-state.json` si ejecución exitosa

### Journey 2: Atomic Fixes (Remediación)

**Paso 1: Usuario ejecuta comando**
```bash
node dist/cli.js fix . --apply
```

**Paso 2: CLI Validation**
- Validación de input igual que Full Review
- Valida que `--apply` esté presente (default es dry-run mode)

**Paso 3: Inicialización**
- Igual que Full Review (ThermalController, SecretManager, ReportAggregator, StatePersistence)

**Paso 4: Phase 16 - Fix Strategy Generation**
- `Phase16FixStrategy.execute()` genera estrategia de fixes:
  - `AtomicFixer.generateFixes(violations)` genera parches:
    - i18n fixes: agrega alt text a imágenes, aria-label a buttons
    - environment fixes: crea .env.example con variables detectadas
    - clean-code fixes: refactorea funciones con muchos parámetros a options object pattern
  - Collision detection: detecta múltiples fixes en la misma línea
  - Si collision detected: marca como `manualMergeRequired = true`
  - Dependency Blast Radius: protege archivos "high-traffic" con Safe Level 4

**Paso 5: Phase 17 - Multi-Fix Execution**
- `Phase17MultiFixExecution.execute()` ejecuta fixes en batch:
  - Para cada fix:
    - `AtomicFixer.applyFix(fix)`:
      - Genera patch file en `.sentinel/diffs/`
      - Syntax Pre-flight: `validateSyntax()` verifica sintaxis (balance de braces/parens)
      - Si dry-run: skip aplicación
      - Si autoApply o interactive:
        - Crea backup en `.sentinel/diffs/backup-{fixId}.bak`
        - Aplica fix escribiendo en archivo
        - Agrega traceability comment: `// Sentinel Fix ID: {id} | Violation ID: {violationId} | Applied: {timestamp}`
        - Validation Loop: re-ejecuta auditoría específica
        - Si validation failed: `rollbackFix()` revierte a backup
  - Dynamic Thermal Throttle:
    - Si CPU > 70%: reduce paralelismo a 1 archivo + pausas de 2s
    - Monitorea temperatura entre cada fix

**Paso 6: Phase 18 - Post-Fix Validation**
- `Phase18PostFixValidation.execute()` valida fixes:
  - Global Integrity Check: compara firma TSC baseline vs post-fix
  - Si firma diferente: algunos fixes introdujeron errores
  - Zombie Hunter: limpia archivos `.backup.*.tmp` recursivamente
  - Reporta: fixedCount, needsHumanReview, failedCount

**Paso 7: Generación de Reporte**
- Igual que Full Review pero con sección de Applied Fixes

**Paso 8: Smart Exit Code**
- Igual que Full Review

### Journey 3: Incremental Review (Análisis Diferencial)

**Paso 1: Usuario ejecuta comando**
```bash
node dist/cli.js incremental .
```

**Paso 2: CLI Validation**
- Igual que Full Review

**Paso 3: Inicialización**
- Igual que Full Review

**Paso 4: Phase 19 - Incremental Review**
- `Phase19IncrementalReview.execute()` analiza cambios:
  - Obtiene git diff: archivos modificados desde último commit
  - Para cada archivo modificado:
    - Calcula SHA-256 hash del contenido actual
    - Compara con hash cacheado en `StatePersistence`
    - Si hash diferente: archivo tiene cambios reales → analizar
    - Si hash igual: archivo sin cambios reales → skip
  - Ejecuta fases selectivas solo en archivos con cambios:
    - Phase 1: Code Quality
    - Phase 3: Security
    - Phase 11: Atomic Fixes
  - Hash-Validation Double Check: usa SHA-256 para asegurar que cache sea infalible

**Paso 5: Generación de Reporte**
- Reporte enfocado en archivos modificados
- Delta de errores solo en archivos con cambios

**Paso 6: Smart Exit Code**
- Igual que Full Review

---

**Especificaciones Técnicas Generadas:** 20 de Enero 2026
**Versión de Aegis QA Analizada:** 1.0.0
**Total de Archivos Analizados:** 15+ archivos clave
**Líneas de Código Analizadas:** ~15,000+ líneas
