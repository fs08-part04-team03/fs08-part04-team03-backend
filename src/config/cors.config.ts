import cors from 'cors';

// CORS 미들웨어 설정
export const corsMiddleware = () => {
  // 환경 변수에서 허용된 출처 목록을 저장
  const originList = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());

  const corsOptions: cors.CorsOptions = {
    origin: originList,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
  };

  return cors(corsOptions);
};
