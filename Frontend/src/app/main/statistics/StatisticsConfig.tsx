import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const StatisticsApp = lazyWithReducer('statisticsApp', () => import('./StatisticsApp'), reducer);

const StatisticsConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.user,
  routes: [
    {
      path: '/statistics',
      element: <StatisticsApp />,
    },
  ],
};

export default StatisticsConfig;
