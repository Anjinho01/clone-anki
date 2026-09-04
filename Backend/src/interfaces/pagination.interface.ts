/**
 * Interfaces compartilhadas — paginação e respostas padronizadas
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export function parsePagination(page?: string | number, limit?: string | number): PaginationParams {
  const p = Math.max(1, parseInt(String(page || '1'), 10));
  const l = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));
  return { page: p, limit: l, offset: (p - 1) * l };
}
