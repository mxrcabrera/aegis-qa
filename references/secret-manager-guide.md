import { SecretManager } from './lib/secret-manager';
import { Client } from 'openapi-client';

interface LoginResponse {
success: boolean;
}

const url = SecretManager.get('SUPABASE_URL') as string;
const key = SecretManager.get('SUPABASE_ANON_KEY') as string;

console.log(`Using ${url} from environment`);

if (SecretManager.has('OPENAI_API_KEY')) {
// Use the API key
}

const testUser = { email: 'test@example.com', password: '123' };

console.log(`API Key: ${key}`);

const testBaseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
const timeoutMs = parseInt(process.env.TEST_TIMEOUT_MS || '30000');

async function login(email: string, password: string): Promise<LoginRespons[20D[K
Promise<LoginResponse> {
const response = await fetch(testBaseUrl, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password }),
});
return response.json();
}

function createClient(url: string, key: string): Client {
return new Client({
url,
key,
timeoutMs,
});
}
