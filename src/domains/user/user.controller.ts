import { Request, Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { userService } from './user.service';
import type {
  AdminProfilePatchBody,
  UpdateRoleBody,
  UpdateStatusBody,
  UserListQuery,
  UserProfilePatchBody,
} from './user.types';

type UserIdParam = { id: string };
type GetUsersRequest = AuthenticatedRequest & Request<unknown, unknown, unknown, UserListQuery>;

// 인증된 사용자 정보 필요
const requireUserContext = (req: AuthenticatedRequest) => {
  if (!req.user) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '인증 정보가 없습니다.'
    );
  }
  return req.user;
};

export const userController = {
  // 프로필 조회
  getProfile: async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = requireUserContext(req);
    const profile = await userService.getProfile(userId);
    res.status(HttpStatus.OK).json(ResponseUtil.success(profile, '내 프로필 조회 성공'));
  },
  // 비밀번호 변경 (유저/매니저)
  patchMyProfile: async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = requireUserContext(req);
    const { newPassword } = req.body as UserProfilePatchBody;
    await userService.changeMyPassword(userId, newPassword);
    res.status(HttpStatus.OK).json(ResponseUtil.success(null, '비밀번호가 변경되었습니다.'));
  },
  // 비밀번호/회사명 변경 (관리자)
  patchAdminProfile: async (req: AuthenticatedRequest, res: Response) => {
    const { userId, companyId } = requireUserContext(req);
    const payload = req.body as AdminProfilePatchBody;
    await userService.adminPatchProfile(userId, companyId, payload);
    res
      .status(HttpStatus.OK)
      .json(ResponseUtil.success(null, '관리자 프로필이 업데이트되었습니다.'));
  },
  // 권한 변경 (관리자)
  updateRole: async (req: AuthenticatedRequest & Request<UserIdParam>, res: Response) => {
    const actor = requireUserContext(req);
    const { role } = req.body as UpdateRoleBody;
    const updated = await userService.updateRole(
      actor.companyId,
      req.params.id,
      role,
      actor.userId
    );
    res.status(HttpStatus.OK).json(ResponseUtil.success(updated, '권한이 변경되었습니다.'));
  },
  // 활성/비활성 전환 (관리자)
  updateStatus: async (req: AuthenticatedRequest & Request<UserIdParam>, res: Response) => {
    const actor = requireUserContext(req);
    const { isActive } = req.body as UpdateStatusBody;
    const updated = await userService.updateStatus(
      actor.companyId,
      req.params.id,
      isActive,
      actor.userId
    );
    res.status(HttpStatus.OK).json(ResponseUtil.success(updated, '계정 상태가 변경되었습니다.'));
  },
  // 회사 소속 사용자 목록 조회/검색 (관리자)
  getUsers: async (req: GetUsersRequest, res: Response) => {
    const actor = requireUserContext(req);
    const result = await userService.listUsers(actor.companyId, actor.userId, req.query);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.successWithPagination(result.users, result.pagination, '사용자 목록 조회 성공')
      );
  },
};
