/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: 장바구니 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 상품 ID
 *         name:
 *           type: string
 *           description: 상품명
 *         price:
 *           type: integer
 *           description: 상품 가격
 *         image:
 *           type: string
 *           nullable: true
 *           description: 상품 이미지 URL
 *         link:
 *           type: string
 *           description: 상품 링크
 *         isActive:
 *           type: boolean
 *           description: 상품 활성화 상태
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 상품 생성일
 *
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 장바구니 항목 ID (UUID)
 *         quantity:
 *           type: integer
 *           description: 수량
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 최종 수정일
 *         product:
 *           $ref: '#/components/schemas/CartProduct'
 *         subtotal:
 *           type: integer
 *           description: 소계 (가격 × 수량)
 *
 *     CartItemWithFlag:
 *       allOf:
 *         - $ref: '#/components/schemas/CartItem'
 *         - type: object
 *           properties:
 *             isNew:
 *               type: boolean
 *               description: 새로 추가된 항목인지 여부 (false인 경우 수량 증가)
 *
 *     CartSummary:
 *       type: object
 *       properties:
 *         totalItems:
 *           type: integer
 *           description: 전체 아이템 개수
 *         currentPageItemCount:
 *           type: integer
 *           description: 현재 페이지 아이템 개수
 *         currentPageTotalPrice:
 *           type: integer
 *           description: 현재 페이지의 총 금액
 *         totalPrice:
 *           type: integer
 *           description: 전체 장바구니 총 금액
 *
 *     CartPagination:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: integer
 *           description: 현재 페이지
 *         totalPages:
 *           type: integer
 *           description: 전체 페이지 수
 *         itemsPerPage:
 *           type: integer
 *           description: 페이지당 항목 수
 *         hasNextPage:
 *           type: boolean
 *           description: 다음 페이지 존재 여부
 *         hasPreviousPage:
 *           type: boolean
 *           description: 이전 페이지 존재 여부
 *
 *     CartResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         summary:
 *           $ref: '#/components/schemas/CartSummary'
 *         pagination:
 *           $ref: '#/components/schemas/CartPagination'
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
 *       - 같은 회사의 상품만 추가 가능
 *       - 비활성화된 상품은 추가 불가
 *
 *       **응답에 포함된 isNew 플래그:**
 *       - `true`: 새로 추가된 상품
 *       - `false`: 기존 상품의 수량이 증가됨
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
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: 수량
 *                 example: 2
 *     responses:
 *       201:
 *         description: 장바구니에 상품 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "장바구니에 상품이 추가되었습니다."
 *                 result:
 *                   $ref: '#/components/schemas/CartItemWithFlag'
 *       400:
 *         description: 잘못된 요청 (비활성화된 상품, 다른 회사 상품)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 상품을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/cart/getMycart:
 *   get:
 *     summary: 내 장바구니 조회
 *     description: |
 *       내 장바구니 목록을 조회합니다.
 *
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
 *                 result:
 *                   $ref: '#/components/schemas/CartResponse'
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
 *
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
 *                 example: "abc12345-uuid"
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
 *                 message:
 *                   type: string
 *                   example: "장바구니 상품 수량이 수정되었습니다."
 *                 result:
 *                   $ref: '#/components/schemas/CartItem'
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
 *
 *       **특징:**
 *       - 본인의 장바구니 항목만 삭제 가능
 *       - 삭제된 항목의 정보를 응답으로 반환
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
 *                 example: "abc12345-uuid"
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "장바구니에서 상품이 삭제되었습니다:"
 *                 returnData:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 삭제된 항목 ID
 *                     productId:
 *                       type: integer
 *                       description: 상품 ID
 *                     quantity:
 *                       type: integer
 *                       description: 삭제 시점의 수량
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: 최종 수정일
 *       400:
 *         description: 잘못된 요청 (다른 사용자의 장바구니 항목)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 장바구니 항목을 찾을 수 없음
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
