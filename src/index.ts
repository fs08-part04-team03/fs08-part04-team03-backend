import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// 환경 변수 설정
const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'development') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else {
  // Production 환경 등에서는 시스템 환경변수를 우선하되, 파일이 있다면 로드
  dotenv.config();
}

// Express 앱 생성
const app: Application = express();

// 환경 변수
const PORT = parseInt(process.env.PORT || '4000', 10);

// 미들웨어
app.use(helmet());
app.use(cors());
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
