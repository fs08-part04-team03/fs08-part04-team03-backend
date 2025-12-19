import type { Request } from 'express';

// 인증 토큰 페이로드
export type AuthTokenPayload = {
  userId: string;
  id: string;
  companyId: string;
  email: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
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
