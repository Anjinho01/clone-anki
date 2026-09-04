import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const OverviewApp = lazyWithReducer('overviewApp', () => import('./OverviewApp'), reducer);

const OverviewConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.manager,
  routes: [
    {
      path: '/dashboard/overview',
      element: <OverviewApp />,
    },
  ],
};

export default OverviewConfig;
