import { useState } from 'react';
import api from 'api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useTimeOutMessage from '@fuse/hooks/useTimeOutMessage';
/* Form */
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
/* Compoments */
import Alert from '@fuse/ui/Alert';
import { FormItem, Form } from '@fuse/ui/Form';
import type { FormProps } from '@fuse/ui/Form';
import OtpInput from '@fuse/shared/OtpInput';
import ActionLink from '@fuse/shared/ActionLink';
import Button from '@fuse/ui/Button';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';

type AlertType = React.ComponentProps<typeof Alert>['type'];

const OTP_LENGTH = 6;

/**
 * Form Validation Schema
 */
// 1) Validação: exatamente 6 dígitos numéricos
const schema = yup.object().shape({
  otp: yup
    .string()
    .required('Por favor, insira o Token recebido')
    .matches(/^\d{6}$/, 'O Token deve ter 6 dígitos numéricos'),
});

const defaultValues = {
  otp: '',
};

function OtpVerificationApp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useTimeOutMessage();

  const [otpMessage, setOtpMessage] = useTimeOutMessage();
  const [otpValid, setOtpValid] = useState<{ state: boolean; type: AlertType }>({
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

  async function onSubmit({ otp }: yup.InferType<typeof schema>) {
    if (!email) {
      setMessage('Parâmetro de e-mail ausente na URL');
      return;
    }

    if (isSubmitting) return;
    setSubmitting(true);

    try {
      const requestBody = { token: otp, email };
      const response = await api.post('/auth/otp-verification', requestBody);

      if (response.data.valid) {
        setOtpMessage(response.data.message);

        setOtpValid({
          state: true,
          type: 'info',
        });

        setTimeout(() => {
          setOtpValid({
            state: false,
            type: 'info',
          });
        }, 1500);

        setTimeout(() => {
          navigate(
            `/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
          );
        }, 1800);
      }
    } catch (error: unknown) {
      const errMsg = extractApiErrorMessage(error, 'Erro ao validar token');
      setMessage(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-white">
      <div className="w-full max-w-[380px] px-4 xl:max-w-[450px]">
        <div className="mb-6">
          <h3 className="mb-2">Verificação de Token</h3>
          <p className="heading-text font-semibold">
            Enviamos uma Senha de Uso Único (Token) para seu e-mail. A senha dura 60 minutos
          </p>
        </div>

        {otpValid.state && otpMessage && (
          <Alert showIcon className="mb-4" type={otpValid.type}>
            <span className="break-all">{otpMessage}</span>
          </Alert>
        )}
        {message && (
          <Alert showIcon className="mb-4" type="danger">
            <span className="break-all">{message}</span>
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit) as FormProps['onSubmit']}>
          <FormItem label="Token" invalid={Boolean(errors.otp)} errorMessage={errors.otp?.message}>
            <Controller
              name="otp"
              control={control}
              render={({ field }) => (
                <OtpInput placeholder="" inputClass="h-[58px]" length={OTP_LENGTH} {...field} />
              )}
            />
          </FormItem>

          <Button block loading={isSubmitting} variant="solid" type="submit">
            Enviar
          </Button>
        </Form>

        <div className="mt-4 text-center">
          <span>Não recebeu o Token? </span>
          <ActionLink to="/forgot-password" className="heading-text font-bold" themeColor={false}>
            Reenviar TOKEN
          </ActionLink>
        </div>
      </div>
    </div>
  );
}

export default OtpVerificationApp;
