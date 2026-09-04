import { RowDataPacket } from 'mysql2';
import type { RoleName } from './user.model';

export type AudienceRole = RoleName; // 'develop' | 'admin' | 'user'

export interface NotificationRow extends RowDataPacket {
  notificationId: number;
  userId: number | null;
  audienceRole: AudienceRole | null;
  title: string;
  message: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  linkParams: string | null;
  isRead: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  actorUserId: number | null;
}
