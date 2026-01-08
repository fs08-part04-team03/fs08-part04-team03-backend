import { prisma } from '@/common/database/prisma.client';
import { budgetService } from './budget.service';

// Prisma 모킹
jest.mock('@/common/database/prisma.client', () => ({
  prisma: {
    budgets: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    budgetCriteria: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('BudgetService', () => {
  const mockCompanyId = 'company-123';
  const mockYear = 2024;
  const mockMonth = 12;
  const mockAmount = 1000000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertBudget', () => {
    const payload = {
      year: mockYear,
      month: mockMonth,
      amount: mockAmount,
    };

    it('새로운 예산을 생성해야 합니다', async () => {
      // Given
      const mockBudget = {
        id: 'budget-1',
        companyId: mockCompanyId,
        year: mockYear,
        month: mockMonth,
        amount: mockAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.budgets.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.budgets.upsert as jest.Mock).mockResolvedValue(mockBudget);

      // When
      const result = await budgetService.upsertBudget(mockCompanyId, payload);

      // Then
      expect(result.budget).toEqual(mockBudget);
      expect(result.created).toBe(true);
      expect(prisma.budgets.findUnique).toHaveBeenCalledWith({
        where: {
          companyId_year_month: { companyId: mockCompanyId, year: mockYear, month: mockMonth },
        },
      });
      expect(prisma.budgets.upsert).toHaveBeenCalledWith({
        where: {
          companyId_year_month: { companyId: mockCompanyId, year: mockYear, month: mockMonth },
        },
        create: { companyId: mockCompanyId, year: mockYear, month: mockMonth, amount: mockAmount },
        update: { amount: mockAmount },
      });
    });

    it('기존 예산을 업데이트해야 합니다', async () => {
      // Given
      const existingBudget = {
        id: 'budget-1',
        companyId: mockCompanyId,
        year: mockYear,
        month: mockMonth,
        amount: 500000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedBudget = { ...existingBudget, amount: mockAmount };

      (prisma.budgets.findUnique as jest.Mock).mockResolvedValue(existingBudget);
      (prisma.budgets.upsert as jest.Mock).mockResolvedValue(updatedBudget);

      // When
      const result = await budgetService.upsertBudget(mockCompanyId, payload);

      // Then
      expect(result.budget).toEqual(updatedBudget);
      expect(result.created).toBe(false);
    });
  });

  describe('getBudgets', () => {
    it('모든 예산을 조회해야 합니다', async () => {
      // Given
      const mockBudgets = [
        {
          id: 'budget-1',
          companyId: mockCompanyId,
          year: 2024,
          month: 12,
          amount: 1000000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'budget-2',
          companyId: mockCompanyId,
          year: 2024,
          month: 11,
          amount: 900000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.budgets.findMany as jest.Mock).mockResolvedValue(mockBudgets);

      // When
      const result = await budgetService.getBudgets(mockCompanyId, {});

      // Then
      expect(result).toEqual(mockBudgets);
      expect(prisma.budgets.findMany).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    });

    it('특정 연도의 예산을 필터링해야 합니다', async () => {
      // Given
      const mockBudgets = [
        {
          id: 'budget-1',
          companyId: mockCompanyId,
          year: 2024,
          month: 12,
          amount: 1000000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.budgets.findMany as jest.Mock).mockResolvedValue(mockBudgets);

      // When
      const result = await budgetService.getBudgets(mockCompanyId, { year: 2024 });

      // Then
      expect(result).toEqual(mockBudgets);
      expect(prisma.budgets.findMany).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, year: 2024 },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    });

    it('특정 연도와 월의 예산을 필터링해야 합니다', async () => {
      // Given
      const mockBudget = [
        {
          id: 'budget-1',
          companyId: mockCompanyId,
          year: 2024,
          month: 12,
          amount: 1000000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.budgets.findMany as jest.Mock).mockResolvedValue(mockBudget);

      // When
      const result = await budgetService.getBudgets(mockCompanyId, { year: 2024, month: 12 });

      // Then
      expect(result).toEqual(mockBudget);
      expect(prisma.budgets.findMany).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, year: 2024, month: 12 },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    });
  });

  describe('upsertCriteria', () => {
    const payload = { amount: 1000000 };

    it('새로운 예산 기준을 생성해야 합니다', async () => {
      // Given
      const mockCriteria = {
        id: 'criteria-1',
        companyId: mockCompanyId,
        amount: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.budgetCriteria.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.budgetCriteria.upsert as jest.Mock).mockResolvedValue(mockCriteria);

      // When
      const result = await budgetService.upsertCriteria(mockCompanyId, payload);

      // Then
      expect(result.criteria).toEqual(mockCriteria);
      expect(result.created).toBe(true);
      expect(prisma.budgetCriteria.upsert).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId },
        create: { companyId: mockCompanyId, amount: 1000000 },
        update: { amount: 1000000 },
      });
    });

    it('기존 예산 기준을 업데이트해야 합니다', async () => {
      // Given
      const existingCriteria = {
        id: 'criteria-1',
        companyId: mockCompanyId,
        amount: 500000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCriteria = { ...existingCriteria, amount: 1000000 };

      (prisma.budgetCriteria.findUnique as jest.Mock).mockResolvedValue(existingCriteria);
      (prisma.budgetCriteria.upsert as jest.Mock).mockResolvedValue(updatedCriteria);

      // When
      const result = await budgetService.upsertCriteria(mockCompanyId, payload);

      // Then
      expect(result.criteria).toEqual(updatedCriteria);
      expect(result.created).toBe(false);
    });
  });

  describe('getCriteria', () => {
    it('예산 기준을 조회해야 합니다', async () => {
      // Given
      const mockCriteria = {
        id: 'criteria-1',
        companyId: mockCompanyId,
        amount: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.budgetCriteria.findUnique as jest.Mock).mockResolvedValue(mockCriteria);

      // When
      const result = await budgetService.getCriteria(mockCompanyId);

      // Then
      expect(result).toEqual(mockCriteria);
      expect(prisma.budgetCriteria.findUnique).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId },
      });
    });

    it('예산 기준이 없으면 null을 반환해야 합니다', async () => {
      // Given
      (prisma.budgetCriteria.findUnique as jest.Mock).mockResolvedValue(null);

      // When
      const result = await budgetService.getCriteria(mockCompanyId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('seedMonthlyBudgetsFromCriteria', () => {
    it('예산 기준을 기반으로 월별 예산을 생성해야 합니다', async () => {
      // Given
      const utcYear = 2024;
      const utcMonth = 12;

      const mockCriteriaList = [
        {
          id: 'criteria-1',
          companyId: 'company-1',
          amount: 1000000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'criteria-2',
          companyId: 'company-2',
          amount: 2000000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTx = {
        budgetCriteria: {
          findMany: jest.fn().mockResolvedValue(mockCriteriaList),
        },
        budgets: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(mockTx));

      // When
      await budgetService.seedMonthlyBudgetsFromCriteria(utcYear, utcMonth);

      // Then
      expect(mockTx.budgetCriteria.findMany).toHaveBeenCalled();
      expect(mockTx.budgets.createMany).toHaveBeenCalledWith({
        data: [
          {
            companyId: 'company-1',
            year: utcYear,
            month: utcMonth,
            amount: 1000000,
          },
          {
            companyId: 'company-2',
            year: utcYear,
            month: utcMonth,
            amount: 2000000,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('예산 기준이 없으면 빈 배열로 생성해야 합니다', async () => {
      // Given
      const utcYear = 2024;
      const utcMonth = 12;

      const mockTx = {
        budgetCriteria: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        budgets: {
          createMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(mockTx));

      // When
      await budgetService.seedMonthlyBudgetsFromCriteria(utcYear, utcMonth);

      // Then
      expect(mockTx.budgetCriteria.findMany).toHaveBeenCalled();
      expect(mockTx.budgets.createMany).toHaveBeenCalledWith({
        data: [],
        skipDuplicates: true,
      });
    });

    it('null 금액을 0으로 변환해야 합니다', async () => {
      // Given
      const utcYear = 2024;
      const utcMonth = 12;

      const mockCriteriaList = [
        {
          id: 'criteria-1',
          companyId: 'company-1',
          amount: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTx = {
        budgetCriteria: {
          findMany: jest.fn().mockResolvedValue(mockCriteriaList),
        },
        budgets: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(mockTx));

      // When
      await budgetService.seedMonthlyBudgetsFromCriteria(utcYear, utcMonth);

      // Then
      expect(mockTx.budgets.createMany).toHaveBeenCalledWith({
        data: [
          {
            companyId: 'company-1',
            year: utcYear,
            month: utcMonth,
            amount: 0,
          },
        ],
        skipDuplicates: true,
      });
    });
  });
});
