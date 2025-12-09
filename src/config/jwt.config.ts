import type { SignOptions } from 'jsonwebtoken';
import { env } from './env.config';

const accessSecret = env.JWT_ACCESS_SECRET;
const refreshSecret = env.JWT_REFRESH_SECRET;
if (!accessSecret) throw new Error('JWT_ACCESS_SECRET is required');
if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is required');

const accessExpiry = (env.JWT_ACCESS_EXPIRY ?? '15m') as SignOptions['expiresIn'];
const refreshExpiry = (env.JWT_REFRESH_EXPIRY ?? '7d') as SignOptions['expiresIn'];

export const jwtConfig = {
  accessToken: {
    secret: accessSecret,
    expiresIn: accessExpiry,
  },
  refreshToken: {
    secret: refreshSecret,
    expiresIn: refreshExpiry,
  },
} as const;
