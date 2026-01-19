/**
 * @swagger
 * tags:
 *   name: Report
 *   description: 리포트/엑셀 내보내기 API
 */

/**
 * @swagger
 * /api/v1/report/admin/exportPurchaseRequests:
 *   get:
 *     summary: 구매 요청 승인/거절 리포트 엑셀 다운로드 (관리자)
 *     description: |
 *       관리자용 구매 요청 승인/거절 리포트를 XLSX로 다운로드합니다.
 *       결정일은 `updatedAt` 기준입니다.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 결정 시작 일시 (ISO 8601)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 결정 종료 일시 (ISO 8601)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [APPROVED, REJECTED]
 *         description: 결정 상태 필터 (선택)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, MANAGER, ADMIN, ALL]
 *         description: 요청자 역할 필터 (선택)
 *     responses:
 *       200:
 *         description: 엑셀 파일 스트림
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 잘못된 쿼리 파라미터
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 접근 가능)
 *       422:
 *         description: 엑셀 내보내기 한도 초과
 */
