import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// Express 앱 생성
const app = express();

// 환경 변수
const PORT = parseInt(process.env.PORT || '4000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(express.json());

// 헬스체크 엔드포인트
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({ message: '🚀 API 서버가 실행 중입니다!' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('🚀 서버 시작...');
  console.log(`📌 환경: ${NODE_ENV}`);
  console.log(`📌 포트: ${PORT}`);
  console.log('✅ 서버가 성공적으로 시작되었습니다!');
  console.log(`🔗 http://localhost:${PORT}`);
});
