import rateLimit from 'express-rate-limit';
import { HttpStatus } from '../constants/httpStatus.constants';

export const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS),
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
