/**
 * @openapi
 * tags:
 *   - name: Company
 *     description: 회사 정보 조회 API
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, example: "Acme Inc" }
 *         businessNumber: { type: string, example: "123-45-67890" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CompanyDetailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/Company' }
 *             message:
 *               type: string
 *               example: "회사 정보 조회 성공"
 */

/**
 * @openapi
 * /api/v1/company:
 *   get:
 *     summary: 회사 상세 정보 조회 (USER/MANAGER/ADMIN)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: 회사 정보 조회 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CompanyDetailResponse' }
 *       '401':
 *         description: 인증 실패 (토큰 없음/만료/유효하지 않음)
 *       '404':
 *         description: 회사를 찾을 수 없습니다.
 */
