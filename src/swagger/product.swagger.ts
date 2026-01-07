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
 *           example: 40589
 *         categoryId:
 *           type: integer
 *           example: 101
 *         name:
 *           type: string
 *           example: "알새우칩"
 *         price:
 *           type: integer
 *           example: 1800
 *         image:
 *           type: string
 *           nullable: true
 *           description: S3에 저장된 이미지 경로 (S3 object key)
 *           example: "products/1767688541756-3lb9w1fachx.jpg"
 *         link:
 *           type: string
 *           example: "https://example.com/products/http-test-b"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-06T08:35:42.077Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-06T08:35:42.077Z"
 *     ProductWithImageUrl:
 *       allOf:
 *         - $ref: '#/components/schemas/ProductBase'
 *         - type: object
 *           properties:
 *             imageUrl:
 *               type: string
 *               nullable: true
 *               description: |
 *                 S3 Presigned URL (이미지 조회용, 1시간 유효)
 *                 - 이 URL을 사용하여 브라우저에서 바로 이미지를 표시할 수 있습니다.
 *                 - 만료 시간: 생성 후 3600초 (1시간)
 *                 - 만료된 URL은 403 에러를 반환하며, API를 다시 호출하여 새 URL을 받아야 합니다.
 *               example: "https://your-bucket.s3.ap-northeast-2.amazonaws.com/products/1767688541756-3lb9w1fachx.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...&X-Amz-Date=20260106T091542Z&X-Amz-Expires=3600&X-Amz-Signature=..."
 *     ProductWithSales:
 *       allOf:
 *         - $ref: '#/components/schemas/ProductWithImageUrl'
 *         - type: object
 *           properties:
 *             salesCount:
 *               type: integer
 *               description: 승인된 구매 요청의 수량 합계 (APPROVED 상태만 집계)
 *               example: 15
 */

/**
 * @swagger
 * /api/v1/product:
 *   post:
 *     summary: 상품 등록
 *     description: |
 *       상품을 등록합니다. 생성 시 isActive는 항상 true로 저장됩니다.
 *       이미지 파일을 포함하여 multipart/form-data로 전송해야 합니다.
 *       이미지는 S3에 업로드되며, 최대 5MB, jpg/jpeg/png/gif/webp 형식만 허용됩니다.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *                 minLength: 1
 *                 maxLength: 30
 *                 example: "새우깡"
 *               price:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1800
 *               link:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "https://example.com/products/1001"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 상품 이미지 파일 (선택, 최대 5MB, jpg/jpeg/png/gif/webp)
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
 *                   example: "상품 등록이 완료되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 카테고리를 찾을 수 없음
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
 *       - **응답에 imageUrl 포함**: 각 상품마다 S3 Presigned URL이 자동으로 생성되어 반환됩니다. (1시간 유효)
 *       - salesCount 포함: 각 상품의 승인된 구매 수량 합계가 포함됩니다.
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
 *       - **응답에 imageUrl 포함**: 각 상품마다 S3 Presigned URL이 자동으로 생성되어 반환됩니다. (1시간 유효)
 *       - salesCount 포함: 각 상품의 승인된 구매 수량 합계가 포함됩니다.
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
 *     description: |
 *       상품 ID로 상품 상세 정보를 조회합니다.
 *       - isActive=false 상품은 조회되지 않습니다.
 *       - **응답에 imageUrl 포함**: S3 Presigned URL이 자동으로 생성되어 반환됩니다. (1시간 유효)
 *       - salesCount 포함: 승인된 구매 수량 합계가 포함됩니다.
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
 *         example: 40589
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
 *             examples:
 *               success:
 *                 summary: 성공 응답 예시
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 40589
 *                     categoryId: 101
 *                     name: "알새우칩"
 *                     price: 1800
 *                     image: "products/1767688541756-3lb9w1fachx.jpg"
 *                     imageUrl: "https://your-bucket.s3.ap-northeast-2.amazonaws.com/products/1767688541756-3lb9w1fachx.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...&X-Amz-Expires=3600&X-Amz-Signature=..."
 *                     link: "https://example.com/products/http-test-b"
 *                     isActive: true
 *                     salesCount: 15
 *                     createdAt: "2026-01-06T08:35:42.077Z"
 *                     updatedAt: "2026-01-06T08:35:42.077Z"
 *                   message: "상품 상세 정보를 조회했습니다."
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
 *     description: |
 *       상품 정보를 수정합니다. multipart/form-data로 전송해야 합니다.
 *       - 새 이미지 업로드: image 파일 첨부
 *       - 이미지 제거: removeImage=true 쿼리 파라미터
 *       - 이미지 유지: 파일 없이 다른 필드만 수정
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
 *       - in: query
 *         name: removeImage
 *         required: false
 *         schema:
 *           type: boolean
 *         description: true로 설정 시 기존 이미지 삭제
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 101
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 30
 *                 example: "새우깡_수정본"
 *               price:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1900
 *               link:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "https://example.com/products/1001"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 새 상품 이미지 파일 (선택, 최대 5MB, jpg/jpeg/png/gif/webp)
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
 *                   example: "상품이 수정되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (MANAGER 이상 필요)
 *       404:
 *         description: 상품 또는 카테고리를 찾을 수 없음
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
 *                   example: "상품이 삭제되었습니다."
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (MANAGER 이상 필요)
 *       404:
 *         description: 상품을 찾을 수 없음
 */
