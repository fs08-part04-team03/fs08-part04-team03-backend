// SSE를 이용하기 위해 클라이언트와 서버 간의 연결을 관리하는 모듈
import type { Response } from 'express';
import { logger } from '../../common/utils/logger.util';

// Client 연결 정보
type ClientConnection = {
  res: Response;
  keepAlive: NodeJS.Timeout;
};

const KEEP_ALIVE_MS = 30000;
const clients = new Map<string, ClientConnection>();

// 클라이언트 등록
function register(userId: string, res: Response) {
  const existing = clients.get(userId);

  // 단일 연결 보장: 기존 연결은 종료 후 교체
  if (existing) {
    clearInterval(existing.keepAlive);
    try {
      if (!existing.res.writableEnded && !existing.res.destroyed) {
        existing.res.end();
      }
    } catch (err) {
      logger.warn('[notification] 현재 SSE 연결 종료 중 오류', { userId, err });
    }
    clients.delete(userId);
  }

  // keep-alive로 중간 프록시 타임아웃 방지
  const keepAlive = setInterval(() => {
    try {
      if (!res.writableEnded && !res.destroyed) {
        res.write(': keep-alive\n\n');
      } else {
        clearInterval(keepAlive);
        clients.delete(userId);
      }
    } catch {
      clearInterval(keepAlive);
      clients.delete(userId);
    }
  }, KEEP_ALIVE_MS);

  clients.set(userId, { res, keepAlive });
}

// 클라이언트 등록 해제
function unregister(userId: string, res?: Response) {
  const existing = clients.get(userId);
  if (!existing) return;
  if (res && existing.res !== res) return;

  clearInterval(existing.keepAlive);
  try {
    if (!existing.res.writableEnded && !existing.res.destroyed) {
      existing.res.end();
    }
  } catch {
    // 무시
  }
  clients.delete(userId);
}

// 특정 사용자에게 이벤트 전송
function send(userId: string, payload: unknown) {
  const client = clients.get(userId);
  if (!client) return false;

  if (client.res.writableEnded || client.res.destroyed) return false;

  try {
    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

export const notificationStream = {
  register,
  unregister,
  send,
};
