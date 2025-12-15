/**
 * @openapi
 * tags:
 *   - name: Company
 *     description: 회사 정보 및 소속 유저 API
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
 *     CompanyUser:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         email: { type: string, format: email }
 *         name: { type: string }
 *         role: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *         isActive: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *     CompanyDetailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/Company' }
 *             message:
 *               type: string
 *               example: "회사 정보 조회 성공"
 *     CompanyUsersResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items: { $ref: '#/components/schemas/CompanyUser' }
 *             pagination:
 *               type: object
 *               properties:
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 10 }
 *                 total: { type: integer, example: 42 }
 *                 totalPages: { type: integer, example: 5 }
 *             message:
 *               type: string
 *               example: "소속 유저 조회 성공"
 *     UpdateCompanyNameBody:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "New Company Name", minLength: 1, maxLength: 255 }
 */

/**
 * @openapi
 * /api/v1/company:
 *   get:
 *     summary: 회사 세부 정보 조회 (USER/MANAGER/ADMIN)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: 회사 정보
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CompanyDetailResponse' }
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/company/users:
 *   get:
 *     summary: 회사 소속 유저 목록 조회 (ADMIN 전용)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, example: 10 }
 *     responses:
 *       '200':
 *         description: 소속 유저 목록
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CompanyUsersResponse' }
 *       '403':
 *         description: 권한 없음 (USER/MANAGER)
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/company/name:
 *   patch:
 *     summary: 회사명 변경 (ADMIN 전용)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCompanyNameBody' }
 *     responses:
 *       '200':
 *         description: 변경된 회사 정보
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CompanyDetailResponse' }
 *       '403':
 *         description: 권한 없음 (USER/MANAGER)
 *       '401':
 *         description: 인증 실패
 */
