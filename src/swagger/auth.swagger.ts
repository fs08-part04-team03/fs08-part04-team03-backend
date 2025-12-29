/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: 인증 및 토큰 관리
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     AuthUser:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         companyId: { type: string, format: uuid }
 *         email: { type: string, format: email }
 *         name: { type: string }
 *         role: { type: string, enum: ["USER", "MANAGER", "ADMIN"] }
 *     AuthCompany:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, example: "Acme Inc" }
 *         businessNumber: { type: string, example: "123-45-67890" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     AuthSignupRequest:
 *       type: object
 *       required: [name, email, password, passwordConfirm, inviteUrl]
 *       properties:
 *         name: { type: string, minLength: 1, maxLength: 255 }
 *         email: { type: string, format: email }
 *         password: { type: string, minLength: 8, maxLength: 30 }
 *         passwordConfirm: { type: string, minLength: 8, maxLength: 30 }
 *         inviteUrl:
 *           type: string
 *           format: uri
 *           description: 'query `token` 또는 `#token=` 해시에 토큰 포함 필요 (예: ?token=... 또는 #token=...)'
 *           example: "https://app.example.com/signup?token=123e4567-e89b-12d3-a456-426614174000"
 *     AuthAdminRegisterRequest:
 *       type: object
 *       required: [name, email, password, passwordConfirm, companyName, businessNumber]
 *       properties:
 *         name: { type: string, minLength: 1, maxLength: 255 }
 *         email: { type: string, format: email }
 *         password: { type: string, minLength: 8, maxLength: 30 }
 *         passwordConfirm: { type: string, minLength: 8, maxLength: 30 }
 *         companyName: { type: string, minLength: 1, maxLength: 255 }
 *         businessNumber:
 *           type: string
 *           pattern: "^\\d{3}-\\d{2}-\\d{5}$"
 *           example: "123-45-67890"
 *     AuthLoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email }
 *         password: { type: string }
 *     AuthTokenPayload:
 *       type: object
 *       properties:
 *         user: { $ref: '#/components/schemas/AuthUser' }
 *         accessToken: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 *     AuthSignupResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/AuthTokenPayload' }
 *             message:
 *               type: string
 *               example: '회원가입 완료'
 *     AuthLoginResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/AuthTokenPayload' }
 *             message:
 *               type: string
 *               example: '로그인 성공'
 *     AuthRefreshResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data: { $ref: '#/components/schemas/AuthTokenPayload' }
 *             message:
 *               type: string
 *               example: '토큰 재발급 완료'
 *     AuthAdminRegisterResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/AuthUser' }
 *                 company: { $ref: '#/components/schemas/AuthCompany' }
 *                 accessToken: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 *             message:
 *               type: string
 *               example: '관리자 회원가입 완료'
 *     AuthLogoutResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               nullable: true
 *               example: null
 *             message:
 *               type: string
 *               example: '로그아웃 완료'
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: 사용자 회원가입 (초대)
 *     description: 액세스 토큰을 발급하고 리프레시 토큰 쿠키를 설정합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthSignupRequest' }
 *     responses:
 *       '201':
 *         description: 회원가입 완료
 *         headers:
 *           Set-Cookie:
 *             description: 리프레시 토큰 쿠키
 *             schema:
 *               type: string
 *               example: "refreshToken=...; HttpOnly; Path=/"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthSignupResponse' }
 *       '400':
 *         description: 요청 본문 오류 또는 초대 URL 오류
 *       '401':
 *         description: 초대 토큰이 유효하지 않거나 만료됨
 *       '409':
 *         description: 회사에 이미 등록된 이메일
 */

/**
 * @openapi
 * /api/v1/auth/admin/register:
 *   post:
 *     summary: 관리자 회원가입 (회사 생성)
 *     description: 회사와 관리자 계정을 생성하고 액세스 토큰 발급 및 리프레시 토큰 쿠키를 설정합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthAdminRegisterRequest' }
 *     responses:
 *       '201':
 *         description: 관리자 회원가입 완료
 *         headers:
 *           Set-Cookie:
 *             description: 리프레시 토큰 쿠키
 *             schema:
 *               type: string
 *               example: "refreshToken=...; HttpOnly; Path=/"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthAdminRegisterResponse' }
 *       '400':
 *         description: 요청 본문 오류
 *       '409':
 *         description: 사업자등록번호 또는 이메일 중복
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 액세스 토큰을 발급하고 리프레시 토큰 쿠키를 설정합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthLoginRequest' }
 *     responses:
 *       '200':
 *         description: 로그인 성공
 *         headers:
 *           Set-Cookie:
 *             description: 리프레시 토큰 쿠키
 *             schema:
 *               type: string
 *               example: "refreshToken=...; HttpOnly; Path=/"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthLoginResponse' }
 *       '401':
 *         description: 인증 실패 또는 비활성 계정
 */

/**
 * @openapi
 * /api/v1/auth/csrf:
 *   get:
 *     summary: CSRF 토큰 발급
 *     description: CSRF 토큰을 반환하고 XSRF-TOKEN/SESSION_ID 쿠키를 설정합니다.
 *     tags: [Auth]
 *     responses:
 *       '200':
 *         description: CSRF 토큰 발급 완료
 *         headers:
 *           Set-Cookie:
 *             description: XSRF-TOKEN 및 SESSION_ID 쿠키
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthCsrfResponse' }
 */

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 토큰 재발급
 *     description: refreshToken 쿠키 + CSRF 헤더(csrftoken) 필요
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: X-CSRF-Token
 *         required: true
 *         schema: { type: string }
 *         description: /auth/csrf 응답으로 받은 CSRF 토큰
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema: { type: string }
 *         description: HttpOnly refresh token cookie
 *     responses:
 *       '200':
 *         description: 토큰 재발급 성공
 *         headers:
 *           Set-Cookie:
 *             description: refresh token cookie
 *             schema:
 *               type: string
 *               example: "refreshToken=...; HttpOnly; Path=/"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthRefreshResponse' }
 *       '401':
 *         description: refresh token 없음/무효/만료
 *       '403':
 *         description: CSRF token missing or mismatch
 */

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: refreshToken 쿠키 + CSRF 헤더(csrftoken) 필요
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: X-CSRF-Token
 *         required: true
 *         schema: { type: string }
 *         description: /auth/csrf 응답으로 받은 CSRF 토큰
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema: { type: string }
 *         description: HttpOnly refresh token cookie
 *     responses:
 *       '200':
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthLogoutResponse' }
 *       '403':
 *         description: CSRF token missing or mismatch
 */
