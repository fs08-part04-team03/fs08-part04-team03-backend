import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';
import type { AuthTokenPayload } from '../types/common.types';

/**
 * Bearer <token> -> 허용
 * Bearer     <token> -> 허용
 * Bearer <token with spaeces> -> 불허
 * Bearer<token> -> 불허
 * Bearer -> 불허
 *  -> 불허
 */

// access token 검증 미들웨어
export function verifyAccessToken(req: Request, _res: Response, next: NextFunction) {
  try {
    // Authorization 헤더 유효성 검사
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.trim()) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Authorization header is missing'
      );
    }

    const value = authHeader.trim();
    // Bearer insensitive 검사
    if (value.slice(0, 6).toLowerCase() !== 'bearer') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        'Invalid Authorization header format'
      );
    }

    const rest = value.slice(6);
    // "Bearer"만 온 경우는 토큰 없음
    if (!rest) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Bearer token is missing'
      );
    }

    // Bearer와 토큰 사이에 최소 1개 이상의 스페이스/탭이 있어야 함 (Bearer<token> 불허)
    if (rest[0] !== ' ' && rest[0] !== '\t') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        'Invalid Authorization header format'
      );
    }

    // 선행 스페이스/탭 스킵
    let i = 0;
    while (i < rest.length && (rest[i] === ' ' || rest[i] === '\t')) i += 1;

    const token = rest.slice(i).trim();

    // 공백만 있는 경우는 "토큰 없음"으로 처리
    if (!token) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Bearer token is missing'
      );
    }

    // 토큰 내부 공백은 400
    if (/\s/.test(token)) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        'Bearer token must not contain whitespace'
      );
    }

    const payload = JwtUtil.verifyAccessToken(token);
    (req as Request & { user?: AuthTokenPayload }).user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
