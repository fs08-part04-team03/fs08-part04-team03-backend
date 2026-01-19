import type { Request } from 'express';
import type { AuthenticatedRequest } from '../../common/types/common.types';

// 챗봇 대화 요청 타입
export type ChatRequest = AuthenticatedRequest &
  Request<
    unknown,
    unknown,
    {
      message: string;
      chatHistory?: string[];
    }
  >;

// 자연어 쿼리 요청 타입
export type ChatQueryRequest = AuthenticatedRequest &
  Request<
    unknown,
    unknown,
    {
      query: string;
    }
  >;

// 상품 추천 요청 타입
export type RecommendProductsRequest = AuthenticatedRequest &
  Request<
    unknown,
    unknown,
    {
      query: string;
    }
  >;

// 통계 조회 요청 타입
export type StatisticsRequest = AuthenticatedRequest &
  Request<
    unknown,
    unknown,
    {
      query: string;
    }
  >;
