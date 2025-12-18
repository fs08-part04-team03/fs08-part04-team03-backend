/* eslint-disable */
import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { ResponseUtil } from '../../common/utils/response.util';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { invitationAuthService } from './invitation.service';

const router = Router();

// 입력받은 url에서 token 파싱
function extractTokenFromInviteUrl(inviteUrl: string): string {
  let parsed: URL;

  // 절대 URL이 아닌 경우도 허용하기 위해 base 제공 (TODO: 추후 프론트 주소로 변경)
  try {
    parsed = new URL(inviteUrl);
  } catch {
    parsed = new URL(inviteUrl, 'http://localhost');
  }

  // 1) query param 우선
  const fromQuery = parsed.searchParams.get('token');
  if (fromQuery) return fromQuery;

  // 2) hash(#token=...) 지원
  const hash = parsed.hash ?? '';
  if (hash.startsWith('#token=')) return hash.slice('#token='.length);

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
  async (req: any, res: any) => {
    const { inviteUrl } = req.body as { inviteUrl: string };

    const rawToken = extractTokenFromInviteUrl(inviteUrl);

    // rawToken -> (service 내부에서 해시) -> DB 조회/만료/사용/취소 검증
    const info = await invitationAuthService.getPublicInfoByToken(rawToken);

    // 프론트에 필요한 값만 내려주고 싶으면 name/email만 응답
    res.status(HttpStatus.OK).json(
      ResponseUtil.success(
        {
          name: info.name,
          email: info.email,
          role: info.role,
        },
        '초대 URL이 유효합니다.'
      )
    );
  }
);

export const invitationRouter = router;
