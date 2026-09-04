import { useCallback, useEffect, useState } from 'react';
import { isEmptyObject, displayRole } from 'app/utils';
import { validateEmail } from 'app/utils';
/* Components */
import useResponsive from '@fuse/hooks/useResponsive';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import Spinner from '@fuse/ui/Spinner';
import Avatar from '@fuse/ui/Avatar';
import { HiOutlineUser } from 'react-icons/hi';
import { Form } from '@fuse/ui/Form';
import Button from '@fuse/ui/Button';
import Select from '@fuse/ui/Select';
import Input from '@fuse/ui/Input';
import InputGroup from '@fuse/ui/InputGroup';
import Switcher from '@fuse/ui/Switcher';
import PasswordInput from '@fuse/shared/PasswordInput';
import { FormItem } from '@fuse/ui/Form';
/* Form */
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
/* Store */
import { useAppDispatch, useAppSelector } from 'app/store';
import { selectRoles } from '../store/rolesSlice';
import {
  getUser,
  selectEditUserDialog,
  closeEditUserDialog,
  updateUser,
  resetPassword,
} from '../store/userSlice';
/* Types */
import type { GroupBase } from 'react-select';
import type { UserType } from '../types/UserType';

import EditUserModel from '../models/EditUserModel';
import NewPasswordModel from '../models/NewPasswordModel';

type RoleOption = { roleId: number; role: string };

const isRegistryRole = (roleId?: number) => roleId === 5 || roleId === 6;

/**
 * Form Validation Schema
 */
/** 1) Defina dois schemas separados */
const infoSchema = yup
  .object({
    userId: yup.number().required(),
    role: yup.string().required(),
    roleId: yup.number().required('Campo obrigatório').moreThan(0),
    login: yup
      .string()
      .when('roleId', ([roleId], schemaValue) =>
        isRegistryRole(Number(roleId))
          ? schemaValue.required('Campo obrigatório')
          : schemaValue
              .required('Campo obrigatório')
              .test('valid-email-login', 'Email inválido', (value = '') => validateEmail(value))
      ),
    name: yup.string().required('Campo obrigatório'),
    email: yup
      .string()
      .required('Campo obrigatório')
      .test('valid-email', 'Email inválido', (v) => validateEmail(v ?? '')),
    actived: yup.boolean().required(),
  })
  .required();

const passwordSchema = yup
  .object({
    userId: yup.number().required(),
    newPassword: yup
      .string()
      .required('Campo obrigatório')
      .min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    confirmNewPassword: yup
      .string()
      .oneOf([yup.ref('newPassword')], 'As senhas devem ser iguais')
      .required('Confirme a senha'),
  })
  .required();

/** 2) Dois hooks de formulário, cada um com seu resolver */
type InfoFormValues = yup.InferType<typeof infoSchema>;
type PasswordFormValues = yup.InferType<typeof passwordSchema>;

const defaultValuesInfo = EditUserModel();

const defaultValuesPassword = NewPasswordModel();

const options = [
  { label: 'Informações', value: 'info' },
  { label: 'Resetar senha', value: 'new-password' },
];

