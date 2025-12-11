export interface GetAllPurchasesQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalPrice';
  order?: 'asc' | 'desc';
}
