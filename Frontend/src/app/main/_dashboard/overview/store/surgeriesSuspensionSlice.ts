import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Types */
import type { AppRootStateType } from 'app/store/types';
import type { SuspensionApiResponse, SuspensionType } from '../types/OverviewType';

import { notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

/**
 * AsyncThunk: busca suspensão das cirurgias via API
 */
export const getSurgeriesSuspension = createAppAsyncThunk<
  SuspensionApiResponse,
  { date: string },
  { state: AppRootStateType }
>(
  'overviewApp/surgeriesSuspension/getSurgeriesSuspension',
  async ({ date }, { rejectWithValue, signal }) => {
    try {
      const params = new URLSearchParams({ date });
      const response = await api.get<SuspensionApiResponse>(`/overview/suspension?${params}`, {
        signal,
      });
      return response.data;
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao carregar suspensões');

      notifyError(msg, 'top-end');

      return rejectWithValue({ msg });
    }
  }
);

type SurgeriesSuspensionState = {
  loading: boolean;
  error: string | null;
  data: SuspensionType;
};

const initialState: SurgeriesSuspensionState = {
  loading: true,
  error: null,
  data: {
    total: 0,
    patient: 0,
    structure: 0,
    team: 0,
  },
};

/**
 * Slice: estado do suspensão de cirurgias
 */
export const surgeriesSuspensionSlice = createSlice({
  name: 'overviewApp/surgeriesSuspension',
  initialState,
  reducers: {
    setLoadingSurgeriesSuspension: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearSurgeriesSuspension: (state) => {
      state.loading = false;
      state.error = null;
      state.data = {
        total: 0,
        patient: 0,
        structure: 0,
        team: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // .addCase(getSurgeriesSuspension.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      .addCase(getSurgeriesSuspension.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(getSurgeriesSuspension.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Erro inesperado';
        state.loading = false;
        state.data = {
          total: 0,
          patient: 0,
          structure: 0,
          team: 0,
        };
      });
  },
});

/**
 * Actions
 */
export const { setLoadingSurgeriesSuspension, clearSurgeriesSuspension } =
  surgeriesSuspensionSlice.actions;

/**
 * Selectors
 */
export const selectSurgeriesSuspension = (state: AppRootStateType) =>
  state.overviewApp.surgeriesSuspension;

export const selectSurgeriesSuspensionData = (state: AppRootStateType) =>
  state.overviewApp.surgeriesSuspension.data;

export const selectSurgeriesSuspensionLoading = (state: AppRootStateType) =>
  state.overviewApp.surgeriesSuspension.loading;

export default surgeriesSuspensionSlice.reducer;
