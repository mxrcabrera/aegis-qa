# Secret Manager Guide v2

## Overview

SecretManager es una capa de abstracción segura para gestionar secretos en QA Orchestrator v2. Valida automáticamente las conexiones con Supabase y proporciona un Mock Mode para desarrollo sin secretos reales.

## Estructura de Archivos

```
qa-orchestrator/
├── .env.example                    # Template con nombres de variables (safe to commit)
├── .env                           # Valores reales (NEVER committed)
├── .gitignore                     # Protege .env, .env.local, .env.production, .env.test
├── lib/
│   └── secret-manager.ts          # Capa de abstracción segura
└── references/
    └── secret-manager-guide.md    # Esta guía
```

## Secretos Disponibles

- **SUPABASE_URL** (required)
- **SUPABASE_ANON_KEY** (required)
- **SUPABASE_SERVICE_ROLE_KEY** (optional)
- **TEST_USER_EMAIL** (required)
- **TEST_USER_PASSWORD** (required)
- **TEST_ADMIN_EMAIL** (optional)
- **TEST_ADMIN_PASSWORD** (optional)
- **OPENAI_API_KEY** (optional)
- **ANTHROPIC_API_KEY** (optional)
- **TEST_BASE_URL** (default: http://localhost:3000)
- **TEST_TIMEOUT_MS** (default: 30000)

## Uso Seguro para Agentes

### ✅ CORRECTO

```typescript
import SecretManager from './lib/secret-manager';

// Referencia secretos por nombre de clave
const url = SecretManager.get('SUPABASE_URL');
const key = SecretManager.get('SUPABASE_ANON_KEY');

// Log que se accedió a un secreto (NO el valor)
console.log(`Using ${url} from environment`);

// Verificar si existe un secreto
if (SecretManager.has('OPENAI_API_KEY')) {
  // Usar la API key
}
```

### ❌ INCORRECTO

```typescript
// NUNCA escribas valores de secretos en código
const url = 'https://xyz.supabase.co';  // FORBIDDEN
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // FORBIDDEN

// NUNCA loguees valores de secretos
console.log(SecretManager.get('API_KEY'));  // FORBIDDEN
```

## API Methods

### `get(key: string): Promise<string>`

Obtiene el valor de un secreto.

```typescript
const url = await secretManager.get('SUPABASE_URL');
```

### `getString(key: string): string`

Obtiene el valor de un secreto como string (síncrono).

```typescript
const email = secretManager.getString('TEST_USER_EMAIL');
```

### `has(key: string): boolean`

Verifica si un secreto existe.

```typescript
if (secretManager.has('OPENAI_API_KEY')) {
  // Usar la API key
}
```

### `validate(): void`

Valida que todos los secretos requeridos estén presentes.

```typescript
try {
  secretManager.validate();
  console.log('✅ All required secrets validated');
} catch (error) {
  console.warn('⚠️ Warning: Some secrets are missing');
}
```

### `sanityCheckAndRepair(key: string): Promise<string | null>`

Verifica y repara un secreto inválido. Busca en múltiples ubicaciones y activa Mock Mode si no encuentra un valor válido.

```typescript
const validKey = await secretManager.sanityCheckAndRepair('SUPABASE_URL');
```

## Validación de Supabase v2

### `isValidSupabaseKey(key: string): boolean`

Valida que una clave de Supabase tenga el formato correcto.

```typescript
if (key.includes('SUPABASE') && secretManager.isValidSupabaseKey(value)) {
  console.log('Sanity check passed');
}
```

## Mock Mode

Cuando no se encuentran secretos reales, SecretManager activa automáticamente Mock Mode para permitir desarrollo sin configuración.

### Valores Mock

```typescript
SUPABASE_URL: "https://mock.supabase.co"
SUPABASE_ANON_KEY: "mock-anon-key-for-testing-only"
SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...mock-signature"
TEST_USER_EMAIL: "mock-user@example.com"
TEST_USER_PASSWORD: "mock-password-123"
TEST_BASE_URL: "http://localhost:3000"
```

## Carga desde .env

SecretManager busca automáticamente en múltiples ubicaciones:

1. `process.cwd()/.env`
2. `process.cwd()/../.env`
3. `process.cwd()/../../.env`
4. `__dirname/../.env` (Relativo a qa-orchestrator)
5. `__dirname/../../../.env` (Relativo a qa-orchestrator)

## Integración CI/CD

### GitHub Actions

```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Vercel

Configura las variables de entorno en el dashboard de Vercel.

## Masking de Secretos

SecretManager automáticamente enmascara valores de secretos en logs y reportes para evitar exposición.

```typescript
// En logs: "Using *** from environment" (valor oculto)
console.log(`Using ${url} from environment`);
```

## Ejemplo Completo

```typescript
import SecretManager from './lib/secret-manager';

async function initializeSupabase() {
  const secretManager = new SecretManager();
  
  try {
    // Validar todos los secretos requeridos
    await secretManager.validate();
    
    // Obtener credenciales
    const url = await secretManager.get('SUPABASE_URL');
    const key = await secretManager.get('SUPABASE_ANON_KEY');
    
    // Sanity check & repair para keys inválidas
    const validUrl = await secretManager.sanityCheckAndRepair('SUPABASE_URL');
    
    // Usar las credenciales (valor está oculto/mascarado)
    console.log(`Connecting to ${validUrl}`);
    
    return { url, key };
  } catch (error) {
    console.warn('Activating Mock Mode for development');
    // Mock Mode se activa automáticamente
  }
}
```

## Seguridad

- ✅ Los secretos nunca se loguean en texto plano
- ✅ Los secretos nunca se exponen en reportes
- ✅ Mock Mode activado automáticamente para desarrollo
- ✅ Validación automática de formato de claves
- ✅ Búsqueda en múltiples ubicaciones para .env
