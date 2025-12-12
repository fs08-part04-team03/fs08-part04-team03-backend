import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/logger.util';

// 요청-응답 logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const status = res.statusCode;

    // 로그 레벨 결정
    let level: 'info' | 'warn' | 'error' = 'info';
    if (status >= 500) {
      level = 'error';
    } else if (status >= 400) {
      level = 'warn';
    }

    logger.log(level, `${req.method} ${req.originalUrl} ${status} ${durationMs.toFixed(2)}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length'),
    });
  });

  next();
};
