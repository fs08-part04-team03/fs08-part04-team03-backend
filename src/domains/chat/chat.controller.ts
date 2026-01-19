import { Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { chatService } from './chat.service';
import type {
  ChatRequest,
  ChatQueryRequest,
  RecommendProductsRequest,
  StatisticsRequest,
} from './chat.types';

// 회사 ID 가져오기
const getCompanyId = (req: AuthenticatedRequest) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '회사 정보가 없습니다.'
    );
  }
  return companyId;
};

// 사용자 정보 가져오기
const getUserInfo = (req: AuthenticatedRequest) => {
  const { user } = req;
  if (!user) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '사용자 인증이 필요합니다.'
    );
  }
  return { userId: user.id, userRole: user.role };
};

export const chatController = {
  // 챗봇 대화 (메인 엔드포인트)
  chat: async (req: ChatRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const { userId, userRole } = getUserInfo(req);
    const { message, chatHistory = [] } = req.body as { message: string; chatHistory?: string[] };

    if (!message || message.trim() === '') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '메시지를 입력해주세요.'
      );
    }

    const result = await chatService.chat(companyId, message, userRole, userId, chatHistory);

    // 프론트엔드가 기대하는 응답 형식으로 변환
    const responseData = {
      reply: result.response,
    };

    res.status(HttpStatus.OK).json(ResponseUtil.success(responseData, '챗봇 응답 생성 완료'));
  },

  // 자연어 쿼리 처리
  query: async (req: ChatQueryRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const { userId, userRole } = getUserInfo(req);
    const { query } = req.body as { query: string };

    if (!query || query.trim() === '') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '쿼리를 입력해주세요.'
      );
    }

    const result = await chatService.queryWithAgent(companyId, query, userRole, userId);
    res.status(HttpStatus.OK).json(ResponseUtil.success(result, '쿼리 처리 완료'));
  },

  // 상품 추천
  recommendProducts: async (req: RecommendProductsRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const { query } = req.body as { query: string };

    if (!query || query.trim() === '') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '추천 조건을 입력해주세요.'
      );
    }

    const result = await chatService.recommendProducts(companyId, query);
    res.status(HttpStatus.OK).json(ResponseUtil.success(result, '상품 추천 완료'));
  },

  // 통계 조회
  getStatistics: async (req: StatisticsRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const { userId, userRole } = getUserInfo(req);
    const { query } = req.body as { query: string };

    if (!query || query.trim() === '') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '통계 조회 조건을 입력해주세요.'
      );
    }

    const result = await chatService.getStatistics(companyId, query, userRole, userId);
    res.status(HttpStatus.OK).json(ResponseUtil.success(result, '통계 조회 완료'));
  },
};
