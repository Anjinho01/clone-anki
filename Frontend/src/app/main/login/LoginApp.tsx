import { useCallback, useEffect, useRef, useState } from 'react';
import apiService from '../../auth/services/apiService';
import apiServiceConfig from '../../auth/services/apiServiceConfig';
import api from 'api';
import {
  executeRecaptcha,
  preloadRecaptcha,
  loadRecaptchaV2,
  renderRecaptchaV2,
  resetRecaptchaV2,
} from 'recaptcha';
import classNames from '@fuse/utils/classNames';
import useTimeOutMessage from '@fuse/hooks/useTimeOutMessage';
/* Form */
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
/* Components */
import Alert from '@fuse/ui/Alert';
import { FormItem, Form } from '@fuse/ui/Form';
import type { FormProps } from '@fuse/ui/Form';
import Checkbox from '@fuse/ui/Checkbox';
import PasswordInput from '@fuse/shared/PasswordInput';
import ActionLink from '@fuse/shared/ActionLink';
import Input from '@fuse/ui/Input';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import Spinner from '@fuse/ui/Spinner';
import extractAuthErrorMessage from 'app/auth/utils/extractAuthErrorMessage';
import { ThemeModeToogleBase } from 'app/layout/components/shared/ThemeModeToogle';

/**
 * Form Validation Schema
 */
const schema = yup.object().shape({
  email: yup
    .string()
    .email('Por favor, insira um e-mail válido')
    .required('Por favor, insira seu e-mail'),
  password: yup.string().required('Por favor, digite sua senha.'),
  remember: yup.boolean().default(true),
});

type FormValues = yup.InferType<typeof schema>;

type PendingCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

const defaultValues: FormValues = {
  email: '',
  password: '',
  remember: true,
};

