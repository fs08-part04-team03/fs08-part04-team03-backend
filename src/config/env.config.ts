import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// 파싱 유틸
function int(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return defaultValue;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid int env: ${name}=${raw}`);
  return n;
}

function str(name: string, defaultValue?: string): string {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    if (defaultValue != null) return defaultValue;
    throw new Error(`Missing env: ${name}`);
  }
  return raw;
}

function csv(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export const env = {
  NODE_ENV,

  PORT: int('PORT', 4000),
  API_VERSION: str('API_VERSION', 'v1'),

  DATABASE_URL: str('DATABASE_URL'),

  JWT_ACCESS_SECRET: str('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: str('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRY: str('JWT_ACCESS_EXPIRY', '5m'),
  JWT_REFRESH_EXPIRY: str('JWT_REFRESH_EXPIRY', '1h'),

  ALLOWED_ORIGINS: csv('ALLOWED_ORIGINS'),

  RATE_LIMIT_WINDOW_MS: int('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: int('RATE_LIMIT_MAX_REQUESTS', 100),

  EXTERNAL_API_KEY: str('EXTERNAL_API_KEY', ''),
  EXTERNAL_API_URL: str('EXTERNAL_API_URL', ''),
} as const;
