import { role } from '@prisma/client';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { notificationStream } from './notification.stream';
import type {
  NotificationListQuery,
  NotificationPayload,
  NotificationTargetType,
} from './notification.types';
import { logger } from '../../common/utils/logger.util';

// 알림 레코드 타입
type NotificationRecord = {
  id: bigint;
  content: string;
  targetType: string;
  targetId: string;
  isRead: boolean;
  createdAt: Date;
};

const MANAGER_ROLES: role[] = [role.MANAGER, role.ADMIN];
const PURCHASE_REQUEST_TARGET_TYPE: NotificationTargetType = 'PURCHASE_REQUEST';
const APPROVAL_NOTICE_TARGET_TYPE: NotificationTargetType = 'APPROVAL_NOTICE';
const DENIAL_NOTICE_TARGET_TYPE: NotificationTargetType = 'DENIAL_NOTICE';

function serializeNotification(notification: NotificationRecord): NotificationPayload {
  return {
    id: notification.id.toString(),
    content: notification.content,
    targetType: notification.targetType as NotificationTargetType,
    targetId: notification.targetId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

function parseNotificationId(rawId: string): bigint {
  try {
    return BigInt(rawId);
  } catch {
    throw new CustomError(
      HttpStatus.BAD_REQUEST,
      ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
      'ID 형식이 올바르지 않습니다.'
    );
  }
}

// 알림 생성/푸쉬
async function createAndPush(
  receiverId: string,
  content: string,
  targetType: NotificationTargetType,
  targetId: string
) {
  const created = await prisma.notifications.create({
    data: {
      receiverId,
      content,
      targetType,
      targetId,
    },
  });

  const payload = serializeNotification(created);
  notificationStream.send(receiverId, payload);
  return payload;
}

export const notificationService = {
  // 알림 목록 조회
  async listNotifications(receiverId: string, query: NotificationListQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.notifications.count({
      where: {
        receiverId,
      },
    });

    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        targetType: true,
        targetId: true,
        isRead: true,
        createdAt: true,
      },
    });

    return {
      items: notifications.map(serializeNotification),
      pagination: { page, limit, total },
    };
  },

  // 읽지 않은 알림 개수 조회
  async countUnread(receiverId: string) {
    return prisma.notifications.count({
      where: {
        receiverId,
        isRead: false,
      },
    });
  },

  // 알림 읽음 처리
  async markRead(receiverId: string, rawNotificationId: string) {
    const notificationId = parseNotificationId(rawNotificationId);

    const updateResult = await prisma.notifications.updateMany({
      where: {
        id: notificationId,
        receiverId,
      },
      data: {
        isRead: true,
      },
    });

    if (updateResult.count === 0) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOTIFICATION_NOT_FOUND,
        '알림을 찾을 수 없습니다.'
      );
    }

    const updated = await prisma.notifications.findUnique({
      where: {
        id: notificationId,
      },
      select: {
        id: true,
        content: true,
        targetType: true,
        targetId: true,
        isRead: true,
        createdAt: true,
      },
    });

    if (!updated) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOTIFICATION_NOT_FOUND,
        '알림을 찾을 수 없습니다.'
      );
    }

    return serializeNotification(updated);
  },

  // 알림 생성/푸시 외부 호출용
  createAndPush,

  // 구매 요청 알림 발송
  async notifyPurchaseRequested(companyId: string, requesterId: string, purchaseRequestId: string) {
    const [requester, recipients] = await Promise.all([
      // 요청자 이름 조회
      prisma.users.findUnique({
        where: {
          id: requesterId,
        },
        select: {
          name: true,
        },
      }),
      // 해당 회사에 속하는 매니저/어드민 모두 조회
      prisma.users.findMany({
        where: {
          companyId,
          role: {
            in: MANAGER_ROLES,
          },
          isActive: true,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (recipients.length === 0) return;

    const requesterName = requester?.name || 'User';
    const content = `${requesterName}님이 구매 요청을 보냈습니다.`;

    await Promise.all(
      recipients.map((receiver) =>
        createAndPush(receiver.id, content, PURCHASE_REQUEST_TARGET_TYPE, purchaseRequestId)
      )
    );
  },

  // 구매 승인 알림 발송
  async notifyPurchaseApproved(requesterId: string, purchaseRequestId: string) {
    const content = '구매 요청이 승인되었습니다.';
    await createAndPush(requesterId, content, APPROVAL_NOTICE_TARGET_TYPE, purchaseRequestId);
  },

  // 구매 거절 알림 발송
  async notifyPurchaseDenied(requesterId: string, purchaseRequestId: string) {
    const content = '구매 요청이 거절되었습니다.';
    await createAndPush(requesterId, content, DENIAL_NOTICE_TARGET_TYPE, purchaseRequestId);
  },

  // 오래된 알림 정리 (cronJob에서만 사용)
  async cleanupOldNotifications(retentionDays: number) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    try {
      return await prisma.notifications.deleteMany({
        where: {
          createdAt: {
            lt: cutoff,
          },
        },
      });
    } catch (err) {
      logger.error(
        '[notification] cleanup failed',
        err instanceof Error ? { message: err.message, stack: err.stack } : err
      );
      throw err;
    }
  },
};
