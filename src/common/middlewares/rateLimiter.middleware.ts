import rateLimit from 'express-rate-limit';
import { HttpStatus } from '../constants/httpStatus.constants';

// Rate Limiter 미들웨어 설정
export function rateLimiter() {
  // 환경 변수에서 설정 값 읽기
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS);
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS);

  // 환경 변수가 없거나 잘못된 경우 오류 로그 출력
  if (Number.isNaN(windowMs) || Number.isNaN(maxRequests)) {
    console.warn('[rateLimiter] env not loaded or not numeric', {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    });
  }

  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.',
      },
    },
  });
}
