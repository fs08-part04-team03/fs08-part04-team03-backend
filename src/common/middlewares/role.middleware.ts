import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest, AuthTokenPayload } from '../types/common.types';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';

type Role = AuthTokenPayload['role'];

// 권한 등급
const roleRank: Record<Role, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

// 로그인 여부만 확인
export function requireAuth() {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_UNAUTHORIZED,
          'Authentication required'
        )
      );
    }
    return next();
  };
}

// 지정한 role 중 하나면 통과
export function requireRoles(...allowed: Role[]) {
  const allowedSet = new Set<Role>(allowed);

  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_UNAUTHORIZED,
          'Authentication required'
        )
      );
    }

    if (!allowedSet.has(req.user.role)) {
      return next(new CustomError(HttpStatus.FORBIDDEN, ErrorCodes.AUTH_FORBIDDEN, 'Forbidden'));
    }

    return next();
  };
}

// 최소 권한 이상이면 통과 (USER < MANAGER < ADMIN)
export function requireMinRole(minRole: Role) {
  const min = roleRank[minRole];

  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_UNAUTHORIZED,
          'Authentication required'
        )
      );
    }

    if (roleRank[req.user.role] < min) {
      return next(new CustomError(HttpStatus.FORBIDDEN, ErrorCodes.AUTH_FORBIDDEN, 'Forbidden'));
    }

    return next();
  };
}
