import cors from 'cors';
import { env } from './env.config';

// CORS 미들웨어 설정
export const corsMiddleware = () => {
  const corsOptions: cors.CorsOptions = {
    origin: env.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    credentials: true,
    optionsSuccessStatus: 200,
  };

  return cors(corsOptions);
};
