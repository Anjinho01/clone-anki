/* eslint-disable */
import { useSnackbar } from 'notistack';
import type { OptionsObject, SnackbarKey, SnackbarMessage } from 'notistack';

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

/**
 * Hook customizado para notificações
 * Substitui os alerts nativos por Snackbars do Material-UI
 */
function useNotification() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showSuccess = (message: SnackbarMessage, options: Partial<OptionsObject> = {}): SnackbarKey => {
    return enqueueSnackbar(normalizeNotificationMessage(message), {
      variant: 'success',
      autoHideDuration: 4000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options,
    });
  };

  const showError = (message: SnackbarMessage, options: Partial<OptionsObject> = {}): SnackbarKey => {
    return enqueueSnackbar(normalizeNotificationMessage(message), {
      variant: 'error',
      autoHideDuration: 6000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options,
    });
  };

  const showWarning = (message: SnackbarMessage, options: Partial<OptionsObject> = {}): SnackbarKey => {
    return enqueueSnackbar(normalizeNotificationMessage(message), {
      variant: 'warning',
      autoHideDuration: 5000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options,
    });
  };

  const showInfo = (message: SnackbarMessage, options: Partial<OptionsObject> = {}): SnackbarKey => {
    return enqueueSnackbar(normalizeNotificationMessage(message), {
      variant: 'info',
      autoHideDuration: 4000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    close: closeSnackbar,
  };
}

export default useNotification;
