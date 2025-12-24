// 초대 토큰 생성 및 검증
import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '../../common/database/prisma.client';
import { env } from '../../config/env.config';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { Role } from '../user/user.types';

// 관리자가 초대를 생성할 때 필요한 입력값
type CreateInvitationInput = {
  companyId: string;
  email: string;
  name: string;
  role: Role;
  requestedByRole: Role;
};

// 토큰 검증이 성공했을 때, 프론트에 내려줄 공개 정보
// - 가입 페이지에서 name/email을 read-only로 채우는 용도
type PublicInvitationInfo = {
  email: string;
  name: string;
  role: Role;
};

// 초대 토큰 해시
function hashInviteToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

// 초대장이 사용 가능한지 확인 (isValid, isUsed, expiresAt 검사)
function assertInvitationUsable(invitation: {
  isValid: boolean;
  isUsed: boolean;
  expiresAt: Date;
}) {
  // 관리자가 초대를 무효화했거나(취소), 시스템이 폐기 처리했다면 차단
  if (!invitation.isValid) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_INVALID_TOKEN,
      '취소된 초대장입니다.'
    );
  }

  // 초대 링크는 1회성이어야 하므로 사용 완료 상태면 차단
  if (invitation.isUsed) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_INVALID_TOKEN,
      '이미 사용된 초대장입니다.'
    );
  }

  // 시간이 지나 만료되었으면 차단
  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_TOKEN_EXPIRED,
      '초대장이 만료되었습니다.'
    );
  }
}

export const invitationAuthService = {
  /**
   * 초대 생성
   *
   * 흐름:
   * 1) email 정규화(대소문자, 공백)
   * 2) 이미 가입된 users에 존재하면 초대 불가
   * 3) rawToken 생성 -> tokenHash 생성
   * 4) invitations 테이블에 tokenHash 저장(=schema의 token 컬럼에 해시 저장)
   * 5) rawToken은 "반환만" 하고 서버는 저장하지 않음(링크 생성에만 사용)
   *
   * 반환값:
   * - token: raw token (링크에 넣을 값)
   * - invitation: 초대 메타(응답에 같이 내려주면 관리자 UI에 유용)
   */
  async createInvitation(input: CreateInvitationInput) {
    if (input.requestedByRole !== 'ADMIN') {
      throw new CustomError(HttpStatus.FORBIDDEN, ErrorCodes.AUTH_FORBIDDEN, '관리자만 초대 가능');
    }

    // 1) email 정규화
    const email = input.email.trim().toLowerCase();

    // 2) 이미 가입된 users에 존재하면 초대 불가
    const existingUser = await prisma.users.findFirst({ where: { email } });
    if (existingUser) {
      throw new CustomError(
        HttpStatus.CONFLICT,
        ErrorCodes.USER_DETAIL_CONFLICT,
        '이미 가입된 이메일입니다.'
      );
    }

    // 3) 초대 이메일에 포함될 invitation 토큰 생성 (rawToken)
    const rawToken = randomUUID();

    // DB 저장용 해시 생성
    const tokenHash = hashInviteToken(rawToken);

    // 만료 시간 결정
    const expiresAt = new Date(Date.now() + env.INVITATION_EXPIRES_HOURS * 60 * 60 * 1000);

    // 재초대 시에는 update로 토큰/만료 갱신 (동일한 이메일에 여러 초대 레코드가 생기지 않음)
    const existingInvitation = await prisma.invitations.findUnique({ where: { email } });

    // 다른 회사에서 살아있는 초대가 걸린 이메일이면 충돌 처리
    if (existingInvitation && existingInvitation.companyId !== input.companyId) {
      const stillAlive =
        existingInvitation.isValid &&
        !existingInvitation.isUsed &&
        existingInvitation.expiresAt.getTime() > Date.now();

      if (stillAlive) {
        throw new CustomError(
          HttpStatus.CONFLICT,
          ErrorCodes.GENERAL_BAD_REQUEST,
          '이미 다른 회사에서 초대된 이메일입니다.'
        );
      }
    }

    // 4) invitations 테이블에 tokenHash 저장 (upsert)
    const invitation = existingInvitation
      ? await prisma.invitations.update({
          where: { email },
          data: {
            companyId: input.companyId,
            email,
            name: input.name,
            role: input.role,
            token: tokenHash,
            expiresAt,
            isUsed: false,
            isValid: true,
          },
        })
      : await prisma.invitations.create({
          data: {
            companyId: input.companyId,
            email,
            name: input.name,
            role: input.role,
            token: tokenHash,
            expiresAt,
            isUsed: false,
            isValid: true,
          },
        });

    // 반환되는 rawToken은 링크 생성에만 사용하고, 저장/로그는 금지 (보안 위험)
    return {
      token: rawToken,
      invitation: {
        id: invitation.id,
        companyId: invitation.companyId,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  },

  /**
   * 토큰 검증 + 공개 정보 반환
   *
   * 프론트 흐름:
   * - 사용자가 링크 클릭 -> 프론트가 token(raw)을 얻음
   * - 백엔드로 raw token 전달(현재는 GET param) -> 서버는 hash로 변환 -> DB 조회
   * - 유효하면 name/email을 반환 -> 가입 페이지에서 read-only 채움
   */
  async getPublicInfoByToken(rawToken: string): Promise<PublicInvitationInfo> {
    const tokenHash = hashInviteToken(rawToken);
    const invitation = await prisma.invitations.findUnique({ where: { token: tokenHash } });

    // 토큰 자체가 잘못된 경우(존재하지 않음)
    if (!invitation) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_TOKEN,
        '유효하지 않은 초대 토큰입니다.'
      );
    }

    // 존재하더라도 만료/취소/사용 상태면 가입 불가
    assertInvitationUsable(invitation);

    // 프론트가 필요로 하는 최소 정보만 반환(민감 정보 제외)
    return {
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
    };
  },
};
