import type { Request } from 'express';
import type { role } from '@prisma/client';

// 인증 토큰 페이로드
export type AuthTokenPayload = {
  id: string;
  companyId: string;
  email: string;
  role: role;
  iat: number;
  exp: number;
};

export type PurchaseItemRequest = {
  productId: number;
  quantity: number;
};

export type PurchaseRequestBody = {
  shippingFee: number;
  items: PurchaseItemRequest[];
};

export type AuthenticatedRequest = Request & { user?: AuthTokenPayload };

export type BudgetCheckRequest = Request<never, never, PurchaseRequestBody, never> & {
  user?: AuthTokenPayload;
};
