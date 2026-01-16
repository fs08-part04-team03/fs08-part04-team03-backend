import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';
const defaultOrigins =
  NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:4000'] : undefined;

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

function optionalStr(name: string, defaultValue?: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) {
    return defaultValue;
  }
  if (raw === '') {
    return undefined; // 빈 문자열은 undefined로 처리
  }
  return raw;
}

function secret(name: string, minLength: number = 32): string {
  const value = str(name);
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters long`);
  }
  return value;
}

function csv(name: string, defaultValue?: string[]): string[] {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') {
    if (defaultValue) return defaultValue;
    throw new Error(`Missing env: ${name}`);
  }
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function bool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === '') return defaultValue;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`Invalid boolean env: ${name}=${raw}`);
}

// 환경 변수 객체
export const env = {
  NODE_ENV,

  PORT: int('PORT', 4000),
  API_VERSION: str('API_VERSION', 'v1'),

  DATABASE_URL: str('DATABASE_URL'),

  JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRY: str('JWT_ACCESS_EXPIRY', '5m'),
  JWT_REFRESH_EXPIRY: str('JWT_REFRESH_EXPIRY', '1h'),
  SESSION_SECRET: secret('SESSION_SECRET', 32),

  COOKIE_DOMAIN: optionalStr('COOKIE_DOMAIN', 'localhost'),
  COOKIE_SECURE: bool('COOKIE_SECURE', false),
  COOKIE_SAME_SITE: str('COOKIE_SAME_SITE', 'lax') as 'strict' | 'lax' | 'none',
  COOKIE_PATH: str('COOKIE_PATH', '/'),

  ALLOWED_ORIGINS: csv('ALLOWED_ORIGINS', defaultOrigins),

  RATE_LIMIT_WINDOW_MS: int('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: int('RATE_LIMIT_MAX_REQUESTS', 100),

  EXTERNAL_API_KEY: str('EXTERNAL_API_KEY', ''),
  EXTERNAL_API_URL: str('EXTERNAL_API_URL', ''),

  API_HOST: str(
    'API_HOST',
    NODE_ENV === 'production' ? 'fs08-part04-team03-backend.onrender.com' : ''
  ),

  INVITATION_EXPIRES_HOURS: int('INVITATION_EXPIRES_HOURS', 48),

  WEB_APP_BASE_URL: str('WEB_APP_BASE_URL', 'http://localhost:4000'),

  EMAIL_HOST: str('EMAIL_HOST', 'smtp.example.com'),
  EMAIL_PORT: int('EMAIL_PORT', 587),
  EMAIL_USER: str('EMAIL_USER', 'example@example.com'),
  EMAIL_PASS: str('EMAIL_PASS', 'password'),

  // AWS S3 설정
  AWS_REGION: str('AWS_REGION', 'ap-northeast-2'),
  AWS_ACCESS_KEY_ID: str('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: str('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET_NAME: str('AWS_S3_BUCKET_NAME'),

  NOTIFICATION_RETENTION_DAYS: int('NOTIFICATION_RETENTION_DAYS', 14),
} as const;
