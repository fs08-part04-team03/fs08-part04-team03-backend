import type { Request } from 'express';

export type AuthTokenPayload = {
  userId: string;
  companyId: string;
  email: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  iat: number;
  exp: number;
};

export type AuthenticatedRequest = Request & { user?: AuthTokenPayload };
