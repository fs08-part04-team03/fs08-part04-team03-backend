/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: 장바구니 관리 API
 */

/**
 * @swagger
 * /api/v1/cart/addToCart:
 *   post:
 *     summary: 장바구니에 상품 추가
 *     description: |
 *       장바구니에 상품을 추가합니다.
 *
 *       **주요 기능:**
 *       - 새로운 상품을 장바구니에 추가
 *       - 이미 있는 상품은 수량 증가 (중복 처리)
 *       - 같은 회사의 상품만 추가 가능 (테넌트 격리)
 *       - 비활성화된 상품은 추가 불가
 *       - 회사에 소속되지 않은 사용자는 이용 불가
 *
 *       **보안 검증:**
 *       - 사용자의 companyId 확인
 *       - 상품의 companyId와 일치 여부 확인
 *       - 다른 회사의 상품 접근 차단
 *
 *       **응답에 포함된 isNew 플래그:**
 *       - `true`: 새로 추가된 상품 → "장바구니에 상품이 추가되었습니다."
 *       - `false`: 기존 상품의 수량 증가 → "장바구니 상품의 수량이 증가했습니다."
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *                 minimum: 1
 *                 description: 상품 ID
 *                 example: 222
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: 수량
 *                 example: 6
 *     responses:
 *       201:
 *         description: 장바구니에 상품 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 장바구니 항목 ID (UUID)
 *                       example: "019b3014-7162-7b01-84a2-b97bac03005b"
 *                     quantity:
 *                       type: integer
 *                       description: 수량
 *                       example: 6
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-18T06:20:49.080Z"
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 222
 *                         name:
 *                           type: string
 *                           example: "농심 새우깡"
 *                         price:
 *                           type: integer
 *                           example: 1800
                         image:
                           type: string
                           nullable: true
                           example: "01_농심_새우깡.png"
                           description: S3 키
                         imageUrl:
                           type: string
                           nullable: true
                           example: "https://bucket.s3.amazonaws.com/products/abc123.jpg?X-Amz-..."
                           description: S3 Presigned URL
                         link:
 *                           type: string
 *                           example: "https://example.com/products/1001"
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                     subtotal:
 *                       type: integer
 *                       description: 소계 (가격 × 수량)
 *                       example: 10800
 *                     isNew:
 *                       type: boolean
 *                       description: 새로 추가된 항목 여부
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "장바구니 상품의 수량이 증가했습니다."
 *       400:
 *         description: 잘못된 요청 (비활성화된 상품, 다른 회사 상품)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 상품을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/cart/getMyCart:
 *   get:
 *     summary: 내 장바구니 조회
 *     description: |
 *       내 장바구니 목록을 조회합니다.
 *       **제공 정보:**
 *       - 장바구니 아이템 목록 (페이지네이션)
 *       - 각 상품의 상세 정보
 *       - 각 아이템별 소계 (가격 × 수량)
 *       - 현재 페이지 총 금액
 *       - 전체 장바구니 총 금액
 *       - 페이지네이션 정보
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 장바구니 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "019b3014-7162-7b01-84a2-b97bac03005b"
 *                       quantity:
 *                         type: integer
 *                         example: 6
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-12-18T06:20:49.080Z"
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 222
 *                           name:
 *                             type: string
 *                             example: "농심 새우깡"
 *                           price:
 *                             type: integer
 *                             example: 1800
 *                           image:
 *                             type: string
 *                             nullable: true
 *                             example: "01_농심_새우깡.png"
 *                           link:
 *                             type: string
 *                             example: "https://example.com/products/1001"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-17T04:10:16.167Z"
 *                       subtotal:
 *                         type: integer
 *                         description: 소계 (가격 × 수량)
 *                         example: 10800
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       description: 전체 아이템 수
 *                       example: 3
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "내 장바구니 조회에 성공했습니다."
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       description: 전체 아이템 개수
 *                       example: 3
 *                     currentPageItemCount:
 *                       type: integer
 *                       description: 현재 페이지 아이템 개수
 *                       example: 3
 *                     currentPageTotalPrice:
 *                       type: integer
 *                       description: 현재 페이지의 총 금액
 *                       example: 19800
 *                     totalPrice:
 *                       type: integer
 *                       description: 전체 장바구니 총 금액
 *                       example: 19800
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/v1/cart/updateQuantity:
 *   patch:
 *     summary: 장바구니 상품 수량 수정
 *     description: |
 *       장바구니에 있는 상품의 수량을 변경합니다.
 *       **특징:**
 *       - 본인의 장바구니 항목만 수정 가능
 *       - 수량은 1 이상이어야 함
 *       - 수정된 항목의 정보를 응답으로 반환
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItemId
 *               - quantity
 *             properties:
 *               cartItemId:
 *                 type: string
 *                 description: 장바구니 항목 ID (UUID)
 *                 example: "019b3014-7162-7b01-84a2-b97bac03005b"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: 변경할 수량
 *                 example: 5
 *     responses:
 *       200:
 *         description: 수량 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "019b3014-7162-7b01-84a2-b97bac03005b"
 *                     quantity:
 *                       type: integer
 *                       example: 5
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-18T06:22:44.715Z"
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 222
 *                         name:
 *                           type: string
 *                           example: "농심 새우깡"
 *                         price:
 *                           type: integer
 *                           example: 1800
 *                         image:
 *                           type: string
 *                           nullable: true
 *                           example: "01_농심_새우깡.png"
 *                           description: S3 키
 *                         imageUrl:
 *                           type: string
 *                           nullable: true
 *                           example: "https://bucket.s3.amazonaws.com/products/abc123.jpg?X-Amz-..."
 *                           description: S3 Presigned URL
 *                         link:
 *                           type: string
 *                           example: "https://example.com/products/1001"
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                     subtotal:
 *                       type: integer
 *                       description: 소계 (가격 × 수량)
 *                       example: 9000
 *                 message:
 *                   type: string
 *                   example: "장바구니 상품 수량이 수정되었습니다."
 *       400:
 *         description: 잘못된 요청 (다른 사용자의 장바구니 항목, 유효하지 않은 수량)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 장바구니 항목을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/cart/deleteFromCart:
 *   delete:
 *     summary: 장바구니에서 상품 삭제
 *     description: |
 *       장바구니에서 특정 상품을 완전히 삭제합니다.
 *       **특징:**
 *       - 본인의 장바구니 항목만 삭제 가능
 *       - 삭제된 항목의 ID를 응답으로 반환
 *       - 삭제 후 복구 불가능
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItemId
 *             properties:
 *               cartItemId:
 *                 type: string
 *                 description: 장바구니 항목 ID (UUID)
 *                 example: "019b3014-7162-7b01-84a2-b97bac03005b"
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 삭제된 항목 ID
 *                       example: "019b3014-7162-7b01-84a2-b97bac03005b"
 *                 message:
 *                   type: string
 *                   example: "장바구니에서 상품이 삭제되었습니다."
 *       400:
 *         description: 잘못된 요청 (다른 사용자의 장바구니 항목)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 장바구니 항목을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/cart/deleteMultiple:
 *   delete:
 *     summary: 장바구니에서 여러 상품 삭제
 *     description: |
 *       장바구니에서 여러 상품을 한 번에 삭제합니다.
 *       **특징:**
 *       - 본인의 장바구니 항목만 삭제 가능
 *       - 최소 1개 이상의 항목을 선택해야 함
 *       - 삭제된 항목 수와 ID 목록을 응답으로 반환
 *       - 트랜잭션으로 처리되어 전체 성공 또는 전체 실패
 *       - 일부 항목이라도 권한이 없거나 존재하지 않으면 전체 실패
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItemIds
 *             properties:
 *               cartItemIds:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 description: 장바구니 항목 ID 배열 (UUID)
 *                 example: ["019b3014-7162-7b01-84a2-b97bac03005b", "019b2a80-65bc-7590-99c8-f40e99a984bb"]
 *     responses:
 *       200:
 *         description: 다중 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       description: 삭제된 항목 수
 *                       example: 2
 *                     deletedIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 삭제된 항목 ID 목록
 *                       example: ["019b3014-7162-7b01-84a2-b97bac03005b", "019b2a80-65bc-7590-99c8-f40e99a984bb"]
 *                 message:
 *                   type: string
 *                   example: "2개의 상품이 장바구니에서 삭제되었습니다."
 *       400:
 *         description: 잘못된 요청 (빈 배열, 다른 사용자의 항목, 일부 항목 없음)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 일부 장바구니 항목을 찾을 수 없음
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
