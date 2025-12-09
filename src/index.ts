import 'express-async-errors';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import { env } from './config/env.config';
import { corsMiddleware } from './config/cors.config';
import { rateLimiter } from './common/middlewares/rateLimiter.middleware';
import { errorHandler } from './common/middlewares/error.middleware';
import { authRouter } from './domains/auth/auth.router';

const app: Application = express();

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

// 도메인 라우트
app.use(`/api/${env.API_VERSION}/auth`, authRouter);

// 에러 처리 미들웨어
app.use(errorHandler);

// 서버 시작
app.listen(env.PORT, () => {
  console.log('🚀 서버 시작...');
  console.log(`📌 환경: ${env.NODE_ENV}`); // 현재 환경 명시적 출력
  console.log(`📌 포트: ${env.PORT}`);
  console.log('✅ 서버가 성공적으로 시작되었습니다!');
});
