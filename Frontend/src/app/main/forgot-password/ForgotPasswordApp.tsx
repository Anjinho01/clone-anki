import { useState } from 'react';
import api from 'api';
import { useNavigate } from 'react-router-dom';
import useTimeOutMessage from '@fuse/hooks/useTimeOutMessage';
/* Form */
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
/* Compoments */
import Alert from '@fuse/ui/Alert';
import { FormItem, Form } from '@fuse/ui/Form';
import type { FormProps } from '@fuse/ui/Form';
import ActionLink from '@fuse/shared/ActionLink';
import Input from '@fuse/ui/Input';
import Button from '@fuse/ui/Button';
import AuthSplitLayout from 'app/auth/AuthSplitLayout';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';

/**
 * Form Validation Schema
 */
const schema = yup.object().shape({
  email: yup
    .string()
    .required('Por favor, insira seu e-mail')
    .min(1, { message: 'Por favor, insira seu e-mail' }),
});

const defaultValues = {
  email: '',
};

function ForgotPasswordApp() {
  const navigate = useNavigate();

  const [isSubmitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useTimeOutMessage();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  async function onSubmit({ email }: yup.InferType<typeof schema>) {
    if (isSubmitting) return;
    setSubmitting(true);

    try {
      const requestBody = { email };
      const response = await api.post(`/auth/forgot-password`, requestBody);
      const { send } = response.data;

      setEmailSent(send);

      setSubmitting(false);

      setTimeout(() => {
        navigate(`/otp-verification?email=${encodeURIComponent(email)}`);
      }, 1200);
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error, 'Erro ao solicitar recuperação de senha');
      setMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      leftEyebrow="Recuperação segura"
      leftTitle="Recupere o acesso sem perder o ritmo de estudo."
      leftDescription="Envie o código de verificação para o seu e-mail e volte para seus decks com o mesmo contexto de antes."
      features={[
        {
          eyebrow: 'Código rápido',
          title: 'Receba a verificação no e-mail cadastrado.',
          description:
            'O fluxo de recuperação foi mantido simples para você retomar o acesso sem atrito.',
        },
        {
          eyebrow: 'Retorno imediato',
          title: 'Volte ao seu painel assim que validar a identidade.',
          description:
            'A ideia é recuperar a conta e retomar as revisões do dia sem desorganizar a rotina.',
        },
      ]}
      rightEyebrow={emailSent ? 'Verificação enviada' : 'Recuperação de senha'}
      rightTitle={emailSent ? 'Confira sua caixa de entrada.' : 'Esqueceu sua senha?'}
      rightDescription={
        emailSent
          ? 'Enviamos um código de recuperação para o seu e-mail. Em instantes você será redirecionado para a próxima etapa.'
          : 'Informe seu e-mail para receber um código de verificação e continuar o processo de redefinição.'
      }
    >
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
            render={({ field }) => (
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                autoComplete="off"
                {...field}
              />
            )}
          />
        </FormItem>

        <Button block loading={isSubmitting} variant="solid" type="submit">
          Continuar
        </Button>
      </Form>

      <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <span>Voltar para </span>
        <ActionLink to="/login" className="font-bold underline" themeColor={false}>
          Página de acesso
        </ActionLink>
      </div>
    </AuthSplitLayout>
  );
}

export default ForgotPasswordApp;
