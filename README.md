# 프로젝트명

> 프로젝트에 대한 간단한 한 줄 설명

## 📖 프로젝트 소개

프로젝트에 대한 상세한 설명을 작성합니다.

## 🛠 기술 스택

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- Express
- TypeScript
- PostgreSQL

## 📦 설치 방법

### 요구사항

- Node.js 18.x 이상
- PostgreSQL 14 이상

### 설치

```bash
# 레포지토리 클론
git clone https://github.com/username/project.git

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

## 🔧 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```
# 데이터베이스
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp

# JWT
JWT_SECRET=your-secret-key

# 서버
PORT=3000
```

자세한 내용은 `.env.example` 파일을 참고하세요.

## 🚀 실행 방법

### 개발 모드

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 프로덕션 모드

```bash
npm start
```

### 테스트

```bash
npm test
```

## 📚 API 문서

API 문서는 다음 경로에서 확인할 수 있습니다:

- Swagger UI: http://localhost:3000/api-docs

## 🤝 기여 방법

기여 방법은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 팀원

- 홍길동 ([@github-id](https://github.com/github-id)) - Frontend
- 김철수 ([@github-id](https://github.com/github-id)) - Backend
