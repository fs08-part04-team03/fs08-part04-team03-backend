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
    purchaseItems: Array<{
      quantity: number;
      products: {
        name: string;
      };
    }>;
  }>;
  stats?: {
    totalProducts: number;
    totalUsers: number;
    pendingRequests: number;
  };
  wishList?: Array<{
    id: string;
    productId: number;
    createdAt: Date;
    products: {
      id: number;
      name: string;
      price: number;
      categoies: { name: string } | null;
    };
  }>;
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
1. companies (회사): id, name, businessNumber, createdAt, updatedAt
2. users (사용자): id, companyId, email, name, role, profileImage, isActive, createdAt, updatedAt
3. categories (카테고리): id, name, parentCategoryId
4. products (상품): id, companyId, categoryId, createdById, name, price, image, link, isActive, createdAt, updatedAt
5. carts (장바구니): id, userId, productId, quantity, updatedAt
6. budgetCriteria (예산 기준): id, companyId, amount
7. budgets (월별 예산): id, companyId, year, month, amount, updatedAt
8. purchaseRequests (구매 요청): id, companyId, requesterId, approverId, status, totalPrice, shippingFee, createdAt, updatedAt
9. purchaseItems (구매 항목): id, purchaseRequestId, productId, quantity, priceSnapshot
10. wishLists (찜 목록): id, userId, productId, createdAt
11. notifications (알림): id, userId, content, targetType, targetId, isRead, createdAt
12. invitations (초대): id, companyId, email, token, expiresAt, createdAt
13. uploads (업로드 파일): id, userId, companyId, productId, filename, filePath, fileType, fileSize, createdAt

사용자 역할: USER(일반 사용자), MANAGER(관리자), ADMIN(최고 관리자)

구매 상태: PENDING(승인 대기), APPROVED(승인됨), REJECTED(거절됨), CANCELLED(취소됨)

카테고리 예시: 음료, 과자, 사탕, 초콜릿, 빵, 아이스크림, 커피, 차, 과일, 견과류 등

알림 대상 타입: PURCHASE_REQUEST(구매 요청), PURCHASE_APPROVAL(구매 승인), PURCHASE_REJECTION(구매 거절), ANNOUNCEMENT(공지사항)
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

**중요: 구매 요청 상태 정의**
- PENDING: 승인 대기 중 (아직 통과되지 않음, 대기 중)
- APPROVED: 승인됨 (통과됨, 승인 완료)
- REJECTED: 거절됨
- CANCELLED: 취소됨

**사용자 권한: {userRole}**

**권한별 정보 제공 규칙 (매우 중요!):**
- **USER 권한인 경우**:
  * 제공된 데이터는 오직 이 사용자 본인이 요청한 구매 내역만 포함되어 있습니다.
  * 답변 시 "회원님께서 요청하신", "회원님의" 등 본인 한정 표현을 사용하세요.
  * 절대로 "회사 전체", "전체 요청", "다른 직원" 등의 표현을 사용하지 마세요.
  * 제공된 데이터에 없는 정보(다른 사람의 요청, 전체 통계 등)는 "권한이 없어 확인할 수 없습니다"라고 답변하세요.

- **MANAGER/ADMIN 권한인 경우**:
  * 제공된 데이터는 회사 전체 구매 요청을 포함합니다.
  * "회사 전체", "전체 직원", "팀 전체" 등의 표현을 자유롭게 사용할 수 있습니다.

**대화 컨텍스트 유지 (매우 중요!):**
- 사용자가 "그것", "그거", "저거", "방금 추천해준 것" 등 지시대명사를 사용하면, 대화 기록에서 최근에 언급한 상품이나 정보를 참조하세요.
- 예: 사용자가 "긴급한 물건 추천해줘" → 챗봇이 "콜라, 사이다, 물" 추천 → 사용자가 "그것에 대해 자세히 알려줘" → "그것"은 방금 추천한 "콜라, 사이다, 물"을 의미합니다.
- 대화 기록과 현재 참고 데이터를 모두 활용하여 맥락을 이해하세요.

**답변 규칙:**
1. "통과되지 않은", "대기 중", "승인 대기" 등의 질문은 status가 "PENDING"인 건수를 의미합니다.
2. "승인된", "통과된", "완료된" 등의 질문은 status가 "APPROVED"인 건수를 의미합니다.
3. 제공된 데이터의 status 필드를 정확히 확인하여 답변하세요.
4. 상품명이 포함된 질문의 경우, 해당 상품과 관련된 구매 요청만 필터링하여 답변하세요.
5. **찜한 간식/위시리스트**: wishList 데이터는 사용자 본인이 찜한 상품 목록입니다. "찜한 간식", "관심 있는 상품", "위시리스트" 등의 질문에 이 데이터를 활용하세요.
6. **중요**: 제공된 contextData에 없는 정보는 절대 추측하거나 만들어내지 마세요.

대화 기록 (최근 대화부터):
{chatHistory}

현재 사용자 메시지: {message}

현재 참고 데이터:
{contextData}

