/**
 * @swagger
 * tags:
 *   name: Purchase
 *   description: 구매 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 구매 항목 ID
 *         quantity:
 *           type: integer
 *           description: 수량
 *         priceSnapshot:
 *           type: number
 *           description: 구매 시점 가격
 *         products:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: 상품 ID
 *             name:
 *               type: string
 *               description: 상품명
 *             image:
 *               type: string
 *               description: 상품 이미지 URL
 *             link:
 *               type: string
 *               description: 상품 링크
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 사용자 ID
 *         name:
 *           type: string
 *           description: 사용자 이름
 *         email:
 *           type: string
 *           description: 사용자 이메일
 *
 *     PurchaseRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 구매 요청 ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 요청일
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 승인/반려일
 *         totalPrice:
 *           type: number
 *           description: 총 가격
 *         shippingFee:
 *           type: number
 *           description: 배송비
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *           description: 구매 요청 상태
 *         requestMessage:
 *           type: string
 *           description: 요청 메시지
 *         rejectReason:
 *           type: string
 *           description: 반려 사유
 *         purchaseItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseItem'
 *         requester:
 *           $ref: '#/components/schemas/User'
 *         approver:
 *           $ref: '#/components/schemas/User'
 *
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: integer
 *           description: 현재 페이지
 *         totalPages:
 *           type: integer
 *           description: 전체 페이지 수
 *         totalItems:
 *           type: integer
 *           description: 전체 항목 수
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
 *     ExpenseStatistics:
 *       type: object
 *       properties:
 *         expenses:
 *           type: object
 *           properties:
 *             thisMonth:
 *               type: number
 *               description: 이번달 지출액
 *             lastMonth:
 *               type: number
 *               description: 지난달 지출액
 *             thisYear:
 *               type: number
 *               description: 올해 총 지출액
 *             lastYear:
 *               type: number
 *               description: 지난해 지출액
 *         budget:
 *           type: object
 *           properties:
 *             thisMonthBudget:
 *               type: number
 *               nullable: true
 *               description: 이번달 예산
 *             remainingBudget:
 *               type: number
 *               nullable: true
 *               description: 남은 예산
 */

/**
 * @swagger
 * /api/v1/purchase/admin/getAllPurchases:
 *   get:
 *     summary: 전체 구매 내역 목록 조회 (관리자)
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, totalPrice]
 *           default: createdAt
 *         description: 정렬 기준
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 정렬 순서
 *     responses:
 *       200:
 *         description: 전체 구매 내역 목록 조회 성공
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
 *                     $ref: '#/components/schemas/PurchaseRequest'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "조회 성공"
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 */

/**
 * @swagger
 * /api/v1/purchase/admin/purchaseNow:
 *   post:
 *     summary: 즉시 구매 (관리자)
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingFee
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: 상품 ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: 수량
 *               shippingFee:
 *                 type: number
 *                 minimum: 0
 *                 description: 배송비
 *     responses:
 *       201:
 *         description: 즉시 구매 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseRequest'
 *                 message:
 *                   type: string
 *                   example: "즉시 구매가 완료되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 */

