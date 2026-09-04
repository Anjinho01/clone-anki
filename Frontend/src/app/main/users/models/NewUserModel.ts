import _ from '@lodash';
import type { DeepPartial } from 'react-hook-form';
import type { NewUser } from '../types/FormType';

const UserModel = (data?: DeepPartial<NewUser>): NewUser => {
  // como _.uniqueId() retorna string, convertendo pra number
  const defaults: NewUser = {
    id: Number(_.uniqueId()),
    roleId: 0,
    name: '',
    login: '',
    email: '',
    password: '',
  };

  // _.defaults preenche só os campos que faltam em `data`
  return _.defaults(data || {}, defaults);
};

export default UserModel;
