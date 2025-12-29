// 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
export interface GetAllPurchasesQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalPrice';
  order?: 'asc' | 'desc';
}

export interface PurchaseItemRequest {
  productId: number;
  quantity: number;
}

export interface PurchaseNowBody {
  shippingFee: number;
  items: PurchaseItemRequest[];
}

// 💰 [Purchase] 구매 요청 API
export interface RequestPurchaseBody {
  items: PurchaseItemRequest[];
  shippingFee: number;
  requestMessage: string;
}

// 💰 [Purchase] 구매 요청 반려 API (관리자)
export interface RejectPurchaseRequestBody {
  reason: string;
}
