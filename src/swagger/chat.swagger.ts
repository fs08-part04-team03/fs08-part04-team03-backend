/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI 기반 챗봇 및 자연어 쿼리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: 챗봇에게 보낼 메시지
 *           example: "목이 마른데, 마실만한 것을 추천해주세요"
 *         chatHistory:
 *           type: array
 *           items:
 *             type: string
 *           description: 이전 대화 기록 (최근 10개까지 사용)
 *           example: ["안녕하세요!", "네, 안녕하세요! 무엇을 도와드릴까요?"]
 *     ChatResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "챗봇 응답 생성 완료"
 *         data:
 *           type: object
 *           properties:
 *             reply:
 *               type: string
 *               description: 챗봇의 응답 메시지
 *               example: "🥤 목이 마르시군요! 시원한 음료를 추천해드릴게요. 저희 회사에서 판매 중인 상품 중에서 콜라, 사이다, 오렌지주스를 추천드립니다!"
 *     ChatQueryRequest:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: 자연어 쿼리 (한글 또는 영문)
 *           example: "이번 달 구매 요청 건수는?"
 *     ChatQueryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "쿼리 처리 완료"
 *         data:
 *           type: object
 *           properties:
 *             query:
 *               type: string
 *               description: 입력한 쿼리
 *             answer:
 *               type: string
 *               description: AI의 답변
 *             contextData:
 *               type: object
 *               description: 응답 생성에 사용된 데이터
 */

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     summary: 챗봇 대화 (메인 엔드포인트)
 *     description: |
 *       스낵봇과 자연스럽게 대화할 수 있는 메인 엔드포인트입니다.
 *
 *       **주요 기능:**
 *       - 간식 추천
 *       - 예산/지출 현황 조회
 *       - 구매 요청 현황 확인
 *       - 통계 정보 제공
 *
 *       **사용 예시:**
 *       - "안녕하세요!"
 *       - "목이 마른데, 마실만한 것을 추천해주세요"
 *       - "이번 달 예산은 얼마나 남았나요?"
 *       - "최근 구매 요청 현황 알려줘"
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *           examples:
 *             greeting:
 *               summary: 인사
 *               value:
 *                 message: "안녕하세요!"
 *                 chatHistory: []
 *             recommend:
 *               summary: 음료 추천
 *               value:
 *                 message: "목이 마른데, 마실만한 것을 추천해주세요"
 *                 chatHistory: ["안녕하세요!", "네, 안녕하세요! 무엇을 도와드릴까요?"]
 *             budget:
 *               summary: 예산 조회
 *               value:
 *                 message: "이번 달 예산은 얼마나 남았나요?"
 *                 chatHistory: []
 *     responses:
 *       200:
 *         description: 챗봇 응답 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: 잘못된 요청 (메시지 누락 또는 형식 오류)
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류 (AI 처리 실패)
 */

/**
 * @swagger
 * /api/v1/chat/query:
 *   post:
 *     summary: 자연어 쿼리 처리
 *     description: |
 *       자연어로 데이터베이스를 질의하고 AI가 적절한 답변을 생성합니다.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatQueryRequest'
 *     responses:
 *       200:
 *         description: 쿼리 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatQueryResponse'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/v1/chat/recommend:
 *   post:
 *     summary: AI 상품 추천
 *     description: |
 *       자연어로 상품 추천 조건을 입력하면 AI가 적합한 상품을 추천합니다.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatQueryRequest'
 *           examples:
 *             drink:
 *               summary: 음료 추천
 *               value:
 *                 query: "목이 마른데, 마실만한 것을 추천해주세요"
 *             snack:
 *               summary: 간식 추천
 *               value:
 *                 query: "간식거리 추천해줘"
 *     responses:
 *       200:
 *         description: 상품 추천 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatQueryResponse'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/v1/chat/statistics:
 *   post:
 *     summary: AI 통계 조회
 *     description: |
 *       자연어로 통계 조회 조건을 입력하면 AI가 데이터를 분석하여 답변합니다.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatQueryRequest'
 *           examples:
 *             expense:
 *               summary: 지출 금액 조회
 *               value:
 *                 query: "이번 달 총 지출 금액은?"
 *             category:
 *               summary: 카테고리별 통계
 *               value:
 *                 query: "가장 많이 구매한 카테고리는?"
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatQueryResponse'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
