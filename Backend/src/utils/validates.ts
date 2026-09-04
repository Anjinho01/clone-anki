/**
 * Validações e sanitização utilitárias reutilizáveis
 */

import disposableDomains from 'disposable-email-domains';

const disposableSet = new Set(disposableDomains);

/**
 * Verifica se um email é de domínio descartável
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? disposableSet.has(domain) : false;
}

/**
 * Sanitiza string removendo tags HTML básicas
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Sanitiza string removendo < > (prevenção XSS básica)
 * Padrão api-app-ade90
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Formata data para ISO-8601 com timezone de Brasília
 */
export function toISOBrasilia(date: Date): string {
  return date.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '-03:00';
}
