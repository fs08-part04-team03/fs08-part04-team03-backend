import type { SignOptions } from 'jsonwebtoken';

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!accessSecret) throw new Error('JWT_ACCESS_SECRET is required');
if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is required');

const accessExpiry = (process.env.JWT_ACCESS_EXPIRY ?? '15m') as SignOptions['expiresIn'];
const refreshExpiry = (process.env.JWT_REFRESH_EXPIRY ?? '7d') as SignOptions['expiresIn'];

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