친근하고 도움이 되는 답변을 한글로 해주세요.
이모지를 적절히 사용해서 친근감을 더해주세요.
위의 구매 상태 정의와 권한별 정보 제공 규칙을 정확히 따라 답변해주세요.
대화 기록을 참조하여 맥락을 이해하고 자연스러운 대화를 이어가세요.
`);

export const chatService = {
  // 챗봇 대화 (메인 기능)
  async chat(
    companyId: string,
    message: string,
    userRole: string,
    userId: string,
    chatHistory: string[] = []
  ): Promise<ChatResponse> {
    try {
      const model = getLLM();

      // 대화 기록 결합 (이전 대화 컨텍스트 파악용)
      const recentHistory = chatHistory.slice(-10).join('\n');

      // 메시지 분석하여 필요한 데이터 조회 (권한 기반 필터링)
      // chatHistory도 함께 전달하여 이전 대화 맥락 파악
      const contextData = await this.getContextData(
        companyId,
        message,
        userRole,
        userId,
        recentHistory
      );

      const chain = RunnableSequence.from([chatPrompt, model, new StringOutputParser()]);

      const response = await chain.invoke({
        chatHistory: recentHistory || '(첫 대화입니다)',
        message,
        contextData: serializeContextData(contextData),
        userRole,
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

  // 메시지에 따라 필요한 컨텍스트 데이터 조회 (권한 기반 필터링)
  async getContextData(
    companyId: string,
    message: string,
    userRole: string,
    userId: string,
    chatHistory: string = ''
  ): Promise<ContextData> {
    const lowerMessage = message.toLowerCase();
    const lowerHistory = chatHistory.toLowerCase();
    const contextData: ContextData = {};

    // 지시대명사 감지 - 이전 대화 컨텍스트 참조가 필요한 경우
    const hasReference =
      lowerMessage.includes('그것') ||
      lowerMessage.includes('그거') ||
      lowerMessage.includes('저것') ||
      lowerMessage.includes('저거') ||
      lowerMessage.includes('방금') ||
      lowerMessage.includes('아까') ||
      lowerMessage.includes('위에') ||
      lowerMessage.includes('그 상품') ||
      lowerMessage.includes('그 물건') ||
      lowerMessage.includes('추천해준');

    // 대화 기록에 상품 추천이 있었는지 확인
    const hasProductInHistory =
      lowerHistory.includes('추천') ||
      lowerHistory.includes('비타') ||
      lowerHistory.includes('우유') ||
      lowerHistory.includes('삼다수') ||
      lowerHistory.includes('라면') ||
      lowerHistory.includes('샌드위치') ||
      lowerHistory.includes('콜라') ||
      lowerHistory.includes('사이다') ||
      lowerHistory.includes('간식') ||
      lowerHistory.includes('상품');

    // 상품/추천 관련 키워드, 지시대명사, 또는 대화 기록에 상품이 있는 경우
    if (
      hasReference ||
      hasProductInHistory ||
      lowerMessage.includes('추천') ||
      lowerMessage.includes('상품') ||
      lowerMessage.includes('간식') ||
      lowerMessage.includes('마실') ||
      lowerMessage.includes('먹을') ||
      lowerMessage.includes('음료') ||
      lowerMessage.includes('과자') ||
      lowerMessage.includes('자세히') ||
      lowerMessage.includes('정보') ||
      lowerMessage.includes('알려') ||
      lowerMessage.includes('가격')
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
      // 권한에 따른 접근 제어
      const isManagerOrAbove = userRole === 'MANAGER' || userRole === 'ADMIN';

      contextData.recentPurchases = await prisma.purchaseRequests.findMany({
        where: {
          companyId,
          // USER는 자신이 요청한 것만, MANAGER/ADMIN은 모든 요청 조회
          ...(isManagerOrAbove ? {} : { requesterId: userId }),
        },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          createdAt: true,
          purchaseItems: {
            select: {
              quantity: true,
              products: {
                select: {
                  name: true,
                },
              },
            },
          },
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
      // 권한에 따른 접근 제어
      const isManagerOrAbove = userRole === 'MANAGER' || userRole === 'ADMIN';

      contextData.stats = {
        totalProducts: await prisma.products.count({ where: { companyId, isActive: true } }),
        totalUsers: await prisma.users.count({ where: { companyId, isActive: true } }),
        // USER는 대기 중인 구매 요청 개수를 볼 수 없음
        pendingRequests: isManagerOrAbove
          ? await prisma.purchaseRequests.count({
              where: { companyId, status: 'PENDING' },
            })
          : 0,
      };
    }

    // 찜한 간식 관련 키워드
    if (
      lowerMessage.includes('찜') ||
      lowerMessage.includes('위시') ||
      lowerMessage.includes('wishlist') ||
      lowerMessage.includes('관심') ||
      lowerMessage.includes('좋아하는')
    ) {
      contextData.wishList = await prisma.wishLists.findMany({
        where: { userId },
        select: {
          id: true,
          productId: true,
          createdAt: true,
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              categoies: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    return contextData;
  },

  // 자연어 쿼리 (기존 호환)
  async queryWithAgent(
    companyId: string,
    query: string,
    userRole: string,
    userId: string
  ): Promise<QueryResponse> {
    try {
      const model = getLLM();
      const contextData = await this.getContextData(companyId, query, userRole, userId, '');

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
  async getStatistics(
    companyId: string,
    query: string,
    userRole: string,
    userId: string
  ): Promise<QueryResponse> {
    try {
      return await this.queryWithAgent(companyId, query, userRole, userId);
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
