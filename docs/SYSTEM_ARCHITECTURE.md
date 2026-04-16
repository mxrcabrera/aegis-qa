# System Architecture v2 - The Sovereign Edition

## Overview

QA Orchestrator v2 es un framework de QA autónomo para desarrolladores de Next.js/Supabase que combina auditoría de código, inferencia de dominio de negocio y protección de hardware en una arquitectura unificada.

## Pilares de Arquitectura

### 1. El Escudo (Hardware Protection Layer)

**Componente:** `lib/thermal-controller.ts`

El sistema de protección de hardware garantiza que la GPU nunca supere los 70°C:

- **Detección de VRAM**: Antes de cada proceso, el sistema decide qué modelo usar (7B vs 32B) basado en la capacidad real
- **Thermal Throttling**: Un controlador central que detiene el loop de ejecución si la GPU cruza los 70°C
- **Cooldown Mandatorio**: Ciclos de enfriamiento de 15s/20s integrados en el core del orquestador

**Reglas de Cooldown:**
- Base: 15 segundos después de CADA archivo
- Regla de Oro: 20 segundos cada 3 archivos
- Modo Dinámico: 15 segundos para archivos > 500 líneas

**Ajuste de Concurrencia según VRAM:**
- < 8GB: 1 proceso concurrente, modelo 7B
- 8-12GB: 2 procesos concurrentes, modelo 7B
- 12-16GB: 3 procesos concurrentes, modelo 32B
- > 16GB: 4 procesos concurrentes, modelo 32B

### 2. El Cerebro (Domain & Logic)

**Componentes:** `lib/domain-inference.ts`, `lib/secret-manager.ts`

**Domain Inference:**
- Analiza esquemas de DB y Server Actions para entender el dominio de negocio
- Detecta entidades principales (users, products, orders, etc.)
- Inferir relaciones entre entidades (one-to-one, one-to-many, many-to-many)
- Identifica reglas de negocio implícitas
- Genera resumen del dominio en lenguaje natural

**SecretManager v2:**
- Validación automática de conexión con Supabase
- Sanity Check & Repair para keys inválidas
- Mock Mode para desarrollo sin secretos
- Masking automático de secretos en logs y reportes
- Búsqueda en múltiples ubicaciones para .env

### 3. El Músculo (Auditoría & Fix)

**Componentes:** `lib/code-reader.ts`, `lib/style-auditor.ts`, `lib/security-scanner.ts`

**Auditores Especializados (reutilizados de v1):**
- **CodeReader**: Mapea el App Router de Next.js, detecta Server Actions, escanea archivos
- **StyleAuditor**: Detecta violaciones de estilo (inline styles, colores hardcodeados, espaciado)
- **SecurityScanner**: Verifica RLS en Supabase, detecta SERVICE_ROLE_KEY en código cliente

**Atomic Auto-Fixer:**
- Aplicación de parches con validación inmediata mediante npx tsc
- Fixes por severidad (Critical > High > Medium > Low)
- Un commit por fix

## Estructura de Archivos

```
/qa-orchestrator
├── /src
│   └── index.ts                      <-- Orquestador principal v2
├── /lib
│   ├── thermal-controller.ts         <-- Control térmico (NUEVO)
│   ├── secret-manager.ts             <-- Gestión segura (REESCRITO)
│   ├── domain-inference.ts           <-- Entendimiento de negocio (NUEVO)
│   ├── code-reader.ts                <-- (REUTILIZADO de v1)
│   ├── style-auditor.ts              <-- (REUTILIZADO de v1)
│   ├── security-scanner.ts           <-- (REUTILIZADO de v1)
│   ├── report-aggregator.ts          <-- Agregación de reportes
│   └── types/
│       └── audit.ts                  <-- Interfaces estrictas (SIN ANY)
├── /references
│   ├── secret-manager-guide.md       <-- Guía de uso seguro
│   ├── phase-fix.md                  <-- [OBSOLETO] Referencia de v1
│   ├── phase-review.md               <-- [OBSOLETO] Referencia de v1
│   ├── report-template.md            <-- Template de reportes
│   └── skills-map.md                 <-- [OBSOLETO] Referencia de v1
├── /lib/templates
│   └── report-template.md            <-- Template de reportes
├── README.md                         <-- Documentación principal v2
├── SYSTEM_ARCHITECTURE.md           <-- Este archivo
├── OLLAMA_APB_LOG.md                 <-- Log de auditoría (preservado)
└── package.json
```

## Flujo de Ejecución v2

