/* eslint-disable @typescript-eslint/no-explicit-any */
import api from 'api';
import type { NotificationDTO, Notification } from './types';

const parseMaybeJson = (val: any) => {
  if (!val) return undefined;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return undefined;
  }
};

const mapDTO = (n: NotificationDTO): Notification => ({
  id: (n as any).notificationId ?? (n as any).notification_id,
  title: n.title,
  message: n.message,
  linkUrl: (n as any).linkUrl ?? (n as any).link_url ?? undefined,
  linkParams: parseMaybeJson((n as any).linkParams ?? (n as any).link_params),
  isRead: Boolean((n as any).isRead ?? (n as any).is_read),
  readAt: (n as any).readAt ?? (n as any).read_at,
  createdAt: (n as any).createdAt ?? (n as any).created_at,
  expiresAt: (n as any).expiresAt ?? (n as any).expires_at ?? undefined,
});

export async function fetchNotifications(opts: {
  onlyUnread?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ items: Notification[]; total?: number }> {
  const { onlyUnread = false, limit = 8, offset = 0 } = opts;
  const { data } = await api.get('/notifications', {
    params: { onlyUnread: onlyUnread ? 1 : 0, limit, offset },
  });
  return {
    items: (data?.items ?? []).map(mapDTO),
    total: data?.total,
  };
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count');
  return Number(data?.count ?? 0);
}

export async function markAsRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.post(`/notifications/read-all`);
}
