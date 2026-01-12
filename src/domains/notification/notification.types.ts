// 알림 목록 타입
export type NotificationListQuery = {
  page?: number;
  limit?: number;
};

// 알림 타입
export type NotificationTargetType =
  | 'PURCHASE_REQUEST'
  | 'APPROVAL_NOTICE'
  | 'DENIAL_NOTICE'
  | 'ADMIN_MESSAGE'
  | 'GENERAL_NOTICE';

// 어드민 알림 바디 타입
export type NotificationBroadcastBody = {
  content: string;
};

// 알림 페이로드 타입
export type NotificationPayload = {
  id: string;
  content: string;
  targetType: NotificationTargetType;
  targetId: string;
  isRead: boolean;
  createdAt: Date;
};
