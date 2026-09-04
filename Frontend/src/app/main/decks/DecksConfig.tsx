import { authRoles } from 'app/auth';
import lazyWithReducer from 'app/store/lazyWithReducer';
import reducer from './store';

const DecksApp = lazyWithReducer('decksApp', () => import('./DecksApp'), reducer);
const DeckDetailApp = lazyWithReducer('decksApp', () => import('./DeckDetailApp'), reducer);
const DeckStudyApp = lazyWithReducer('decksApp', () => import('./DeckStudyApp'), reducer);
const DecksManageApp = lazyWithReducer('decksApp', () => import('./DecksManageApp'), reducer);

const DecksConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  auth: authRoles.user,
  routes: [
    {
      path: '/decks',
      element: <DecksApp />,
    },
    {
      path: '/decks/manage',
      element: <DecksManageApp />,
      auth: authRoles.monitor,
    },
    {
      path: '/decks/:deckKey/study',
      element: <DeckStudyApp />,
    },
    {
      path: '/decks/:deckKey',
      element: <DeckDetailApp />,
    },
  ],
};

export default DecksConfig;
