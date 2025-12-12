import { Request, Response } from 'express';
import { budgetService } from './budget.service';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { CustomError } from '../../common/utils/error.util';
import { ResponseUtil } from '../../common/utils/response.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import type { UpsertBudgetBody, UpsertCriteriaBody } from './budget.types';

type UpsertBudgetRequest = AuthenticatedRequest & Request<unknown, unknown, UpsertBudgetBody>;
type UpsertCriteriaRequest = AuthenticatedRequest & Request<unknown, unknown, UpsertCriteriaBody>;
type GetBudgetsRequest = AuthenticatedRequest &
  Request<unknown, unknown, unknown, { year?: string; month?: string }>;

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
  // 월 별 예산 insert + update
  upsert: async (req: UpsertBudgetRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const payload = req.body as UpsertBudgetBody;
    const { budget, created } = await budgetService.upsertBudget(companyId, payload);
    res
      .status(created ? HttpStatus.CREATED : HttpStatus.OK)
      .json(ResponseUtil.success(budget, created ? '예산 생성 성공' : '예산 수정 성공'));
  },

  // 예산 목록 조회
  getList: async (req: GetBudgetsRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const budgets = await budgetService.getBudgets(companyId, { year, month });
    res.status(HttpStatus.OK).json(ResponseUtil.success(budgets, '예산 조회 성공'));
  },

  // 예산 기준 조회
  getCriteria: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const criteria = await budgetService.getCriteria(companyId);
    res.status(HttpStatus.OK).json(ResponseUtil.success(criteria, '예산 기준 조회 성공'));
  },

  // 예산 기준 insert + update
  upsertCriteria: async (req: UpsertCriteriaRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const payload = req.body as UpsertCriteriaBody;
    const { criteria, created } = await budgetService.upsertCriteria(companyId, payload);
    res
      .status(created ? HttpStatus.CREATED : HttpStatus.OK)
      .json(
        ResponseUtil.success(criteria, created ? '예산 기준 생성 성공' : '예산 기준 수정 성공')
      );
  },
};
