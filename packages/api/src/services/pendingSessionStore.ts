import crypto from 'node:crypto';

interface PendingSession {
  id: string;
  phone: string;
  userId?: string; // set on password login
  expiresAt: number; // epoch ms
}

const SESSIONS = new Map<string, PendingSession>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function createPendingSession(data: Omit<PendingSession, 'id' | 'expiresAt'>): PendingSession {
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + TTL_MS;
  const session: PendingSession = { id, expiresAt, ...data };
  SESSIONS.set(id, session);
  return session;
}

export function getPendingSession(id: string): PendingSession | null {
  const s = SESSIONS.get(id);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    SESSIONS.delete(id);
    return null;
  }
  return s;
}

export function deletePendingSession(id: string) {
  SESSIONS.delete(id);
}
