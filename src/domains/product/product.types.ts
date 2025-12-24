// 상품 정렬 기준 타입 (최신순, 판매량순, 낮은 가격순, 높은 가격순)
export type ProductSort = 'latest' | 'sales' | 'priceAsc' | 'priceDesc';

// 상품 생성 요청 바디
export type CreateProductBody = {
  categoryId: number;
  name: string;
  price: number;
  image?: string;
  link: string;
};

// 상품 수정 요청 바디
export type UpdateProductBody = {
  categoryId?: number;
  name?: string;
  price?: number;
  image?: string | null;
  link?: string;
};

// 상품 목록 조회 쿼리 파라미터
export type ProductListQuery = {
  page?: number;
  limit?: number;
  categoryId?: number;
  sort?: ProductSort;
};