/**
 * @swagger
 * /api/v1/purchase/user/getMyPurchases:
 *   get:
 *     summary: 내 구매 내역 조회
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, totalPrice]
 *           default: createdAt
 *         description: 정렬 기준
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 정렬 순서
 *     responses:
 *       200:
 *         description: 내 구매 내역 조회 성공
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
 *                     $ref: '#/components/schemas/PurchaseRequest'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "조회 성공"
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/v1/purchase/user/getMyPurchaseDetail/{purchaseRequestId}:
 *   get:
 *     summary: 내 구매 상세 조회
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: 구매 요청 ID
 *     responses:
 *       200:
 *         description: 구매 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseRequest'
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 구매 요청을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/purchase/admin/getPurchaseRequestDetail/{purchaseRequestId}:
 *   get:
 *     summary: 구매 요청 상세 조회 (관리자)
 *     description: |
 *       관리자가 모든 구매 요청의 상세 내역을 조회할 수 있습니다.
 *
 *       ### 조회 가능한 정보
 *       - 구매 요청 기본 정보 (ID, 요청일, 승인/반려일, 승인일, 상품 금액, 배송비, 최종 금액, 상태)
 *       - 요청 메시지 및 반려 사유
 *       - 구매 항목 목록 (상품명, 수량, 가격 스냅샷, 항목 소계, 이미지, 링크)
 *       - 요청인 정보 (이름, 이메일)
 *       - 승인자/반려자 정보 (이름, 이메일)
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseRequestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 구매 요청 ID
 *     responses:
 *       200:
 *         description: 구매 요청 상세 조회 성공
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
 *                       format: uuid
 *                       description: 구매 요청 ID
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: 요청일
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: 수정일
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: 승인일 (APPROVED 상태일 때만)
 *                     itemsTotalPrice:
 *                       type: number
 *                       description: 상품 금액 합계 (배송비 제외)
 *                     shippingFee:
 *                       type: number
 *                       description: 배송비
 *                     finalTotalPrice:
 *                       type: number
 *                       description: 최종 금액 (상품 + 배송비)
 *                     status:
 *                       type: string
 *                       enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *                       description: 구매 요청 상태
 *                     requestMessage:
 *                       type: string
 *                       nullable: true
 *                       description: 요청 메시지
 *                     rejectReason:
 *                       type: string
 *                       nullable: true
 *                       description: 반려 사유
 *                     purchaseItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 구매 항목 ID
 *                           quantity:
 *                             type: integer
 *                             description: 수량
 *                           priceSnapshot:
 *                             type: number
 *                             description: 구매 시점 가격
 *                           itemTotal:
 *                             type: number
 *                             description: 항목 소계 (수량 × 단가)
 *                           products:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 description: 상품 ID
 *                               name:
 *                                 type: string
 *                                 description: 상품명
 *                               image:
 *                                 type: string
 *                                 description: 상품 이미지 URL
 *                               link:
 *                                 type: string
 *                                 description: 상품 링크
 *                     requester:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: 요청자 ID
 *                         name:
 *                           type: string
 *                           description: 요청자 이름
 *                         email:
 *                           type: string
 *                           description: 요청자 이메일
 *                     approver:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: 승인자 ID
 *                         name:
 *                           type: string
 *                           description: 승인자 이름
 *                         email:
 *                           type: string
 *                           description: 승인자 이메일
 *                 message:
 *                   type: string
 *                   example: "구매 요청 상세 내역을 조회했습니다."
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 *       404:
 *         description: 구매 요청을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "구매 요청을 찾을 수 없습니다."
 */

/**
 * @swagger
 * /api/v1/purchase/admin/managePurchaseRequests:
 *   get:
 *     summary: 구매 요청 목록 조회 (관리자)
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: 구매 요청 상태 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, totalPrice]
 *           default: createdAt
 *         description: 정렬 기준
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 정렬 순서
 *     responses:
 *       200:
 *         description: 구매 요청 목록 조회 성공
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
 *                     $ref: '#/components/schemas/PurchaseRequest'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "조회 성공"
 *       400:
 *         description: 잘못된 요청 (유효하지 않은 상태 값)
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 */

/**
 * @swagger
 * /api/v1/purchase/admin/approvePurchaseRequest/{purchaseRequestId}:
 *   patch:
 *     summary: 구매 요청 승인 (관리자)
 *     description: |
 *       PENDING 상태의 구매 요청을 승인합니다.
 *
 *       ### 동작 방식
 *       - 구매 요청의 상태를 APPROVED로 변경합니다.
 *       - 승인자(approver) 정보가 자동으로 기록됩니다.
 *       - 동시성 제어를 통해 중복 승인을 방지합니다.
 *
 *       ### 승인 조건
 *       - 구매 요청이 존재해야 합니다.
 *       - 구매 요청의 상태가 PENDING이어야 합니다.
 *       - 당월 회사 예산이 요청 금액(totalPrice + shippingFee) 이상이어야 합니다.
 *       - 요청한 사용자가 관리자(MANAGER) 권한을 가지고 있어야 합니다.
 *
 *       ### 승인 후 변경사항
 *       - `status`: PENDING → APPROVED
 *       - `approver`: 승인한 관리자 정보가 설정됩니다.
 *       - `updatedAt`: 승인 시간으로 자동 업데이트됩니다.
 *       - `budget`: 당월 회사 예산에서 요청 금액(totalPrice + shippingFee)만큼 차감됩니다.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: 구매 요청 ID
 *     responses:
 *       200:
 *         description: 구매 요청 승인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseRequest'
 *                   description: 승인된 구매 요청 (approver 필드 포함)
 *                 message:
 *                   type: string
 *                   example: "구매 요청을 승인했습니다."
 *       400:
 *         description: |
 *           잘못된 요청
 *           - 이미 처리된 구매 요청 (APPROVED, REJECTED, CANCELLED 상태)
 *           - 예산 미설정 (당월 예산이 설정되지 않은 경우)
 *           - 예산 초과 (당월 예산이 요청 금액보다 부족한 경우)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "이미 처리된 구매 요청입니다."
 *             examples:
 *               alreadyProcessed:
 *                 summary: 이미 처리된 구매 요청
 *                 value:
 *                   success: false
 *                   message: "이미 처리된 구매 요청입니다."
 *               budgetNotFound:
 *                 summary: 예산 미설정
 *                 value:
 *                   success: false
 *                   message: "이번 달 예산을 찾을 수 없습니다."
 *               budgetExceeded:
 *                 summary: 예산 초과
 *                 value:
 *                   success: false
 *                   message: "예산이 부족하여 구매 요청을 승인할 수 없습니다."
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 *       404:
 *         description: 구매 요청을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "구매 요청을 찾을 수 없습니다."
 */

