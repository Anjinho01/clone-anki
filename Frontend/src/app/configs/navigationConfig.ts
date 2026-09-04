import type { NavigationType } from '@fuse/core/FuseNavigation/types/NavigationType';
import { authRoles } from 'app/auth';

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: NavigationType = [
  {
    id: 'applications',
    path: '',
    title: '',
    icon: '',
    type: 'title',
    authority: authRoles.user,
    subMenu: [
      {
        id: 'applications.decks',
        path: `/decks`,
        title: 'Meus Decks',
        icon: 'applicationsDecks',
        type: 'item',
        authority: authRoles.user,
        subMenu: [],
      },
      {
        id: 'applications.packages',
        path: `/packages`,
        title: 'Packages',
        icon: 'applicationsPackages',
        type: 'item',
        authority: authRoles.user,
        subMenu: [],
      },
      {
        id: 'applications.libraryCards',
        path: `/library-cards`,
        title: 'Biblioteca de Cards',
        icon: 'applicationsLibraryCards',
        type: 'item',
        authority: authRoles.user,
        subMenu: [],
      },
      {
        id: 'applications.statistics',
        path: `/statistics`,
        title: 'Estatísticas',
        icon: 'applicationsStatistics',
        type: 'item',
        authority: authRoles.user,
        subMenu: [],
      },
      {
        id: 'applications.users',
        path: `/users`,
        title: 'Usuários',
        icon: 'applicationsUsers',
        type: 'item',
        authority: authRoles.admin,
        subMenu: [],
      },
    ],
  },
  {
    id: 'decks',
    path: '',
    title: 'Decks',
    icon: '',
    type: 'title',
    authority: authRoles.user,
    subMenu: [],
  },
];

export default navigationConfig;
