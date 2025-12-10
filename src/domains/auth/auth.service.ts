import argon2 from 'argon2';
import { prisma } from '../../common/database/prisma.client';
import { JwtUtil } from '../../common/utils/jwt.util';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';

type LoginInput = { email: string; password: string };

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await prisma.users.findUnique({ where: { email } });

    const ok = user && (await argon2.verify(user.password, password));
    // 1) 로그인 정보 오류 (이메일 혹은 비밀번호 불일치)
    if (!ok || !user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        '이메일 혹은 비밀번호가 틀렸습니다.'
      );
    }

    // 2) 비활성 계정
    if (!user.isActive) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '비활성화된 계정입니다.'
      );
    }

    // 3) 토큰 발급 (companyId 포함)
    const payload = JwtUtil.buildAccessPayload({
      companyId: user.companyId,
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const accessToken = JwtUtil.generateAccessToken(payload);

    return {
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    };
  },
};
