import { Request, Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { companyService } from './company.service';
import type { CompanyUserQuery, UpdateCompanyNameBody } from './company.types';

type GetUsersRequest = AuthenticatedRequest & Request<unknown, unknown, unknown, CompanyUserQuery>;

// 회사 ID 가져오기
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

export const companyController = {
  // 회사 상세 정보 조회
  getDetail: async (req: AuthenticatedRequest, res: Response) => {
    const company = await companyService.getCompanyDetail(getCompanyId(req));
    res.status(HttpStatus.OK).json(ResponseUtil.success(company, '회사 정보 조회 성공'));
  },

  // 회사 소속 유저 조회 (Admin 전용)
  getUsers: async (req: GetUsersRequest, res: Response) => {
    const { role, isActive, page, limit } = req.query;
    const result = await companyService.getCompanyUsers(getCompanyId(req), {
      role,
      isActive,
      page,
      limit,
    });
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.successWithPagination(result.users, result.pagination, '소속 유저 조회 성공')
      );
  },

  // 회사명 변경 (Admin 전용)
  updateName: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const { name } = req.body as UpdateCompanyNameBody;
    const updated = await companyService.updateCompanyName(companyId, { name });
    res.status(HttpStatus.OK).json(ResponseUtil.success(updated, '회사명 변경 성공'));
  },
};
