import { Response } from 'express';
import { purchaseStatus } from '@prisma/client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { purchaseService } from './purchase.service';
import type {
  GetAllPurchasesQuery,
  PurchaseNowBody,
  RejectPurchaseRequestBody,
  RequestPurchaseBody,
} from './purchase.types';

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

    // 요청 바디에서 필요한 정보 추출
    const { shippingFee, items } = req.body as PurchaseNowBody;

    // 요청 바디 유효성 검사 (exception-safe)
    const invalidItems =
      !Array.isArray(items) ||
      items.length === 0 ||
      items.some(
        (i) =>
          !i ||
          typeof i !== 'object' ||
          typeof i.productId !== 'number' ||
          !Number.isInteger(i.productId) ||
          i.productId < 1 ||
          typeof i.quantity !== 'number' ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1
      );

    if (
      typeof shippingFee !== 'number' ||
      !Number.isFinite(shippingFee) ||
      !Number.isInteger(shippingFee) ||
      shippingFee < 0 ||
      invalidItems
    ) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '요청 바디가 올바르지 않습니다.'
      );
    }

    // 입력 값 검증
    if (!items.length) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '구매할 상품 항목이 없어 구매를 진행할 수 없습니다.'
      );
    }

    if (shippingFee < 0 || items.some((i) => i.quantity <= 0)) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '배송비는 0 이상이어야 하며, 모든 상품의 수량은 1 이상이어야 합니다.'
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

  // 💰 [Purchase] 내 구매 내역 조회 API
  getMyPurchases: async (req: AuthenticatedRequest, res: Response) => {
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
    const result = await purchaseService.getMyPurchases(req.user.companyId, req.user.userId, query);

    // 응답 반환
    res
      .status(HttpStatus.OK)
      .json({ success: true, ...result, message: '내 구매 내역을 조회했습니다.' });
  },

  // 💰 [Purchase] 구매 요청 조회 API (관리자)
  managePurchaseRequests: async (req: AuthenticatedRequest, res: Response) => {
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
      status: req.query.status as purchaseStatus | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    // 서비스 호출
    const result = await purchaseService.managePurchaseRequests(req.user.companyId, query);

    // 응답 반환
    res
      .status(HttpStatus.OK)
      .json({ success: true, ...result, message: '구매 요청 내역을 조회했습니다.' });
  },

  // 💰 [Purchase] 구매 요청 승인 API (관리자)
  approvePurchaseRequest: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    const purchaseRequestId = req.params.id;
    if (!purchaseRequestId) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '구매 요청 ID가 필요합니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.approvePurchaseRequest(
      req.user.companyId,
      req.user.userId,
      purchaseRequestId
    );

    // 응답 반환
    res
      .status(HttpStatus.OK)
      .json({ success: true, ...result, message: '구매 요청을 승인했습니다.' });
  },

  // 💰 [Purchase] 구매 요청 반려 API (관리자)
  rejectPurchaseRequest: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    const purchaseRequestId = req.params.id;
    if (!purchaseRequestId) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '구매 요청 ID가 필요합니다.'
      );
    }

    const body = req.body as RejectPurchaseRequestBody;

    // 서비스 호출
    const result = await purchaseService.rejectPurchaseRequest(
      req.user.companyId,
      req.user.userId,
      purchaseRequestId,
      body
    );

    // 응답 반환
    res
      .status(HttpStatus.OK)
      .json({ success: true, ...result, message: '구매 요청을 반려했습니다.' });
  },

  // 💰 [Purchase] 구매 요청 API
  requestPurchase: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    // 요청 바디의 내용이 없는 경우
    if (!req.body) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '요청 바디가 없습니다.'
      );
    }

    const { productId, quantity, requestMessage } = req.body as RequestPurchaseBody;

    // 요청 바디 유효성 검사
    if (!productId || !quantity || !requestMessage) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'productId, quantity, requestMessage 필드가 모두 필요합니다.'
      );
    }

    // productId 유효성 검사
    if (
      typeof productId !== 'number' ||
      !Number.isFinite(productId) ||
      !Number.isInteger(productId) ||
      productId < 1
    ) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'productId는 1 이상의 정수여야 합니다.'
      );
    }

    // quantity 유효성 검사
    if (
      typeof quantity !== 'number' ||
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'quantity는 1 이상의 정수여야 합니다.'
      );
    }

    // requestMessage 유효성 검사
    if (typeof requestMessage !== 'string' || requestMessage.trim().length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'requestMessage는 비어있지 않은 문자열이어야 합니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.requestPurchase(
      req.user.companyId,
      req.user.userId,
      productId,
      quantity,
      requestMessage
    );

    // 응답 반환
    res
      .status(HttpStatus.OK)
      .json({ success: true, ...result, message: '구매 요청이 완료되었습니다.' });
  },
};
