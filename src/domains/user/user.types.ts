import type { AuthTokenPayload } from '../../common/types/common.types';

export type Role = AuthTokenPayload['role'];

// 사용자 프로필 정보
export type UserProfile = {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileImage?: string | null;
};

// 비밀번호 변경
export type UserProfilePatchBody = {
  newPassword: string;
  newPasswordConfirm: string;
};

// 회사명/비밀번호 변경
export type AdminProfilePatchBody = {
  companyName?: string;
  newPassword?: string;
  newPasswordConfirm?: string;
};

// 권한 변경
export type UpdateRoleBody = { role: Role };

// 활성/비활성 변경
export type UpdateStatusBody = { isActive: boolean };

// 회사 소속 사용자 목록 조회/검색 쿼리
export type UserListQuery = {
  q?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

// 회원 요약 정보
export type UserSummary = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
};
