import argon2 from 'argon2';
import { prisma } from '../../common/database/prisma.client';
import { JwtUtil } from '../../common/utils/jwt.util';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';

type LoginInput = { email: string; password: string };

export const authService = {
  // 로그인
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

    // 3) access 토큰 발급 (companyId 포함)
    const accessToken = JwtUtil.generateAccessToken(
      JwtUtil.buildAccessPayload({
        companyId: user.companyId,
        id: user.id,
        email: user.email,
        role: user.role,
      })
    );

    // 4) refresh 토큰 발급 및 해시 저장
    const refreshToken = JwtUtil.generateRefreshToken({
      userId: user.id,
      jti: crypto.randomUUID(),
    });
    const refreshTokenHash = await argon2.hash(refreshToken);
    await prisma.users.update({ where: { id: user.id }, data: { refreshToken: refreshTokenHash } });

    return {
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  // refresh
  async refresh(refreshToken: string) {
    // 1) JWT 서명/만료 검증 및 userId 추출
    const payload = JwtUtil.verifyRefreshToken(refreshToken);

    // 2) 사용자 조회 및 해시 검증
    const user = await prisma.users.findUnique({ where: { id: payload.userId } });
    if (!user || !user.refreshToken) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '유효하지 않은 유저입니다.'
      );
    }

    // 3) 비활성 계정
    if (!user.isActive) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '비활성화된 계정입니다'
      );
    }

    // 3) refresh 토큰 해시 검증
    const ok = await argon2.verify(user.refreshToken, refreshToken);
    if (!ok) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '유효하지 않은 Refresh Token입니다.'
      );
    }

    // 4) 새 access/refresh 토큰 발급
    const accessToken = JwtUtil.generateAccessToken(
      JwtUtil.buildAccessPayload({
        companyId: user.companyId,
        id: user.id,
        email: user.email,
        role: user.role,
      })
    );
    const newRefreshToken = JwtUtil.generateRefreshToken({
      userId: user.id,
      jti: crypto.randomUUID(),
    });
    const newRefreshHash = await argon2.hash(newRefreshToken);

    // 5) refresh 토큰 갱신
    await prisma.users.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshHash },
    });

    return {
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  // 로그아웃
  async logoutByToken(refreshToken: string) {
    try {
      const { userId } = JwtUtil.verifyRefreshToken(refreshToken);
      await prisma.users.update({ where: { id: userId }, data: { refreshToken: null } });
    } catch {
      // 토큰이 만료/위조되어도 무시하고 로그아웃 처리
    }
  },
};
