import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '..', '.env');
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : rootEnvPath;

dotenv.config({ path: envPath });

// --- Fail-fast validation ---------------------------------------------------
const REQUIRED = ['REDIS_URL'];
const RECOMMENDED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[env] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const warned = RECOMMENDED.filter((k) => !process.env[k]);
if (warned.length) {
  console.warn(`[env] Missing recommended env vars (features disabled): ${warned.join(', ')}`);
}
