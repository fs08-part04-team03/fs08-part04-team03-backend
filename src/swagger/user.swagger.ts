/**
 * @openapi
 * tags:
 *   - name: User
 *     description: 사용자 프로필/계정 관리 API
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         companyId: { type: string, format: uuid }
 *         email: { type: string, format: email }
 *         name: { type: string }
 *         role: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *         isActive: { type: boolean }
 *         profileImage: { type: string, nullable: true, example: "https://example.com/avatar.png" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     UserAdminView:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         email: { type: string, format: email }
 *         name: { type: string }
 *         role: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *         isActive: { type: boolean }
 *         companyId: { type: string, format: uuid }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     UserSummary:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         email: { type: string, format: email }
 *         name: { type: string }
 *         role: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *         isActive: { type: boolean }
 *         companyId: { type: string, format: uuid }
 *         createdAt: { type: string, format: date-time }
 *     UserProfileResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/UserProfile' }
 *             message:
 *               type: string
 *               example: '내 프로필 조회 성공'
 *     UserUpdateResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/UserAdminView' }
 *             message:
 *               type: string
 *               example: '권한/상태가 변경되었습니다.'
 *     UserListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items: { $ref: '#/components/schemas/UserSummary' }
 *             pagination:
 *               type: object
 *               properties:
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 10 }
 *                 total: { type: integer, example: 42 }
 *                 totalPages: { type: integer, example: 5 }
 *             message:
 *               type: string
 *               example: '사용자 목록 조회 성공'
 *     PasswordChangeBody:
 *       type: object
 *       required: [newPassword, newPasswordConfirm]
 *       properties:
 *         newPassword: { type: string, minLength: 1, maxLength: 30 }
 *         newPasswordConfirm: { type: string, minLength: 1, maxLength: 30 }
 *     AdminProfilePatchBody:
 *       type: object
 *       properties:
 *         companyName: { type: string, minLength: 1, maxLength: 255 }
 *         newPassword: { type: string, minLength: 1, maxLength: 30 }
 *         newPasswordConfirm: { type: string, minLength: 1, maxLength: 30 }
 *       description: companyName 또는 newPassword 중 하나 이상 필수
 *     UpdateRoleBody:
 *       type: object
 *       required: [role]
 *       properties:
 *         role: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *     UpdateStatusBody:
 *       type: object
 *       required: [isActive]
 *       properties:
 *         isActive: { type: boolean }
 *     EmptySuccessResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               nullable: true
 *               example: null
 *           required: [success, data]
 */

/**
 * @openapi
 * /api/v1/user/me:
 *   get:
 *     summary: 내 프로필 조회 (USER 이상)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserProfileResponse' }
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/user/me/profile:
 *   patch:
 *     summary: 내 비밀번호 변경 (USER/MANAGER)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PasswordChangeBody' }
 *     responses:
 *       '200':
 *         description: 비밀번호 변경
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/EmptySuccessResponse' }
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/user/admin/profile:
 *   patch:
 *     summary: 회사명/관리자 비밀번호 변경 (ADMIN)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AdminProfilePatchBody' }
 *     responses:
 *       '200':
 *         description: 관리자 프로필 수정
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/EmptySuccessResponse' }
 *       '401':
 *         description: 인증 실패
 *       '403':
 *         description: 권한 없음
 */

/**
 * @openapi
 * /api/v1/user/admin/{id}/role:
 *   patch:
 *     summary: 사용자 권한 변경 (ADMIN)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateRoleBody' }
 *     responses:
 *       '200':
 *         description: 권한 변경 완료
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserUpdateResponse' }
 *       '401':
 *         description: 인증 실패
 *       '403':
 *         description: 권한 없음
 */

/**
 * @openapi
 * /api/v1/user/admin/{id}/status:
 *   patch:
 *     summary: 사용자 활성/비활성 전환 (ADMIN)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateStatusBody' }
 *     responses:
 *       '200':
 *         description: 상태 변경 완료
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserUpdateResponse' }
 *       '401':
 *         description: 인증 실패
 *       '403':
 *         description: 권한 없음
 */

/**
 * @openapi
 * /api/v1/user:
 *   get:
 *     summary: 회사 소속 사용자 목록 조회/검색 (ADMIN)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string, example: "user@example.com" }
 *         description: 이메일/이름 부분 검색 (대소문자 무시)
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
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserListResponse' }
 *       '401':
 *         description: 인증 실패
 *       '403':
 *         description: 권한 없음
 */