/**
 * @swagger
 * /api/v1/purchase/admin/rejectPurchaseRequest/{purchaseRequestId}:
 *   patch:
 *     summary: 구매 요청 반려 (관리자)
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: 구매 요청 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 반려 사유
 *     responses:
 *       200:
 *         description: 구매 요청 반려 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseRequest'
 *                 message:
 *                   type: string
 *       400:
 *         description: 이미 처리된 구매 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 *       404:
 *         description: 구매 요청을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/purchase/user/requestPurchase:
 *   post:
 *     summary: 구매 요청
 *     description: 장바구니에 있는 상품으로 구매 요청을 생성합니다. 요청 성공 시 해당 상품은 장바구니에서 삭제됩니다.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingFee
 *             properties:
 *               items:
 *                 type: array
 *                 description: 구매할 상품 목록 (장바구니에 있어야 함)
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: 상품 ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: 수량 (장바구니의 수량과 일치해야 함)
 *               shippingFee:
 *                 type: number
 *                 minimum: 0
 *                 description: 배송비
 *               requestMessage:
 *                 type: string
 *                 description: 요청 메시지 (선택사항)
 *     responses:
 *       201:
 *         description: 구매 요청 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseRequest'
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 (장바구니에 상품이 없거나 수량 불일치)
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/v1/purchase/user/urgentRequestPurchase:
 *   post:
 *     summary: 긴급 구매 요청 (예산 체크 우회)
 *     description: |
 *       **예산 확인 없이 긴급하게 구매 요청을 생성합니다.**
 *       ### 🚨 중요 특징
 *       - **예산 우회 (의도적 설계)**:
 *         - 일반 구매 요청(`/user/requestPurchase`)과 달리 `checkBudget` 미들웨어를 거치지 않습니다.
 *         - 긴급 상황(예: 시스템 장애, 긴급 업무 필요, 예기치 않은 비즈니스 기회)에서 빠른 구매 처리를 위해 **의도적으로 설계**되었습니다.
 *         - 라우터에서 `checkBudget` 미들웨어를 제외하여 예산 검증을 우회합니다.
 *       - **장바구니 기반**:
 *         - 장바구니에 있는 상품으로만 구매 요청이 가능합니다.
 *         - 요청 성공 시 해당 상품은 장바구니에서 자동 삭제됩니다.
 *       ### ⚠️ 남용 방지 메커니즘
 *       **1. 승인 프로세스**
 *       - 긴급 구매 요청도 관리자(`MANAGER`)의 승인이 필요합니다.
 *       - 관리자는 긴급 요청의 타당성을 검토하고 반려할 수 있습니다.
 *       **2. 감사 로그 (모니터링)**
 *       - 모든 긴급 구매 요청은 시스템 로그에 자동 기록됩니다.
 *       - 로그 정보: 요청자, 요청일시, 상품 목록, 총 금액, 요청 사유
 *       - 관리자는 `/admin/managePurchaseRequests`에서 모든 긴급 구매를 조회 및 모니터링할 수 있습니다.
 *       **3. 요청 사유 기록**
 *       - `requestMessage`를 통해 긴급 구매의 사유를 명확히 기록하는 것을 **강력히 권장**합니다.
 *       - 예시: "서버 장애로 인한 긴급 하드웨어 교체", "중요 고객 미팅을 위한 긴급 물품 구매"
 *       **4. 정기 검토**
 *       - 긴급 구매 내역을 정기적으로 검토하여 남용 패턴을 식별할 수 있습니다.
 *       - 지출 통계(`/admin/expenseStatistics`)에서 긴급 구매 비율을 모니터링합니다.
 *       ### ✅ 자동화된 테스트 검증
 *       다음 사항이 자동화된 테스트를 통해 검증됩니다:
 *       1. **일반 구매 요청**: `checkBudget` 미들웨어가 적용되어 예산 검증이 수행됨
 *       2. **긴급 구매 요청**: `checkBudget` 미들웨어가 적용되지 않아 예산 우회됨
 *       3. **공통 검증**: 두 엔드포인트 모두 동일한 인증(`verifyAccessToken`) 및 권한(`requireMinRole('USER')`) 검증을 거침
 *       4. **장바구니 검증**: 두 엔드포인트 모두 장바구니에 있는 상품만 구매 요청 가능
 *       ### 📊 사용 시나리오
 *       - ✅ **적절한 사용**: 서버 장애로 인한 긴급 하드웨어 교체, 예기치 않은 중요 고객 미팅
 *       - ❌ **부적절한 사용**: 일상적인 구매, 단순 편의를 위한 예산 우회
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingFee
 *             properties:
 *               items:
 *                 type: array
 *                 description: 구매할 상품 목록 (장바구니에 있어야 함)
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: 상품 ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: 수량 (장바구니의 수량과 일치해야 함)
 *               shippingFee:
 *                 type: number
 *                 minimum: 0
 *                 description: 배송비
 *               requestMessage:
 *                 type: string
 *                 description: |
 *                   긴급 요청 사유 (강력 권장)
 *                   예시:
 *                   - "서버 장애로 인한 긴급 하드웨어 교체 필요"
 *                   - "중요 고객 미팅을 위한 긴급 물품 구매"
 *                   - "예기치 않은 시스템 다운타임 방지를 위한 긴급 구매"
 *     responses:
 *       201:
 *         description: 긴급 구매 요청 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseRequest'
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 (장바구니에 상품이 없거나 수량 불일치)
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/v1/purchase/user/cancelPurchaseRequest/{purchaseRequestId}:
 *   patch:
 *     summary: 구매 요청 취소
 *     description: 대기 중인 구매 요청을 취소합니다. PENDING 상태의 요청만 취소 가능합니다.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: 구매 요청 ID
 *     responses:
 *       200:
 *         description: 구매 요청 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseRequest'
 *                 message:
 *                   type: string
 *       400:
 *         description: 대기 중인 구매 요청이 아님 (이미 처리됨)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 구매 요청을 찾을 수 없음
 */

