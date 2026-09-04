import axios from 'axios';

export type ApiValidationDetail = {
  field?: string;
  message: string;
};

export function isRequestCanceledError(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) {
    return true;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { name?: unknown }).name === 'CanceledError';
}

function fromUnknownMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = fromUnknownMessage(item);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (value && typeof value === 'object') {
    if ('details' in value) {
      const nested = fromUnknownMessage(value.details);
      if (nested) {
        return nested;
      }
    }

    if ('msg' in value) {
      const nested = fromUnknownMessage(value.msg);
      if (nested) {
        return nested;
      }
    }

    if ('message' in value) {
      const nested = fromUnknownMessage(value.message);
      if (nested) {
        return nested;
      }
    }

    if ('error' in value) {
      const nested = fromUnknownMessage(value.error);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function collectValidationDetails(value: unknown): ApiValidationDetail[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectValidationDetails(item));
  }

  if ('details' in value) {
    return collectValidationDetails((value as { details?: unknown }).details);
  }

  const field = 'field' in value ? (value as { field?: unknown }).field : undefined;
  const message = 'message' in value ? (value as { message?: unknown }).message : undefined;

  if (typeof message === 'string' && message.trim()) {
    return [
      {
        field: typeof field === 'string' && field.trim() ? field : undefined,
        message,
      },
    ];
  }

  if ('error' in value) {
    return collectValidationDetails((value as { error?: unknown }).error);
  }

  return [];
}

export function extractApiValidationDetails(error: unknown): ApiValidationDetail[] {
  if (axios.isAxiosError(error)) {
    return collectValidationDetails(error.response?.data);
  }

  return collectValidationDetails(error);
}

export default function extractApiErrorMessage(
  error: unknown,
  fallback = 'Erro inesperado'
): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    const responseMessage = fromUnknownMessage(responseData);
    if (responseMessage) {
      return responseMessage;
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const genericMessage = fromUnknownMessage(error);
  return genericMessage || fallback;
}
