import { getPool } from '../config/database';
import type { AudienceRole } from '../models/notification.model';

type BaseCreate = {
  title: string;
  message?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  expiresAt?: Date | null;
  metadata?: object | null;
  actorUserId?: number | null;
};

function toJsonOrNull(obj?: object | null): string | null {
  return obj ? JSON.stringify(obj) : null;
}

export const notificationRepository = {
  /** Unicast para lista de userId */
  async createForUsers(input: { userIds: number[] } & BaseCreate): Promise<void> {
    if (!input.userIds?.length) return;
    const pool = getPool();

    const placeholders = input.userIds.map(() => '(?, NULL, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const params: any[] = [];
    const linkParams = toJsonOrNull(input.metadata);
    for (const uid of input.userIds) {
      params.push(
        uid,
        input.title,
        input.message ?? null,
        input.linkUrl ?? null,
        input.linkLabel ?? null,
        linkParams,
        input.expiresAt ?? null,
        input.actorUserId ?? null
      );
    }
    await pool.query(
      `INSERT INTO tb_notifications
         (user_id, audience_role, title, message, link_url, link_label, link_params, expires_at, actor_user_id)
       VALUES ${placeholders}`,
      params
    );
  },

  /** Broadcast por roles */
  async createForRoles(input: { roles: AudienceRole[] } & BaseCreate): Promise<void> {
    if (!input.roles?.length) return;
    const pool = getPool();

    const placeholders = input.roles.map(() => '(NULL, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const params: any[] = [];
    const linkParams = toJsonOrNull(input.metadata);
    for (const role of input.roles) {
      params.push(
        role,
        input.title,
        input.message ?? null,
        input.linkUrl ?? null,
        input.linkLabel ?? null,
        linkParams,
        input.expiresAt ?? null,
        input.actorUserId ?? null
      );
    }
    await pool.query(
      `INSERT INTO tb_notifications
         (user_id, audience_role, title, message, link_url, link_label, link_params, expires_at, actor_user_id)
       VALUES ${placeholders}`,
      params
    );
  },

  async listForUser(
    userId: number,
    role: AudienceRole,
    opts?: { onlyUnread?: boolean; limit?: number; offset?: number }
  ): Promise<any[]> {
    const pool = getPool();
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
    const offset = Math.max(0, opts?.offset ?? 0);
    const onlyUnread = !!opts?.onlyUnread;

    const [rows] = await pool.query(
      `SELECT
         n.notification_id AS notificationId,
         n.user_id         AS userId,
         n.audience_role   AS audienceRole,
         n.title, n.message,
         n.link_url        AS linkUrl,
         n.link_label      AS linkLabel,
         n.link_params     AS linkParams,
         CASE
           WHEN n.user_id IS NOT NULL THEN n.is_read
           ELSE CASE WHEN nr.read_at IS NOT NULL THEN 1 ELSE 0 END
         END AS isRead,
         n.created_at  AS createdAt,
         CASE WHEN n.user_id IS NOT NULL THEN n.read_at ELSE nr.read_at END AS readAt,
         n.expires_at  AS expiresAt,
         n.actor_user_id AS actorUserId
       FROM tb_notifications n
       LEFT JOIN tb_notification_receipts nr
         ON nr.notification_id = n.notification_id AND nr.user_id = ?
       WHERE (n.user_id = ? OR n.audience_role = ?)
         AND (? = 0 OR
              CASE
                WHEN n.user_id IS NOT NULL THEN n.is_read = 0
                ELSE nr.read_at IS NULL
              END)
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, role, onlyUnread ? 1 : 0, limit, offset]
    );
    return rows as any[];
  },

  async unreadCountForUser(userId: number, role: AudienceRole): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt
         FROM tb_notifications n
         LEFT JOIN tb_notification_receipts nr
           ON nr.notification_id = n.notification_id AND nr.user_id = ?
        WHERE (n.user_id = ? OR n.audience_role = ?)
          AND (
            (n.user_id IS NOT NULL AND n.is_read = 0)
            OR (n.user_id IS NULL AND nr.read_at IS NULL)
          )`,
      [userId, userId, role]
    );
    return (rows as any[])[0]?.cnt ?? 0;
  },

  async markAsRead(notificationId: number, userId: number, role: AudienceRole): Promise<void> {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT notification_id, user_id, audience_role
         FROM tb_notifications
        WHERE notification_id = ? AND (user_id = ? OR audience_role = ?)`,
      [notificationId, userId, role]
    );
    const n = (rows as any[])[0];
    if (!n) return;

    if (n.user_id) {
      await pool.query(
        `UPDATE tb_notifications SET is_read = 1, read_at = NOW()
          WHERE notification_id = ? AND user_id = ?`,
        [notificationId, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO tb_notification_receipts (notification_id, user_id, read_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)`,
        [notificationId, userId]
      );
    }
  },

  async markAllAsRead(userId: number, role: AudienceRole): Promise<void> {
    const pool = getPool();
    // Unicast (notificações diretas ao usuário)
    await pool.query(
      `UPDATE tb_notifications SET is_read = 1, read_at = NOW()
        WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    // Broadcast (notificações por role ainda não lidas)
    await pool.query(
      `INSERT INTO tb_notification_receipts (notification_id, user_id, read_at)
       SELECT n.notification_id, ?, NOW()
         FROM tb_notifications n
         LEFT JOIN tb_notification_receipts nr
           ON nr.notification_id = n.notification_id AND nr.user_id = ?
        WHERE n.audience_role = ? AND nr.notification_id IS NULL`,
      [userId, userId, role]
    );
  },

  async purgeOld(): Promise<void> {
    const pool = getPool();
    await pool.query(
      `DELETE FROM tb_notifications
        WHERE (expires_at IS NOT NULL AND expires_at < NOW())
           OR (user_id IS NOT NULL AND is_read = 1 AND read_at < DATE_SUB(NOW(), INTERVAL 90 DAY))`
    );
  },
};
