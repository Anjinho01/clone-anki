import { useCallback, useEffect, useState } from 'react';
import { displayRole } from 'app/utils';
import { validateEmail } from 'app/utils';
/* Components */
import useResponsive from '@fuse/hooks/useResponsive';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import { Form } from '@fuse/ui/Form';
import Button from '@fuse/ui/Button';
import Select from '@fuse/ui/Select';
import Input from '@fuse/ui/Input';
import PasswordInput from '@fuse/shared/PasswordInput';
import { FormItem } from '@fuse/ui/Form';
/* Form */
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
/* Store */
import { useAppDispatch, useAppSelector } from 'app/store';
import { selectRoles } from '../store/rolesSlice';
import { selectNewUserDialog, closeNewUserDialog, createUser } from '../store/userSlice';
/* Types */
import type { GroupBase } from 'react-select';
import type { NewUser } from '../types/FormType';

import NewUserModel from '../models/NewUserModel';

type CreateUserRejectedPayload = {
  msg?: string;
  details?: Array<{ field?: string; message: string }>;
  aborted?: boolean;
};

type RoleOption = { roleId: number; role: string };

const isRegistryRole = (roleId?: number) => roleId === 5 || roleId === 6;
const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Form Validation Schema
 */
const schema = yup.object().shape({
  roleId: yup.number().moreThan(0).required('Campo obrigatório'),
  login: yup
    .string()
    .when('roleId', ([roleId], schemaValue) =>
      isRegistryRole(Number(roleId))
        ? schemaValue.required('Campo obrigatório').min(3)
        : schemaValue
            .required('Campo obrigatório')
            .test('valid-email-login', 'Email inválido', (value = '') => validateEmail(value))
    ),
  password: yup
    .string()
    .required('Campo obrigatório')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .matches(passwordPolicyRegex, 'Senha deve conter maiúscula, minúscula e número'),
  name: yup.string().required('Campo obrigatório').min(3),
  email: yup
    .string()
    .required('Campo obrigatório')
    .test('valid-email', 'Email inválido', (value = '') => validateEmail(value)),
});

const defaultValues = NewUserModel();

const backendFieldToFormField: Partial<Record<string, keyof NewUser>> = {
  role: 'roleId',
  roleId: 'roleId',
  login: 'login',
  password: 'password',
  name: 'name',
  email: 'email',
};

function NewUserDialog() {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(selectRoles);
  const userDialog = useAppSelector(selectNewUserDialog);

  const [isSubmiting, setIsSubmiting] = useState(false);

  const { smaller } = useResponsive();
  const isMobile = smaller.md;

  const {
    reset,
    control,
    watch,
    getValues,
    clearErrors,
    setError,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<NewUser>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  const roleId = watch('roleId');
  const emailAsLogin = !isRegistryRole(roleId);

  /**
   * Initialize Dialog with Data
   */
  const initDialog = useCallback(() => {
    const seed = {
      ...defaultValues,
      ...userDialog.data,
    };
    const accessEmail = seed.email || seed.login;

    reset({
      ...seed,
      ...(isRegistryRole(seed.roleId) ? {} : { login: accessEmail, email: accessEmail }),
    });
  }, [userDialog.data, reset]);

  /**
   * On Dialog Open
   */
  useEffect(() => {
    if (userDialog.props.isOpen) {
      initDialog();
    }
  }, [userDialog.props.isOpen, initDialog]);

  /**
   * Close Dialog
   */
  function closeComposeDialog() {
    return dispatch(closeNewUserDialog({}));
  }

  /**
   * Form Submit
   */
  async function onSubmit() {
    const data = getValues();
    setIsSubmiting(true);
    clearErrors();

    try {
      await dispatch(
        createUser({
          data,
        })
      ).unwrap();

      closeComposeDialog();
    } catch (error) {
      const rejected = error as CreateUserRejectedPayload;

      rejected.details?.forEach((detail, index) => {
        const fieldName = detail.field ? backendFieldToFormField[detail.field] : undefined;

        if (!fieldName) {
          return;
        }

        setError(
          fieldName,
          {
            type: 'server',
            message: detail.message,
          },
          { shouldFocus: index === 0 }
        );
      });
    } finally {
      setIsSubmiting(false);
    }
  }

  return (
    <Dialog
      {...userDialog.props}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      isMobile={isMobile}
      width={isMobile ? undefined : 1000}
      contentClassName={`
        px-0 pb-0
        ${isMobile ? 'w-screen h-[100dvh] rounded-none my-0 mx-0' : ''}
      `}
      onClose={closeComposeDialog}
      onRequestClose={closeComposeDialog}
    >
      <Form
        className="flex h-full w-full"
        containerClassName={`flex flex-col w-full justify-between h-full ${
          isMobile ? 'overflow-hidden' : ''
        }`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div
          className={`flex-1 px-6 pb-6 ${isMobile ? 'min-h-0 overflow-y-auto overscroll-contain' : ''}`}
        >
          <h5 className="mb-4">Novo Usuário</h5>
          <p className="mb-8">Selecione primeiro o perfil do usuário</p>

          {/* Perfil */}
          <FormItem
            label="Perfil"
            invalid={Boolean(errors.roleId)}
            errorMessage={errors.roleId?.message}
            className={`w-full ${roleId === 0 ? 'mb-[300px]' : ''}`}
          >
            <Controller
              name="roleId"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select<RoleOption, false, GroupBase<RoleOption>>
                  placeholder="Selecione o perfil"
                  options={roles}
                  // Encontra o objeto cujo .value bate com o valor do form
                  value={roles.find((opt) => opt.roleId === value) || null}
                  // Extrai do objeto apenas a string que queremos salvar
                  onChange={(opt) => onChange(opt?.roleId)}
                  getOptionValue={(opt) => `${opt.roleId}`}
                  getOptionLabel={(opt) => displayRole(opt.role)}
                />
              )}
            />
          </FormItem>

          {roleId !== 0 && (
            <>
              <div className="gap-4 md:flex">
                {/* Login */}
                <FormItem
                  label={emailAsLogin ? 'Email de acesso' : 'Login'}
                  invalid={Boolean(errors.login)}
                  errorMessage={errors.login?.message}
                  className="w-full"
                >
                  <Controller
                    name="login"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="text"
                        autoComplete="off"
                        placeholder={
                          roleId == 5 ? 'CRM' : roleId == 6 ? 'Coren' : 'exemplo@email.com'
                        }
                        value={field.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const v = e.target.value;
                          field.onChange(v);
                          if (emailAsLogin) {
                            setValue('email', v, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                    )}
                  />
                </FormItem>

                {/* Password */}
                <FormItem
                  label="Senha"
                  invalid={Boolean(errors.password)}
                  errorMessage={errors.password?.message}
                  className="w-full"
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <PasswordInput
                        type="text"
                        autoComplete="off"
                        placeholder="••••••••••••"
                        {...field}
                      />
                    )}
                  />
                </FormItem>
              </div>

              {/* Nome */}
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

              {!emailAsLogin && (
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
                        value={field.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    )}
                  />
                </FormItem>
              )}
            </>
          )}
        </div>

        <DialogActions isMobile={isMobile} align="right">
          <Button type="button" className="ltr:mr-2 rtl:ml-2" onClick={closeComposeDialog}>
            Cancelar
          </Button>
          <Button variant="solid" type="submit" loading={isSubmiting}>
            Confirmar
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export default NewUserDialog;
