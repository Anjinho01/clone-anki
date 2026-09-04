import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const LibraryCardsApp = lazyWithReducer('decksApp', () => import('./LibraryCardsApp'), reducer);

const LibraryCardsConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.user,
  routes: [
    {
      path: '/library-cards',
      element: <LibraryCardsApp />,
    },
  ],
};

export default LibraryCardsConfig;
