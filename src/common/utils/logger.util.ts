import path from 'path';
import { createLogger, format, transports } from 'winston';
import type { Logger } from 'winston';
import type { TransformableInfo } from 'logform';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../../config/env.config';

// log directory 설정
// 매일 날짜에 해당하는 파일 아래에 로그 파일 생성
const logDir = path.join(process.cwd(), 'logs');
const datedDir = path.join(logDir, '%DATE%');
const isProd = env.NODE_ENV === 'production';
const auditFile = (name: string) => path.join(logDir, `.audit-${name}.json`);

// log format
const logFormat = format.printf((info: TransformableInfo) => {
  const { level, message, timestamp, ...rest } = info as {
    level: string;
    message: unknown;
    timestamp?: unknown;
    [key: string]: unknown;
  };

  const ts = typeof timestamp === 'string' ? timestamp : '';
  const msg = typeof message === 'string' ? message : JSON.stringify(message);

  // Symbol 키 등은 제외하고 문자열 키만 JSON으로 직렬화
  const metaEntries = Object.entries(rest).filter(([key]) => typeof key === 'string');
  const metaString = metaEntries.length
    ? ` ${JSON.stringify(Object.fromEntries(metaEntries))}`
    : '';

  return `${ts} [${level}] ${msg}${metaString}`;
});

const logger: Logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    // 일반 logging
    new DailyRotateFile({
      dirname: datedDir,
      filename: 'combined.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      auditFile: auditFile('combined'),
    }),
    // error logging
    new DailyRotateFile({
      level: 'error',
      dirname: path.join(datedDir, 'error'),
      filename: 'error.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      auditFile: auditFile('error'),
    }),
  ],
  // 예외 처리 logging
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: datedDir,
      filename: 'exception.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      auditFile: auditFile('exception'),
    }),
  ],
  // 처리되지 않은 Promise rejection logging
  rejectionHandlers: [
    new DailyRotateFile({
      dirname: datedDir,
      filename: 'rejection.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      auditFile: auditFile('rejection'),
    }),
  ],
});

// 개발 환경에서는 콘솔에도 출력
if (!isProd) {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export { logger };
