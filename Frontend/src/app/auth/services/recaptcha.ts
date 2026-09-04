/**
 * recaptcha.js — Integração com Google reCAPTCHA v3 + fallback v2.
 *
 * Em produção: carrega o script do Google e gera tokens invisíveis (v3).
 *   Se o backend retornar 449 (score baixo), o frontend exibe o challenge
 *   visual v2 (checkbox "Não sou um robô").
 *
 * Em desenvolvimento: não carrega nada, executeRecaptcha() retorna null.
 *   O backend automaticamente ignora tokens ausentes em dev.
 *
 * Uso (v3 — invisível):
 *   import { executeRecaptcha, preloadRecaptcha } from 'recaptcha';
 *
 *   useEffect(() => { preloadRecaptcha(); }, []);
 *
 *   const token = await executeRecaptcha('signin');
 *   api.post('/auth/signin', { login, password, recaptchaToken: token });
 *
 * Uso (v2 — challenge visual, após 449):
 *   import { loadRecaptchaV2, renderRecaptchaV2, resetRecaptchaV2 } from 'recaptcha';
 *
 *   await loadRecaptchaV2();
 *   renderRecaptchaV2(containerId, siteKey, (token) => { ... });
 */

interface ReCaptchaInstance {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
  render(
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      theme?: 'light' | 'dark';
      size?: 'normal' | 'compact';
    }
  ): number;
  reset(widgetId?: number): void;
}

declare global {
  interface Window {
    grecaptcha?: ReCaptchaInstance;
  }
}

const SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';

/**
 * Determina se o reCAPTCHA está ativo.
 * webpack substitui process.env.NODE_ENV pelo modo do build ('development'|'production').
 */
const isEnabled = process.env.NODE_ENV === 'production';

let loadPromise: Promise<void> | null = null;

/**
 * Carrega o script do reCAPTCHA v3 de forma lazy (uma única vez).
 * Retorna uma Promise que resolve quando grecaptcha.ready() dispara.
 */
function loadScript() {
  if (!isEnabled) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha?.ready(() => resolve());
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Falha ao carregar reCAPTCHA'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Executa o reCAPTCHA v3 e retorna o token.
 *
 * @param {string} action — Nome da ação (ex.: 'signin').
 * @returns {Promise<string|null>} Token reCAPTCHA ou null em dev.
 */
export async function executeRecaptcha(action = 'signin') {
  if (!isEnabled) return null;

  try {
    await loadScript();
    return (await window.grecaptcha?.execute(SITE_KEY, { action })) ?? null;
  } catch (err) {
    console.warn('[recaptcha] falha ao gerar token:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Precarrega o script do reCAPTCHA v3 sem executar.
 */
export function preloadRecaptcha() {
  if (!isEnabled) return;
  loadScript().catch(() => {});
}

/* ========================================================================
 * reCAPTCHA v2 — Fallback visual (checkbox "Não sou um robô")
 * Carregado sob demanda apenas quando o backend retorna 449.
 * ======================================================================== */

let v2LoadPromise: Promise<void> | null = null;

/**
 * Carrega o script do reCAPTCHA v2 (separado do v3).
 * Usa `onload` callback + `render=explicit` para não conflitar com o v3.
 */
export function loadRecaptchaV2() {
  if (!isEnabled) return Promise.resolve();
  if (v2LoadPromise) return v2LoadPromise;

  v2LoadPromise = new Promise<void>((resolve, reject) => {
    // Se já existe grecaptcha com .render (v2 API), está pronto
    if (window.grecaptcha) {
      resolve();
      return;
    }

    // Callback que o script do Google chama quando carregado
    const callbackName = '__recaptchaV2Loaded';
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=${callbackName}&render=explicit`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      v2LoadPromise = null;
      delete (window as unknown as Record<string, unknown>)[callbackName];
      reject(new Error('Falha ao carregar reCAPTCHA v2'));
    };

    document.head.appendChild(script);
  });

  return v2LoadPromise;
}

/**
 * Renderiza o widget reCAPTCHA v2 checkbox num container.
 *
 * @param {string} containerId — ID do elemento DOM container
 * @param {string} siteKey — Site key v2 (vem do backend na resposta 449)
 * @param {function} onSuccess — Callback chamado com o token v2
 * @param {function} [onExpired] — Callback quando o token expira
 * @returns {number} Widget ID (para poder resetar)
 */
export function renderRecaptchaV2(
  containerId: string,
  siteKey: string,
  onSuccess: (token: string) => void,
  onExpired?: () => void
): number | null {
  if (!window.grecaptcha || !window.grecaptcha.render) {
    console.error('[recaptcha-v2] grecaptcha.render não disponível');
    return null;
  }

  // Limpa container antes de renderizar (evita duplicatas)
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';

  return window.grecaptcha.render(containerId, {
    sitekey: siteKey,
    callback: onSuccess,
    'expired-callback': onExpired ?? (() => {}),
    theme: 'light',
    size: 'normal',
  });
}

/**
 * Reseta o widget reCAPTCHA v2.
 * @param {number} widgetId — ID retornado por renderRecaptchaV2
 */
export function resetRecaptchaV2(widgetId: number | null): void {
  if (window.grecaptcha && window.grecaptcha.reset && widgetId != null) {
    window.grecaptcha.reset(widgetId);
  }
}
