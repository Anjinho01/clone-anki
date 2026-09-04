import { notificationRepository } from '../repositories/notification.repository';
import type { AudienceRole } from '../models/notification.model';

export const notificationService = {
  /** Notifica usuários por role (broadcast) */
  async notifyRoles(input: {
    roles: AudienceRole[];
    title: string;
    message?: string | null;
    linkUrl?: string | null;
    linkLabel?: string | null;
    expiresAtDays?: number;
    metadata?: object | null;
    actorUserId?: number | null;
    excludeActor?: boolean;
  }): Promise<void> {
    const expiresAt =
      input.expiresAtDays && input.expiresAtDays > 0
        ? new Date(Date.now() + input.expiresAtDays * 24 * 60 * 60 * 1000)
        : null;

    await notificationRepository.createForRoles({
      roles: input.roles,
      title: input.title,
      message: input.message ?? null,
      linkUrl: input.linkUrl ?? null,
      linkLabel: input.linkLabel ?? null,
      metadata: input.metadata ?? null,
      expiresAt,
      actorUserId: input.actorUserId ?? null,
    });
  },

  /** Notifica usuários específicos por id (unicast) */
  async notifyUsers(input: {
    userIds: number[];
    title: string;
    message?: string | null;
    linkUrl?: string | null;
    linkLabel?: string | null;
    expiresAtDays?: number;
    metadata?: object | null;
    actorUserId?: number | null;
  }): Promise<void> {
    const expiresAt =
      input.expiresAtDays && input.expiresAtDays > 0
        ? new Date(Date.now() + input.expiresAtDays * 24 * 60 * 60 * 1000)
        : null;

    await notificationRepository.createForUsers({
      userIds: input.userIds,
      title: input.title,
      message: input.message ?? null,
      linkUrl: input.linkUrl ?? null,
      linkLabel: input.linkLabel ?? null,
      metadata: input.metadata ?? null,
      expiresAt,
      actorUserId: input.actorUserId ?? null,
    });
  },

  /** Novo usuário criado → notifica develop + admin */
  async onUserCreated(p: {
    actorUserId: number;
    createdUserId: number;
    createdUserName: string;
  }): Promise<void> {
    await this.notifyRoles({
      roles: ['develop', 'admin'],
      title: 'Novo usuário cadastrado',
      message: `Usuário criado: ${p.createdUserName}`,
      linkUrl: `/users/${p.createdUserId}`,
      linkLabel: 'Ver usuário',
      expiresAtDays: 30,
      metadata: { userId: p.createdUserId },
      actorUserId: p.actorUserId,
    });
  },
};
