/**
 * @openapi
 * tags:
 *   - name: Notification
 *     description: 알림 API
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     NotificationItem:
 *       type: object
 *       required: [id, content, targetType, targetId, isRead, createdAt]
 *       properties:
 *         id:
 *           type: string
 *           description: BigInt ID serialized as string
 *           example: "42"
 *         content: { type: string, example: "홍길동님이 구매 요청을 보냈습니다." }
 *         targetType:
 *           type: string
 *           enum: [PURCHASE_REQUEST, APPROVAL_NOTICE, DENIAL_NOTICE, ADMIN_MESSAGE, GENERAL_NOTICE]
 *           example: PURCHASE_REQUEST
 *         targetId: { type: string, format: uuid, example: "b0f4fb8b-0d1a-4a6c-9f8c-3d2b0c07e9e1" }
 *         isRead: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time, example: "2025-01-07T10:00:00.000Z" }
 *     NotificationListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items: { $ref: '#/components/schemas/NotificationItem' }
 *             pagination:
 *               type: object
 *               properties:
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 10 }
 *                 total: { type: integer, example: 3 }
 *                 totalPages: { type: integer, example: 1 }
 *             message: { type: string, example: "알림 목록을 조회했습니다." }
 *     NotificationReadResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/NotificationItem' }
 *             message: { type: string, example: "알림을 읽음 처리했습니다." }
 *     NotificationUnreadCountResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 count: { type: integer, example: 4 }
 *             message: { type: string, example: "읽지 않은 알림 수를 조회했습니다." }
 */

/**
 * @openapi
 * /api/v1/notification/stream:
 *   get:
 *     summary: 알림 SSE 스트림 연결
 *     description: 알림 발생 시 `data: {NotificationItem JSON}` 형태로 전송됩니다.
 *     tags: [Notification]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: SSE 스트림 연결 성공
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: {\"id\":\"42\",\"content\":\"홍길동님이 구매 요청을 보냈습니다.\",\"targetType\":\"PURCHASE_REQUEST\",\"targetId\":\"b0f4fb8b-0d1a-4a6c-9f8c-3d2b0c07e9e1\",\"isRead\":false,\"createdAt\":\"2025-01-07T10:00:00.000Z\"}\n\n"
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/notification:
 *   get:
 *     summary: 알림 목록 조회
 *     tags: [Notification]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *         description: 페이지 크기
 *     responses:
 *       '200':
 *         description: 알림 목록 조회 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationListResponse' }
 *       '400':
 *         description: 잘못된 요청
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/notification/unread-count:
 *   get:
 *     summary: 읽지 않은 알림 수 조회
 *     tags: [Notification]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: 읽지 않은 알림 수 조회 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationUnreadCountResponse' }
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/notification/{id}/read:
 *   patch:
 *     summary: 알림 읽음 처리
 *     tags: [Notification]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, format: int64, minimum: 1 }
 *         description: 알림 ID (BigInt)
 *     responses:
 *       '200':
 *         description: 알림 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationReadResponse' }
 *       '400':
 *         description: 잘못된 요청
 *       '401':
 *         description: 인증 실패
 *       '404':
 *         description: 알림을 찾을 수 없음
 */
