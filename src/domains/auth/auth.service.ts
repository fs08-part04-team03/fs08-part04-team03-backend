import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { JwtUtil } from '../../common/utils/jwt.util';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';

const prisma = new PrismaClient();
type LoginInput = { email: string; password: string };

export const authService = {
  async login({ email, password }: LoginInput) {
    // 인자가 제대로 넘어왔는지 확인
    if (!email || !password) {
      throw new CustomError(
        HttpStatus.FORBIDDEN,
        ErrorCodes.GENERAL_NOT_FOUND,
        '이메일 및 비밀번호가 존재하지 않습니다.'
      );
    }

    const user = await prisma.users.findUnique({ where: { email } });

    // 1) 사용자 정보 없음
    if (!user) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.USER_NOT_FOUND,
        '사용자 정보가 존재하지 않습니다.'
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

    // 3) 비밀번호 불일치
    const ok = await argon2.verify(user.password, password);
    if (!ok) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.USER_INVALID_PASSWORD,
        '비밀번호가 틀렸습니다.'
      );
    }

    // 4) 토큰 발급 (companyId 포함)
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
