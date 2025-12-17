import type { Request } from 'express';

// 인증 토큰 페이로드
export type AuthTokenPayload = {
  userId: string;
  companyId: string;
  email: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  iat: number;
  exp: number;
};

export type PurchaseRequestBody = {
  shippingFee: number;
  totalPrice: number;
  productId: number;
  quantity: number;
};

export type AuthenticatedRequest = Request & { user?: AuthTokenPayload };
export type BudgetCheckRequest = Request &
  AuthenticatedRequest & {
    body: PurchaseRequestBody;
  };
