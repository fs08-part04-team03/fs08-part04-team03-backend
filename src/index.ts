import 'express-async-errors';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { env } from './config/env.config';
import { corsMiddleware } from './config/cors.config';
import { startBudgetScheduler } from './config/cron.config';
import { swaggerDocs } from './config/swagger.config';
import { logger } from './common/utils/logger.util';
import { requestLogger } from './common/middlewares/logger.middleware';
import { rateLimiter } from './common/middlewares/rateLimiter.middleware';
import { forceHttps } from './common/middlewares/https.middleware';
import { errorHandler } from './common/middlewares/error.middleware';
import { authRouter } from './domains/auth/auth.router';
import { budgetRouter } from './domains/budget/budget.router';
import { companyRouter } from './domains/company/company.router';
import { userRouter } from './domains/user/user.router';
import { cartRouter } from './domains/cart/cart.router';
import { purchaseRouter } from './domains/purchase/purchase.router';
import { productRouter } from './domains/product/product.router';
import { wishlistRouter } from './domains/wishlist/wishlist.router';

const app: Application = express();

// proxy 신뢰 설정 (Render, Heroku 등 프록시 환경)
app.set('trust proxy', 1);

// HTTPS 강제 리다이렉트 (프로덕션에서만 작동)
app.use(forceHttps);

// 미들웨어
app.use(corsMiddleware());
app.use(
  helmet({
    // HSTS (HTTP Strict Transport Security) 설정
    hsts: {
      maxAge: 31536000, // 1년 (초 단위)
      includeSubDomains: true, // 모든 서브도메인 포함
      preload: true, // HSTS preload 리스트 등록 가능
    },
    // Content Security Policy (XSS 방어 강화)
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
      },
    },
  })
);

// api-docs 경로에만 완화된 CSP 적용
app.use(
  '/api-docs',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

app.use(requestLogger);
app.use(cookieParser());

// 세션 기반 CSRF를 위해 서버에 세션을 유지하고, 쿠키로 세션 ID를 전달
app.use(
  session({
    name: 'SESSION_ID',
    secret: env.SESSION_SECRET, // 세션 서명용 시크릿
    resave: false, // 변경 없으면 세션을 다시 저장하지 않음
    saveUninitialized: false, // 초기 상태(미변경) 세션은 저장하지 않음
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.COOKIE_SAME_SITE,
      domain: env.COOKIE_DOMAIN,
      path: env.COOKIE_PATH,
    },
  })
);

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
app.use(`/api/${env.API_VERSION}/budget`, budgetRouter);
app.use(`/api/${env.API_VERSION}/company`, companyRouter);
app.use(`/api/${env.API_VERSION}/user`, userRouter);
app.use(`/api/${env.API_VERSION}/purchase`, purchaseRouter);
app.use(`/api/${env.API_VERSION}/cart`, cartRouter);
app.use(`/api/${env.API_VERSION}/product`, productRouter);
app.use(`/api/${env.API_VERSION}/wishlist`, wishlistRouter);

// Swagger 문서 설정
swaggerDocs(app);

// 예산 스케줄러 시작
startBudgetScheduler();

// 에러 처리 미들웨어
app.use(errorHandler);

// 서버 시작
app.listen(env.PORT, () => {
  logger.info('🚀 서버 시작...');
  logger.info(`📌 환경: ${env.NODE_ENV}`); // 현재 환경 명시적 출력
  logger.info(`📌 포트: ${env.PORT}`);
  logger.info('✅ 서버가 성공적으로 시작되었습니다!');
});
