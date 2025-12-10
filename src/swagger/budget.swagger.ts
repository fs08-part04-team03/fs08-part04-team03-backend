/**
 * @openapi
 * tags:
 *   - name: Budget
 *     description: 회사별 월 예산 관리
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
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 *
 *   patch:
 *     summary: 월 예산 생성/수정(upsert)
 *     tags: [Budget]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpsertBudgetBody'
 *     responses:
 *       '200':
 *         description: 수정됨
 *       '201':
 *         description: 새로 생성됨
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
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/BudgetCriteria'
 *   patch:
 *     summary: 회사 기본 예산 생성/수정(upsert)
 *     tags: [Budget]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpsertCriteriaBody'
 *     responses:
 *       '200':
 *         description: 저장됨
 *
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         companyId: { type: string, format: uuid }
 *         year: { type: integer }
 *         month: { type: integer }
 *         amount: { type: integer }
 *         updatedAt: { type: string, format: date-time }
 *     UpsertBudgetBody:
 *       type: object
 *       required: [year, month, amount]
 *       properties:
 *         year:   { type: integer, minimum: 2000, maximum: 2100 }
 *         month:  { type: integer, minimum: 1, maximum: 12 }
 *         amount: { type: integer, minimum: 0 }
 *     BudgetCriteria:
 *       type: object
 *       properties:
 *         companyId: { type: string, format: uuid }
 *         amount: { type: integer }
 *     UpsertCriteriaBody:
 *       type: object
 *       required: [amount]
 *       properties:
 *         amount: { type: integer, minimum: 0 }
 */
