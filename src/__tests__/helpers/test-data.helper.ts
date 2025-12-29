import { role } from '@prisma/client';

/**
 * 테스트용 회사 데이터 생성
 */
export const createTestCompany = () => ({
  name: '테스트 회사',
  businessNumber: '123-45-67890',
});

/**
 * 테스트용 사용자 데이터 생성
 */
export const createTestUser = (companyId: string, userRole: role = 'USER') => ({
  companyId,
  email: `test-${Date.now()}@example.com`,
  password: 'hashedPassword123!',
  name: '테스트 사용자',
  role: userRole,
});

/**
 * 테스트용 상품 데이터 생성
 */
export const createTestProduct = (companyId: string, categoryId: number) => ({
  companyId,
  categoryId,
  name: '테스트 상품',
  price: 10000,
  link: 'https://example.com/product',
  image: 'https://example.com/image.jpg',
});

/**
 * 테스트용 카테고리 데이터 생성
 */
export const createTestCategory = (parentCategoryId?: number) => ({
  name: '테스트 카테고리',
  parentCategoryId: parentCategoryId || null,
});

/**
 * 테스트용 초대 데이터 생성
 */
export const createTestInvitation = (companyId: string, userRole: role = 'USER') => ({
  companyId,
  name: '초대된 사용자',
  email: `invited-${Date.now()}@example.com`,
  token: `token-${Date.now()}`,
  role: userRole,
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48시간 후
});

/**
 * 테스트용 예산 데이터 생성
 */
export const createTestBudget = (companyId: string, year: number, month: number) => ({
  companyId,
  year,
  month,
  amount: 1000000,
});

/**
 * 테스트용 장바구니 데이터 생성
 */
export const createTestCart = (userId: string, productId: number, quantity = 1) => ({
  userId,
  productId,
  quantity,
});

/**
 * 테스트용 구매 요청 데이터 생성
 */
export const createTestPurchaseRequest = (
  companyId: string,
  requesterId: string,
  totalPrice: number
) => ({
  companyId,
  requesterId,
  status: 'PENDING' as const,
  totalPrice,
  shippingFee: 3000,
  requestMessage: '테스트 구매 요청입니다.',
});
