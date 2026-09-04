import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Types */
import type { AppRootStateType } from 'app/store/types';
import type { ProfileType } from '../types/ProfileType';
import type { UserType, UserApiResponse } from '../types/UserType';

import { notifySuccess, notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

type UpdateMePayload = {
  data: ProfileType;
};

type PasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Get the profile
 */
export const getProfile = createAppAsyncThunk<
  UserType | null, // tipo do payload retornado
  void, // tipo do payload
  { state: AppRootStateType }
>('profileApp/profile/getProfile', async (_, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<UserApiResponse>(`/users/me`, { signal });
    const { data } = response.data;
    if (!data) return null;

    const surgeryData: UserType = {
      ...data,
      id: data.userId,
    };

    return surgeryData;
  } catch (error: unknown) {
    if (isRequestCanceledError(error, signal)) {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar perfil');

    notifyError(msg, 'top-end');

    return rejectWithValue({ msg });
  }
});

/**
 * Update Me
 */
export const updateMe = createAppAsyncThunk<UserType, UpdateMePayload, { state: AppRootStateType }>(
  'profileApp/profile/updateMe',
  async (payload, { rejectWithValue, signal }) => {
    try {
      const requestBody = {
        ...payload.data,
      };

      const response = await api.put(`/users/me`, requestBody, { signal });
      const updatedRaw = response.data.data;

      if (!updatedRaw) {
        const msg = 'Não foi possível atualizar o usuário!';
        notifyError(msg, 'top-end');
        return rejectWithValue(msg);
      }

      notifySuccess('Dados atualizado com sucesso!', 'top-end');

      return updatedRaw;
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao atualizar perfil');

      notifyError(msg, 'top-end');

      return rejectWithValue({ msg });
    }
  }
);

/**
 * Reset Password
 */
export const resetPassword = createAppAsyncThunk<
  { data: boolean },
  PasswordPayload,
  { state: AppRootStateType }
>(
  'profileApp/profile/resetPassword',
  async ({ currentPassword, newPassword }, { rejectWithValue, signal }) => {
    try {
      const requestBody = {
        currentPassword,
        newPassword,
      };

      const response = await api.put(`/users/me/reset-password`, requestBody, {
        signal,
      });
      const updatedPassword = response.data.data;

      if (!updatedPassword) {
        const msg = 'Não foi possível atualizar senha!';
        notifyError(msg, 'top-end');
        return rejectWithValue(msg);
      }

      notifySuccess('Senha atualizada com sucesso!', 'top-end');

      return updatedPassword;
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao atualizar senha');
      notifyError(msg, 'top-end');

      return rejectWithValue({ msg });
    }
  }
);

type ProfileState = {
  data: UserType | null;
  loading: boolean;
  error: string | null;
};

const initialState: ProfileState = {
  data: null,
  loading: true,
  error: null,
};

/**
 * The profile slice
 */
export const profileSlice = createSlice({
  name: 'profileApp/profile',
  initialState,
  reducers: {
    setLoadingProfile(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearProfile(state) {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export const { setLoadingProfile, clearProfile } = profileSlice.actions;

export const selectProfile = (state: AppRootStateType) => state.profileApp.profile;

export const selectLoadingProfile = (state: AppRootStateType) => state.profileApp.profile.loading;

export const selectProfileData = (state: AppRootStateType) => state.profileApp.profile.data;

export default profileSlice.reducer;
