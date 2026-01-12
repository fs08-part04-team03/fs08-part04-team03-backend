import argon2 from 'argon2';
import type { Prisma } from '@prisma/client';
import { role as RoleEnum } from '@prisma/client';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { uploadService } from '../upload/upload.service';
import { s3Client, S3_BUCKET_NAME, PRESIGNED_URL_EXPIRES_IN } from '../../config/s3.config';
import type { AdminProfilePatchBody, UserListQuery, Role } from './user.types';

// 공개 가능한 필드만 선택
const userSafeSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
};

// 사용자 조회 (존재 여부만 확인)
async function getUser(userId: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) {
    throw new CustomError(HttpStatus.NOT_FOUND, ErrorCodes.USER_NOT_FOUND, 'User not found.');
  }
  return user;
}

// 같은 회사 여부 확인
async function getUserInCompany(companyId: string, userId: string) {
  const user = await getUser(userId);
  if (!user.companyId) {
    throw new CustomError(
      HttpStatus.FORBIDDEN,
      ErrorCodes.AUTH_FORBIDDEN,
      '회사에 소속되지 않은 사용자입니다.'
    );
  }
  if (user.companyId !== companyId) {
    throw new CustomError(
      HttpStatus.FORBIDDEN,
      ErrorCodes.AUTH_FORBIDDEN,
      '유저가 소속된 회사가 아닙니다.'
    );
  }
  return user;
}

// 동일 회사 + 활성(isActive) 사용자 확인
async function ensureActiveUserInCompany(companyId: string, userId: string) {
  const user = await getUserInCompany(companyId, userId);
  if (!user.isActive) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '비활성화된 계정입니다.'
    );
  }
  return user;
}

