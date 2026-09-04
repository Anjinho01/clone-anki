import type { PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { AppThunkType, AppRootStateType } from 'app/store/types';
import type { PartialDeep } from 'type-fest';
import { selectUserRole } from 'app/store/user/userSlice';
import FuseUtils from '@fuse/utils';
import FuseNavigationHelper from '@fuse/utils/FuseNavigationHelper';
import NavItemModel from '@fuse/core/FuseNavigation/models/NavItemModel';
import type { NavigationType } from '@fuse/core/FuseNavigation/types/NavigationType';
import type { NavItemType } from '@fuse/core/FuseNavigation/types/NavItemType';

import navigationConfig from 'app/configs/navigationConfig';

const navigationAdapter = createEntityAdapter<NavItemType>();

const emptyInitialState = navigationAdapter.getInitialState([]);

const initialState = navigationAdapter.upsertMany(emptyInitialState, navigationConfig);

/**
 * Redux Thunk actions related to the navigation store state
 */

/**
 * Appends a navigation item to the navigation store state.
 */
export const appendNavigationItem =
  (item: NavItemType, parentId?: string | null): AppThunkType =>
  async (dispatch, getState) => {
    const AppState = getState() as AppRootStateType;
    const navigation = selectNavigationAll(AppState);

    dispatch(
      setNavigation(FuseNavigationHelper.appendNavItem(navigation, NavItemModel(item), parentId))
    );

    return Promise.resolve();
  };

/**
 * Prepends a navigation item to the navigation store state.
 */
export const prependNavigationItem =
  (item: NavItemType, parentId?: string | null): AppThunkType =>
  async (dispatch, getState) => {
    const AppState = getState() as AppRootStateType;
    const navigation = selectNavigationAll(AppState);

    dispatch(
      setNavigation(FuseNavigationHelper.prependNavItem(navigation, NavItemModel(item), parentId))
    );

    return Promise.resolve();
  };

/**
 * Adds a navigation item to the navigation store state at the specified index.
 */
export const updateNavigationItem =
  (id: string, item: PartialDeep<NavItemType>): AppThunkType =>
  async (dispatch, getState) => {
    const AppState = getState() as AppRootStateType;
    const navigation = selectNavigationAll(AppState);

    dispatch(setNavigation(FuseNavigationHelper.updateNavItem(navigation, id, item)));

    return Promise.resolve();
  };

/**
 * Removes a navigation item from the navigation store state.
 */
export const removeNavigationItem =
  (id: string): AppThunkType =>
  async (dispatch, getState) => {
    const AppState = getState() as AppRootStateType;
    const navigation = selectNavigationAll(AppState);

    dispatch(setNavigation(FuseNavigationHelper.removeNavItem(navigation, id)));

    return Promise.resolve();
  };

export const {
  selectAll: selectNavigationAll,
  selectIds: selectNavigationIds,
  selectById: selectNavigationItemById,
} = navigationAdapter.getSelectors((state: AppRootStateType) => state.fuse.navigation);

/**
 * The navigation slice
 */
export const navigationSlice = createSlice({
  name: 'fuse/navigation',
  initialState,
  reducers: {
    setNavigation: (state, action: PayloadAction<NavigationType>) =>
      navigationAdapter.setAll(state, action.payload),
    resetNavigation: () => initialState,
  },
});

export const { setNavigation, resetNavigation } = navigationSlice.actions;

export const selectNavigation = createSelector(
  [selectNavigationAll, selectUserRole],
  (navigation, userRole) => {
    function setAdditionalData(data: NavigationType): NavigationType {
      return data?.map((item) => ({
        hasPermission: Boolean(FuseUtils.hasPermission(item?.authority, userRole)),
        ...item,
        ...(item.subMenu ? { subMenu: setAdditionalData(item.subMenu) } : {}),
        id: item.id,
      }));
    }

    const translatedValues = setAdditionalData(navigation);

    return translatedValues;
  }
);

export type navigationSliceType = typeof navigationSlice;

export default navigationSlice.reducer;
