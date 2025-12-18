import { Request, Response, type CookieOptions } from 'express';
import { authService } from './auth.service';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import { CustomError } from '../../common/utils/error.util';
import { JwtUtil } from '../../common/utils/jwt.util';
import { env } from '../../config/env.config';

type SignupRequest = Request<
  unknown,
  unknown,
  { name: string; email: string; password: string; passwordConfirm: string; inviteToken: string },
  unknown
>;

type LoginRequest = Request<
  unknown,
  unknown,
  {
    email: string;
    password: string;
  },
  unknown
>;

// refresh token cookie 옵션
const refreshCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  domain: env.COOKIE_DOMAIN,
  path: env.COOKIE_PATH,
  maxAge: maxAgeMs,
});

export const authController = {
  // 회원가입
  signup: async (req: SignupRequest, res: Response) => {
    const { name, email, password, inviteToken } = req.body;
    const { accessToken, refreshToken, user } = await authService.signup({
      name,
      email,
      password,
      inviteToken,
    });

    const { exp } = JwtUtil.verifyRefreshToken(refreshToken);
    const maxAge = Math.max(0, exp * 1000 - Date.now());

    res.cookie('refreshToken', refreshToken, refreshCookieOptions(maxAge));
    res
      .status(HttpStatus.CREATED)
      .json(ResponseUtil.success({ user, accessToken }, '회원가입 완료'));
  },

  // 로그인
  login: async (req: LoginRequest, res: Response) => {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login({ email, password });

    const { exp } = JwtUtil.verifyRefreshToken(refreshToken);
    const maxAge = Math.max(0, exp * 1000 - Date.now());

    res.cookie('refreshToken', refreshToken, refreshCookieOptions(maxAge));
    res.status(HttpStatus.OK).json(ResponseUtil.success({ user, accessToken }, '로그인 성공'));
  },

  // refresh (token 재발급)
  refresh: async (req: Request, res: Response) => {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.refreshToken;
    if (!token) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'refresh token이 존재하지 않습니다.'
      );
    }

    const { accessToken, refreshToken, user } = await authService.refresh(token);
    const { exp } = JwtUtil.verifyRefreshToken(refreshToken);
    const maxAge = Math.max(0, exp * 1000 - Date.now());

    res.cookie('refreshToken', refreshToken, refreshCookieOptions(maxAge));
    res.status(HttpStatus.OK).json(ResponseUtil.success({ user, accessToken }, '토큰 재발급 성공'));
  },

  // 로그아웃
  logout: async (req: Request, res: Response) => {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.refreshToken;
    if (token) {
      await authService.logoutByToken(token);
    }
    res.clearCookie('refreshToken', refreshCookieOptions(0));
    res.status(HttpStatus.OK).json(ResponseUtil.success(null, '로그아웃 성공'));
  },
};
