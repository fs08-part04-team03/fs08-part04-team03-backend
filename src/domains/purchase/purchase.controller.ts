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
    res.status(HttpStatus.OK).json(result);
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
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'items는 최소 1개 이상의 배열이어야 합니다.'
      );
    }

    // items 배열의 각 항목 유효성 검사
    const invalidItems = items.some(
      (item) =>
        !item ||
        typeof item !== 'object' ||
        typeof item.productId !== 'number' ||
        !Number.isInteger(item.productId) ||
        item.productId < 1 ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
    );

    if (invalidItems) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '모든 항목의 productId와 quantity는 1 이상의 정수여야 합니다.'
      );
    }

    // shippingFee 유효성 검사
    if (
      typeof shippingFee !== 'number' ||
      !Number.isFinite(shippingFee) ||
      !Number.isInteger(shippingFee) ||
      shippingFee < 0
    ) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '배송비는 0 이상의 정수여야 합니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.purchaseNow(
      req.user.companyId,
      req.user.id,
      shippingFee,
      items
    );
    // 응답 반환
    res.status(HttpStatus.OK).json(result);
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
    const result = await purchaseService.getMyPurchases(req.user.companyId, req.user.id, query);

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
  },

  // 💰 [Purchase] 내 구매 상세 조회 API
  getMyPurchaseDetail: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    // 구매 요청 ID가 없는 경우
    const purchaseRequestId = req.params.id;
    if (!purchaseRequestId) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '구매 요청 ID가 필요합니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.getMyPurchaseDetail(
      req.user.companyId,
      req.user.id,
      purchaseRequestId
    );

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
  },

  // 💰 [Purchase] 구매 요청 상세 조회 API (관리자)
  getPurchaseRequestDetail: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    // 구매 요청 ID가 없는 경우
    const purchaseRequestId = req.params.id;
    if (!purchaseRequestId) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '구매 요청 ID가 필요합니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.getPurchaseRequestDetail(
      req.user.companyId,
      purchaseRequestId
    );

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
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
    res.status(HttpStatus.OK).json(result);
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
      req.user.id,
      purchaseRequestId
    );

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
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
      req.user.id,
      purchaseRequestId,
      body
    );

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
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

    const { shippingFee, items, requestMessage } = req.body as RequestPurchaseBody;

    // 요청 바디 유효성 검사 - items 배열 검증
    if (!Array.isArray(items) || items.length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'items는 최소 1개 이상의 배열이어야 합니다.'
      );
    }

    // items 배열의 각 항목 유효성 검사
    const invalidItems = items.some(
      (item) =>
        !item ||
        typeof item !== 'object' ||
        typeof item.productId !== 'number' ||
        !Number.isInteger(item.productId) ||
        item.productId < 1 ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
    );

    if (invalidItems) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '모든 항목의 productId와 quantity는 1 이상의 정수여야 합니다.'
      );
    }

    // shippingFee 유효성 검사
    if (
      typeof shippingFee !== 'number' ||
      !Number.isFinite(shippingFee) ||
      !Number.isInteger(shippingFee) ||
      shippingFee < 0
    ) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'shippingFee는 0 이상의 정수여야 합니다.'
      );
    }

    // requestMessage 유효성 검사
    if (
      typeof requestMessage !== 'string' ||
      requestMessage.trim().length === 0 ||
      requestMessage.length > 255
    ) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        'requestMessage는 1자 이상 255자 이하의 문자열이어야 합니다.'
      );
    }

    // 서비스 호출 - items 배열 전체를 전달
    const result = await purchaseService.requestPurchase(
      req.user.companyId,
      req.user.id,
      shippingFee,
      items,
      requestMessage
    );

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
  },

  // 💰 [Purchase] 구매 요청 취소 API
  cancelPurchaseRequest: async (req: AuthenticatedRequest, res: Response) => {
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
    const result = await purchaseService.cancelPurchaseRequest(
      req.user.companyId,
      req.user.id,
      purchaseRequestId
    );

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
  },

  // 💰 [Purchase] 지출 통계 조회 API
  getExpenseStatistics: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.getExpenseStatistics(req.user.companyId);

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
  },

  // 💰 [Purchase] 구매 관리 대시보드 API
  getPurchaseDashboard: async (req: AuthenticatedRequest, res: Response) => {
    // 사용자 정보가 없는 경우
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '사용자 정보가 없습니다.'
      );
    }

    // 서비스 호출
    const result = await purchaseService.getPurchaseDashboard(req.user.companyId);

    // 응답 반환
    res.status(HttpStatus.OK).json(result);
  },
};
