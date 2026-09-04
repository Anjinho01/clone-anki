import toast from '@fuse/ui/toast';
import Notification from '@fuse/ui/Notification';
import type { NotificationPlacement } from '@fuse/@types/placement';

function normalizeNotificationMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error && message.message) {
    return message.message;
  }

  if (Array.isArray(message)) {
    const firstItem = message.find((item) => item != null);
    return normalizeNotificationMessage(firstItem);
  }

  if (message && typeof message === 'object') {
    if ('message' in message) {
      const nestedMessage = normalizeNotificationMessage(message.message);
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    if ('error' in message) {
      const nestedError = normalizeNotificationMessage(message.error);
      if (nestedError) {
        return nestedError;
      }
    }

    if ('details' in message) {
      const nestedDetails = normalizeNotificationMessage(message.details);
      if (nestedDetails) {
        return nestedDetails;
      }
    }
  }

  return 'Erro inesperado';
}

export function notify(message: unknown, placement: NotificationPlacement = 'top-center') {
  toast.push(<Notification closable title={normalizeNotificationMessage(message)} />, {
    placement,
  });
}

export function notifySuccess(message: unknown, placement: NotificationPlacement = 'top-center') {
  toast.push(
    <Notification closable type="success" title={normalizeNotificationMessage(message)} />,
    {
      placement,
    }
  );
}

export function notifyWarning(message: unknown, placement: NotificationPlacement = 'top-center') {
  toast.push(
    <Notification closable type="warning" title={normalizeNotificationMessage(message)} />,
    {
      placement,
    }
  );
}

export function notifyError(message: unknown, placement: NotificationPlacement = 'top-center') {
  toast.push(
    <Notification closable type="danger" title={normalizeNotificationMessage(message)} />,
    {
      placement,
    }
  );
}
