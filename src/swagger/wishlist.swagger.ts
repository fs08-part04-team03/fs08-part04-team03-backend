/**
 * @openapi
 * tags:
 *   - name: Wishlist
 *     description: 찜 관련 API
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     WishlistProduct:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 222 }
 *         name: { type: string, example: "간식 상품" }
 *         price: { type: integer, example: 1800 }
 *         image: { type: string, nullable: true, example: "01_snack.png" }
 *         link: { type: string, example: "https://example.com/products/1001" }
 *         isActive: { type: boolean, example: true }
 *         createdAt: { type: string, format: date-time, example: "2025-12-18T06:20:49.080Z" }
 *     WishlistItem:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         createdAt: { type: string, format: date-time, example: "2025-12-18T06:20:49.080Z" }
 *         product: { $ref: '#/components/schemas/WishlistProduct' }
 *     WishlistCreateResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/WishlistItem' }
 *             message: { type: string, example: "찜 등록 성공" }
 *     WishlistListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items: { $ref: '#/components/schemas/WishlistItem' }
 *             pagination:
 *               type: object
 *               properties:
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 10 }
 *                 total: { type: integer, example: 3 }
 *                 totalPages: { type: integer, example: 1 }
 *             message: { type: string, example: "찜 목록 조회 성공" }
 *     WishlistDeleteResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 productId: { type: integer, example: 222 }
 *             message: { type: string, example: "찜 해제 성공" }
 */

/**
 * @openapi
 * /api/v1/wishlist/{id}:
 *   post:
 *     summary: 찜 등록
 *     tags: [Wishlist]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         description: 상품 ID
 *     responses:
 *       '201':
 *         description: 찜 등록 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WishlistCreateResponse' }
 *       '400':
 *         description: 잘못된 요청
 *       '401':
 *         description: 인증 실패
 *       '403':
 *         description: 권한 없음
 *       '404':
 *         description: 상품을 찾을 수 없음
 */

/**
 * @openapi
 * /api/v1/wishlist/my:
 *   get:
 *     summary: 내 찜 목록 조회
 *     tags: [Wishlist]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *         description: 페이지당 개수
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *         description: 정렬 기준(등록일)
 *     responses:
 *       '200':
 *         description: 찜 목록 조회 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WishlistListResponse' }
 *       '401':
 *         description: 인증 실패
 */

/**
 * @openapi
 * /api/v1/wishlist/{id}:
 *   delete:
 *     summary: 찜 해제
 *     tags: [Wishlist]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         description: 상품 ID
 *     responses:
 *       '200':
 *         description: 찜 해제 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WishlistDeleteResponse' }
 *       '401':
 *         description: 인증 실패
 *       '404':
 *         description: 찜 항목을 찾을 수 없음
 */
