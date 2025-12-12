import { Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { purchaseService } from './purchase.service';
import type { GetAllPurchasesQuery, PurchaseNowBody } from './purchase.types';

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
    res
      .status(HttpStatus.OK)
      .json({ success: true, ...result, message: '전체 구매 내역을 조회했습니다.' });
  },

  // 💰 [Purchase] 즉시 구매 API (관리자)
  purchaseNow: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    const { shippingFee, items } = req.body as PurchaseNowBody;

    // 요청 바디에서 필요한 정보 추출
    if (typeof shippingFee !== 'number' || !Array.isArray(items) || items.length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '요청 바디가 올바르지 않습니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.purchaseNow(
      req.user.companyId,
      req.user.userId,
      shippingFee,
      items
    );

    // 응답 반환
    res
      .status(HttpStatus.OK)
      .json({ success: true, ...result, message: '즉시 구매가 완료되었습니다.' });
  },
};
