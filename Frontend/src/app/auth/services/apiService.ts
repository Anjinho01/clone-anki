import FuseUtils from '@/@fuse/utils/FuseUtils';
import api from 'api';
import apiServiceConfig from './apiServiceConfig';
import { systemRoles } from 'app/auth/authRoles';
import { getAccessToken, setAccessToken, clearAllTokens } from 'tokenStorage';
import extractAuthErrorMessage from '../utils/extractAuthErrorMessage';

class ApiService extends FuseUtils.EventEmitter {
  /** Evita execução concorrente (ex.: React StrictMode double-invoke). */
  _authInProgress = false;

  init() {
    this.handleAuthentication();
  }

  /**
   * Verifica o estado de autenticação ao carregar a aplicação.
   *
   * Casos cobertos:
   * 1. Access token presente (válido ou expirado) → valida via /auth/me.
   *    Se expirado, o interceptor do axios renova automaticamente.
   * 2. Access token ausente → tenta renovar silenciosamente via cookie httpOnly.
   * 3. Se refresh falhar → limpa sessão e redireciona para login.
   */
  handleAuthentication = async () => {
    if (this._authInProgress) return;
    this._authInProgress = true;

    const accessToken = getAccessToken();

    // Access token ausente: tenta renovar via cookie httpOnly antes de chamar /auth/me.
    if (!accessToken) {
      try {
        const res = await api.post(apiServiceConfig.refresh);
        const refreshBody = res.data?.data ?? res.data;
        const newAccessToken = refreshBody?.accessToken ?? refreshBody?.token;
        if (!newAccessToken) {
          throw new Error('Refresh sem access token');
        }

        setAccessToken(newAccessToken);
        this.emit('onTokenRefreshed');
      } catch {
        clearAllTokens();
        this._authInProgress = false;
        this.emit('onAutoLogout', 'Sessão expirada');
        return;
      }
    }

    // Valida o access token (expirado → interceptor renova e retenta transparentemente).
    this.signInWithToken()
      .then((userData) => {
        this.emit('onAutoLogin', userData);
      })
      .catch(() => {
        clearAllTokens();
        this.emit('onAutoLogout', 'Sessão expirada');
      })
      .finally(() => {
        this._authInProgress = false;
      });
  };

  /** Realiza login com credenciais. Salva access e refresh token. */
  signInWithEmailAndPassword = (
    email: string,
    password: string,
    remember = false,
    recaptchaToken: string | null = null
  ) =>
    new Promise((resolve, reject) => {
      const payload: {
        email: string;
        password: string;
        remember: boolean;
        recaptchaToken?: string;
      } = { email, password, remember };
      if (recaptchaToken) payload.recaptchaToken = recaptchaToken;

      api
        .post(apiServiceConfig.signIn, payload)
        .then((response) => {
          const body = response.data;
          const payload2 = body?.data ?? body;
          const accessToken: string | undefined = payload2?.accessToken ?? payload2?.token;
          const user = payload2?.user;
          const role: string = user?.role ?? payload2?.role ?? '';

          if (!accessToken) return reject(new Error(body?.message || 'E-mail ou senha inválidos!'));

          if (!checkAccessRole(role)) {
            return reject(new Error('E-mail ou senha inválidos!'));
          }

          setAccessToken(accessToken);

          this.emit('onLogin', user);
          resolve(user);
        })
        .catch((error) => {
          // Se o backend retornou 449 (reCAPTCHA challenge necessário),
          // propaga o erro original do axios para que o SignInPage
          // possa acessar error.response.status e error.response.data.
          if (error?.response?.status === 449) {
            return reject(error);
          }

          reject(new Error(extractAuthErrorMessage(error) || 'E-mail ou senha inválidos!'));
        });
    });

  /**
   * Valida sessão consultando /auth/me.
   * Se o access token estiver expirado, o interceptor do axios renova e retenta.
   */
  signInWithToken = () =>
    new Promise((resolve, reject) => {
      if (!getAccessToken()) {
        return reject(new Error('No access token'));
      }

      api
        .get(apiServiceConfig.me)
        .then((response) => {
          const body = response.data;
          const payload = body?.data ?? body;
          const user = payload?.user ?? payload;
          const role: string = user?.role ?? payload?.role ?? '';

          if (!checkAccessRole(role)) {
            return reject(new Error('Não autorizado'));
          }

          resolve(user);
        })
        .catch(() => {
          reject(new Error('Failed to login with token.'));
        });
    });

  /** Revoga o refresh token no servidor e limpa o storage local. */
  logout = async () => {
    try {
      await api.post(apiServiceConfig.logout);
    } catch {
      // Falha no logout remoto não impede a limpeza local.
    } finally {
      clearAllTokens();
      this.emit('onLogout', 'Logged out');
    }
  };
}

function checkAccessRole(role: string): boolean {
  return systemRoles.includes(role);
}

const instance = new ApiService();
export default instance;
