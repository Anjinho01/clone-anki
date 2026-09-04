const INVALID_CREDENTIALS_MESSAGES = new Set([
  'Credenciais inválidas',
  'E-mail ou senha inválidos!',
  'Email ou senha inválidos!',
]);

function normalizeAuthMessage(message: string, statusCode?: number): string {
  if (INVALID_CREDENTIALS_MESSAGES.has(message) || statusCode === 401) {
    return 'Email e/ou senha incorretos';
  }

  return message;
}

export default function extractAuthErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) {
    return normalizeAuthMessage(error);
  }

  if (!error || typeof error !== 'object') {
    return 'Erro ao fazer login';
  }

  const candidate = error as {
    message?: unknown;
    error?: unknown;
    response?: {
      status?: number;
      data?: {
        message?: unknown;
        error?: unknown;
      };
    };
  };

  const statusCode = candidate.response?.status;
  const values = [
    candidate.response?.data?.error,
    candidate.response?.data?.message,
    candidate.error,
  ];

  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return normalizeAuthMessage(value, statusCode);
    }

    if (value && typeof value === 'object' && 'message' in value) {
      const nestedMessage = (value as { message?: unknown }).message;
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        return normalizeAuthMessage(nestedMessage, statusCode);
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return normalizeAuthMessage(error.message, statusCode);
  }

  if (statusCode === 401) {
    return 'Email e/ou senha incorretos';
  }

  return 'Erro ao fazer login';
}
