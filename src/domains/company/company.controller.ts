import { Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { companyService } from './company.service';

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
};
