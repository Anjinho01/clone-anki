import { useEffect, useState } from 'react';
import { validateEmail } from 'app/utils';
/* Components */
import { Form, FormItem } from '@fuse/ui/Form';
import Button from '@fuse/ui/Button';
import Input from '@fuse/ui/Input';
/* Form */
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
/* Store */
import { useAppDispatch, useAppSelector } from 'app/store';
import { selectProfileData, updateMe } from '../store/profileSlice';
/* Types */
import type { ProfileType } from '../types/ProfileType';

import ProfileModel from '../models/ProfileModel';

const defaultValues = ProfileModel();

/**
 * Form Validation Schema
 */
const schema = yup.object().shape({
  name: yup.string().required('Campo obrigatório').min(3),
  email: yup
    .string()
    .required('Campo obrigatório')
    .test('valid-email', 'Email inválido', (value = '') => validateEmail(value)),
});

function ProfileView() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectProfileData);

  const [isSubmiting, setIsSubmiting] = useState(false);

  const {
    reset,
    control,
    // watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileType>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (user) {
      // Combine defaultValues com os dados do usuário (objetos, não strings isoladas)
      reset({
        ...defaultValues,
        ...user,
      });
    }
  }, [user, reset]);

  /**
   * Form Submit
   */
  function onSubmit() {
    const data = getValues();
    setIsSubmiting(true);

    try {
      dispatch(
        updateMe({
          data,
        })
      ).then(() => {
        setIsSubmiting(false);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmiting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 md:p-6 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            Informações pessoais
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Ajuste os dados principais usados para identificação da conta no ambiente e para
            comunicação administrativa.
          </p>
        </div>

        <Form
          className="flex h-full w-full"
          containerClassName="flex flex-col w-full justify-between gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormItem
              label="Nome"
              invalid={Boolean(errors.name)}
              errorMessage={errors.name?.message}
              className="w-full"
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input type="text" autoComplete="off" placeholder="Nome completo" {...field} />
                )}
              />
            </FormItem>

            <FormItem
              label="Email"
              invalid={Boolean(errors.email)}
              errorMessage={errors.email?.message}
              className="w-full"
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    autoComplete="off"
                    placeholder="exemplo@email.com"
                    {...field}
                  />
                )}
              />
            </FormItem>
          </div>

          <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            As alterações refletem nos dados pessoais da sua conta. O login e o papel administrativo
            continuam controlados pela gestão de usuários.
          </div>

          <div className="flex justify-end">
            <Button
              variant="solid"
              type="submit"
              loading={isSubmiting}
              className="rounded-2xl px-5 py-3"
            >
              Salvar alterações
            </Button>
          </div>
        </Form>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">
            Resumo da conta
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs text-slate-400">Login</div>
              <div className="mt-1 text-sm font-medium text-slate-950 dark:text-white">
                {user?.login || 'Não informado'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Papel</div>
              <div className="mt-1 text-sm font-medium text-slate-950 dark:text-white">
                {user?.role || 'Não informado'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Status</div>
              <div className="mt-1 text-sm font-medium text-slate-950 dark:text-white">
                {user?.actived ? 'Ativo' : 'Sem status'}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="text-sm font-semibold text-slate-950 dark:text-white">
            Uso recomendado
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Mantenha nome e email sempre atualizados para garantir rastreabilidade, contato e uma
            experiência consistente nas rotas administrativas.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default ProfileView;
