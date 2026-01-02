/**
 * @swagger
 * tags:
 *   name: Product
 *   description: 상품 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductBase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 222
 *         categoryId:
 *           type: integer
 *           example: 101
 *         name:
 *           type: string
 *           example: "농심 새우깡"
 *         price:
 *           type: integer
 *           example: 1800
 *         image:
 *           type: string
 *           nullable: true
 *           example: "01_농심_새우깡.png"
 *         link:
 *           type: string
 *           example: "https://example.com/products/1001"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-18T06:20:49.080Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-18T06:20:49.080Z"
 *     ProductWithSales:
 *       allOf:
 *         - $ref: '#/components/schemas/ProductBase'
 *         - type: object
 *           properties:
 *             salesCount:
 *               type: integer
 *               description: 승인된 구매 수량 합계
 *               example: 12
 */

/**
 * @swagger
 * /api/v1/product:
 *   post:
 *     summary: 상품 등록
 *     description: 상품을 등록합니다. 생성 시 isActive는 항상 true로 저장됩니다.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - name
 *               - price
 *               - link
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 101
 *               name:
 *                 type: string
 *                 example: "새우깡"
 *               price:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1800
 *               image:
 *                 type: string
 *                 nullable: true
 *                 example: "01_농심_새우깡.png"
 *               link:
 *                 type: string
 *                 example: "https://example.com/products/1001"
 *     responses:
 *       201:
 *         description: 상품 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductBase'
 *                 message:
 *                   type: string
 *                   example: "Product created."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/v1/product:
 *   get:
 *     summary: 상품 목록 조회
 *     description: |
 *       상품 목록을 조회합니다.
 *       - categoryId로 카테고리 필터링
 *       - sort로 정렬 (latest, sales, priceAsc, priceDesc)
 *       - isActive=false 상품은 목록에서 제외됩니다.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, sales, priceAsc, priceDesc]
 *           default: latest
 *     responses:
 *       200:
 *         description: 상품 목록 조회 성공
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
 *                     $ref: '#/components/schemas/ProductWithSales'
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
 *                       example: 120
 *                     totalPages:
 *                       type: integer
 *                       example: 12
 *                 message:
 *                   type: string
 *                   example: "상품 목록을 조회했습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/v1/product/my:
 *   get:
 *     summary: 내가 등록한 상품 목록 조회
 *     description: |
 *       내가 등록한 상품만 조회합니다.
 *       - categoryId로 카테고리 필터링
 *       - sort로 정렬 (latest, sales, priceAsc, priceDesc)
 *       - isActive=false 상품은 목록에서 제외됩니다.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, sales, priceAsc, priceDesc]
 *           default: latest
 *     responses:
 *       200:
 *         description: 내가 등록한 상품 목록 조회 성공
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
 *                     $ref: '#/components/schemas/ProductWithSales'
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
 *                       example: 120
 *                     totalPages:
 *                       type: integer
 *                       example: 12
 *                 message:
 *                   type: string
 *                   example: "내가 등록한 상품 목록을 조회했습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/v1/product/{id}:
 *   get:
 *     summary: 상품 상세 조회
 *     description: isActive=false 상품은 조회되지 않습니다.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: 상품 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductWithSales'
 *                 message:
 *                   type: string
 *                   example: "상품 상세 정보를 조회했습니다."
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 상품을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/product/{id}:
 *   patch:
 *     summary: 상품 수정 (MANAGER 이상)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 101
 *               name:
 *                 type: string
 *                 example: "새우깡_수정본"
 *               price:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1900
 *               image:
 *                 type: string
 *                 nullable: true
 *                 example: "01_농심_새우깡_v2.png"
 *               link:
 *                 type: string
 *                 example: "https://example.com/products/1001"
 *     responses:
 *       200:
 *         description: 상품 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductBase'
 *                 message:
 *                   type: string
 *                   example: "Product updated."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 상품을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/product/{id}:
 *   delete:
 *     summary: 상품 삭제 (MANAGER 이상)
 *     description: 상품을 논리 삭제(isActive=false) 처리합니다.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: 상품 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductBase'
 *                 message:
 *                   type: string
 *                   example: "Product deleted."
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 상품을 찾을 수 없음
 */
