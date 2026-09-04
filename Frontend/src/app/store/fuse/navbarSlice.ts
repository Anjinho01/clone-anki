import { createSlice } from '@reduxjs/toolkit';
import type { AppRootStateType } from 'app/store/types';

/**
 * The type definition for the initial state of the navbar slice.
 */
type initialStateProps = {
  open: boolean;
  mobileOpen: boolean;
};

/**
 * The initial state of the navbar slice.
 */
const initialState: initialStateProps = {
  open: true,
  mobileOpen: false,
};

/**
 * The navbar slice.
 */
export const navbarSlice = createSlice({
  name: 'fuse/navbar',
  initialState,
  reducers: {
    navbarToggleMobile: (state) => {
      state.mobileOpen = !state.mobileOpen;
    },
    navbarOpenMobile: (state) => {
      state.mobileOpen = true;
    },
    navbarCloseMobile: (state) => {
      state.mobileOpen = false;
    },
    navbarClose: (state) => {
      state.open = false;
    },
    navbarOpen: (state) => {
      state.open = true;
    },
    navbarToggle: (state) => {
      state.open = !state.open;
    },
  },
});

export const {
  navbarOpen,
  navbarClose,
  navbarToggle,
  navbarOpenMobile,
  navbarCloseMobile,
  navbarToggleMobile,
} = navbarSlice.actions;

export const selectFuseNavbar = ({ fuse }: AppRootStateType) => fuse.navbar;

export default navbarSlice.reducer;
