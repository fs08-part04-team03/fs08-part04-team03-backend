import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser, JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { env } from '../../config/env.config';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';

// 컨텍스트 데이터 타입 정의
interface ContextData {
  products?: Array<{
    id: number;
    name: string;
    price: number;
    categoryId: number;
  }>;
  categories?: Array<{
    id: number;
    name: string;
  }>;
  budget?: {
    id: string;
    companyId: string;
    year: number;
    month: number;
    amount: number;
  } | null;
  thisMonthPurchases?: {
    _sum: {
      totalPrice: number | null;
    };
    _count: number;
  };
  recentPurchases?: Array<{
    id: string;
    status: string;
    totalPrice: number;
    createdAt: Date;
  }>;
  stats?: {
    totalProducts: number;
    totalUsers: number;
    pendingRequests: number;
  };
}

// 서비스 응답 타입 정의
interface ChatResponse {
  message: string;
  response: string;
  contextData: ContextData;
}

interface QueryResponse {
  query: string;
  answer: string;
  contextData: ContextData;
}

interface RecommendProductsResponse {
  query: string;
  answer: string;
  recommendedProducts: Array<{
    id: number;
    name: string;
    price: number;
    categoies: { name: string } | null;
  }>;
}

// ChatOpenAI 모델 초기화 (싱글톤)
let llm: ChatOpenAI | null = null;

