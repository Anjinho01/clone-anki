import _ from '@lodash';
import type { DeepPartial } from 'react-hook-form';
import type { PasswordUser } from '../types/FormType';

const NewPasswordModel = (data?: DeepPartial<PasswordUser>): PasswordUser => {
  // como _.uniqueId() retorna string, convertendo pra number
  const defaults: PasswordUser = {
    newPassword: '',
    confirmNewPassword: '',
  };

  // _.defaults preenche só os campos que faltam em `data`
  return _.defaults(data || {}, defaults);
};

export default NewPasswordModel;
