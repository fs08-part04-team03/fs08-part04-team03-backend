import { Router } from 'express';
import { body } from 'express-validator';
import type { Request, Response } from 'express';
import { role as RoleEnum } from '@prisma/client';
import { env } from '../../config/env.config';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { ResponseUtil } from '../../common/utils/response.util';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { invitationAuthService } from './invitation.service';
import { sendInvitationEmail } from '../../common/utils/email.util';
import { invitationValidator } from './invitation.validator';

const router = Router();

// 입력받은 url에서 token 파싱
function extractTokenFromInviteUrl(inviteUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(inviteUrl);
  } catch {
    throw new CustomError(
      HttpStatus.BAD_REQUEST,
      ErrorCodes.GENERAL_BAD_REQUEST,
      'inviteUrl에서 token을 찾을 수 없습니다.'
    );
  }

  const fromQuery = parsed.searchParams.get('token');
  if (fromQuery !== null) {
    const token = fromQuery.trim();
    if (token.length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        'inviteUrl에서 token을 찾을 수 없습니다.'
      );
    }
    return token;
  }

  const fromHash = new URLSearchParams(parsed.hash.replace(/^#/, '')).get('token');
  if (fromHash !== null) {
    const token = fromHash.trim();
    if (token.length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        'inviteUrl에서 token을 찾을 수 없습니다.'
      );
    }
    return token;
  }

  throw new CustomError(
    HttpStatus.BAD_REQUEST,
    ErrorCodes.GENERAL_BAD_REQUEST,
    'inviteUrl에서 token을 찾을 수 없습니다.'
  );
}

// 초대 링크 문자열을 입력하면 토큰을 추출해 검증 후 공개 정보 반환
router.post(
  '/verifyUrl',
  [body('inviteUrl').isString().trim().isLength({ min: 1, max: 2048 }), validateRequest],
  async (req: Request, res: Response) => {
    const { inviteUrl } = req.body as { inviteUrl: string };

    const rawToken = extractTokenFromInviteUrl(inviteUrl);

    // rawToken -> (service 내부에서 해시) -> DB 조회/만료/사용/취소 검증
    const info = await invitationAuthService.getPublicInfoByToken(rawToken);

    // 프론트에 필요한 값만 내려주고 싶으면 name/email만 응답
    res.status(HttpStatus.OK).json(
      ResponseUtil.success(
        {
          companyId: info.companyId,
          name: info.name,
          email: info.email,
          role: info.role,
        },
        '초대 URL이 유효합니다.'
      )
    );
  }
);

// 초대 링크 생성
type AuthedRequest = Request & {
  user: { role: RoleEnum };
};
router.post(
  '/create',
  verifyAccessToken,
  [body('companyId').isUUID(), ...invitationValidator.create],
  async (req: Request, res: Response) => {
    // 2) 여기서만 캐스팅
    const authReq = req as AuthedRequest;

    const { companyId, email, name, role } = req.body as {
      companyId: string;
      email: string;
      name: string;
      role: RoleEnum;
    };

    const { token: rawToken, invitation } = await invitationAuthService.createInvitation({
      companyId,
      email,
      name,
      role,
      requestedByRole: authReq.user.role,
    });

    const webAppBaseUrl = env.WEB_APP_BASE_URL;
    const url = new URL('/invite', webAppBaseUrl);
    url.searchParams.set('token', rawToken);

    // 초대 이메일 발송
    sendInvitationEmail(email, url.toString()).catch((error) => {
      console.error('초대 이메일 전송 실패:', error);
    });

    res
      .status(HttpStatus.CREATED)
      .json(
        ResponseUtil.success({ invitation, inviteUrl: url.toString() }, '초대가 생성되었습니다.')
      );
  }
);

export const invitationRouter = router;
