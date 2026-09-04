import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const UsersApp = lazyWithReducer('usersApp', () => import('./UsersApp'), reducer);

const UsersConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.admin,
  routes: [
    {
      path: '/users',
      element: <UsersApp />,
    },
  ],
};

export default UsersConfig;
