// async-errors 패키지를 사용하여, 비동기 에러도 이 미들웨어로 전달
import { Request, Response, NextFunction } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientInitializationError,
} from '@prisma/client/runtime/library'; // Prisma 에러 타입들 (에러가 발생하여 직접 import)
import { env } from '../../config/env.config';
import { CustomError, type ErrorDetails } from '../utils/error.util';
import { logger } from '../utils/logger.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';

type ErrorResponse = {
  name: string;
  message: string;
  statusCode: number;
  errorCode: string;
  details: ErrorDetails;
};

function prismaTargetDetails(target: unknown): ErrorResponse['details'] {
  if (Array.isArray(target)) return target.map(String).join(', ');
  if (typeof target === 'string') return target;
  if (typeof target === 'number' || typeof target === 'boolean' || typeof target === 'bigint')
    return `${target}`;
  if (target && typeof target === 'object') return JSON.stringify(target);
  return null;
}

// Prisma 에러 처리 헬퍼 함수
function handlePrismaError(err: PrismaClientKnownRequestError, response: ErrorResponse) {
  switch (err.code) {
    case 'P2002': {
      response.statusCode = HttpStatus.CONFLICT;
      response.errorCode = ErrorCodes.DB_UNIQUE_CONSTRAINT_VIOLATION;
      response.message = '이미 존재하는 데이터입니다.';

      const meta = err.meta as unknown;
      const target =
        typeof meta === 'object' && meta !== null && 'target' in meta
          ? (meta as Record<string, unknown>).target
          : undefined;

      response.details = prismaTargetDetails(target);
      break;
    }

    case 'P2025':
      response.statusCode = HttpStatus.NOT_FOUND;
      response.errorCode = ErrorCodes.GENERAL_NOT_FOUND;
      response.message = '해당 데이터를 찾을 수 없습니다.';
      break;

    case 'P2003':
      response.statusCode = HttpStatus.BAD_REQUEST;
      response.errorCode = ErrorCodes.VAL_VALIDATION_ERROR;
      response.message = '연관된 데이터가 존재하지 않습니다 (Foreign Key 오류).';
      break;

    default:
      response.name = err.name;
      response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      response.errorCode = ErrorCodes.GENERAL_INTERNAL_ERROR;
      response.message = '서버 내부 데이터베이스 오류가 발생했습니다.';
      if (env.NODE_ENV === 'development') response.details = err.message; // 개발 환경에서만 상세 메시지 포함
      break;
  }
}

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  const errorResponse: ErrorResponse = {
    name: 'InternalServerError',
    message: '서버 내부 오류가 발생했습니다.',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCodes.GENERAL_INTERNAL_ERROR,
    details: null,
  };

  // CustomError
  if (err instanceof CustomError) {
    errorResponse.name = err.name;
    errorResponse.statusCode = err.statusCode;
    errorResponse.errorCode = err.errorCode;
    errorResponse.message = err.message;
    errorResponse.details = err.details;
  }

  // Prisma
  else if (err instanceof PrismaClientKnownRequestError) {
    errorResponse.name = err.name;
    handlePrismaError(err, errorResponse);
  } else if (err instanceof PrismaClientValidationError) {
    errorResponse.name = err.name;
    errorResponse.statusCode = HttpStatus.BAD_REQUEST;
    errorResponse.errorCode = ErrorCodes.VAL_VALIDATION_ERROR;
    errorResponse.message = '데이터베이스 검증 오류: 입력값이 스키마와 일치하지 않습니다.';
    if (env.NODE_ENV === 'development') errorResponse.details = err.message;
  } else if (err instanceof PrismaClientInitializationError) {
    errorResponse.name = err.name;
    errorResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    errorResponse.errorCode = ErrorCodes.DB_CONNECTION_FAILED;
    errorResponse.message = '데이터베이스 연결 실패';
    if (env.NODE_ENV === 'development') errorResponse.details = err.message;
  }

  // 일반 Error
  else if (err instanceof Error) {
    errorResponse.name = err.name;
    errorResponse.message = err.message;

    // http-errors, custom error 등이 주는 statusCode/status 반영
    const maybeStatus = err as { statusCode?: unknown; status?: unknown };
    let statusFromErr: number | undefined;
    if (typeof maybeStatus.statusCode === 'number') {
      statusFromErr = maybeStatus.statusCode;
    } else if (typeof maybeStatus.status === 'number') {
      statusFromErr = maybeStatus.status;
    }

    // errorResponse 업데이트
    if (statusFromErr) {
      errorResponse.statusCode = statusFromErr;
      errorResponse.errorCode =
        statusFromErr >= 500 ? ErrorCodes.GENERAL_INTERNAL_ERROR : ErrorCodes.GENERAL_BAD_REQUEST;
    }

    if (err.name === 'JsonWebTokenError') {
      errorResponse.statusCode = HttpStatus.UNAUTHORIZED;
      errorResponse.errorCode = ErrorCodes.AUTH_INVALID_TOKEN;
      errorResponse.message = '유효하지 않은 토큰입니다.';
    } else if (err.name === 'TokenExpiredError') {
      errorResponse.statusCode = HttpStatus.UNAUTHORIZED;
      errorResponse.errorCode = ErrorCodes.AUTH_TOKEN_EXPIRED;
      errorResponse.message = '토큰이 만료되었습니다.';
    } else if (err instanceof SyntaxError && 'body' in err) {
      errorResponse.statusCode = HttpStatus.BAD_REQUEST;
      errorResponse.errorCode = ErrorCodes.GENERAL_BAD_REQUEST;
      errorResponse.message = '잘못된 JSON 형식입니다.';
    } else if (err.name === 'MulterError') {
      errorResponse.statusCode = HttpStatus.BAD_REQUEST;
      errorResponse.errorCode = ErrorCodes.GENERAL_BAD_REQUEST;
      errorResponse.message = `파일 업로드 오류: ${err.message}`;
    }
  }

  // logging
  // error name, message, stack 기록, body 등 민감한 정보는 제외
  const safeErr =
    err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err;
  logger.error('Unhandled error', {
    err: safeErr,
    path: req.path,
    method: req.method,
    statusCode: errorResponse.statusCode,
    errorCode: errorResponse.errorCode,
  });

  return res.status(errorResponse.statusCode).json({
    success: false,
    error: {
      code: errorResponse.errorCode,
      message: errorResponse.message,
      details: errorResponse.details,
    },
  });
};
