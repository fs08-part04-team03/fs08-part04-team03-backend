import type { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';
import type { AuthenticatedRequest } from '../types/common.types';
import { runWithTenantContext } from '../utils/tenant-context.util';

/**
 * 테넌트 격리 미들웨어
 *
 * 모든 인증된 요청에서 사용자의 companyId가 존재하는지 검증합니다.
 * 이 미들웨어는 verifyAccessToken 이후에 실행되어야 합니다.
 *
 * 멀티 테넌트 아키텍처에서 데이터 격리를 보장하기 위해:
 * - 인증된 사용자가 회사에 소속되어 있는지 확인
 * - companyId가 없는 경우 요청 거부
 * - AsyncLocalStorage에 테넌트 컨텍스트 저장 (Prisma middleware에서 사용)
 *
 * @param req - AuthenticatedRequest (user.companyId 포함)
 * @param res - Express Response 객체
 * @param next - Express NextFunction
 */
export function verifyTenantAccess(req: Request, res: Response, next: NextFunction) {
  const authenticatedReq = req as AuthenticatedRequest;

  // 1. 인증된 사용자 정보 확인
  if (!authenticatedReq.user) {
    return next(
      new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '인증 정보가 없습니다. 먼저 로그인해주세요.'
      )
    );
  }

  // 2. 회사 소속 확인 (테넌트 격리의 핵심)
  if (!authenticatedReq.user.companyId) {
    return next(
      new CustomError(
        HttpStatus.FORBIDDEN,
        ErrorCodes.AUTH_FORBIDDEN,
        '회사에 소속되지 않은 사용자입니다. 관리자에게 문의하세요.'
      )
    );
  }

  // 3. 테넌트 컨텍스트 설정 및 요청 처리
  // AsyncLocalStorage를 사용하여 현재 요청의 companyId와 userId를 저장
  // 이를 통해 Prisma middleware에서 자동으로 companyId 필터를 추가할 수 있습니다.
  return runWithTenantContext(
    {
      companyId: authenticatedReq.user.companyId,
      userId: authenticatedReq.user.id,
    },
    () => {
      next();
    }
  );
}
