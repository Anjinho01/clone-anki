import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Types */
import type { AppRootStateType } from 'app/store/types';
import type { StatusApiResponse, StatusType } from '../types/OverviewType';

import { notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

// Status padrão (fallback)
const DEFAULT_STATUS_DATA: StatusType[] = [
  { status: 'em espera', total: 0 },
  { status: 'em sala', total: 0 },
  { status: 'finalizado', total: 0 },
  { status: 'suspenso', total: 0 },
];

/**
 * AsyncThunk: busca status das cirurgias via API
 */
export const getSurgeriesStatus = createAppAsyncThunk<
  StatusApiResponse,
  { date: string },
  { state: AppRootStateType }
>('overviewApp/surgeriesStatus/getSurgery', async ({ date }, { rejectWithValue, signal }) => {
  try {
    const params = new URLSearchParams({ date });
    const response = await api.get<StatusApiResponse>(`/overview/surgeries?${params}`, { signal });
    return response.data;
  } catch (error: unknown) {
    if (isRequestCanceledError(error, signal)) {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar status das cirurgias');

    notifyError(msg, 'top-end');

    return rejectWithValue({ msg });
  }
});

type SurgeriesStatusState = {
  loading: boolean;
  error: string | null;
  data: StatusApiResponse;
};

const initialState: SurgeriesStatusState = {
  loading: true,
  error: null,
  data: {
    total: 0,
    overviewStatus: [...DEFAULT_STATUS_DATA],
  },
};

/**
 * Slice: estado do status de cirurgias
 */
export const surgeriesStatusSlice = createSlice({
  name: 'overviewApp/surgeriesStatus',
  initialState,
  reducers: {
    setLoadingSurgeriesStatus: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearSurgeriesStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.data = {
        total: 0,
        overviewStatus: [...DEFAULT_STATUS_DATA],
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // .addCase(getSurgeriesStatus.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      .addCase(getSurgeriesStatus.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(getSurgeriesStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Erro inesperado';
        state.loading = false;
        state.data = {
          total: 0,
          overviewStatus: [...DEFAULT_STATUS_DATA],
        };
      });
  },
});

/**
 * Actions
 */
export const { setLoadingSurgeriesStatus, clearSurgeriesStatus } = surgeriesStatusSlice.actions;

/**
 * Selectors
 */
export const selectSurgeriesStatus = (state: AppRootStateType) => state.overviewApp.surgeriesStatus;

export const selectSurgeriesStatusData = (state: AppRootStateType) =>
  state.overviewApp.surgeriesStatus.data;

export const selectSurgeriesStatusLoading = (state: AppRootStateType) =>
  state.overviewApp.surgeriesStatus.loading;

export default surgeriesStatusSlice.reducer;