```
src/index.ts (Orquestador Principal)
    ↓
1. Inicialización
   - ThermalController (chequeo de VRAM y temperatura)
   - SecretManager (validación de secretos)
   - ReportAggregator (inicialización)
    ↓
2. Domain Discovery
   - DomainInference (análisis de esquemas DB)
   - Empty Project Guard (cancelación si no hay entidades)
    ↓
3. Auditoría
   - SecurityScanner (con ThermalController)
   - StyleAuditor (con ThermalController)
   - CodeReader (con ThermalController)
    ↓
4. Agregación de Reportes
   - ReportAggregator (centraliza violaciones)
   - Hardware Safety Metrics (métricas térmicas)
    ↓
5. Generación de Reporte
   - SOVEREIGN_REPORT.md
   - Clickable path (OSC 8)
```

## Integración de Hardware

### CodeReader
```typescript
// Hardware check antes de procesar
if (this.config.thermalController) {
  const tempReading = await this.config.thermalController.checkTemperature();
  if (!tempReading.isSafe) {
    console.warn(`[CodeReader] GPU temperature unsafe (${tempReading.current}°C), applying cooldown`);
    await this.config.thermalController.applyCooldown(3000);
  }
}
```

### StyleAuditor
```typescript
// Hardware check antes de auditar
if (this.thermalController) {
  const tempReading = await this.thermalController.checkTemperature();
  if (!tempReading.isSafe) {
    console.warn(`[StyleAuditor] GPU temperature unsafe (${tempReading.current}°C), applying cooldown`);
    await this.thermalController.applyCooldown(3000);
  }
}
```

### SecurityScanner
```typescript
// ThermalController importado y utilizado
import ThermalController from "./thermal-controller.js";
```

## Seguridad

### SERVICE_ROLE_KEY Detection

**Patrones de Regex:**
- `/SERVICE_ROLE_KEY/i`
- `/supabase.*service.*role/i`
- `/SUPABASE_SERVICE_ROLE_KEY/i`

**BLOCKER Severity:**
Si se detecta SERVICE_ROLE_KEY en `app/` sin directiva 'use server':
```
🚨 BLOCKER: Service Role Key detectado en archivo dentro de app/ sin directiva 'use server'. 
Esta es una fuga de seguridad CRÍTICA. La Service Role Key puede acceder a TODOS los datos sin RLS. 
Nunca debe usarse en código cliente. Mover a Server Action o usar ANON key.
```

### Masking de Secretos

SecretManager automáticamente enmascara valores en logs:
```typescript
// En logs: "Using *** from environment" (valor oculto)
console.log(`Using ${url} from environment`);
```

## Reportes

### SOVEREIGN_REPORT.md

El reporte incluye:
- **Violations**: Por auditor (security, style, code)
- **Hardware Safety Metrics**: Temperatura GPU, VRAM disponible, límite de concurrencia
- **Domain Context**: Entidades inferidas, relaciones, reglas de negocio
- **Severity Levels**: Critical, High, Medium, Low

### ReportAggregator

Centraliza violaciones de todos los módulos:
```typescript
reportAggregator.addViolations(securityResult.violations);
reportAggregator.addViolations(styleResult.violations);
reportAggregator.addViolations(codeResult.violations);
```

## Diferencias con v1

### v1 (Legacy)
- Orquestador: `lib/orchestrator.ts` (pipeline: Seed → Audit → Fix → Test → Verify → Report)
- Sin protección de hardware
- Sin Domain Inference
- SecretManager básico
- OllamaProcessor sin cooldowns

### v2 (Sovereign Edition)
- Orquestador: `src/index.ts` (pipeline simplificado con Domain Discovery)
- **Hardware Protection Layer** (ThermalController)
- **Domain Inference** (entendimiento de negocio)
- **SecretManager v2** (validación, Mock Mode, Masking)
- Cooldowns mandatorios en cada módulo

## Módulos Obsoletos

Los siguientes archivos de references/ contienen documentación de v1 y están marcados como obsoletos:

- `references/phase-fix.md` - Fases de fix de v1
- `references/phase-review.md` - Fases de review de v1
- `references/skills-map.md` - Skills de Claude Code de v1

Estos se preservan por contexto histórico pero no reflejan el flujo actual de v2.

## Integración CI/CD

### GitHub Actions
```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Vercel
Configura las variables de entorno en el dashboard de Vercel.

## Definición de "Terminado" (DoD)

- ✅ **Cero Errores**: npx tsc --noEmit debe dar 0 (en código v2)
- ✅ **Seguridad Térmica**: La GPU no debe superar los 70°C en ningún momento
- ✅ **Integridad**: Los secretos nunca deben quedar expuestos en logs o reportes
- ✅ **Calidad**: El reporte final debe listar contexto de negocio inferido
