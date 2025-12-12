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
