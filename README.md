# 스낵 프로젝트 백엔드

> 회사 단위 간식 구매 및 예산 관리 시스템

## 📖 프로젝트 소개

스낵 프로젝트는 회사에서 간식을 효율적으로 구매하고 예산을 관리할 수 있도록 돕는 백엔드 API 서버입니다. 회사별로 간식 예산을 설정하고, 직원들이 간식을 요청하면 관리자가 승인하는 워크플로우를 제공합니다.

### 주요 기능

- **회사 및 사용자 관리**: 회사별 사용자 관리 및 역할 기반 접근 제어 (USER, MANAGER, ADMIN)
- **초대 시스템**: 이메일 기반 초대장 발송 및 회원가입
- **제품 관리**: 카테고리별 제품 등록 및 관리
- **장바구니**: 사용자별 장바구니 기능
- **예산 관리**: 회사별 월간 예산 설정 및 자동 갱신 (cron)
- **구매 요청**: 구매 요청 생성 및 승인/거절 워크플로우
- **변경 이력**: 주요 데이터 변경 이력 추적

## 🛠 기술 스택

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **인증**: JWT (Access & Refresh Token)
- **보안**: Helmet, CSRF, CORS, Rate Limiting, HTTPS 강제
- **로깅**: Winston (Daily Rotate File)
- **API 문서**: Swagger
- **스케줄링**: node-cron
- **이메일**: Nodemailer
- **패스워드 암호화**: Argon2

### Development Tools

- **Code Quality**: ESLint, Prettier
- **Git Hooks**: Husky, Lint-staged, Commitlint
- **Testing**: Jest, Supertest
- **개발 환경**: Nodemon, ts-node

## 📦 설치 방법

### 요구사항

- Node.js 18.0.0 이상
- npm 9.0.0 이상
- PostgreSQL 14 이상

### 설치

```bash
# 레포지토리 클론
git clone https://github.com/fs08-part04-team03/fs08-part04-team03-backend.git

# 프로젝트 디렉토리로 이동
cd fs08-part04-team03-backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 실제 값으로 수정

# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# (선택사항) 시드 데이터 삽입
npm run prisma:seed
```

## 🔧 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# 서버
NODE_ENV=development
PORT=3000
API_VERSION=v1

# 데이터베이스
DATABASE_URL=postgresql://postgres:password@localhost:5432/myapp

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# COOKIE
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_PATH=/

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# 로깅
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 초대 설정
INVITATION_EXPIRES_HOURS=48

# 웹 애플리케이션 기본 URL
WEB_APP_BASE_URL=https://example-frontend.com/

# 이메일 서비스
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=example@example.com
EMAIL_PASS=your-email-password
```

자세한 내용은 `.env.example` 파일을 참고하세요.

## 🚀 실행 방법

### 개발 모드

```bash
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프로덕션 모드

```bash
npm run build
npm start
```

### 테스트

```bash
# 전체 테스트 실행
npm test

# 테스트 watch 모드
npm run test:watch

# 테스트 커버리지
npm run test:coverage
```

### 코드 품질

```bash
# ESLint 실행
npm run lint

# ESLint 자동 수정
npm run lint:fix

# Prettier 포맷팅
npm run format

# 타입 체크
npm run type-check
```

### Prisma 명령어

```bash
# Prisma Client 생성
npm run prisma:generate

# 마이그레이션 생성 및 적용
npm run prisma:migrate

# Prisma Studio 실행 (GUI)
npm run prisma:studio

# 프로덕션 마이그레이션
npm run prisma:deploy

# 시드 데이터 삽입
npm run prisma:seed
```

## 📚 API 문서

서버 실행 후, 다음 경로에서 Swagger UI를 통해 API 문서를 확인할 수 있습니다:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **헬스체크**: `http://localhost:3000/health`

### API 엔드포인트

#### 인증 (Auth)

- `POST /api/v1/auth/register` - 회원가입 (초대장 필요)
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/logout` - 로그아웃
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/invitations` - 초대장 발송 (ADMIN)

#### 사용자 (User)

- `GET /api/v1/user/me` - 내 정보 조회
- `PATCH /api/v1/user/me` - 내 정보 수정
- `GET /api/v1/user` - 회사 사용자 목록 조회

#### 회사 (Company)

- `GET /api/v1/company` - 회사 정보 조회
- `PATCH /api/v1/company` - 회사 정보 수정

#### 제품 (Product)

- `GET /api/v1/product` - 제품 목록 조회
- `GET /api/v1/product/:id` - 제품 상세 조회
- `POST /api/v1/product` - 제품 등록 (ADMIN)
- `PATCH /api/v1/product/:id` - 제품 수정 (ADMIN)
- `DELETE /api/v1/product/:id` - 제품 삭제 (ADMIN)

#### 장바구니 (Cart)

- `GET /api/v1/cart` - 장바구니 조회
- `POST /api/v1/cart` - 장바구니 추가
- `PATCH /api/v1/cart/:id` - 장바구니 수량 변경
- `DELETE /api/v1/cart/:id` - 장바구니 삭제

#### 예산 (Budget)

