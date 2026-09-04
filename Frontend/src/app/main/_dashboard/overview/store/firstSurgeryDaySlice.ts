import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Types */
import type { AppRootStateType } from 'app/store/types';
import type { FistApiResponse, FistType } from '../types/OverviewType';

import { notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

/**
 * AsyncThunk: busca primeria cirurgia via API
 */
export const getFirstSurgeryDay = createAppAsyncThunk<
  FistApiResponse,
  { date: string },
  { state: AppRootStateType }
>(
  'overviewApp/firstSurgeryDay/getFirstSurgeryDay',
  async ({ date }, { rejectWithValue, signal }) => {
    try {
      const params = new URLSearchParams({ date });
      const response = await api.get<FistApiResponse>(`/overview/first?${params}`, { signal });
      return response.data;
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao carregar primeira cirurgia do dia');

      notifyError(msg, 'top-end');

      return rejectWithValue({ msg });
    }
  }
);

type FirstSurgeryDayState = {
  loading: boolean;
  error: string | null;
  data: FistType;
};

const initialState: FirstSurgeryDayState = {
  loading: true,
  error: null,
  data: {
    total: 0,
    le0730: 0,
    between0730_0800: 0,
    gt0800: 0,
    pct: { le0730: 0, between0730_0800: 0, gt0800: 0 },
  },
};

/**
 * Slice: estado do suspensão de cirurgias
 */
export const firstSurgeryDaySlice = createSlice({
  name: 'overviewApp/firstSurgeryDay',
  initialState,
  reducers: {
    setLoadingFirstSurgeryDay: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearFirstSurgeryDay: (state) => {
      state.loading = false;
      state.error = null;
      state.data = {
        total: 0,
        le0730: 0,
        between0730_0800: 0,
        gt0800: 0,
        pct: { le0730: 0, between0730_0800: 0, gt0800: 0 },
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // .addCase(getFirstSurgeryDay.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      .addCase(getFirstSurgeryDay.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(getFirstSurgeryDay.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Erro inesperado';
        state.loading = false;
        state.data = {
          total: 0,
          le0730: 0,
          between0730_0800: 0,
          gt0800: 0,
          pct: { le0730: 0, between0730_0800: 0, gt0800: 0 },
        };
      });
  },
});

/**
 * Actions
 */
export const { setLoadingFirstSurgeryDay, clearFirstSurgeryDay } = firstSurgeryDaySlice.actions;

/**
 * Selectors
 */
export const selectFirstSurgeryDay = (state: AppRootStateType) => state.overviewApp.firstSurgeryDay;

export const selectFirstSurgeryDayData = (state: AppRootStateType) =>
  state.overviewApp.firstSurgeryDay.data;

export const selectFirstSurgeryDayLoading = (state: AppRootStateType) =>
  state.overviewApp.firstSurgeryDay.loading;

export default firstSurgeryDaySlice.reducer;
