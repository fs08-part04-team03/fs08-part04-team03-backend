import { Request, Response } from 'express';
import { authService } from './auth.service';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { AuthenticatedRequest } from '../../common/types/common.types';

type LoginRequest = Request<unknown, unknown, { email: string; password: string }, unknown>;

export const authController = {
  // 로그인
  login: async (req: LoginRequest, res: Response) => {
    const { email, password } = req.body;

    // 인자가 제대로 넘어왔는지 확인
    if (!email || !password) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VAL_MISSING_FIELD,
        '이메일 및 비밀번호가 존재하지 않습니다.'
      );
    }

    const result = await authService.login({ email, password });
    res.status(HttpStatus.OK).json({ success: true, data: result });
  },

  // 자기 정보 조회 (JWT를 이용해 인증된 사용자 정보 반환)
  me: (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '인증되지 않은 사용자입니다.'
      );
    }

    res.status(HttpStatus.OK).json({ success: true, data: req.user });
  },
};
