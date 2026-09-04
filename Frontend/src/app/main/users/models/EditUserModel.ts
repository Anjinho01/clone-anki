import _ from '@lodash';
import type { DeepPartial } from 'react-hook-form';
import type { EditUser } from '../types/FormType';

const UserModel = (data?: DeepPartial<EditUser>): EditUser => {
  // Note que aqui trocamos `id: 0` por `userId: 0`
  const defaults: EditUser = {
    userId: 0,
    roleId: 0,
    name: '',
    login: '',
    email: '',
    actived: true,
    role: '',
  };

  // _.defaults vai preencher todo campo que esteja faltando em `data`
  return _.defaults(data || {}, defaults) as EditUser;
};

export default UserModel;
