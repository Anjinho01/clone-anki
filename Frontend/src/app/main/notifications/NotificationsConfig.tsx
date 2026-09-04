import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const NotificationsApp = lazyWithReducer(
  'notificationsApp',
  () => import('./NotificationsApp'),
  reducer
);

const NotificationsConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.all,
  routes: [
    {
      path: '/notifications',
      children: [
        {
          path: '',
          element: <NotificationsApp />,
        },
      ],
    },
  ],
};

export default NotificationsConfig;