function LoginApp() {
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useTimeOutMessage();

  // reCAPTCHA v2 challenge state
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeSiteKey, setChallengeSiteKey] = useState('');
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [v2Token, setV2Token] = useState<string | null>(null);
  const pendingCredentials = useRef<PendingCredentials | null>(null);
  const v2WidgetId = useRef<number | null>(null);

  // Precarrega o script do reCAPTCHA v3 ao montar o componente
  useEffect(() => {
    preloadRecaptcha();
  }, []);

  // Renderiza o widget v2 quando o dialog abre e a siteKey está definida
  useEffect(() => {
    if (challengeOpen && challengeSiteKey) {
      setChallengeLoading(true);
      loadRecaptchaV2()
        .then(() => {
          v2WidgetId.current = renderRecaptchaV2(
            'recaptcha-v2-container',
            challengeSiteKey,
            (token) => setV2Token(token),
            () => setV2Token(null)
          );
          setChallengeLoading(false);
        })
        .catch(() => {
          setMessage('Falha ao carregar verificação. Tente novamente.');
          setChallengeOpen(false);
          setChallengeLoading(false);
          setSubmitting(false);
        });
    }
  }, [challengeOpen, challengeSiteKey]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(schema),
  });

  /**
   * Submete o login com token v2 já verificado (após challenge visual).
   */
  const handleChallengeSubmit = useCallback(async () => {
    if (!v2Token || !pendingCredentials.current) return;

    setChallengeOpen(false);
    setSubmitting(true);

    const { email, password, remember } = pendingCredentials.current;

    try {
      const response = await api.post(apiServiceConfig.signIn, {
        email,
        password,
        remember,
        recaptchaV2Token: v2Token,
      });

      const body = response.data;
      const payload = body?.data ?? body;
      const accessToken: string | undefined = payload?.accessToken ?? payload?.token;
      const user = payload?.user;

      if (!accessToken) throw new Error(extractAuthErrorMessage(body));

      const { setAccessToken } = await import('tokenStorage');
      setAccessToken(accessToken);

      const userPayload = {
        id: user?.id,
        userId: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role ?? '',
      };
      apiService.emit('onLogin', userPayload);
    } catch (err: unknown) {
      setMessage(extractAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
      setV2Token(null);
      pendingCredentials.current = null;
    }
  }, [v2Token]);

  /**
   * Fecha o dialog de challenge sem submeter.
   */
  const handleChallengeClose = () => {
    resetRecaptchaV2(v2WidgetId.current);
    v2WidgetId.current = null;
    setChallengeOpen(false);
    setSubmitting(false);
    setV2Token(null);
    pendingCredentials.current = null;
  };

  function onSubmit({ email, password, remember }: FormValues) {
    if (isSubmitting) return;
    setSubmitting(true);

    executeRecaptcha('signin')
      .then((recaptchaToken) =>
        apiService.signInWithEmailAndPassword(email, password, remember ?? false, recaptchaToken)
      )
      .then(() => {
        setSubmitting(false);
      })
      .catch(
        (error: {
          response?: {
            status?: number;
            data?: { requireChallenge?: boolean; challengeSiteKey?: string; error?: string };
          };
          message?: string;
        }) => {
          const response = error?.response;

          // Backend retornou 449 → exibe challenge visual v2
          if (
            response?.status === 449 &&
            response?.data?.requireChallenge &&
            response?.data?.challengeSiteKey
          ) {
            pendingCredentials.current = { email, password, remember: remember ?? false };
            setChallengeSiteKey(response.data.challengeSiteKey);
            setChallengeOpen(true);
            // Mantém loading até o challenge ser resolvido
            return;
          }

          setMessage(extractAuthErrorMessage(error));
          setSubmitting(false);
        }
      );
  }

  return (
    <div className="relative grid min-h-screen w-full bg-white lg:grid-cols-2 dark:bg-gray-900">
      <ThemeModeToogleBase className="absolute top-5 right-5 z-20 rounded-full border border-slate-200/80 bg-white/88 p-2 text-xl text-slate-500 shadow-sm backdrop-blur-md transition-colors hover:border-slate-300 hover:bg-white lg:top-6 lg:right-6 dark:border-slate-700 dark:bg-slate-900/78 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900" />

      {/* Left panel */}
      <div className="relative hidden min-h-screen overflow-hidden lg:flex">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/assets/auth-side-bg.png"
          alt="Ilustração do Flashcards"
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(6,23,78,0.5)_0%,rgba(10,26,101,0.78)_48%,rgba(3,8,34,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.22),transparent_28%)]" />

        <div className="relative flex min-h-screen w-full flex-col justify-between px-14 py-12 xl:px-18 xl:py-16">
          <div className="max-w-xl rounded-[36px] border border-white/15 bg-white/8 p-8 text-white shadow-[0_32px_120px_rgba(2,6,23,0.45)] backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.32em] text-sky-100 uppercase">
              Packages UnB
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              Aprenda com ritmo, clareza e repetição inteligente.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-blue-50/88 xl:text-lg">
              Organize seus decks, avance nos packages e acompanhe o estudo com uma rotina guiada
              pelo FSRS, sem perder contexto nem consistência.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-2 gap-4">
            <div className="rounded-[28px] border border-white/12 bg-slate-950/20 p-5 text-white shadow-[0_18px_60px_rgba(2,6,23,0.35)] backdrop-blur-md">
              <p className="text-xs font-semibold tracking-[0.28em] text-sky-100/80 uppercase">
                Revisão ativa
              </p>
              <p className="mt-3 text-lg font-semibold">Estude no momento certo, não no escuro.</p>
              <p className="mt-2 text-sm leading-6 text-blue-50/78">
                Priorize o que vence hoje e mantenha seu ritmo sem sobrecarga desnecessária.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-slate-950/20 p-5 text-white shadow-[0_18px_60px_rgba(2,6,23,0.35)] backdrop-blur-md">
              <p className="text-xs font-semibold tracking-[0.28em] text-sky-100/80 uppercase">
                Estrutura clara
              </p>
              <p className="mt-3 text-lg font-semibold">
                Grupos, decks e cards em uma trilha lógica.
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-50/78">
                Encontre rápido o conteúdo certo e entre direto no fluxo de estudo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-[380px] xl:max-w-[450px]">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-400">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Entre para continuar seus estudos.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              Use seu e-mail para acessar seus decks, revisar pendências do dia e retomar seu
              progresso exatamente de onde parou.
            </p>
          </div>

          {message && (
            <Alert showIcon className="mb-4" type="danger">
              <span className="break-all">{message}</span>
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit) as FormProps['onSubmit']}>
            <FormItem
              label="E-mail"
              invalid={Boolean(errors.email)}
              errorMessage={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input placeholder="" autoComplete="email" {...field} />}
              />
            </FormItem>

            <FormItem
              label="Senha"
              invalid={Boolean(errors.password)}
              errorMessage={errors.password?.message}
              className={classNames(errors.password?.message ? 'mb-8' : '')}
            >
              <Controller
                name="password"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <PasswordInput type="text" placeholder="" autoComplete="off" {...field} />
                )}
              />
            </FormItem>

            <div className="mt-2 mb-7">
              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <Checkbox {...field} checked={field.value ?? false}>
                    Permanecer conectado?
                  </Checkbox>
                )}
              />
            </div>

            <Button block loading={isSubmitting} variant="solid" type="submit">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </Form>

          <div className="mt-8">
            <ActionLink
              to="/forgot-password"
              className="heading-text mt-2 font-semibold underline"
              themeColor={false}
            >
              Esqueceu sua senha?
            </ActionLink>
          </div>

          {/* Atribuição reCAPTCHA (exigida pelo Google em v3) */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Protegido por reCAPTCHA do Google.{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Privacidade
            </a>
            {' e '}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Termos
            </a>
            .
          </p>
        </div>
      </div>

      {/* reCAPTCHA v2 Challenge Dialog */}
      <Dialog
        isOpen={challengeOpen}
        onRequestClose={handleChallengeClose}
        onClose={handleChallengeClose}
        width={400}
        closable
      >
        <div className="px-6 pt-6 pb-2">
          <h5 className="mb-1">Verificação de segurança</h5>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Para sua segurança, complete a verificação abaixo antes de prosseguir com o login.
          </p>
          <div className="flex min-h-[78px] items-center justify-center">
            {challengeLoading ? <Spinner size={32} /> : <div id="recaptcha-v2-container" />}
          </div>
        </div>
        <DialogActions
          cancelText="Cancelar"
          confirmText="Continuar"
          disabled={!v2Token}
          onCancel={handleChallengeClose}
          onConfirm={handleChallengeSubmit}
          confirmType="button"
        />
      </Dialog>
    </div>
  );
}

export default LoginApp;
