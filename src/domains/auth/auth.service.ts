import argon2 from 'argon2';
import { createHash, randomUUID } from 'node:crypto';
import { role } from '@prisma/client';
import { prisma } from '../../common/database/prisma.client';
import { JwtUtil } from '../../common/utils/jwt.util';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';

// 회원가입 입력 타입
type SignupInput = {
  name: string;
  email: string;
  password: string;
  inviteToken: string;
  profileImage?: string | null;
};

// 어드민 회원가입 입력 타입
type AdminRegisterInput = {
  name: string;
  email: string;
  password: string;
  companyName: string;
  businessNumber: string;
  profileImage?: string | null;
};

type LoginInput = { email: string; password: string };

// 초대장 사용 가능 여부 검사
function assertInvitationUsable(invitation: {
  isValid: boolean;
  isUsed: boolean;
  expiresAt: Date;
}) {
  if (!invitation.isValid) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_INVALID_TOKEN,
      '취소된 초대장입니다.'
    );
  }
  if (invitation.isUsed) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_INVALID_TOKEN,
      '이미 사용된 초대장입니다.'
    );
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_TOKEN_EXPIRED,
      '초대장이 만료되었습니다.'
    );
  }
}

function hashInviteToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export const authService = {
  // 회원가입
  async signup({ name, email, password, inviteToken, profileImage }: SignupInput) {
    if (!inviteToken) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        '초대 토큰이 필요합니다.'
      );
    }

    // 초대장 조회를 먼저 수행하여 companyId 확보
    const tokenHash = hashInviteToken(inviteToken);
    const invitation = await prisma.invitations.findUnique({ where: { token: tokenHash } });
    if (!invitation) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        '유효하지 않은 초대장입니다.'
      );
    }
    assertInvitationUsable(invitation);

    // 중복 이메일 검사
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.users.findFirst({
      where: { email: normalizedEmail, companyId: invitation.companyId },
    });
    if (existingUser) {
      throw new CustomError(
        HttpStatus.CONFLICT,
        ErrorCodes.USER_DETAIL_CONFLICT,
        '이미 가입된 이메일입니다.'
      );
    }

    // 초대장 조회 및 검증
    assertInvitationUsable(invitation);
    if (invitation.email !== normalizedEmail) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        '초대된 이메일과 일치하지 않습니다.'
      );
    }

    const passwordHash = await argon2.hash(password);
    const profileImageValue = profileImage ? profileImage.trim() : null;

    return prisma.$transaction(async (tx) => {
      // 사용자 생성
      const user = await tx.users.create({
        data: {
          companyId: invitation.companyId,
          email: normalizedEmail,
          name,
          role: invitation.role,
          password: passwordHash,
          isActive: true,
          profileImage: profileImageValue,
        },
        select: {
          id: true,
          companyId: true,
          email: true,
          name: true,
          role: true,
          profileImage: true,
        },
      });

      // 리프레시 토큰 발급/저장
      const refreshToken = JwtUtil.generateRefreshToken({ id: user.id, jti: randomUUID() });
      const refreshTokenHash = await argon2.hash(refreshToken);
      await tx.users.update({ where: { id: user.id }, data: { refreshToken: refreshTokenHash } });

      // 초대장 소진 처리
      await tx.invitations.update({
        where: { id: invitation.id },
        data: { isUsed: true, isValid: false },
      });

      const accessToken = JwtUtil.generateAccessToken(
        JwtUtil.buildAccessPayload({
          companyId: user.companyId,
          id: user.id,
          email: user.email,
          role: user.role,
        })
      );

      return { user, accessToken, refreshToken };
    });
  },

  // 어드민 회원가입
  async adminRegister({
    name,
    email,
    password,
    companyName,
    businessNumber,
    profileImage,
  }: AdminRegisterInput) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCompanyName = companyName.trim();
    const normalizedBusinessNumber = businessNumber.trim();
    const passwordHash = await argon2.hash(password);
    const profileImageValue = profileImage ? profileImage.trim() : null;

    // 사업자 번호 중복 검사 및 회사/어드민 유저 생성
    return prisma.$transaction(async (tx) => {
      const existingCompany = await tx.companies.findFirst({
        where: { businessNumber: normalizedBusinessNumber },
      });

      if (existingCompany) {
        throw new CustomError(
          HttpStatus.CONFLICT,
          ErrorCodes.DB_UNIQUE_CONSTRAINT_VIOLATION,
          '사업자 번호가 이미 존재합니다.'
        );
      }

      // 회사 생성
      const company = await tx.companies.create({
        data: {
          name: normalizedCompanyName,
          businessNumber: normalizedBusinessNumber,
        },
        select: {
          id: true,
          name: true,
          businessNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 예산 기준 초기화 (0원으로 기본값 설정)
      await tx.budgetCriteria.create({
        data: { companyId: company.id, amount: 0 },
      });

      // 최고 관리자 생성
      const user = await tx.users.create({
        data: {
          companyId: company.id,
          email: normalizedEmail,
          name,
          role: role.ADMIN,
          password: passwordHash,
          isActive: true,
          profileImage: profileImageValue,
        },
        select: {
          id: true,
          companyId: true,
          email: true,
          name: true,
          role: true,
          profileImage: true,
        },
      });

      // 로그인 정보 생성 (refresh/access token 발급 및 저장)
      const refreshToken = JwtUtil.generateRefreshToken({
        id: user.id,
        jti: randomUUID(),
      });
      const refreshTokenHash = await argon2.hash(refreshToken);
      await tx.users.update({
        where: { id: user.id },
        data: { refreshToken: refreshTokenHash },
      });

      const accessToken = JwtUtil.generateAccessToken(
        JwtUtil.buildAccessPayload({
          companyId: user.companyId,
          id: user.id,
          email: user.email,
          role: user.role,
        })
      );

      return { user, company, accessToken, refreshToken };
    });
  },

  // 로그인
  async login({ email, password }: LoginInput) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.users.findFirst({ where: { email: normalizedEmail } });

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
      id: user.id,
      jti: randomUUID(),
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
        profileImage: user.profileImage,
      },
      accessToken,
      refreshToken,
    };
  },

  // refresh
  async refresh(refreshToken: string) {
    // 1) JWT 서명/만료 검증 및 id 추출
    const payload = JwtUtil.verifyRefreshToken(refreshToken);

    // 2) 사용자 조회 및 해시 검증
    const user = await prisma.users.findUnique({ where: { id: payload.id } });
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

    // 4) refresh 토큰 해시 검증
    const ok = await argon2.verify(user.refreshToken, refreshToken);
    if (!ok) {
      // 재사용/탈취 의심 - 기존 토큰 무효화
      await prisma.users.updateMany({
        where: { id: user.id, refreshToken: user.refreshToken },
        data: { refreshToken: null },
      });

      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '유효하지 않은 Refresh Token입니다.'
      );
    }

    // 5) 새 access/refresh 토큰 발급
    const accessToken = JwtUtil.generateAccessToken(
      JwtUtil.buildAccessPayload({
        companyId: user.companyId,
        id: user.id,
        email: user.email,
        role: user.role,
      })
    );
    const newRefreshToken = JwtUtil.generateRefreshToken({
      id: user.id,
      jti: randomUUID(),
    });
    const newRefreshHash = await argon2.hash(newRefreshToken);

    // 6) refresh 토큰 갱신 (원자적 업데이트로 재사용 방지)
    const updateResult = await prisma.users.updateMany({
      // 현재 DB의 해시가 검증한 해시와 동일할 때만 업데이트
      where: { id: user.id, refreshToken: user.refreshToken },
      data: { refreshToken: newRefreshHash },
    });

    // 업데이트 실패 시 = 다른 요청이 먼저 토큰을 갱신했음 = 재사용 시도
    if (updateResult.count === 0) {
      // 보안을 위해 해당 사용자의 모든 refresh token 무효화
      await prisma.users.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Refresh token이 이미 사용되었습니다. 보안을 위해 재로그인이 필요합니다.'
      );
    }

    return {
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  // 로그아웃
  async logoutByToken(refreshToken: string) {
    try {
      const { id } = JwtUtil.verifyRefreshToken(refreshToken);
      await prisma.users.update({ where: { id }, data: { refreshToken: null } });
    } catch {
      // 토큰이 만료/위조되어도 무시하고 로그아웃 처리
    }
  },
};
