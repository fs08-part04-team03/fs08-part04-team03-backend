import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type {
  CreateBudgetBody,
  UpdateBudgetBody,
  BudgetQuery,
  UpsertCriteriaBody,
} from './budget.types';

export const budgetService = {
  // 월 별 예산 생성
  async createBudget(companyId: string, payload: CreateBudgetBody) {
    const { year, month, amount } = payload;

    const exists = await prisma.budgets.findUnique({
      where: { companyId_year_month: { companyId, year, month } },
    });
    if (exists) {
      throw new CustomError(
        HttpStatus.CONFLICT,
        ErrorCodes.DB_UNIQUE_CONSTRAINT_VIOLATION,
        'Budget already exists for this year and month'
      );
    }

    return prisma.budgets.create({ data: { companyId, year, month, amount } });
  },

  // 월 별 예산 수정
  async updateBudget(companyId: string, budgetId: string, payload: UpdateBudgetBody) {
    const budget = await prisma.budgets.findFirst({ where: { id: budgetId, companyId } });
    if (!budget) {
      throw new CustomError(HttpStatus.NOT_FOUND, ErrorCodes.GENERAL_NOT_FOUND, 'Budget not found');
    }

    return prisma.budgets.update({
      where: { id: budgetId },
      data: { amount: payload.amount },
    });
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
    return prisma.budgetCriteria.upsert({
      where: { companyId },
      create: { companyId, amount: payload.amount },
      update: { amount: payload.amount },
    });
  },

  // 예산 기준 조회
  async getCriteria(companyId: string) {
    return prisma.budgetCriteria.findUnique({ where: { companyId } });
  },

  // 예산 기준으로 월별 예산 생성
  async seedMonthlyBudgetsFromCriteria(utcYear: number, utcMonth: number) {
    // 예산 기준 조회 -> 없는 회사는 생성 X
    const criteriaList = await prisma.budgetCriteria.findMany();

    await Promise.all(
      criteriaList.map(async (criteria) => {
        const exists = await prisma.budgets.findUnique({
          where: {
            companyId_year_month: {
              companyId: criteria.companyId,
              year: utcYear,
              month: utcMonth,
            },
          },
        });
        // 이미 예산이 있으면 생성 X
        if (exists) return;

        await prisma.budgets.create({
          data: {
            companyId: criteria.companyId,
            year: utcYear,
            month: utcMonth,
            amount: criteria.amount ?? 0,
          },
        });
      })
    );
  },
};
