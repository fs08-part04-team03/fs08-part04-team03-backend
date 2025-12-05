import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';
import type { AuthTokenPayload } from '../types/common.types';

export function verifyAccessToken(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Authorization header is missing'
      );
    }

    const [, token] = authHeader.split(' ');
    if (!token) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Bearer token is missing'
      );
    }

    const payload = JwtUtil.verifyAccessToken(token);
    (req as Request & { user?: AuthTokenPayload }).user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
