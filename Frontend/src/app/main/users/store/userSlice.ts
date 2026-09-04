import type { PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Types */
import type { AppRootStateType } from 'app/store/types';
import type { NewUser, EditUser } from '../types/FormType';
import type { UserType } from '../types/UserType';
import type { UserApiResponse } from '../types/UserApiType';

import { notifySuccess, notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, {
  extractApiValidationDetails,
  isRequestCanceledError,
} from 'app/utils/extractApiErrorMessage';

type RejectPayload = {
  msg?: string;
  details?: Array<{ field?: string; message: string }>;
  aborted?: boolean;
};

type CreateUserPayload = {
  data: NewUser;
};

type UpdateUserPayload = {
  id: number;
  data: EditUser;
};

type PasswordPayload = {
  id: number;
  newPassword: string;
};

/**
 * Gets the user.
 */
export const getUser = createAppAsyncThunk<
  UserType | null, // tipo do payload retornado
  { id: number }, // tipo do payload
  { state: AppRootStateType }
>('usersApp/users/getUser', async ({ id }, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<UserApiResponse>(`/users/${id}`, { signal });
    const { data } = response.data;
    if (!data) return null;

    const userData: UserType = {
      ...data,
      id: data.userId,
    };

    return userData;
  } catch (error: unknown) {
    if (isRequestCanceledError(error, signal)) {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar usuário');

    notifyError(msg, 'top-end');

    return rejectWithValue({ msg });
  }
});

/**
 * Create User
 */
export const createUser = createAppAsyncThunk<
  UserType,
  CreateUserPayload,
  { state: AppRootStateType }
>('usersApp/user/createUser', async (payload, { rejectWithValue, signal, getState }) => {
  try {
    const role = getState().usersApp.roles.entities[payload.data.roleId]?.role;
    const requestBody = {
      name: payload.data.name,
      email: payload.data.email,
      password: payload.data.password,
      role,
    };

    const response = await api.post('/users', requestBody, { signal });
    const { data } = response.data;

    notifySuccess('Usuário cadastrado com sucesso!', 'top-end');

    return data;
  } catch (error: unknown) {
    if (isRequestCanceledError(error, signal)) {
      return rejectWithValue({ aborted: true });
    }

    const details = extractApiValidationDetails(error);
    const msg = extractApiErrorMessage(error, 'Erro ao criar usuário');

    notifyError(msg, 'top-end');

    return rejectWithValue({ msg, details } satisfies RejectPayload);
  }
});

/**
 * Update User
 */
export const updateUser = createAppAsyncThunk<
  UserType,
  UpdateUserPayload,
  { state: AppRootStateType }
>('usersApp/user/updateUser', async (payload, { rejectWithValue, signal, getState }) => {
  try {
    const role = getState().usersApp.roles.entities[payload.data.roleId]?.role;
    const requestBody = {
      name: payload.data.name,
      email: payload.data.email,
      role,
      actived: payload.data.actived === true ? 1 : 0,
    };

    const response = await api.put(`/users/${payload.id}`, requestBody, {
      signal,
    });
    const updatedRaw = response.data.data;

    if (!updatedRaw) {
      const msg = 'Não foi possível atualizar o usuário!';
      notifyError(msg, 'top-end');
      return rejectWithValue(msg);
    }

    const updated: UserType = {
      ...updatedRaw,
      actived: Boolean(requestBody.actived),
      role: requestBody.role ?? updatedRaw.role,
      id: updatedRaw.userId,
    };

    notifySuccess('Usuário atualizado com sucesso!', 'top-end');

    return updated;
  } catch (error: unknown) {
    if (isRequestCanceledError(error, signal)) {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao atualizar usuário');

    notifyError(msg, 'top-end');

    return rejectWithValue({ msg });
  }
});

/**
 * Reset Password
 */
export const resetPassword = createAppAsyncThunk<
  { data: boolean },
  PasswordPayload,
  { state: AppRootStateType }
>('usersApp/user/resetPassword', async ({ id, newPassword }, { rejectWithValue, signal }) => {
  try {
    const requestBody = {
      newPassword,
    };

    const response = await api.put(`/users/${id}/reset-password`, requestBody, { signal });
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
});

const userAdapter = createEntityAdapter<UserType>({});

const initialState = userAdapter.getInitialState({
  newUserDialog: {
    props: { isOpen: false },
    data: {},
  },
  editUserDialog: {
    props: { isOpen: false },
    data: {} as Partial<EditUser>,
  },
});

/**
 * The user slice.
 */
export const userSlice = createSlice({
  name: 'usersApp/user',
  initialState,
  reducers: {
    openNewUserDialog: (state, action: PayloadAction<Partial<NewUser>>) => {
      state.newUserDialog = {
        props: { isOpen: true },
        data: action.payload,
      };
    },

    closeNewUserDialog: (state, _action) => {
      state.newUserDialog = {
        props: { isOpen: false },
        data: {},
      };
    },
    openEditUserDialog: (state, action: PayloadAction<Partial<EditUser>>) => {
      state.editUserDialog = {
        props: { isOpen: true },
        data: action.payload,
      };
    },

    closeEditUserDialog: (state, _action) => {
      state.editUserDialog = {
        props: { isOpen: false },
        data: {},
      };
    },
  },
});

export const { openNewUserDialog, closeNewUserDialog, openEditUserDialog, closeEditUserDialog } =
  userSlice.actions;

export const selectNewUserDialog = (state: AppRootStateType) => state.usersApp.user.newUserDialog;

export const selectEditUserDialog = (state: AppRootStateType) => state.usersApp.user.editUserDialog;

export default userSlice.reducer;
