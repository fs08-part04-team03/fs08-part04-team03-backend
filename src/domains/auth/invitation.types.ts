import type { Role } from '../user/user.types';

// 관리자 초대 생성 요청 바디
export type CreateInvitationBody = {
  email: string;
  name: string;
  role: Role;
};
