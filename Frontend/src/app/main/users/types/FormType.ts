// import type { Control, FieldErrors } from 'react-hook-form';

export type NewUser = {
  id?: number;
  roleId: number;
  name: string;
  login: string;
  email: string;
  password: string;
};

export type EditUser = {
  userId: number;
  roleId: number;
  name: string;
  login: string;
  email: string;
  actived: boolean;
  role: string;
};

export type PasswordUser = {
  newPassword: string;
  confirmNewPassword: string;
};

// export type InformationsFields = {
//   cpf?: string;
//   medicalRecord: string;
//   name: string;
//   dateOfBirth: Date;
//   gender: string;
// };

// export type UserFormSchema = InformationsFields;

// export type FormSectionBaseProps = {
//   control: Control<UserFormSchema>;
//   errors: FieldErrors<UserFormSchema>;
// };
