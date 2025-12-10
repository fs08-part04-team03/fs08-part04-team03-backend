import { Request, Response } from 'express';
import { budgetService } from './budget.service';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { CustomError } from '../../common/utils/error.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import type { CreateBudgetBody, UpdateBudgetBody } from './budget.types';

type CreateBudgetRequest = AuthenticatedRequest & Request<unknown, unknown, CreateBudgetBody>;
type UpdateBudgetRequest = AuthenticatedRequest &
  Request<{ budgetId: string }, unknown, UpdateBudgetBody>;
type GetBudgetsRequest = AuthenticatedRequest &
  Request<unknown, unknown, unknown, { year?: string; month?: string }>;

const getCompanyId = (req: AuthenticatedRequest) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      'Missing company context'
    );
  }
  return companyId;
};

export const budgetController = {
  create: async (req: CreateBudgetRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const payload = req.body as CreateBudgetBody;
    const budget = await budgetService.createBudget(companyId, payload);
    res.status(HttpStatus.CREATED).json({ success: true, data: budget });
  },

  update: async (req: UpdateBudgetRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const payload = req.body as UpdateBudgetBody;
    const budget = await budgetService.updateBudget(companyId, req.params.budgetId, payload);
    res.status(HttpStatus.OK).json({ success: true, data: budget });
  },

  getList: async (req: GetBudgetsRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const budgets = await budgetService.getBudgets(companyId, { year, month });
    res.status(HttpStatus.OK).json({ success: true, data: budgets });
  },
};
