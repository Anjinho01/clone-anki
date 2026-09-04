/**
 * Valida se uma string está no formato de e-mail.
 * Retorna true se for um e-mail válido, false caso contrário.
 */
export function validateEmail(input: string): boolean {
  if (typeof input !== 'string') return false;

  // remove espaços em branco nas extremidades
  const email = input.trim();

  // regex simples para verificar o formato básico de e-mail
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(email);
}
