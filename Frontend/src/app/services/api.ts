import axios from 'axios';
import { getAccessToken, setAccessToken, clearAllTokens } from './tokenStorage';

export const baseURL = process.env.API_URL || '';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // O backend armazena o refresh token em cookie httpOnly.
  // withCredentials garante envio/rotação do cookie nas rotas /auth.
  withCredentials: true,
});

// ====== Request: injeta Bearer ======
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ====== Refresh guard (de-duplicado) ======
let refreshPromise: Promise<string> | null = null;

/**
 * Renova o access token usando o refresh token httpOnly salvo em cookie.
 */
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await api.post('/auth/refresh');
      const refreshBody = res.data?.data ?? res.data;
      const newToken = refreshBody?.accessToken ?? refreshBody?.token;
      if (!newToken) throw new Error('Refresh sem token na resposta');

      setAccessToken(newToken);

      return newToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ====== Response: em 401 tenta refresh e refaz a request ======
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;

    // Se não tem response, só propaga
    if (!err.response) return Promise.reject(err);

    const status = err.response.status ?? 0;

    // Não tenta refresh para rotas de auth (evita loops infinitos)
    const url = original?.url ?? '';
    const isAuthRoute = url.startsWith('/auth/signin') || url.startsWith('/auth/refresh');

    if (status !== 401 || original?._retry || isAuthRoute) {
      return Promise.reject(err);
    }

    // marca para evitar loop
    original._retry = true;

    try {
      const newToken = await refreshAccessToken();
      original.headers = {
        ...(original.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };

      // Notifica a aplicação (AuthContext → reauthSockets).
      // Usa CustomEvent no window porque api.js não tem acesso ao apiService.
      window.dispatchEvent(new CustomEvent('auth:token-refreshed'));

      return api(original);
    } catch (e) {
      clearAllTokens();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return Promise.reject(e ?? err);
    }
  }
);

export default api;
