import jwt, { SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config';
import { ErrorCodes } from '../constants/errorCodes.constants';
import { HttpStatus } from '../constants/httpStatus.constants';
import { CustomError } from './error.util';
import type { AuthTokenPayload } from '../types/common.types';

type AccessPayload = Omit<AuthTokenPayload, 'iat' | 'exp'>;

export class JwtUtil {
  // access token 페이로드 생성
  static buildAccessPayload(user: {
    id: string;
    companyId: string;
    email: string;
    role: AuthTokenPayload['role'];
  }): AccessPayload {
    return { userId: user.id, companyId: user.companyId, email: user.email, role: user.role };
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
      return jwt.verify(token, jwtConfig.accessToken.secret) as AuthTokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_TOKEN_EXPIRED,
          'Access token expired'
        );
      }
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        'Invalid access token'
      );
    }
  }
}
