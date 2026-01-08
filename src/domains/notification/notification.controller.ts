import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import { notificationService } from './notification.service';
import { notificationStream } from './notification.stream';
import type { NotificationListQuery } from './notification.types';

type NotificationIdParam = { id: string };
type NotificationListRequest = AuthenticatedRequest &
  Request<unknown, unknown, unknown, NotificationListQuery>;

const requireUserContext = (req: AuthenticatedRequest) => {
  if (!req.user) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '인증이 필요합니다.'
    );
  }
  return req.user;
};

export const notificationController = {
  // SSE(Server Sent Event) 연결
  stream: (req: AuthenticatedRequest, res: Response) => {
    const { id: userId } = requireUserContext(req);

    res.status(HttpStatus.OK); // SSE 상태 코드 200으로 고정
    res.setHeader('Content-Type', 'text/event-stream'); // SSE 콘텐츠 타입
    res.setHeader('Connection', 'keep-alive'); // 연결 유지
    res.setHeader('Cache-Control', 'no-cache'); // 캐시 방지
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 방지
    res.flushHeaders?.();
    res.write('retry: 10000\n\n');

    notificationStream.register(userId, res);

    // 클라이언트 연결 종료 시 정리
    req.on('close', () => {
      notificationStream.unregister(userId, res);
      res.end();
    });
  },

  // 알림 리스트 조회
  list: async (req: NotificationListRequest, res: Response) => {
    const { id: userId } = requireUserContext(req);
    const result = await notificationService.listNotifications(userId, req.query);

    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.successWithPagination(
          result.items,
          result.pagination,
          '알림 목록을 조회했습니다.'
        )
      );
  },

  // 읽지 않은 알림 개수 조회
  unreadCount: async (req: AuthenticatedRequest, res: Response) => {
    const { id: userId } = requireUserContext(req);
    const count = await notificationService.countUnread(userId);

    res
      .status(HttpStatus.OK)
      .json(ResponseUtil.success({ count }, '읽지 않은 알림 수를 조회했습니다.'));
  },

  // 알림 읽음 처리
  markRead: async (req: AuthenticatedRequest & Request<NotificationIdParam>, res: Response) => {
    const { id: userId } = requireUserContext(req);
    const updated = await notificationService.markRead(userId, req.params.id);

    res.status(HttpStatus.OK).json(ResponseUtil.success(updated, '알림을 읽음 처리했습니다.'));
  },
};
