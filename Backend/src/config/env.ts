import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_JWT_SECRET = 'dev-secret-change-in-production';
const DEFAULT_JWT_REFRESH_SECRET = 'dev-refresh-secret-change-in-production';
const DEFAULT_BRAINSCAPE_EXPORT_PATH =
  '/home/dedzec/Documents/bots/bot-brainscape/exports/brainscape_export_2026-04-25T21-06-40-019Z.json';

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  TRUST_PROXY: (() => {
    const val = process.env.TRUST_PROXY;
    if (!val || val === '0' || val === 'false') return false as const;
    if (val === '1' || val === 'true') return true as const;
    if (/^\d+$/.test(val)) return Number.parseInt(val, 10);
    return val; // e.g. 'loopback', 'linklocal', subnet
  })() as boolean | number | string,

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'flashcards_db',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  DB_CONNECT_TIMEOUT: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10),
  REFRESH_TOKEN_REMEMBER_DAYS: parseInt(process.env.REFRESH_TOKEN_REMEMBER_DAYS || '30', 10),

  // CORS
  FRONTEND_ORIGINS: (() => {
    const envOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGINS || '';
    const origins = envOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const defaults = ['http://localhost:5173'];
    return [...new Set([...origins, ...defaults])];
  })(),

  // Cookies
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
  CROSS_SITE_COOKIES: process.env.CROSS_SITE_COOKIES === 'true',
  ENABLE_SWAGGER: (() => {
    const raw = process.env.ENABLE_SWAGGER;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return (process.env.NODE_ENV || 'development') !== 'production';
  })(),
  SEED_DEFAULT_USERS: process.env.SEED_DEFAULT_USERS === 'true',
  SEED_DEVELOP_EMAIL: process.env.SEED_DEVELOP_EMAIL || '',
  SEED_DEVELOP_PASSWORD: process.env.SEED_DEVELOP_PASSWORD || '',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || '',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || '',
  BRAINSCAPE_EXPORT_PATH: process.env.BRAINSCAPE_EXPORT_PATH || DEFAULT_BRAINSCAPE_EXPORT_PATH,
  BRAINSCAPE_IMPORT_TAG: process.env.BRAINSCAPE_IMPORT_TAG || 'brainscape:2026-04-25',
  BRAINSCAPE_IMPORT_ACTOR_EMAIL: process.env.BRAINSCAPE_IMPORT_ACTOR_EMAIL || 'brainscape-import@local.invalid',

  // reCAPTCHA
  RECAPTCHA_V3_SECRET_KEY: process.env.RECAPTCHA_V3_SECRET_KEY || '',
  RECAPTCHA_V3_SITE_KEY: process.env.RECAPTCHA_V3_SITE_KEY || '',
  RECAPTCHA_V2_SECRET_KEY: process.env.RECAPTCHA_V2_SECRET_KEY || '',
  RECAPTCHA_V2_SITE_KEY: process.env.RECAPTCHA_V2_SITE_KEY || '',
  RECAPTCHA_MIN_SCORE: parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5'),

  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@flashcards.app',

  // Helpers
  isDev: () => env.NODE_ENV === 'development',
  isProd: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test',
};

// Validação de variáveis críticas em produção
export function validateEnv(): void {
  if (!env.isProd()) return;

  const required: (keyof typeof env)[] = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_PASSWORD',
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}`);
  }

  if (env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error('JWT_SECRET nao pode usar o valor padrao em producao');
  }

  if (env.JWT_REFRESH_SECRET === DEFAULT_JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET nao pode usar o valor padrao em producao');
  }

  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção');
  }

  // Warn (não bloqueia) sobre reCAPTCHA em produção
  if (!env.RECAPTCHA_V3_SECRET_KEY) {
    // eslint-disable-next-line no-console
    console.warn('[WARN] RECAPTCHA_V3_SECRET_KEY não definida — reCAPTCHA v3 desativado em produção');
  }
}

export default env;
