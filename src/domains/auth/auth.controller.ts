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
  {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    inviteUrl: string;
    profileImage?: string | null;
  },
  unknown
>;

type AdminRegisterRequest = Request<
  unknown,
  unknown,
  {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    companyName: string;
    businessNumber: string;
    profileImage?: string | null;
  },
  unknown
>;

type LoginRequest = Request<
  unknown,
  unknown,
  {
    email: string;
    password: string;
    companyId?: string;
  },
  unknown
>;

// inviteUrl에서 token 추출
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

// refresh token cookie 옵션
const refreshCookieOptions = (maxAgeMs: number): CookieOptions => {
  if (env.NODE_ENV === 'production') {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  return {
    httpOnly: true, // 개발 환경에서도 httpOnly 적용
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: env.COOKIE_PATH,
    maxAge: maxAgeMs,
  };
};

export const authController = {
  // 회원가입
  signup: async (req: SignupRequest, res: Response) => {
    const { name, email, password, inviteUrl, profileImage } = req.body;
    const inviteToken = extractTokenFromInviteUrl(inviteUrl);

    const { accessToken, refreshToken, user } = await authService.signup({
      name,
      email,
      password,
      inviteToken,
      profileImage,
    });

    const { exp } = JwtUtil.verifyRefreshToken(refreshToken);
    const maxAge = Math.max(0, exp * 1000 - Date.now());

    const cookieOptions = refreshCookieOptions(maxAge);

    // 디버깅을 위한 로깅 (개발 환경에서만)
    if (env.NODE_ENV === 'development') {
      console.log('🍪 [SIGNUP] Setting refreshToken cookie with options:', cookieOptions);
    }

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res
      .status(HttpStatus.CREATED)
      .json(ResponseUtil.success({ user, accessToken }, '회원가입 완료'));
  },

  // 어드민 회원가입
  adminRegister: async (req: AdminRegisterRequest, res: Response) => {
    const { name, email, password, companyName, businessNumber, profileImage } = req.body;

    const { accessToken, refreshToken, user, company } = await authService.adminRegister({
      name,
      email,
      password,
      companyName,
      businessNumber,
      profileImage,
    });

    const { exp } = JwtUtil.verifyRefreshToken(refreshToken);
    const maxAge = Math.max(0, exp * 1000 - Date.now());

    const cookieOptions = refreshCookieOptions(maxAge);

    // 디버깅을 위한 로깅 (개발 환경에서만)
    if (env.NODE_ENV === 'development') {
      console.log('🍪 [ADMIN] Setting refreshToken cookie with options:', cookieOptions);
    }

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res
      .status(HttpStatus.CREATED)
      .json(ResponseUtil.success({ user, company, accessToken }, '어드민 회원가입 완료'));
  },

  // 로그인 (회사 선택 포함)
  login: async (req: LoginRequest, res: Response) => {
    const { email, password, companyId } = req.body;
    const { accessToken, refreshToken, user } = await authService.login({
      email,
      password,
      companyId,
    });

    const { exp } = JwtUtil.verifyRefreshToken(refreshToken);
    const maxAge = Math.max(0, exp * 1000 - Date.now());

    const cookieOptions = refreshCookieOptions(maxAge);

    // 디버깅을 위한 로깅 (개발 환경에서만)
    if (env.NODE_ENV === 'development') {
      console.log('🍪 [DEBUG] Setting refreshToken cookie with options:', cookieOptions);
      console.log('🍪 [DEBUG] refreshToken length:', refreshToken.length);
      console.log('🍪 [DEBUG] maxAge (ms):', maxAge);
      console.log('🍪 [DEBUG] Request origin:', req.headers.origin);
    }

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.status(HttpStatus.OK).json(ResponseUtil.success({ user, accessToken }, '로그인 성공'));
  },

  // refresh (token 재발급)
  refresh: async (req: Request, res: Response) => {
    // 쿠키에서 refreshToken 추출
    const token = req.cookies?.refreshToken as string | undefined;

    // 디버깅을 위한 로깅 (개발 환경에서만)
    if (env.NODE_ENV === 'development' && !token) {
      console.log('🔍 [DEBUG] req.cookies:', req.cookies);
      console.log('🔍 [DEBUG] req.headers.cookie:', req.headers.cookie);
    }

    if (!token) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'refresh token이 존재하지 않습니다. 쿠키가 포함된 요청인지 확인하세요.'
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
    const token = req.cookies?.refreshToken as string | undefined;

    if (token) {
      await authService.logoutByToken(token);
    }
    res.clearCookie('refreshToken', refreshCookieOptions(0));
    res.status(HttpStatus.OK).json(ResponseUtil.success(null, '로그아웃 성공'));
  },
};
