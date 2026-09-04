import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import history from '@history';
import settingsConfig from 'app/configs/settingsConfig';
/* Types */
import type { AppThunkType, AppRootStateType } from 'app/store/types';
import type { UserType, RawApiUser } from 'app/store/user';

/**
 * Sets the user data in the Redux store.
 * Receives the raw API user object and transforms it to the UserType shape.
 */
export const setUser = createAsyncThunk('user/setUser', (user: RawApiUser) => {
  if (user.loginRedirectUrl) {
    settingsConfig.loginRedirectUrl = user.loginRedirectUrl;
  }

  const role = user.role ?? '';
  const userData: UserType = {
    userId: user.id ?? user.userId ?? null,
    role,
    data: {
      displayName: user.name?.split(' ')[0] ?? user.email ?? '',
      displayRole: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Guest',
      email: user.email ?? '',
      photoURL: user.photoURL ?? '',
    },
  };

  return Promise.resolve(userData);
});

/**
 * Logs the user out and resets the Redux store.
 */
export const logoutUser = (): AppThunkType => async (dispatch, getState) => {
  const AppState = getState();

  const isUserGuest = selectIsUserGuest(AppState);

  if (isUserGuest) return null;

  history.push({ pathname: '/' });

  return Promise.resolve(dispatch(userLoggedOut()));
};

/**
 * The initial state of the user slice.
 */
const initialState: UserType = {
  userId: null,
  role: '', // guest
  data: {
    displayName: '',
    displayRole: 'guest',
    photoURL: '',
    email: '',
  },
};

/**
 * The User slice
 */
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    userLoggedOut: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(setUser.fulfilled, (_state, action) => action.payload);
  },
});

export const { userLoggedOut } = userSlice.actions;

export const selectUser = (state: AppRootStateType) => state.user;

export const selectUserId = (state: AppRootStateType) => state.user.userId;

export const selectUserRole = (state: AppRootStateType) => state.user.role;

export const selectIsUserGuest = (state: AppRootStateType) => {
  const { role } = state.user;

  return !role || role.length === 0;
};

export default userSlice.reducer;
