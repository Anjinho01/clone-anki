import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const PackagesApp = lazyWithReducer('decksApp', () => import('./PackagesApp'), reducer);
const PackageDetailApp = lazyWithReducer('decksApp', () => import('./PackageDetailApp'), reducer);

const PackagesConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.user,
  routes: [
    {
      path: '/packages',
      element: <PackagesApp />,
      auth: authRoles.user,
    },
    {
      path: '/packages/:packageKey',
      element: <PackageDetailApp />,
    },
  ],
};

export default PackagesConfig;
