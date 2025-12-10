import { Response } from 'express';
import { CustomError } from '@/common/utils/error.util';
import { HttpStatus } from '@/common/constants/httpStatus.constants';
import { ErrorCodes } from '@/common/constants/errorCodes.constants';
import type { AuthenticatedRequest } from '@/common/types/common.types';
import { purchaseService } from './purchase.service';
import type { GetAllPurchasesQuery } from './purchase.types';

export const purchaseController = {
  // 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
  getAllPurchases: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    // 쿼리 파라미터 처리
    const query = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as GetAllPurchasesQuery['sortBy'],
      order: req.query.order as GetAllPurchasesQuery['order'],
    };

    // 서비스 호출
    const result = await purchaseService.getAllPurchases(req.user.companyId, query);

    // 응답 반환
    res.status(HttpStatus.OK).json({ success: true, ...result });
  },
};
