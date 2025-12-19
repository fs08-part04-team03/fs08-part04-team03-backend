import jwt, { SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config';
import { ErrorCodes } from '../constants/errorCodes.constants';
import { HttpStatus } from '../constants/httpStatus.constants';
import { CustomError } from './error.util';
import type { AuthTokenPayload } from '../types/common.types';

type AccessPayload = Omit<AuthTokenPayload, 'iat' | 'exp'>;
type RefreshPayload = { userId: string; jti: string };

export class JwtUtil {
  // access token 페이로드 생성
  static buildAccessPayload(user: {
    id: string;
    companyId: string;
    email: string;
    role: AuthTokenPayload['role'];
  }): { id: string; companyId: string; email: string; role: 'USER' | 'MANAGER' | 'ADMIN' } {
    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    };
  }

  // access token 생성
  static generateAccessToken(payload: AccessPayload): string {
    const { secret, expiresIn } = jwtConfig.accessToken;
    const options: SignOptions = {};
    if (expiresIn !== undefined) {
      options.expiresIn = expiresIn; // 타입 가드로 string/number만 남김
    }
    return jwt.sign(payload, secret, options);
  }

  // access token 검증
  static verifyAccessToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

      // 페이로드 구조 검증
      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        'userId' in decoded &&
        'companyId' in decoded &&
        'email' in decoded &&
        'role' in decoded &&
        typeof decoded.userId === 'string' &&
        typeof decoded.companyId === 'string' &&
        typeof decoded.email === 'string' &&
        ['USER', 'MANAGER', 'ADMIN'].includes(decoded.role as string)
      ) {
        return decoded as AuthTokenPayload;
      }
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        '유효하지 않은 토큰 페이로드'
      );
    } catch (err) {
      if (err instanceof CustomError) {
        throw err;
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_TOKEN_EXPIRED,
          'Access token 만료'
        );
      }
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        '유효하지 않은 access token'
      );
    }
  }

  // refresh token 생성
  static generateRefreshToken(payload: RefreshPayload): string {
    const { secret, expiresIn } = jwtConfig.refreshToken;
    return jwt.sign(payload, secret, { expiresIn });
  }

  // refresh token 검증
  static verifyRefreshToken(token: string): RefreshPayload & { exp: number; iat: number } {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshToken.secret);

      // 페이로드 구조 검증
      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        'userId' in decoded &&
        'jti' in decoded &&
        'exp' in decoded &&
        'iat' in decoded &&
        typeof decoded.userId === 'string' &&
        typeof decoded.jti === 'string' &&
        typeof decoded.exp === 'number' &&
        typeof decoded.iat === 'number'
      ) {
        return decoded as RefreshPayload & { exp: number; iat: number };
      }
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        '유효하지 않은 토큰 페이로드'
      );
    } catch (err) {
      if (err instanceof CustomError) {
        throw err;
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_TOKEN_EXPIRED,
          'Refresh token 만료'
        );
      }
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        '유효하지 않은 refresh token'
      );
    }
  }
}
