/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: 이미지 업로드 및 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadedFileInfo:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: S3에 저장된 파일 키
 *           example: "products/1234567890-abc123.jpg"
 *         url:
 *           type: string
 *           description: 파일의 공개 URL
 *           example: "https://bucket-name.s3.ap-northeast-2.amazonaws.com/products/1234567890-abc123.jpg"
 *         signedUrl:
 *           type: string
 *           description: Presigned URL (임시 접근 URL, 1시간 유효)
 *           example: "https://bucket-name.s3.ap-northeast-2.amazonaws.com/products/1234567890-abc123.jpg?X-Amz-Algorithm=..."
 *         expiresIn:
 *           type: integer
 *           description: Presigned URL 만료 시간 (초)
 *           example: 3600
 *         originalName:
 *           type: string
 *           description: 원본 파일명
 *           example: "product-image.jpg"
 *         size:
 *           type: integer
 *           description: 파일 크기 (bytes)
 *           example: 1048576
 *         mimeType:
 *           type: string
 *           description: MIME 타입
 *           example: "image/jpeg"
 *
 *     ImageUrlResponse:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: S3 객체 키
 *           example: "products/1234567890-abc123.jpg"
 *         url:
 *           type: string
 *           description: Signed URL (1시간 유효)
 *           example: "https://bucket-name.s3.ap-northeast-2.amazonaws.com/products/1234567890-abc123.jpg?X-Amz-Algorithm=..."
 *         expiresIn:
 *           type: integer
 *           description: URL 만료 시간 (초)
 *           example: 3600
 */

/**
 * @swagger
 * /api/v1/upload/image:
 *   post:
 *     summary: 단일 이미지 업로드
 *     description: |
 *       S3에 이미지를 업로드합니다.
 *
 *       ### 업로드 조건
 *       - 인증된 사용자만 업로드 가능 (USER 이상)
 *       - 허용되는 형식: JPEG, JPG, PNG, GIF, WEBP
 *       - 최대 파일 크기: 5MB
 *
 *       ### 폴더 구조
 *       - `products`: 상품 이미지
 *       - `users`: 사용자 프로필 이미지
 *       - `companies`: 회사 로고/이미지
 *       - `misc`: 기타 이미지 (기본값)
 *
 *       ### 반환값
 *       - 업로드된 파일의 공개 URL과 함께 1시간 유효한 Presigned URL을 반환합니다
 *       - Presigned URL은 즉시 사용 가능한 임시 접근 URL입니다
 *
 *       ### 사용 방법
 *       - `multipart/form-data` 형식으로 요청
 *       - 필드명: `image`
 *       - 쿼리 파라미터 `folder`로 저장 폴더 지정 가능
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [products, users, companies, misc]
 *           default: misc
 *         description: 이미지를 저장할 폴더
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 이미지 파일
 *     responses:
 *       201:
 *         description: 이미지 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UploadedFileInfo'
 *                 message:
 *                   type: string
 *                   example: "이미지 업로드가 완료되었습니다."
 *       400:
 *         description: 잘못된 요청 (파일 없음, 지원하지 않는 형식, 파일 크기 초과)
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: S3 업로드 실패
 */

/**
 * @swagger
 * /api/v1/upload/images:
 *   post:
 *     summary: 여러 이미지 업로드
 *     description: |
 *       S3에 여러 이미지를 동시에 업로드합니다. (최대 10개)
 *
 *       ### 업로드 조건
 *       - 인증된 사용자만 업로드 가능 (USER 이상)
 *       - 허용되는 형식: JPEG, JPG, PNG, GIF, WEBP
 *       - 최대 파일 크기: 각 5MB
 *       - 최대 파일 개수: 10개
 *
 *       ### 반환값
 *       - 각 파일의 공개 URL과 함께 1시간 유효한 Presigned URL을 반환합니다
 *       - Presigned URL은 즉시 사용 가능한 임시 접근 URL입니다
 *
 *       ### 사용 방법
 *       - `multipart/form-data` 형식으로 요청
 *       - 필드명: `images` (배열)
 *       - 쿼리 파라미터 `folder`로 저장 폴더 지정 가능
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [products, users, companies, misc]
 *           default: misc
 *         description: 이미지를 저장할 폴더
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 업로드할 이미지 파일들 (최대 10개)
 *     responses:
 *       201:
 *         description: 이미지 업로드 성공
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
 *                     $ref: '#/components/schemas/UploadedFileInfo'
 *                 message:
 *                   type: string
 *                   example: "3개의 이미지 업로드가 완료되었습니다."
 *       400:
 *         description: 잘못된 요청 (파일 없음, 지원하지 않는 형식, 파일 크기 초과)
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: S3 업로드 실패
 */

/**
 * @swagger
 * /api/v1/upload/image/{key}:
 *   get:
 *     summary: 이미지 URL 조회
 *     description: |
 *       S3에 저장된 이미지의 Signed URL을 반환합니다.
 *
 *       ### Signed URL
 *       - 1시간 동안 유효한 임시 URL 제공
 *       - 직접 이미지 다운로드 가능
 *       - 브라우저에서 바로 표시 가능
 *
 *       ### 다운로드 모드
 *       - `download=true` 쿼리 파라미터 사용 시 파일이 다운로드됩니다
 *       - 기본값(download=false)은 브라우저에서 이미지를 표시합니다
 *
 *       ### 사용 방법
 *       - S3 키는 URL 인코딩 필요
 *       - 예: `products/123-abc.jpg` → `products%2F123-abc.jpg`
 *       - 다운로드: `/api/v1/upload/image/products%2F123-abc.jpg?download=true`
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: S3 객체 키 (URL 인코딩 필요)
 *         example: "products%2F1234567890-abc123.jpg"
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *           default: false
 *         description: "다운로드 모드 활성화 (true: 파일 다운로드, false: 브라우저에 표시)"
 *     responses:
 *       200:
 *         description: 이미지 URL 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ImageUrlResponse'
 *                 message:
 *                   type: string
 *                   example: "이미지 URL을 조회했습니다."
 *       400:
 *         description: 잘못된 요청 (키 없음)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 이미지를 찾을 수 없음
 *       500:
 *         description: 이미지 조회 실패
 *   delete:
 *     summary: 이미지 삭제
 *     description: |
 *       S3에서 이미지를 삭제합니다.
 *
 *       ### 권한
 *       - 관리자(MANAGER) 이상만 삭제 가능
 *
 *       ### 주의사항
 *       - 삭제된 이미지는 복구할 수 없습니다
 *       - 삭제 후에도 Signed URL은 만료 시까지 유효할 수 있습니다
 *
 *       ### 사용 방법
 *       - S3 키는 URL 인코딩 필요
 *       - 예: `products/123-abc.jpg` → `products%2F123-abc.jpg`
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: S3 객체 키 (URL 인코딩 필요)
 *         example: "products%2F1234567890-abc123.jpg"
 *     responses:
 *       200:
 *         description: 이미지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                 message:
 *                   type: string
 *                   example: "이미지가 삭제되었습니다."
 *       400:
 *         description: 잘못된 요청 (키 없음)
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (관리자만 삭제 가능)
 *       500:
 *         description: 이미지 삭제 실패
 */
