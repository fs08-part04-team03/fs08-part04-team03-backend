import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.config';

/**
 * HTTPS 강제 리다이렉트 미들웨어
 * - 프로덕션 환경에서만 작동
 * - HTTP 요청을 HTTPS로 리다이렉트
 * - Render, Heroku 등 프록시 환경 지원
 */
export const forceHttps = (req: Request, res: Response, next: NextFunction) => {
  // 개발 환경에서는 리다이렉트 하지 않음
  if (env.NODE_ENV !== 'production') {
    return next();
  }

  // Health check 엔드포인트는 HTTPS 강제에서 제외
  if (req.path === '/health') {
    return next();
  }

  // req.secure는 trust proxy 설정을 존중하여 HTTPS 연결 확인
  // (x-forwarded-proto 헤더를 자동으로 고려)
  if (req.secure) {
    return next();
  }

  // HTTP 요청을 HTTPS로 리다이렉트 (301 영구 리다이렉트)
  const httpsUrl = `https://${req.get('host')}${req.url}`;
  return res.redirect(301, httpsUrl);
};
