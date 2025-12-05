import { Request, Response } from 'express';
import { authService } from './auth.service';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import type { AuthenticatedRequest } from '../../common/types/common.types';

type LoginRequest = Request<unknown, unknown, { email: string; password: string }, unknown>;

export const authController = {
  // 로그인
  login: async (req: LoginRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(HttpStatus.OK).json({ success: true, data: result });
  },

  // 자기 정보 조회 (JWT를 이용해 인증된 사용자 정보 반환)
  me: (req: AuthenticatedRequest, res: Response) => {
    res.status(HttpStatus.OK).json({ success: true, data: req.user });
  },
};
