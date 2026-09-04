import { useState } from 'react';
import api from 'api';
import { useSearchParams } from 'react-router-dom';
import apiService from '../../auth/services/apiService';
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
import PasswordInput from '@fuse/shared/PasswordInput';
import Button from '@fuse/ui/Button';
import AuthSplitLayout from 'app/auth/AuthSplitLayout';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';

type AlertType = React.ComponentProps<typeof Alert>['type'];
const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Form Validation Schema
 */
const schema = yup.object().shape({
  newPassword: yup
    .string()
    .required('Campo obrigatório')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .matches(passwordPolicyRegex, 'Senha deve conter maiúscula, minúscula e número'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'As senhas devem ser iguais')
    .required('Confirme a senha'),
});

const defaultValues = {
  newPassword: '',
  confirmPassword: '',
};

function ResetPasswordApp() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';

  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useTimeOutMessage();

  const [pwdMessage, setPwdMessage] = useTimeOutMessage();
  const [pwdReseted, setPwdReseted] = useState<{
    state: boolean;
    type: AlertType;
  }>({
    state: false,
    type: 'info',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  async function onSubmit({ newPassword }: yup.InferType<typeof schema>) {
    if (!email) {
      setMessage('Parâmetro de e-mail ausente na URL');
      return;
    }

    if (!otp) {
      setMessage('Parâmetro de pin ausente na URL');
      return;
    }

    if (isSubmitting) return;
    setSubmitting(true);

    try {
      const requestBody = { token: otp, email, newPassword };
      const response = await api.post('/auth/reset-password', requestBody);

      if (response.data.reseted) {
        setPwdMessage(response.data.message);

        setPwdReseted({
          state: true,
          type: 'info',
        });

        setTimeout(() => {
          setPwdReseted({
            state: false,
            type: 'info',
          });
        }, 1500);

        setTimeout(() => {
          apiService
            .signInWithLoginAndPassword(email, newPassword, false)
            .then(() => {
              setSubmitting(false);
            })
            .catch((error) => {
              const { message } = error;
              setMessage(message);

              setSubmitting(false);
            });
        }, 2000);
      }
    } catch (error: unknown) {
      const errMsg = extractApiErrorMessage(error, 'Erro ao redefinir senha');
      setMessage(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      leftEyebrow="Nova credencial"
      leftTitle="Defina uma senha nova e recupere o controle da conta."
      leftDescription="Crie uma senha atualizada para proteger seus dados e voltar ao painel com segurança e continuidade."
      features={[
        {
          eyebrow: 'Segurança',
          title: 'Escolha uma senha diferente da anterior.',
          description:
            'A redefinição precisa fortalecer o acesso e evitar repetição de credenciais antigas.',
        },
        {
          eyebrow: 'Continuidade',
          title: 'Depois disso, o acesso volta ao fluxo normal.',
          description:
            'Conclua a troca e siga direto para o ambiente de estudo com menos interrupção.',
        },
      ]}
      rightEyebrow="Redefinição de senha"
      rightTitle="Crie sua nova senha."
      rightDescription="Escolha uma senha forte, confirme o valor e finalize a recuperação para voltar ao seu ambiente com segurança."
    >
      {pwdReseted.state && pwdMessage && (
        <Alert showIcon className="mb-4" type={pwdReseted.type}>
          <span className="break-all">{pwdMessage}</span>
        </Alert>
      )}
      {message && (
        <Alert showIcon className="mb-4" type="danger">
          <span className="break-all">{message}</span>
        </Alert>
      )}

      <Form onSubmit={handleSubmit(onSubmit) as FormProps['onSubmit']}>
        <FormItem
          label="Nova senha"
          invalid={Boolean(errors.newPassword)}
          errorMessage={errors.newPassword?.message}
        >
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <PasswordInput autoComplete="off" placeholder="••••••••••••" {...field} />
            )}
          />
        </FormItem>

        <FormItem
          label="Confirme a senha"
          invalid={Boolean(errors.confirmPassword)}
          errorMessage={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <PasswordInput autoComplete="off" placeholder="Repita a nova senha" {...field} />
            )}
          />
        </FormItem>

        <Button block loading={isSubmitting} variant="solid" type="submit">
          Salvar nova senha
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

export default ResetPasswordApp;
