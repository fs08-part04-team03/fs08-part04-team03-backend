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

export type PurchaseItemRequest = {
  productId: number;
  quantity: number;
};

export type PurchaseRequestBody = {
  shippingFee: number;
  items: PurchaseItemRequest[];
};

export type AuthenticatedRequest = Request & { user?: AuthTokenPayload };

export interface BudgetCheckRequest {
  user?: AuthTokenPayload;
  body: PurchaseRequestBody;
  params: any;
  query: any;
  headers: any;
}
