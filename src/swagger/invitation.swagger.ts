/**
 * @openapi
 * tags:
 *   - name: Invitation
 *     description: 초대 URL 검증
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
 *     InvitationPublicInfo:
 *       type: object
 *       properties:
 *         companyId: { type: string, format: uuid }
 *         name: { type: string, example: "홍길동" }
 *         email: { type: string, format: email, example: "user@example.com" }
 *         role: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *     InvitationVerifyUrlResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/InvitationPublicInfo' }
 *             message:
 *               type: string
 *               example: '초대 URL이 유효합니다.'
 */

/**
 * @openapi
 * /api/v1/auth/invitation/verifyUrl:
 *   post:
 *     summary: 초대 URL에서 토큰을 추출해 검증
 *     description: inviteUrl의 query `token` 또는 `#token=` 해시에서 토큰을 읽어 초대장을 검증합니다.
 *     tags: [Invitation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inviteUrl]
 *             properties:
 *               inviteUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://app.example.com/signup?token=123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       '200':
 *         description: 유효한 초대 URL
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InvitationVerifyUrlResponse' }
 *       '400':
 *         description: URL 파싱 실패 또는 요청 본문 오류
 *       '401':
 *         description: 만료/취소/이미 사용된 토큰
 */