const getLLM = () => {
  if (!llm) {
    llm = new ChatOpenAI({
      temperature: 0,
      model: 'gpt-4o-mini',
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return llm;
};

// 컨텍스트 데이터를 JSON 문자열로 변환하는 헬퍼 함수
const serializeContextData = (data: ContextData): string => JSON.stringify(data, null, 2);

// 데이터베이스 스키마 정보
const getSchemaInfo = () => `
테이블 스키마:
1. products (상품): id, companyId, categoryId, name, price, image, link, isActive, createdAt, updatedAt
2. categories (카테고리): id, name, parentCategoryId
3. users (사용자): id, companyId, email, name, role, isActive, createdAt
4. purchase_requests (구매요청): id, companyId, requesterId, approverId, status, totalPrice, shippingFee, requestMessage, createdAt
5. purchase_items (구매항목): id, purchaseRequestId, productId, quantity, priceSnapshot
6. budgets (예산): id, companyId, year, month, amount
7. carts (장바구니): id, userId, productId, quantity

카테고리 예시: 음료, 과자, 사탕, 초콜릿, 빵, 아이스크림, 커피, 차, 과일, 견과류 등

구매 상태: PENDING(대기중), APPROVED(승인됨), REJECTED(거절됨), CANCELLED(취소됨)
`;

// 상품 추천을 위한 프롬프트
const recommendPrompt = PromptTemplate.fromTemplate(`
당신은 회사 간식 추천 전문가입니다.
사용자의 요청에 맞는 상품을 추천해주세요.

사용자 요청: {query}

사용 가능한 상품 목록 (ID와 함께):
{products}

위 상품 목록에서 사용자의 요청에 가장 적합한 상품 3개를 선택하여 추천해주세요.
추천 이유와 함께 친근하게 한글로 답변해주세요.
각 상품의 이름과 가격을 포함해주세요.

응답은 반드시 다음 JSON 형식으로만 출력해주세요:
{{
  "answer": "사용자에게 보여줄 추천 메시지 (친근하고 이모지 포함)",
  "productIds": ["상품ID1", "상품ID2", "상품ID3"]
}}
`);

// 일반 질의를 위한 프롬프트
const queryPrompt = PromptTemplate.fromTemplate(`
당신은 회사 간식 관리 시스템의 AI 어시스턴트입니다.
데이터베이스 정보를 바탕으로 사용자의 질문에 답변해주세요.

{schemaInfo}

사용자 질문: {query}

제공된 데이터:
{data}

위 정보를 바탕으로 사용자의 질문에 친근하고 정확하게 한글로 답변해주세요.
숫자나 통계가 포함된 경우 명확하게 표시해주세요.
`);

// 챗봇 대화를 위한 프롬프트
const chatPrompt = PromptTemplate.fromTemplate(`
당신은 친근한 회사 간식 관리 어시스턴트 "스낵봇"입니다.
사용자와 자연스럽게 대화하며 간식 추천, 구매 현황, 예산 정보 등을 안내해주세요.

대화 기록:
{chatHistory}

현재 사용자 메시지: {message}

참고 데이터:
{contextData}

친근하고 도움이 되는 답변을 한글로 해주세요.
이모지를 적절히 사용해서 친근감을 더해주세요.
`);

export const chatService = {
  // 챗봇 대화 (메인 기능)
  async chat(
    companyId: string,
    message: string,
    chatHistory: string[] = []
  ): Promise<ChatResponse> {
    try {
      const model = getLLM();

      // 메시지 분석하여 필요한 데이터 조회
      const contextData = await this.getContextData(companyId, message);

      const chain = RunnableSequence.from([chatPrompt, model, new StringOutputParser()]);

      const response = await chain.invoke({
        chatHistory: chatHistory.slice(-10).join('\n') || '(첫 대화입니다)',
        message,
        contextData: serializeContextData(contextData),
      });

      return {
        message,
        response,
        contextData,
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        error instanceof Error ? error.message : '챗봇 응답 생성 중 오류가 발생했습니다.'
      );
    }
  },

  // 메시지에 따라 필요한 컨텍스트 데이터 조회
  async getContextData(companyId: string, message: string): Promise<ContextData> {
    const lowerMessage = message.toLowerCase();
    const contextData: ContextData = {};

    // 상품/추천 관련 키워드
    if (
      lowerMessage.includes('추천') ||
      lowerMessage.includes('상품') ||
      lowerMessage.includes('간식') ||
      lowerMessage.includes('마실') ||
      lowerMessage.includes('먹을') ||
      lowerMessage.includes('음료') ||
      lowerMessage.includes('과자')
    ) {
      contextData.products = await prisma.products.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, price: true, categoryId: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      contextData.categories = await prisma.categoies.findMany({
        select: { id: true, name: true },
      });
    }

    // 예산 관련 키워드
    if (
      lowerMessage.includes('예산') ||
      lowerMessage.includes('지출') ||
      lowerMessage.includes('비용') ||
      lowerMessage.includes('금액')
    ) {
      const now = new Date();
      contextData.budget = await prisma.budgets.findFirst({
        where: {
          companyId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      });

      contextData.thisMonthPurchases = await prisma.purchaseRequests.aggregate({
        where: {
          companyId,
          status: 'APPROVED',
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
        _sum: { totalPrice: true },
        _count: true,
      });
    }

    // 구매/주문 관련 키워드
    if (
      lowerMessage.includes('구매') ||
      lowerMessage.includes('주문') ||
      lowerMessage.includes('요청') ||
      lowerMessage.includes('현황')
    ) {
      contextData.recentPurchases = await prisma.purchaseRequests.findMany({
        where: { companyId },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    }

    // 통계 관련 키워드
    if (
      lowerMessage.includes('통계') ||
      lowerMessage.includes('몇 개') ||
      lowerMessage.includes('얼마') ||
      lowerMessage.includes('총')
    ) {
      contextData.stats = {
        totalProducts: await prisma.products.count({ where: { companyId, isActive: true } }),
        totalUsers: await prisma.users.count({ where: { companyId, isActive: true } }),
        pendingRequests: await prisma.purchaseRequests.count({
          where: { companyId, status: 'PENDING' },
        }),
      };
    }

    return contextData;
  },

  // 자연어 쿼리 (기존 호환)
  async queryWithAgent(companyId: string, query: string): Promise<QueryResponse> {
    try {
      const model = getLLM();
      const contextData = await this.getContextData(companyId, query);

      const chain = RunnableSequence.from([queryPrompt, model, new StringOutputParser()]);

      const answer = await chain.invoke({
        schemaInfo: getSchemaInfo(),
        query,
        data: serializeContextData(contextData),
      });

      return {
        query,
        answer,
        contextData,
      };
    } catch (error) {
      console.error('Query error:', error);
      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        error instanceof Error ? error.message : 'AI 쿼리 처리 중 오류가 발생했습니다.'
      );
    }
  },

  // 상품 추천
  async recommendProducts(companyId: string, query: string): Promise<RecommendProductsResponse> {
    try {
      const model = getLLM();

      // 상품 목록 조회
      const products = await prisma.products.findMany({
        where: { companyId, isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          categoies: { select: { name: true } },
        },
        take: 100,
      });

      // 상품 목록을 ID와 함께 포맷팅
      const productList = products
        .map(
          (p) =>
            `- ID: ${p.id}, 이름: ${p.name}, 카테고리: ${p.categoies?.name || '기타'}, 가격: ${p.price.toLocaleString()}원`
        )
        .join('\n');

      const parser = new JsonOutputParser<{
        answer: string;
        productIds: string[];
      }>();

      const chain = RunnableSequence.from([recommendPrompt, model, parser]);

      const result = await chain.invoke({
        query,
        products: productList,
      });

      // LLM이 선택한 상품 ID로 실제 상품 필터링 (순서 보존)
      const productsById = new Map(products.map((p) => [p.id.toString(), p]));
      const recommendedProducts = result.productIds
        .map((id) => productsById.get(String(id)))
        .filter((p): p is (typeof products)[number] => Boolean(p));

      return {
        query,
        answer: result.answer,
        recommendedProducts,
      };
    } catch (error) {
      console.error('Recommendation error:', error);
      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        '상품 추천 중 오류가 발생했습니다.'
      );
    }
  },

  // 통계 조회
  async getStatistics(companyId: string, query: string): Promise<QueryResponse> {
    try {
      return await this.queryWithAgent(companyId, query);
    } catch (error) {
      console.error('Statistics error:', error);
      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        '통계 조회 중 오류가 발생했습니다.'
      );
    }
  },
};
