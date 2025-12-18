// invitation Service를 호출해 초대 링크 생성(토큰을 받아옴) + 반환
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import { CustomError } from '../../common/utils/error.util';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { invitationAuthService } from './invitation.service';
import type { CreateInvitationBody } from './invitation.types';

// 초대 링크 생성 (TODO: 프론트 주소로 변경)
function buildInviteUrl(rawToken: string) {
  const webAppBaseUrl = process.env.WEB_APP_BASE_URL ?? 'http://localhost:4000';
  const url = new URL('/signup', webAppBaseUrl);
  url.searchParams.set('token', rawToken);

  return url.toString();
}

export const invitationController = {
  // 초대 생성 + 링크 반환
  // email 발송 시스템에서 호출할 수 있도록 inviteUrl 반환
  create: async (req: AuthenticatedRequest, res: Response) => {
    // 관리자만 접근 가능
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '인증된 사용자만 접근할 수 있습니다.'
      );
    }

    const { email, name, role } = req.body as CreateInvitationBody;
    // 초대 생성 로직 처리 + 토큰 생성
    const { token, invitation } = await invitationAuthService.createInvitation({
      companyId: req.user.companyId,
      email,
      name,
      role,
    });

    // 초대 링크 생성
    const inviteUrl = buildInviteUrl(token);

    // 여기서는 링크만 반환
    // email에서 결과값을 받아 실제 이메일에 포함시켜 전송
    res
      .status(HttpStatus.CREATED)
      .json(ResponseUtil.success({ invitation, inviteUrl }, '초대 링크가 생성되었습니다.'));
  },

  // 링크를 통해 회원가입 페이지로 접근하는 경우 -> 토큰 검증
  // 유효하면 이름, 이메일을 프론트에 내려줌
  getByToken: async (req: Request, res: Response) => {
    // URL 파라미터에 있는 raw token
    const { token } = req.params as { token: string };

    // raw token -> hash -> DB 조회/검증
    const info = await invitationAuthService.getPublicInfoByToken(token);

    res.status(HttpStatus.OK).json(ResponseUtil.success(info, '초대 토큰이 유효합니다.'));
  },
};
