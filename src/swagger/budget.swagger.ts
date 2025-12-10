/**
 * @openapi
 * tags:
 *   - name: Budget
 *     description: 회사별 월 예산 관리
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: '성공' }
 *         data: {}
 *     Budget:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         companyId: { type: string, format: uuid }
 *         year: { type: integer, example: 2024 }
 *         month: { type: integer, example: 5 }
 *         amount: { type: integer, example: 1000000 }
 *         updatedAt: { type: string, format: date-time }
 *     BudgetListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items: { $ref: '#/components/schemas/Budget' }
 *             message:
 *               type: string
 *               example: '예산 조회 성공'
 *     BudgetUpsertResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/Budget' }
 *             message:
 *               type: string
 *               example: '예산 생성'  # 또는 '예산 수정'
 *     Criteria:
 *       type: object
 *       properties:
 *         companyId: { type: string, format: uuid }
 *         amount: { type: integer, example: 1000000 }
 *     CriteriaResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/Criteria' }
 *             message:
 *               type: string
 *               example: '기본 예산 조회 성공'
 */

/**
 * @openapi
 * /api/v1/budget:
 *   get:
 *     summary: 월 예산 목록 조회
 *     tags: [Budget]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, minimum: 2000, maximum: 2100 }
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *     responses:
 *       '200':
 *         description: 예산 목록
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BudgetListResponse' }
 *   patch:
 *     summary: 월 예산 생성/수정(upsert)
 *     tags: [Budget]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [year, month, amount]
 *             properties:
 *               year: { type: integer, minimum: 2000, maximum: 2100 }
 *               month: { type: integer, minimum: 1, maximum: 12 }
 *               amount: { type: integer, minimum: 0 }
 *     responses:
 *       '200':
 *         description: 수정
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BudgetUpsertResponse' }
 *       '201':
 *         description: 생성
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BudgetUpsertResponse' }
 */

/**
 * @openapi
 * /api/v1/budget/criteria:
 *   get:
 *     summary: 회사 기본 예산 조회
 *     tags: [Budget]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: 기본 예산
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CriteriaResponse' }
 *   patch:
 *     summary: 회사 기본 예산 생성/수정(upsert)
 *     tags: [Budget]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: integer, minimum: 0 }
 *     responses:
 *       '200':
 *         description: 저장됨
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CriteriaResponse' }
 *       '201':
 *         description: 새로 생성됨
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CriteriaResponse' }
 */
