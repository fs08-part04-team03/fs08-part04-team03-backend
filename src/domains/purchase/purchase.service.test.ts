import { prisma } from '@/common/database/prisma.client';
import { purchaseService } from './purchase.service';

jest.mock('@/common/database/prisma.client', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    products: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    carts: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    purchaseRequests: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
    purchases: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    purchaseItems: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    history: {
      findMany: jest.fn(),
    },
    budgets: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('PurchaseService', () => {
  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(purchaseService).toBeDefined();
  });

  describe('purchaseNow', () => {
    const mockItems = [{ productId: 1, quantity: 2 }];
    const mockProducts = [{ id: 1, price: 1000, companyId: mockCompanyId, isActive: true }];
    const mockPurchaseRequest = {
      id: 'pr-123',
      companyId: mockCompanyId,
      requesterId: mockUserId,
      totalPrice: 2000,
      shippingFee: 3000,
      approverId: mockUserId,
      status: 'APPROVED',
    };

    it('즉시 구매를 성공적으로 처리해야 합니다', async () => {
      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        (prisma.purchaseRequests.create as jest.Mock).mockResolvedValue(mockPurchaseRequest);
        (prisma.purchaseItems.createMany as jest.Mock).mockResolvedValue({ count: 1 });
        return callback(prisma);
      });

      const result = await purchaseService.purchaseNow(mockCompanyId, mockUserId, 3000, mockItems);

      expect(prisma.products.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1] },
          companyId: mockCompanyId,
          isActive: true,
        },
      });
      expect(prisma.purchaseRequests.create).toHaveBeenCalledWith({
        data: {
          companyId: mockCompanyId,
          requesterId: mockUserId,
          totalPrice: 2000,
          shippingFee: 3000,
          approverId: mockUserId,
          status: 'APPROVED',
        },
      });
      expect(prisma.purchaseItems.createMany).toHaveBeenCalledWith({
        data: [
          {
            purchaseRequestId: 'pr-123',
            productId: 1,
            quantity: 2,
            priceSnapshot: 1000,
          },
        ],
      });
      expect(result.data).toEqual(mockPurchaseRequest);
    });

    it('상품을 찾을 수 없으면 에러를 던져야 합니다', async () => {
      (prisma.products.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        purchaseService.purchaseNow(mockCompanyId, mockUserId, 3000, mockItems)
      ).rejects.toThrow('존재하지 않는 상품이 포함되어 있거나, 다른 회사의 상품입니다.');
    });
  });

  describe('requestPurchase', () => {
    const mockItems = [{ productId: 1, quantity: 2 }];
    const mockCartItems = [
      {
        productId: 1,
        quantity: 2,
        products: { id: 1, price: 1000, companyId: mockCompanyId, isActive: true },
      },
    ];
    const mockPurchaseRequest = {
      id: 'pr-123',
      companyId: mockCompanyId,
      requesterId: mockUserId,
      totalPrice: 2000,
      shippingFee: 3000,
      status: 'PENDING',
      requestMessage: 'test message',
    };

    it('구매 요청을 성공적으로 처리해야 합니다', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        (prisma.carts.findMany as jest.Mock).mockResolvedValue(mockCartItems);
        (prisma.purchaseRequests.create as jest.Mock).mockResolvedValue(mockPurchaseRequest);
        (prisma.purchaseItems.createMany as jest.Mock).mockResolvedValue({ count: 1 });
        (prisma.carts.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
        return callback(prisma);
      });

      const result = await purchaseService.requestPurchase(
        mockCompanyId,
        mockUserId,
        3000,
        mockItems,
        'test message'
      );

      expect(prisma.carts.findMany).toHaveBeenCalled();
      expect(prisma.purchaseRequests.create).toHaveBeenCalledWith({
        data: {
          companyId: mockCompanyId,
          requesterId: mockUserId,
          totalPrice: 2000,
          shippingFee: 3000,
          status: 'PENDING',
          requestMessage: 'test message',
        },
      });
      expect(prisma.purchaseItems.createMany).toHaveBeenCalled();
      expect(prisma.carts.deleteMany).toHaveBeenCalled();
      expect(result.data).toEqual(mockPurchaseRequest);
    });

    it('장바구니에 상품이 없으면 에러를 던져야 합니다', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        (prisma.carts.findMany as jest.Mock).mockResolvedValue([]);
        return callback(prisma);
      });

      await expect(
        purchaseService.requestPurchase(mockCompanyId, mockUserId, 3000, mockItems)
      ).rejects.toThrow('가 장바구니에 존재하지 않습니다.');
    });

    it('장바구니의 상품 수량과 요청 수량이 다르면 에러를 던져야 합니다', async () => {
      const differentQuantityCartItems = [{ ...mockCartItems[0], quantity: 1 }];
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        (prisma.carts.findMany as jest.Mock).mockResolvedValue(differentQuantityCartItems);
        return callback(prisma);
      });

      await expect(
        purchaseService.requestPurchase(mockCompanyId, mockUserId, 3000, mockItems)
      ).rejects.toThrow('수량이 장바구니와 일치하지 않습니다.');
    });
  });

  describe('approvePurchaseRequest', () => {
    const mockPurchaseRequestId = 'pr-123';
    const mockPurchaseRequest = {
      id: mockPurchaseRequestId,
      companyId: mockCompanyId,
      status: 'PENDING',
      totalPrice: 1000,
      shippingFee: 500,
    };
    const mockBudget = {
      amount: 2000,
    };

    it('구매 요청을 성공적으로 승인해야 합니다', async () => {
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(mockPurchaseRequest);
      (prisma.purchaseRequests.update as jest.Mock).mockResolvedValue({
        ...mockPurchaseRequest,
        status: 'APPROVED',
      });
      (prisma.budgets.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      (prisma.budgets.update as jest.Mock).mockResolvedValue({});

      await purchaseService.approvePurchaseRequest(
        mockCompanyId,
        mockUserId,
        mockPurchaseRequestId
      );

      expect(prisma.purchaseRequests.update).toHaveBeenCalledWith({
        where: { id: mockPurchaseRequestId, companyId: mockCompanyId, status: 'PENDING' },
        data: { status: 'APPROVED', approverId: mockUserId },
      });
      expect(prisma.budgets.update).toHaveBeenCalled();
    });

    it('구매 요청을 찾을 수 없으면 에러를 던져야 합니다', async () => {
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseService.approvePurchaseRequest(mockCompanyId, mockUserId, mockPurchaseRequestId)
      ).rejects.toThrow('구매 요청을 찾을 수 없습니다.');
    });

    it('PENDING 상태가 아니면 에러를 던져야 합니다', async () => {
      const approvedRequest = { ...mockPurchaseRequest, status: 'APPROVED' };
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(approvedRequest);

      await expect(
        purchaseService.approvePurchaseRequest(mockCompanyId, mockUserId, mockPurchaseRequestId)
      ).rejects.toThrow('이미 처리된 구매 요청입니다.');
    });

    it('예산이 부족하면 에러를 던져야 합니다', async () => {
      const lowBudget = { amount: 1000 };
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(mockPurchaseRequest);
      (prisma.purchaseRequests.update as jest.Mock).mockResolvedValue({
        ...mockPurchaseRequest,
        status: 'APPROVED',
      });
      (prisma.budgets.findFirst as jest.Mock).mockResolvedValue(lowBudget);

      await expect(
        purchaseService.approvePurchaseRequest(mockCompanyId, mockUserId, mockPurchaseRequestId)
      ).rejects.toThrow('예산이 부족하여 구매 요청을 승인할 수 없습니다.');
    });
  });

  describe('rejectPurchaseRequest', () => {
    const mockPurchaseRequestId = 'pr-123';
    const mockPurchaseRequest = {
      id: mockPurchaseRequestId,
      companyId: mockCompanyId,
      status: 'PENDING',
    };
    const mockBody = { reason: 'Test reason' };

    it('구매 요청을 성공적으로 반려해야 합니다', async () => {
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(mockPurchaseRequest);
      (prisma.purchaseRequests.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await purchaseService.rejectPurchaseRequest(
        mockCompanyId,
        mockUserId,
        mockPurchaseRequestId,
        mockBody
      );

      expect(prisma.purchaseRequests.updateMany).toHaveBeenCalledWith({
        where: { id: mockPurchaseRequestId, companyId: mockCompanyId, status: 'PENDING' },
        data: { status: 'REJECTED', approverId: mockUserId, rejectReason: 'Test reason' },
      });
    });
  });

  describe('cancelPurchaseRequest', () => {
    const mockPurchaseRequestId = 'pr-123';
    const mockPurchaseRequest = {
      id: mockPurchaseRequestId,
      companyId: mockCompanyId,
      requesterId: mockUserId,
      status: 'PENDING',
    };

    it('구매 요청을 성공적으로 취소해야 합니다', async () => {
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(mockPurchaseRequest);
      (prisma.purchaseRequests.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await purchaseService.cancelPurchaseRequest(mockCompanyId, mockUserId, mockPurchaseRequestId);

      expect(prisma.purchaseRequests.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockPurchaseRequestId,
          companyId: mockCompanyId,
          requesterId: mockUserId,
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      });
    });

    it('본인의 구매 요청이 아니면 에러를 던져야 합니다', async () => {
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseService.cancelPurchaseRequest(mockCompanyId, 'other-user', mockPurchaseRequestId)
      ).rejects.toThrow('구매 요청을 찾을 수 없습니다.');
    });
  });

  describe('getAllPurchases', () => {
    it('모든 구매 내역을 페이지네이션과 함께 반환해야 합니다', async () => {
      (prisma.purchaseRequests.count as jest.Mock).mockResolvedValue(1);
      (prisma.purchaseRequests.findMany as jest.Mock).mockResolvedValue([{}]);

      const result = await purchaseService.getAllPurchases(mockCompanyId, { page: 1, limit: 10 });

      expect(prisma.purchaseRequests.count).toHaveBeenCalled();
      expect(prisma.purchaseRequests.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getMyPurchases', () => {
    it('나의 구매 내역을 페이지네이션과 함께 반환해야 합니다', async () => {
      (prisma.purchaseRequests.count as jest.Mock).mockResolvedValue(1);
      (prisma.purchaseRequests.findMany as jest.Mock).mockResolvedValue([{}]);

      const result = await purchaseService.getMyPurchases(mockCompanyId, mockUserId, {
        page: 1,
        limit: 10,
      });

      expect(prisma.purchaseRequests.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, requesterId: mockUserId },
      });
      expect(prisma.purchaseRequests.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getMyPurchaseDetail', () => {
    it('나의 특정 구매 내역 상세 정보를 반환해야 합니다', async () => {
      const mockPurchaseDetail = { id: 'pr-123' };
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(mockPurchaseDetail);

      const result = await purchaseService.getMyPurchaseDetail(mockCompanyId, mockUserId, 'pr-123');

      expect(prisma.purchaseRequests.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pr-123', companyId: mockCompanyId, requesterId: mockUserId },
        })
      );
      expect(result.data).toEqual(mockPurchaseDetail);
    });
  });

  describe('getPurchaseRequestDetail', () => {
    it('특정 구매 요청 상세 정보를 반환해야 합니다', async () => {
      const mockPurchaseDetail = {
        id: 'pr-123',
        status: 'APPROVED',
        totalPrice: 1000,
        shippingFee: 500,
        purchaseItems: [],
      };
      (prisma.purchaseRequests.findFirst as jest.Mock).mockResolvedValue(mockPurchaseDetail);

      const result = await purchaseService.getPurchaseRequestDetail(mockCompanyId, 'pr-123');

      expect(result.data).toHaveProperty('finalTotalPrice', 1500);
    });
  });

  describe('managePurchaseRequests', () => {
    it('관리자용 구매 요청 목록을 페이지네이션과 함께 반환해야 합니다', async () => {
      (prisma.purchaseRequests.count as jest.Mock).mockResolvedValue(1);
      (prisma.purchaseRequests.findMany as jest.Mock).mockResolvedValue([{}]);

      const result = await purchaseService.managePurchaseRequests(mockCompanyId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getExpenseStatistics', () => {
    it('지출 통계를 반환해야 합니다', async () => {
      (prisma.purchaseRequests.aggregate as jest.Mock).mockResolvedValue({ _sum: {} });
      (prisma.budgets.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await purchaseService.getExpenseStatistics(mockCompanyId);

      expect(result.data).toHaveProperty('expenses');
      expect(result.data).toHaveProperty('budget');
    });
  });

  describe('getPurchaseDashboard', () => {
    it('구매 대시보드 정보를 반환해야 합니다', async () => {
      (prisma.purchaseRequests.aggregate as jest.Mock).mockResolvedValue({ _sum: {} });
      (prisma.budgets.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.users.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.history.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.purchaseItems.findMany as jest.Mock).mockResolvedValue([]);

      const result = await purchaseService.getPurchaseDashboard(mockCompanyId);

      expect(result.data).toHaveProperty('expenses');
      expect(result.data).toHaveProperty('budget');
      expect(result.data).toHaveProperty('newUsers');
      expect(result.data).toHaveProperty('userChanges');
      expect(result.data).toHaveProperty('snacksList');
      expect(result.data).toHaveProperty('monthlyExpenses');
    });
  });
});
