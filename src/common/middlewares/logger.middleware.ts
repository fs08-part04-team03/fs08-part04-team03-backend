import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/logger.util';

// 요청-응답 logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const status = res.statusCode;

    // 4xx/5xx(에러)는 error middleware가 로그 남기도록 위임
    if (status >= 400) return;

    logger.info(`${req.method} ${req.originalUrl} ${status} ${durationMs.toFixed(2)}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length'),
    });
  });

  next();
};
