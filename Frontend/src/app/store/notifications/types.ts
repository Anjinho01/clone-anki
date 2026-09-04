export type AudienceRole = 'develop' | 'admin' | 'user';

export interface NotificationDTO {
  notification_id: number;
  user_id: number | null;
  audience_role: AudienceRole | null;
  title: string;
  message: string | null;
  link_url: string | null;
  link_params: Record<string, unknown> | null;
  is_read: 0 | 1;
  read_at: string | null;
  created_at: string; // ISO
  expires_at: string | null; // ISO | null
}

export interface Notification {
  id: number;
  title: string;
  message?: string | null;
  linkUrl?: string | null;
  linkParams?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}
