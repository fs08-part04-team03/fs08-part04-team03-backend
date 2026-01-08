// SSE를 이용하기 위해 클라이언트와 서버 간의 연결을 관리하는 모듈
import type { Response } from 'express';

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
  if (existing) {
    clearInterval(existing.keepAlive);
    existing.res.end();
    clients.delete(userId);
  }

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, KEEP_ALIVE_MS);

  clients.set(userId, { res, keepAlive });
}

// 클라이언트 등록 해제
function unregister(userId: string, res?: Response) {
  const existing = clients.get(userId);
  if (!existing) return;
  if (res && existing.res !== res) return;

  clearInterval(existing.keepAlive);
  clients.delete(userId);
}

// 특정 사용자에게 이벤트 전송
function send(userId: string, payload: unknown) {
  const client = clients.get(userId);
  if (!client) return false;

  client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
  return true;
}

export const notificationStream = {
  register,
  unregister,
  send,
};