export const userService = {
  // 내 프로필 조회
  async getProfile(userId: string) {
    const user = await getUser(userId);
    if (!user.isActive) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '비활성화된 계정입니다.'
      );
    }

    let profileImagePresignedUrl: string | null = null;
    if (user.profileImage) {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: user.profileImage,
      });
      profileImagePresignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
      });
    }

    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profileImage: profileImagePresignedUrl,
    };
  },

  // 비밀번호 변경 및 프로필 이미지 업데이트 (유저/매니저)
  async updateMyProfile(userId: string, newPassword?: string, file?: Express.Multer.File) {
    const user = await getUser(userId);
    if (!user.isActive) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '비활성화된 계정입니다.'
      );
    }

    let imageKey: string | null = null;
    const oldImageKey = user.profileImage;
    let hashedPassword: string | undefined;

    try {
      // 비밀번호 해싱
      if (newPassword) {
        hashedPassword = await argon2.hash(newPassword);
      }

      // 새 이미지 업로드
      if (file) {
        const uploadResult = await uploadService.uploadImage(
          file,
          userId,
          user.companyId,
          undefined,
          'users'
        );
        imageKey = uploadResult.data.key;
      }

      // 프로필 업데이트
      const updateData: Prisma.usersUpdateInput = {};
      if (hashedPassword) {
        updateData.password = hashedPassword;
        updateData.refreshToken = null;
      }
      if (file) {
        updateData.profileImage = imageKey;
      }

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: updateData,
        select: userSafeSelect,
      });

      // 기존 이미지 삭제 (새 이미지가 업로드된 경우에만)
      if (file && oldImageKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: oldImageKey,
            })
          );
          await prisma.uploads.delete({ where: { key: oldImageKey } }).catch(() => {});
        } catch (deleteError) {
          console.error('기존 프로필 이미지 삭제 실패:', deleteError);
        }
      }

      return updatedUser;
    } catch (error) {
      // 업로드된 새 이미지 정리
      if (imageKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: imageKey,
            })
          );
          await prisma.uploads.delete({ where: { key: imageKey } }).catch(() => {});
        } catch (cleanupError) {
          console.error('새 이미지 정리 실패:', cleanupError);
        }
      }
      throw error;
    }
  },

  // 비밀번호/회사명/프로필 이미지 변경 (관리자)
  async adminPatchProfile(
    actorUserId: string,
    companyId: string,
    payload: AdminProfilePatchBody,
    file?: Express.Multer.File
  ) {
    const actor = await ensureActiveUserInCompany(companyId, actorUserId);

    let imageKey: string | null = null;
    const oldImageKey = actor.profileImage;
    let hashedPassword: string | undefined;

    try {
      // 트랜잭션 외부에서 비밀번호 해싱
      if (payload.newPassword) {
        hashedPassword = await argon2.hash(payload.newPassword);
      }

      // 새 이미지 업로드
      if (file) {
        const uploadResult = await uploadService.uploadImage(
          file,
          actorUserId,
          companyId,
          undefined,
          'users'
        );
        imageKey = uploadResult.data.key;
      }

      await prisma.$transaction(async (tx) => {
        if (payload.companyName) {
          const company = await tx.companies.findUnique({ where: { id: companyId } });
          if (!company) {
            throw new CustomError(
              HttpStatus.NOT_FOUND,
              ErrorCodes.GENERAL_NOT_FOUND,
              '회사를 찾을 수 없습니다.'
            );
          }
          await tx.companies.update({
            where: { id: companyId },
            data: { name: payload.companyName },
          });
        }

        const updateData: Prisma.usersUpdateInput = {};
        if (hashedPassword) {
          updateData.password = hashedPassword;
          updateData.refreshToken = null;
        }
        if (file) {
          updateData.profileImage = imageKey;
        }

        if (Object.keys(updateData).length > 0) {
          await tx.users.update({
            where: { id: actor.id },
            data: updateData,
          });
        }
      });

      // 기존 이미지 삭제 (새 이미지가 업로드된 경우에만)
      if (file && oldImageKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: oldImageKey,
            })
          );
          await prisma.uploads.delete({ where: { key: oldImageKey } }).catch(() => {});
        } catch (deleteError) {
          console.error('기존 프로필 이미지 삭제 실패:', deleteError);
        }
      }
    } catch (error) {
      // 업로드된 새 이미지 정리
      if (imageKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: imageKey,
            })
          );
          await prisma.uploads.delete({ where: { key: imageKey } }).catch(() => {});
        } catch (cleanupError) {
          console.error('새 이미지 정리 실패:', cleanupError);
        }
      }
      throw error;
    }
  },

  // 권한 변경 (관리자)
  async updateRole(actorCompanyId: string, targetUserId: string, role: Role, actorUserId: string) {
    await ensureActiveUserInCompany(actorCompanyId, actorUserId);
    const user = await getUserInCompany(actorCompanyId, targetUserId);

    if (user.id === actorUserId && user.role === RoleEnum.ADMIN && role !== RoleEnum.ADMIN) {
      throw new CustomError(
        HttpStatus.FORBIDDEN,
        ErrorCodes.AUTH_FORBIDDEN,
        '관리자가 스스로 ADMIN 권한을 변경할 수 없습니다.'
      );
    }
    return prisma.users.update({ where: { id: user.id }, data: { role }, select: userSafeSelect });
  },

  // 활성/비활성 전환 (관리자)
  async updateStatus(
    actorCompanyId: string,
    targetUserId: string,
    isActive: boolean,
    actorUserId: string
  ) {
    await ensureActiveUserInCompany(actorCompanyId, actorUserId);
    const user = await getUserInCompany(actorCompanyId, targetUserId);

    if (user.id === actorUserId) {
      throw new CustomError(
        HttpStatus.FORBIDDEN,
        ErrorCodes.AUTH_FORBIDDEN,
        '자신의 활성 여부를 변경할 수 없습니다.'
      );
    }
    return prisma.users.update({
      where: { id: user.id },
      data: { isActive, refreshToken: isActive ? undefined : null },
      select: userSafeSelect,
    });
  },

  // 회사 소속 사용자 목록 조회/검색 (관리자)
  async listUsers(companyId: string, actorUserId: string, query: UserListQuery) {
    await ensureActiveUserInCompany(companyId, actorUserId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.usersWhereInput = {
      companyId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        select: userSafeSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { users, pagination: { page, limit, total } };
  },
};
