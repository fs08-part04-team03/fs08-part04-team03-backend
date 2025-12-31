import { prisma } from '../../common/database/prisma.client';
import type { UpsertBudgetBody, BudgetQuery, UpsertCriteriaBody } from './budget.types';

export const budgetService = {
  // 월 별 예산 insert + update
  async upsertBudget(companyId: string, payload: UpsertBudgetBody) {
    const { year, month, amount } = payload;

    const existing = await prisma.budgets.findUnique({
      where: { companyId_year_month: { companyId, year, month } },
    });

    const budget = await prisma.budgets.upsert({
      where: { companyId_year_month: { companyId, year, month } },
      create: { companyId, year, month, amount },
      update: { amount },
    });

    return { budget, created: !existing };
  },

  // 예산 목록 조회
  async getBudgets(companyId: string, filters: BudgetQuery) {
    const { year, month } = filters;
    return prisma.budgets.findMany({
      where: {
        companyId,
        ...(year !== undefined ? { year } : {}),
        ...(month !== undefined ? { month } : {}),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  },

  // 예산 기준 insert + update
  async upsertCriteria(companyId: string, payload: UpsertCriteriaBody) {
    const existing = await prisma.budgetCriteria.findUnique({ where: { companyId } });

    const criteria = await prisma.budgetCriteria.upsert({
      where: { companyId },
      create: { companyId, amount: payload.amount },
      update: { amount: payload.amount },
    });

    return { criteria, created: !existing };
  },

  // 예산 기준 조회
  async getCriteria(companyId: string) {
    return prisma.budgetCriteria.findUnique({ where: { companyId } });
  },

  // 예산 기준으로 월별 예산 생성
  async seedMonthlyBudgetsFromCriteria(utcYear: number, utcMonth: number) {
    // 트랜잭션으로 모든 회사에 대해 예산 기준을 조회하고 월별 예산 생성
    await prisma.$transaction(async (tx) => {
      // 예산 기준 목록 조회
      const criteriaList = await tx.budgetCriteria.findMany();

      // 각 회사별로 월별 예산 생성
      await tx.budgets.createMany({
        data: criteriaList.map((criteria) => ({
          companyId: criteria.companyId,
          year: utcYear,
          month: utcMonth,
          amount: criteria.amount ?? 0,
        })),
        // 이미 존재하는 경우 삽입 무시
        skipDuplicates: true,
      });
    });
  },
};
