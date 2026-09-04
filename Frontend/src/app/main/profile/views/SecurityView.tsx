import { useState } from 'react';
/* Components */
import { Form, FormItem } from '@fuse/ui/Form';
import Button from '@fuse/ui/Button';
// import Input from '@fuse/ui/Input';
import PasswordInput from '@fuse/shared/PasswordInput';
/* Form */
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
/* Store */
import { useAppDispatch } from 'app/store';
import { resetPassword } from '../store/profileSlice';
/* Types */
import type { SecurityType } from '../types/SecurityType';

import SecurityModel from '../models/SecurityModel';

const defaultValues = SecurityModel();
const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Form Validation Schema
 */
const schema = yup.object().shape({
  currentPassword: yup.string().required('Campo obrigatório'),
  newPassword: yup
    .string()
    .required('Campo obrigatório')
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .matches(passwordPolicyRegex, 'Nova senha deve conter maiúscula, minúscula e número'),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'As senhas devem ser iguais')
    .required('Confirme a senha'),
});

function SecurityView() {
  const dispatch = useAppDispatch();

  const [isSubmiting, setIsSubmiting] = useState(false);

  const {
    reset,
    control,
    // watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<SecurityType>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  /**
   * Form Submit
   */
  async function onSubmit() {
    setIsSubmiting(true); // ou use isSubmitting do RHF e remova esse state
    const { currentPassword, newPassword } = getValues();

    const action = await dispatch(resetPassword({ currentPassword, newPassword }));

    if (resetPassword.fulfilled.match(action)) {
      // sucesso -> limpa campos
      reset({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    }

    setIsSubmiting(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 md:p-6 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Senha</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Atualize a senha com segurança. A troca é aplicada imediatamente após validação da
            credencial atual.
          </p>
        </div>
        <Form
          className="flex h-full w-full"
          containerClassName="flex flex-col w-full justify-between gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FormItem
            label="Senha atual"
            invalid={Boolean(errors.currentPassword)}
            errorMessage={String(errors.currentPassword?.message ?? '')}
          >
            <Controller
              name="currentPassword"
              control={control}
              render={({ field }) => (
                <PasswordInput type="text" autoComplete="off" placeholder="•••••••••" {...field} />
              )}
            />
          </FormItem>

          <FormItem
            label="Nova senha"
            invalid={Boolean(errors.newPassword)}
            errorMessage={String(errors.newPassword?.message ?? '')}
          >
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <PasswordInput type="text" autoComplete="off" placeholder="•••••••••" {...field} />
              )}
            />
          </FormItem>

          <FormItem
            label="Confirmar nova senha"
            invalid={Boolean(errors.confirmNewPassword)}
            errorMessage={String(errors.confirmNewPassword?.message ?? '')}
          >
            <Controller
              name="confirmNewPassword"
              control={control}
              render={({ field }) => (
                <PasswordInput type="text" autoComplete="off" placeholder="•••••••••" {...field} />
              )}
            />
          </FormItem>

          <div className="flex justify-end">
            <Button
              variant="solid"
              type="submit"
              loading={isSubmiting}
              className="rounded-2xl px-5 py-3"
            >
              Atualizar senha
            </Button>
          </div>
        </Form>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="text-sm font-semibold text-slate-950 dark:text-white">Boas práticas</div>
          <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            <li>Use pelo menos 8 caracteres.</li>
            <li>Combine letra maiúscula, letra minúscula e número.</li>
            <li>Evite repetir senhas usadas em outros sistemas.</li>
            <li>Troque a senha ao menor sinal de compartilhamento indevido.</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="text-sm font-semibold text-slate-950 dark:text-white">
            Quando atualizar
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Recomendado ao trocar de dispositivo, após uso compartilhado ou sempre que existir
            suspeita de comprometimento da conta.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default SecurityView;
