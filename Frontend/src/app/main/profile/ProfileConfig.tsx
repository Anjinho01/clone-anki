import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const ProfileApp = lazyWithReducer('profileApp', () => import('./ProfileApp'), reducer);

const ProfileConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.all,
  routes: [
    {
      path: '/me',
      children: [
        {
          path: 'profile',
          element: <ProfileApp />,
        },
        {
          path: 'security',
          element: <ProfileApp />,
        },
        {
          path: 'access',
          element: <ProfileApp />,
        },
      ],
    },
  ],
};

export default ProfileConfig;
