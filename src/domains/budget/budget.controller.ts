import { Request, Response } from 'express';
import { budgetService } from './budget.service';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { CustomError } from '../../common/utils/error.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import type { CreateBudgetBody, UpdateBudgetBody, UpsertCriteriaBody } from './budget.types';

type CreateBudgetRequest = AuthenticatedRequest & Request<unknown, unknown, CreateBudgetBody>;
type UpdateBudgetRequest = AuthenticatedRequest &
  Request<{ budgetId: string }, unknown, UpdateBudgetBody>;
type GetBudgetsRequest = AuthenticatedRequest &
  Request<unknown, unknown, unknown, { year?: string; month?: string }>;
type UpsertCriteriaRequest = AuthenticatedRequest & Request<unknown, unknown, UpsertCriteriaBody>;

// 회사 ID 추출
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
  // 월 별 예산 생성
  create: async (req: CreateBudgetRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const payload = req.body as CreateBudgetBody;
    const budget = await budgetService.createBudget(companyId, payload);
    res.status(HttpStatus.CREATED).json({ success: true, data: budget });
  },

  // 월 별 예산 수정
  update: async (req: UpdateBudgetRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const payload = req.body as UpdateBudgetBody;
    const budget = await budgetService.updateBudget(companyId, req.params.budgetId, payload);
    res.status(HttpStatus.OK).json({ success: true, data: budget });
  },

  // 예산 목록 조회
  getList: async (req: GetBudgetsRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const budgets = await budgetService.getBudgets(companyId, { year, month });
    res.status(HttpStatus.OK).json({ success: true, data: budgets });
  },

  // 예산 기준 조회
  getCriteria: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const criteria = await budgetService.getCriteria(companyId);
    res.status(HttpStatus.OK).json({ success: true, data: criteria });
  },

  // 예산 기준 insert + update
  upsertCriteria: async (req: UpsertCriteriaRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const payload = req.body as UpsertCriteriaBody;
    const criteria = await budgetService.upsertCriteria(companyId, payload);
    res.status(HttpStatus.OK).json({ success: true, data: criteria });
  },
};
