// src/app/store/fuse/addDecksToNav.ts
//
// Syncs packages into the first slot(s) of the "decks" sidebar group.
// Static admin links remain in place after the dynamic entries.
//
import api from 'api';
import type { AppThunkType } from 'app/store/types';
import type { NavItemType } from '@fuse/core/FuseNavigation/types/NavItemType';
import { updateNavigationItem } from './navigationSlice';
import { authRoles } from 'app/auth';
import navigationConfig from 'app/configs/navigationConfig';

interface ApiPackageGroup {
  id: number;
  uuid: string;
  name: string;
  type: 'general' | 'private';
}

interface ApiDeck {
  id: number;
}

const MAX_PACKAGES_IN_MENU = 10;

const staticDeckSubMenu =
  navigationConfig
    .find((item) => item.id === 'decks')
    ?.subMenu?.filter((item) => {
      return item.id !== 'decks.study';
    }) ?? [];

export const syncDecksNavigation = (): AppThunkType => async (dispatch) => {
  try {
    const [packagesResponse, decksResponse] = await Promise.all([
      api.get<{ success: boolean; data: ApiPackageGroup[] }>('/packages'),
      api.get<{ success: boolean; data: ApiDeck[] }>('/decks'),
    ]);

    const packageGroups: ApiPackageGroup[] = packagesResponse.data?.data ?? [];
    const decks: ApiDeck[] = decksResponse.data?.data ?? [];

    const generalGroups = packageGroups.filter((group) => group.type === 'general');
    const privateGroups = packageGroups.filter((group) => group.type === 'private');

    const makeItem = (group: ApiPackageGroup): NavItemType => {
      return {
        id: `package-group.${group.uuid}`,
        title: group.name,
        path: `/packages/${group.uuid}`,
        type: 'item' as const,
        icon: 'packagesDecks',
        authority: authRoles.user,
        subMenu: [],
      };
    };

    const allDynamicSubMenu: NavItemType[] = [
      ...generalGroups.map(makeItem),
      ...privateGroups.map(makeItem),
    ];

    const dynamicSubMenu = allDynamicSubMenu.slice(0, MAX_PACKAGES_IN_MENU);

    const viewAllPackagesItem: NavItemType = {
      id: 'package-group.view-all',
      title:
        allDynamicSubMenu.length > MAX_PACKAGES_IN_MENU
          ? `Ver todos os packages (${allDynamicSubMenu.length})`
          : 'Ver packages',
      path: '/packages',
      type: 'item',
      icon: 'applicationsPackages',
      authority: authRoles.user,
      subMenu: [],
    };

    const createDeckItem: NavItemType = {
      id: 'decks.create-private',
      title: 'Novo Deck',
      path: '/decks?new=1',
      type: 'item',
      icon: 'decksCreate',
      authority: authRoles.user,
      subMenu: [],
    };

    const subMenu: NavItemType[] =
      dynamicSubMenu.length > 0
        ? [
            ...dynamicSubMenu,
            ...(allDynamicSubMenu.length > MAX_PACKAGES_IN_MENU ? [viewAllPackagesItem] : []),
            ...staticDeckSubMenu,
          ]
        : decks.length === 0
          ? [createDeckItem]
          : staticDeckSubMenu;

    dispatch(updateNavigationItem('decks', { subMenu }));
  } catch {
    // Navigation is non-critical; silent failures are acceptable.
  }
};

export const clearDecksFromNav = (): AppThunkType => async (dispatch) => {
  dispatch(updateNavigationItem('decks', { subMenu: staticDeckSubMenu }));
};