function EditUserDialog() {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(selectRoles);
  const userDialog = useAppSelector(selectEditUserDialog);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [layout, setLayout] = useState('info');

  const { smaller } = useResponsive();
  const isMobile = smaller.md;
  const isTablet = !smaller.md && smaller.lg; // entre md e lg

  // Form 1: Informações
  const {
    reset: resetInfo,
    control: controlInfo,
    watch: watchInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    getValues: getValuesInfo,
    setValue: setValueInfo,
  } = useForm<InfoFormValues>({
    defaultValues: defaultValuesInfo,
    resolver: yupResolver(infoSchema),
  });

  // Form 2: Reset de senha
  const {
    reset: resetPwd,
    clearErrors: clearPwdErrors,
    control: controlPwd,
    handleSubmit: handleSubmitPwd,
    formState: { errors: errorsPwd },
    getValues: getValuesPwd,
  } = useForm<PasswordFormValues>({
    defaultValues: defaultValuesPassword,
    resolver: yupResolver(passwordSchema),
  });

  const roleId = watchInfo('roleId');
  const name = watchInfo('name');
  const role = watchInfo('role');
  const emailAsLogin = !isRegistryRole(roleId);

  // 🔧 mapper: payload -> valores dos forms
  const toInfoValues = useCallback((u: UserType): InfoFormValues => {
    const activeBool =
      typeof u.actived === 'boolean' ? u.actived : u.actived === 1 || u.actived === '1';
    const accessEmail = u.email || u.login || '';

    return {
      userId: u.userId,
      role: u.role,
      roleId: u.roleId,
      login: isRegistryRole(u.roleId) ? (u.login ?? '') : accessEmail,
      name: u.name ?? '',
      email: isRegistryRole(u.roleId) ? (u.email ?? '') : accessEmail,
      actived: !!activeBool,
    };
  }, []);

  const toPasswordValues = useCallback(
    (u: UserType): PasswordFormValues => ({
      userId: u.userId,
      newPassword: '',
      confirmNewPassword: '',
    }),
    []
  );

  /**
   * Initialize Dialog with Data
   */
  const initDialog = useCallback(async () => {
    const uid = userDialog?.data?.userId as number | undefined;
    if (typeof uid !== 'number') return;

    setIsLoading(true);
    try {
      // use unwrap() para payload tipado
      const fetched = (await dispatch(getUser({ id: uid })).unwrap()) as UserType;

      resetInfo(toInfoValues(fetched));
      resetPwd(toPasswordValues(fetched));
    } catch (e) {
      // opcional: tratar erro
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [userDialog.data, dispatch, resetInfo]);

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
    return dispatch(closeEditUserDialog({}));
  }

  /**
   * Form Submit Informations
   */
  async function onSubmitInfo() {
    const data = getValuesInfo();
    if (isEmptyObject(data)) return;

    if (!data.userId) return;

    const id = data.userId;
    setIsSubmiting(true);

    try {
      await dispatch(updateUser({ id, data })).unwrap();
      closeComposeDialog();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmiting(false);
    }
  }

  /**
   * Form Submit new password
   */
  async function onSubmitNewPassword() {
    const { userId, newPassword } = getValuesPwd();

    if (!userId) return;

    const id = userId;
    setIsSubmiting(true);

    try {
      await dispatch(resetPassword({ id, newPassword })).unwrap();

      resetPwd(
        { userId, newPassword: '', confirmNewPassword: '' },
        {
          keepErrors: false,
          keepDirty: false,
          keepTouched: false,
          keepSubmitCount: false,
        }
      );

      clearPwdErrors();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmiting(false);
    }
  }

  const onLayoutSelect = (value: string) => {
    setLayout(value);
  };

  return (
    <Dialog
      {...userDialog.props}
      bodyOpenClassName="overflow-hidden"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      isMobile={isMobile}
      width={
        isMobile
          ? undefined
          : isTablet
            ? 720 // largura para tablet
            : 1000 // largura para desktop
      }
      contentClassName={`
        px-0 pb-0
        ${isMobile ? 'w-screen h-[100dvh] rounded-none my-0 mx-0' : ''}
        ${isTablet ? 'my-4 mx-auto rounded-xl' : ''}
      `}
      onClose={closeComposeDialog}
      onRequestClose={closeComposeDialog}
    >
      <div className="w-full">
        {isLoading ? (
          <div className="flex min-h-full flex-1 items-center justify-center">
            <Spinner size={40} />
          </div>
        ) : (
          <>
            <div className="flex w-full flex-col items-center justify-center">
              <Avatar size={70} icon={<HiOutlineUser />} />
              <h5>{name}</h5>
              <p className="mb-8">{displayRole(role)}</p>
            </div>

            <InputGroup className="mb-6 px-6">
              {options.map((opt) => (
                <Button
                  key={opt.value}
                  active={layout === opt.value}
                  onClick={() => onLayoutSelect(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </InputGroup>

            {layout == 'info' && (
              <Form
                className="flex h-full w-full"
                containerClassName={`flex flex-col w-full justify-between h-full ${
                  isMobile ? 'overflow-hidden' : ''
                }`}
                onSubmit={handleSubmitInfo(onSubmitInfo)}
              >
                <div
                  className={`flex-1 px-6 pb-6 ${isMobile ? 'min-h-0 overflow-y-auto overscroll-contain' : ''}`}
                >
                  {/* Perfil */}
                  <FormItem
                    label="Perfil"
                    invalid={Boolean(errorsInfo.roleId)}
                    errorMessage={errorsInfo.roleId?.message}
                    className="w-full px-6"
                  >
                    <Controller
                      name="roleId"
                      control={controlInfo}
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

                  {/* Login */}
                  <FormItem
                    label={emailAsLogin ? 'Email de acesso' : 'Login'}
                    invalid={Boolean(errorsInfo.login)}
                    errorMessage={errorsInfo.login?.message}
                    className="w-full px-6"
                  >
                    <Controller
                      name="login"
                      control={controlInfo}
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
                              setValueInfo('email', v, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }
                          }}
                        />
                      )}
                    />
                  </FormItem>

                  {/* Nome */}
                  <FormItem
                    label="Nome"
                    invalid={Boolean(errorsInfo.name)}
                    errorMessage={errorsInfo.name?.message}
                    className="w-full px-6"
                  >
                    <Controller
                      name="name"
                      control={controlInfo}
                      render={({ field }) => (
                        <Input
                          type="text"
                          autoComplete="off"
                          placeholder="Nome completo"
                          {...field}
                        />
                      )}
                    />
                  </FormItem>

                  {!emailAsLogin && (
                    <FormItem
                      label="Email"
                      invalid={Boolean(errorsInfo.email)}
                      errorMessage={errorsInfo.email?.message}
                      className="w-full px-6"
                    >
                      <Controller
                        name="email"
                        control={controlInfo}
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

                  {/* Actived */}
                  <FormItem
                    label="Status"
                    invalid={Boolean(errorsInfo.email)}
                    errorMessage={errorsInfo.email?.message}
                    className="w-full px-6"
                  >
                    <Controller
                      name="actived"
                      control={controlInfo}
                      render={({ field: { value, onChange } }) => (
                        <div className="flex w-full flex-row gap-4">
                          <Switcher
                            checked={!!+value}
                            onChange={(v) => {
                              onChange(v);
                            }}
                          />
                          <p>{value ? 'Ativado' : 'Desativado'}</p>
                        </div>
                      )}
                    />
                  </FormItem>
                </div>

                <DialogActions isMobile={isMobile} align="right">
                  <Button type="button" className="ltr:mr-2 rtl:ml-2" onClick={closeComposeDialog}>
                    Cancelar
                  </Button>
                  <Button variant="solid" type="submit" loading={isLoading || isSubmiting}>
                    Confirmar
                  </Button>
                </DialogActions>
              </Form>
            )}

            {layout == 'new-password' && (
              <Form
                className="flex h-full w-full"
                containerClassName={`flex flex-col w-full justify-between h-full ${
                  isMobile ? 'overflow-hidden' : ''
                }`}
                onSubmit={handleSubmitPwd(onSubmitNewPassword)}
              >
                <div
                  className={`flex-1 px-6 pb-6 ${isMobile ? 'min-h-0 overflow-y-auto overscroll-contain' : ''}`}
                >
                  {/* New Password */}
                  <FormItem
                    label="Senha"
                    invalid={Boolean(errorsPwd.newPassword)}
                    errorMessage={errorsPwd.newPassword?.message}
                    className="w-full px-6"
                  >
                    <Controller
                      name="newPassword"
                      control={controlPwd}
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

                  {/* Confirm Password */}
                  <FormItem
                    label="Confirme senha"
                    invalid={Boolean(errorsPwd.confirmNewPassword)}
                    errorMessage={errorsPwd.confirmNewPassword?.message}
                    className="w-full px-6"
                  >
                    <Controller
                      name="confirmNewPassword"
                      control={controlPwd}
                      render={({ field }) => (
                        <PasswordInput autoComplete="off" placeholder="Confirme senha" {...field} />
                      )}
                    />
                  </FormItem>
                </div>

                <DialogActions isMobile={isMobile} align="right">
                  <Button type="button" className="ltr:mr-2 rtl:ml-2" onClick={closeComposeDialog}>
                    Cancelar
                  </Button>
                  <Button variant="solid" type="submit" loading={isLoading || isSubmiting}>
                    Confirmar
                  </Button>
                </DialogActions>
              </Form>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}

export default EditUserDialog;
