import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { CreateBudgetBody, UpdateBudgetBody, BudgetQuery } from './budget.types';

export const budgetService = {
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
};