/**
 * @swagger
 * /api/v1/purchase/admin/expenseStatistics:
 *   get:
 *     summary: 지출 통계 조회 (관리자)
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 지출 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExpenseStatistics'
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 */

/**
 * @swagger
 * /api/v1/purchase/admin/purchaseDashboard:
 *   get:
 *     summary: 구매 관리 대시보드 (관리자)
 *     description: 조직 전체 지출액/예산 조회 및 통계 정보를 제공합니다.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 데이터 조회 성공
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
 *                     expenses:
 *                       type: object
 *                       properties:
 *                         thisMonth:
 *                           type: number
 *                           description: 이번달 지출액
 *                         lastMonth:
 *                           type: number
 *                           description: 지난달 지출액
 *                         thisYear:
 *                           type: number
 *                           description: 올해 총 지출액
 *                         lastYear:
 *                           type: number
 *                           description: 지난해 지출액
 *                         total:
 *                           type: number
 *                           description: 총 지출액 (전체 기간)
 *                     budget:
 *                       type: object
 *                       properties:
 *                         thisMonthBudget:
 *                           type: number
 *                           nullable: true
 *                           description: 이번달 예산
 *                         remainingBudget:
 *                           type: number
 *                           nullable: true
 *                           description: 남은 예산
 *                     newUsers:
 *                       type: array
 *                       description: 이번달 신규 가입 회원 리스트
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: 사용자 ID
 *                           name:
 *                             type: string
 *                             description: 사용자 이름
 *                           email:
 *                             type: string
 *                             description: 사용자 이메일
 *                           role:
 *                             type: string
 *                             enum: [USER, MANAGER, ADMIN]
 *                             description: 사용자 권한
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: 가입일
 *                     userChanges:
 *                       type: array
 *                       description: 이번달 탈퇴/권한 변경 회원 리스트 (최근 50개)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: 이력 ID
 *                           tableName:
 *                             type: string
 *                             description: 테이블명
 *                           tableId:
 *                             type: string
 *                             description: 테이블 레코드 ID
 *                           operationType:
 *                             type: string
 *                             enum: [INSERT, UPDATE, DELETE]
 *                             description: 작업 유형
 *                           data:
 *                             type: object
 *                             description: 변경 데이터
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: 변경일시
 *                     snacksList:
 *                       type: array
 *                       description: 이번달 요청한 간식 순위 (구매 빈도순)
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                             description: 순위
 *                           name:
 *                             type: string
 *                             description: 상품명
 *                           price:
 *                             type: number
 *                             description: 가격 (요청 시점 스냅샷)
 *                           totalQuantity:
 *                             type: integer
 *                             description: 총 구매 수량
 *                           purchaseCount:
 *                             type: integer
 *                             description: 구매 횟수
 *                     monthlyExpenses:
 *                       type: array
 *                       description: 최근 12개월 지출 내역
 *                       items:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                             description: 연도
 *                           month:
 *                             type: integer
 *                             description: 월
 *                           totalExpenses:
 *                             type: number
 *                             description: 해당 월 총 지출액
 *                 message:
 *                   type: string
 *                   example: "구매 관리 대시보드 정보를 조회했습니다."
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
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
