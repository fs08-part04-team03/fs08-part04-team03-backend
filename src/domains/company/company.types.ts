import type { AuthTokenPayload } from '../../common/types/common.types';

export type CompanyUserRole = AuthTokenPayload['role'];

// 회사 상세 정보 타입
export type CompanyDetail = {
  id: string;
  name: string;
  businessNumber: string;
  createdAt: Date;
  updatedAt: Date;
};

// 회사 소속 유저 조회 요약 정보 타입
export type CompanyUserSummary = {
  id: string;
  email: string;
  name: string;
  role: CompanyUserRole;
  isActive: boolean;
  createdAt: Date;
};

// 회사 소속 유저 조회 쿼리 파라미터
export type CompanyUserQuery = {
  role?: CompanyUserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

// 회사명 변경 요청 바디 타입
export type UpdateCompanyNameBody = {
  name: string;
};
