import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { corsMiddleware } from './config/cors.config';
import { rateLimiter } from './common/middlewares/rateLimiter.middleware';

// 환경 변수 설정
const nodeEnv = process.env.NODE_ENV || 'development';

// 개발 환경에서만 .env 파일 로드
// 프로덕션에서는 배포 플랫폼의 환경 변수 사용
if (nodeEnv === 'development') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// Express 앱 생성
const app: Application = express();

// 환경 변수
const PORT = parseInt(process.env.PORT || '4000', 10);

// proxy 신뢰 설정
app.set('trust proxy', 1);

// 미들웨어
app.use(corsMiddleware());
app.use(helmet());
app.use(rateLimiter());
app.use(express.json());

// 헬스체크 엔드포인트
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 기본 라우트
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: '🚀 API 서버가 실행 중입니다!' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('🚀 서버 시작...');
  console.log(`📌 환경: ${nodeEnv}`); // 현재 환경 명시적 출력
  console.log(`📌 포트: ${PORT}`);
  console.log('✅ 서버가 성공적으로 시작되었습니다!');
});
