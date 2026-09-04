// src/app/main/apps/decks/store/packageSlice.ts
import type { PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import api from 'api';
import { notifyError, notifySuccess } from 'app/services/notificationService';
import type { AppRootStateType } from 'app/store/types';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import type { PackageGroupType } from '../types/DeckTypes';

type CrudRejectValue = { aborted?: boolean; msg?: string };

export const getPackages = createAppAsyncThunk(
  'decksApp/packages/getAll',
  async (_, { signal }) => {
    const response = await api.get<{ success: boolean; data: PackageGroupType[] }>('/packages', {
      signal,
    });
    return response.data.data;
  }
);

export const getPackageById = createAppAsyncThunk(
  'decksApp/packages/getById',
  async (key: string | number) => {
    const response = await api.get<{ success: boolean; data: PackageGroupType }>(
      `/packages/${key}`
    );
    return response.data.data;
  }
);

export interface PackageFormData {
  name: string;
  description?: string | null;
  position?: number;
}

export const createPackage = createAppAsyncThunk<
  PackageGroupType,
  PackageFormData,
  { state: AppRootStateType; rejectValue: CrudRejectValue }
>('decksApp/packages/create', async (data, { rejectWithValue, signal }) => {
  try {
    const response = await api.post<{ success: boolean; data: PackageGroupType }>(
      '/packages',
      data,
      {
        signal,
      }
    );
    notifySuccess('Package criado com sucesso!', 'top-end');
    return response.data.data;
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao criar package');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const updatePackage = createAppAsyncThunk<
  PackageGroupType,
  { id: number; data: Partial<PackageFormData>; silent?: boolean },
  { state: AppRootStateType; rejectValue: CrudRejectValue }
>('decksApp/packages/update', async ({ id, data, silent = false }, { rejectWithValue, signal }) => {
  try {
    const response = await api.put<{ success: boolean; data: PackageGroupType }>(
      `/packages/${id}`,
      data,
      { signal }
    );
    if (!silent) {
      notifySuccess('Package atualizado com sucesso!', 'top-end');
    }
    return response.data.data;
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao atualizar package');
    if (!silent) {
      notifyError(msg, 'top-end');
    }
    return rejectWithValue({ msg });
  }
});

export const deletePackage = createAppAsyncThunk<
  number,
  number,
  { state: AppRootStateType; rejectValue: CrudRejectValue }
>('decksApp/packages/delete', async (id, { rejectWithValue, signal }) => {
  try {
    await api.delete(`/packages/${id}`, { signal });
    notifySuccess('Package excluído com sucesso!', 'top-end');
    return id;
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao excluir package');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

const packagesAdapter = createEntityAdapter<PackageGroupType>();

interface DialogState<T> {
  props: { isOpen: boolean };
  data: T;
}

interface PackagesState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  actionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  newPackageDialog: DialogState<Record<string, never>>;
  editPackageDialog: DialogState<PackageGroupType | null>;
  deletePackageId: number | null;
}

const initialState = packagesAdapter.getInitialState<PackagesState>({
  status: 'idle',
  actionStatus: 'idle',
  newPackageDialog: { props: { isOpen: false }, data: {} },
  editPackageDialog: { props: { isOpen: false }, data: null },
  deletePackageId: null,
});

const packageSlice = createSlice({
  name: 'decksApp/packages',
  initialState,
  reducers: {
    openNewPackageDialog(state) {
      state.newPackageDialog = { props: { isOpen: true }, data: {} };
    },
    closeNewPackageDialog(state) {
      state.newPackageDialog = { props: { isOpen: false }, data: {} };
    },
    openEditPackageDialog(state, action: PayloadAction<PackageGroupType>) {
      state.editPackageDialog = { props: { isOpen: true }, data: action.payload };
    },
    closeEditPackageDialog(state) {
      state.editPackageDialog = { props: { isOpen: false }, data: null };
    },
    openDeletePackage(state, action: PayloadAction<number>) {
      state.deletePackageId = action.payload;
    },
    closeDeletePackage(state) {
      state.deletePackageId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPackages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getPackages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        packagesAdapter.setAll(state, action.payload);
      })
      .addCase(getPackages.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = 'failed';
      })
      .addCase(createPackage.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        packagesAdapter.addOne(state, action.payload);
      })
      .addCase(createPackage.rejected, (state) => {
        state.actionStatus = 'failed';
      })
      .addCase(updatePackage.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(updatePackage.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        packagesAdapter.upsertOne(state, action.payload);
      })
      .addCase(updatePackage.rejected, (state) => {
        state.actionStatus = 'failed';
      })
      .addCase(deletePackage.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        packagesAdapter.removeOne(state, action.payload);
      })
      .addCase(deletePackage.rejected, (state) => {
        state.actionStatus = 'failed';
      })
      .addCase(getPackageById.fulfilled, (state, action) => {
        packagesAdapter.upsertOne(state, action.payload);
      });
  },
});

export const {
  openNewPackageDialog,
  closeNewPackageDialog,
  openEditPackageDialog,
  closeEditPackageDialog,
  openDeletePackage,
  closeDeletePackage,
} = packageSlice.actions;

const { selectAll: selectAllPackages, selectById: selectPackageById } =
  packagesAdapter.getSelectors((state: { decksApp: { packages: typeof initialState } }) => {
    return state.decksApp.packages;
  });

export { selectAllPackages, selectPackageById };

export const selectPackagesStatus = (state: { decksApp: { packages: typeof initialState } }) =>
  state.decksApp.packages.status;

export const selectPackageActionStatus = (state: { decksApp: { packages: typeof initialState } }) =>
  state.decksApp.packages.actionStatus;

export const selectNewPackageDialog = (state: { decksApp: { packages: typeof initialState } }) =>
  state.decksApp.packages.newPackageDialog;

export const selectEditPackageDialog = (state: { decksApp: { packages: typeof initialState } }) =>
  state.decksApp.packages.editPackageDialog;

export const selectDeletePackageId = (state: { decksApp: { packages: typeof initialState } }) =>
  state.decksApp.packages.deletePackageId;

export default packageSlice.reducer;
