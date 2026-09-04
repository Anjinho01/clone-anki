import type { PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Store */
import type { AppRootStateType } from 'app/store/types';
import type { RolesApiResponse } from '../types/RoleApiType';
import type { RoleType } from '../types/RoleType';

import { notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

/**
 * Gets the roles.
 */
export const getRoles = createAppAsyncThunk<
  RoleType[], // tipo do payload retornado
  void, // tipo do payload
  { state: AppRootStateType }
>('usersApp/roles/getRoles', async (_, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<RolesApiResponse>(`/roles`, { signal });
    const { data } = response.data;

    const rolesData: RoleType[] = data.map((r) => ({
      ...r,
      id: r.roleId,
    }));

    return rolesData;
  } catch (error: unknown) {
    if (isRequestCanceledError(error, signal)) {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar perfis');

    notifyError(msg, 'top-end');

    return rejectWithValue({ msg });
  }
});

const rolesAdapter = createEntityAdapter<RoleType>({});

const initialState = rolesAdapter.getInitialState({
  loading: true,
});

export const { selectAll: selectRoles, selectById: selectRoleById } = rolesAdapter.getSelectors(
  (state: AppRootStateType) => state.usersApp.roles
);

/**
 * The roles slice.
 */
export const rolesSlice = createSlice({
  name: 'usersApp/roles',
  initialState,
  reducers: {
    setLoadingRoles(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getRoles.fulfilled, (state, action) =>
      rolesAdapter.setAll(state, action.payload)
    );
  },
});

export const { setLoadingRoles } = rolesSlice.actions;

export const selectLoadingRoles = (state: AppRootStateType) => state.usersApp.roles.loading;

export default rolesSlice.reducer;
