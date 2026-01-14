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
 *     description: |
 *       상품을 찜 목록에 추가합니다.
 *
 *       **주요 기능:**
 *       - 같은 회사의 상품만 찜 가능 (테넌트 격리)
 *       - 회사에 소속된 사용자만 이용 가능
 *       - 활성화된 상품만 찜 가능
 *       - 중복 찜 시 기존 찜 정보 반환
 *
 *       **보안 검증:**
 *       - 사용자 활성화 상태 확인
 *       - 사용자의 companyId 확인
 *       - 상품의 companyId와 일치 여부 확인
 *       - 다른 회사의 상품 접근 차단
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
 *         description: 잘못된 요청 (비활성화된 상품)
 *       '401':
 *         description: 인증 실패 또는 비활성화된 계정
 *       '403':
 *         description: 권한 없음 (회사 미소속 사용자, 다른 회사 상품)
 *       '404':
 *         description: 상품을 찾을 수 없음
 */

/**
 * @openapi
 * /api/v1/wishlist/my:
 *   get:
 *     summary: 내 찜 목록 조회
 *     description: |
 *       내가 찜한 상품 목록을 조회합니다.
 *
 *       **제공 정보:**
 *       - 찜 목록 (페이지네이션)
 *       - 각 상품의 상세 정보
 *       - 찜 등록 시간
 *       - 페이지네이션 정보
 *
 *       **보안 검증:**
 *       - 사용자 활성화 상태 확인
 *       - 본인의 찜 목록만 조회 가능
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
 *         description: 인증 실패 또는 비활성화된 계정
 */

/**
 * @openapi
 * /api/v1/wishlist/{id}:
 *   delete:
 *     summary: 찜 해제
 *     description: |
 *       찜 목록에서 상품을 제거합니다.
 *
 *       **특징:**
 *       - 본인의 찜 목록에서만 삭제 가능
 *       - 삭제된 상품 ID를 응답으로 반환
 *       - 삭제 후 복구 불가능
 *
 *       **보안 검증:**
 *       - 사용자 활성화 상태 확인
 *       - 본인의 찜 항목인지 확인
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
 *         description: 인증 실패 또는 비활성화된 계정
 *       '404':
 *         description: 찜 항목을 찾을 수 없음
 */
