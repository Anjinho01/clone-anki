/**
 * tokenStorage — fonte única de verdade para armazenamento de tokens de autenticação.
 *
 * Ambos api.js e apiService.js importam daqui, garantindo que as mesmas chaves
 * sejam usadas em todo o sistema. Se precisar mudar o mecanismo de storage no
 * futuro (ex.: sessionStorage, memória), muda em um único lugar.
 */

const ACCESS_TOKEN_KEY = 'access_token';

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}
/** Remove o access token local; refresh token permanece apenas em cookie httpOnly. */
export function clearAllTokens() {
  removeAccessToken();
}