- `GET /api/v1/budget` - 예산 조회
- `POST /api/v1/budget/criteria` - 예산 기준 설정 (ADMIN)
- `PATCH /api/v1/budget/criteria` - 예산 기준 수정 (ADMIN)

#### 구매 (Purchase)

- `GET /api/v1/purchase` - 구매 요청 목록 조회
- `GET /api/v1/purchase/:id` - 구매 요청 상세 조회
- `POST /api/v1/purchase` - 구매 요청 생성
- `PATCH /api/v1/purchase/:id/approve` - 구매 승인 (MANAGER/ADMIN)
- `PATCH /api/v1/purchase/:id/reject` - 구매 거절 (MANAGER/ADMIN)
- `PATCH /api/v1/purchase/:id/cancel` - 구매 취소

## 🏗 프로젝트 구조

```
src/
├── common/                  # 공통 모듈
│   ├── constants/          # 상수 정의
│   ├── database/           # Prisma 클라이언트
│   ├── middlewares/        # 미들웨어
│   ├── types/              # 공통 타입 정의
│   └── utils/              # 유틸리티 함수
├── config/                 # 설정 파일
│   ├── cors.config.ts
│   ├── cron.config.ts
│   ├── database.ts
│   ├── env.config.ts
│   ├── jwt.config.ts
│   └── swagger.config.ts
├── domains/                # 도메인별 모듈
│   ├── auth/              # 인증 및 초대
│   ├── budget/            # 예산 관리
│   ├── cart/              # 장바구니
│   ├── company/           # 회사 관리
│   ├── product/           # 제품 관리
│   ├── purchase/          # 구매 요청
│   └── user/              # 사용자 관리
├── swagger/               # Swagger 문서 정의
├── __tests__/             # 테스트 파일
└── index.ts               # 진입점

prisma/
├── schema.prisma          # Prisma 스키마
└── seed.ts                # 시드 데이터
```

## 🔐 보안 기능

- **인증**: JWT 기반 Access & Refresh Token
- **암호화**: Argon2를 이용한 비밀번호 해싱
- **HTTPS**: 프로덕션 환경에서 HTTPS 강제 리다이렉트
- **HSTS**: HTTP Strict Transport Security 헤더
- **CSP**: Content Security Policy
- **CSRF**: CSRF 토큰 검증
- **Rate Limiting**: API 요청 속도 제한
- **Helmet**: 보안 헤더 자동 설정
- **입력 검증**: express-validator를 통한 입력 검증

## 📋 데이터베이스 스키마

### 주요 테이블

- **companies**: 회사 정보
- **users**: 사용자 정보 (회사별, 역할별)
- **categories**: 제품 카테고리 (계층 구조)
- **products**: 제품 정보
- **carts**: 장바구니
- **budgetCriteria**: 회사별 예산 기준
- **budgets**: 월별 예산
- **purchaseRequests**: 구매 요청
- **purchaseItems**: 구매 항목
- **invitations**: 초대장
- **History**: 변경 이력

### 역할 (Role)

- **USER**: 일반 사용자 (구매 요청 가능)
- **MANAGER**: 관리자 (구매 승인/거절 가능)
- **ADMIN**: 최고 관리자 (모든 권한)

### 구매 상태 (PurchaseStatus)

- **PENDING**: 승인 대기
- **APPROVED**: 승인됨
- **REJECTED**: 거절됨
- **CANCELLED**: 취소됨

## 🔄 자동화

### 예산 자동 갱신

매월 1일 00:00에 자동으로 다음 달 예산이 생성됩니다 (node-cron 사용).

```typescript
// src/config/cron.config.ts
// 매월 1일 00:00에 실행
cron.schedule('0 0 1 * *', async () => {
  // 예산 자동 생성 로직
});
```

## 🧪 테스트

프로젝트에는 Jest를 사용한 단위 테스트가 포함되어 있습니다.

- **인증 서비스 테스트**: `src/domains/auth/auth.service.test.ts`
- **제품 서비스 테스트**: `src/domains/product/product.service.test.ts`
- **JWT 유틸 테스트**: `src/common/utils/jwt.util.test.ts`

## 📝 커밋 규칙

프로젝트는 Conventional Commits 규칙을 따릅니다:

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가 또는 수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

```bash
# 예시
git commit -m "feat: add user profile update endpoint"
git commit -m "fix: resolve JWT token expiry issue"
```

## 🚀 배포

### 환경 변수 체크리스트

프로덕션 배포 전 다음 환경 변수를 확인하세요:

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (프로덕션 DB 연결 문자열)
- [ ] `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` (강력한 시크릿 키)
- [ ] `COOKIE_SECURE=true`
- [ ] `ALLOWED_ORIGINS` (프로덕션 도메인)
- [ ] `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` (이메일 설정)

### 빌드 및 실행

```bash
# 프로덕션 빌드
npm run build

# 마이그레이션 적용
npm run prisma:deploy

# 서버 실행
npm start
```

## 🤝 기여 방법

1. 이 레포지토리를 Fork 합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: add amazing feature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 👥 팀원

Team 03 - Backend Development Team
