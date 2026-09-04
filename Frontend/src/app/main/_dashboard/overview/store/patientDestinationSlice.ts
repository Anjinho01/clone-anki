import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Types */
import type { AppRootStateType } from 'app/store/types';
import type { DestinationApiResponse, DestinationType } from '../types/OverviewType';

import { notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

/**
 * AsyncThunk: busca destino dos pacientes apos cirurgia via API
 */
export const getPatientDestination = createAppAsyncThunk<
  DestinationApiResponse,
  { date: string },
  { state: AppRootStateType }
>(
  'overviewApp/patientDestination/getPatientDestination',
  async ({ date }, { rejectWithValue, signal }) => {
    try {
      const params = new URLSearchParams({ date });
      const response = await api.get<DestinationApiResponse>(`/overview/destination?${params}`, {
        signal,
      });
      return response.data;
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao carregar destino dos pacientes');

      notifyError(msg, 'top-end');

      return rejectWithValue({ msg });
    }
  }
);

type PatientDestinationState = {
  loading: boolean;
  error: string | null;
  data: DestinationType;
};

const initialState: PatientDestinationState = {
  loading: true,
  error: null,
  data: {
    total: 0,
    morgue: 0,
    uti: 0,
    srpa: 0,
  },
};

/**
 * Slice: estado do destino dos pacientes apos cirurgia
 */
export const patientDestinationSlice = createSlice({
  name: 'overviewApp/patientDestination',
  initialState,
  reducers: {
    setLoadingPatientDestination: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearPatientDestination: (state) => {
      state.loading = false;
      state.error = null;
      state.data = {
        total: 0,
        morgue: 0,
        uti: 0,
        srpa: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // .addCase(getPatientDestination.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      .addCase(getPatientDestination.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(getPatientDestination.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Erro inesperado';
        state.loading = false;
        state.data = {
          total: 0,
          morgue: 0,
          uti: 0,
          srpa: 0,
        };
      });
  },
});

/**
 * Actions
 */
export const { setLoadingPatientDestination, clearPatientDestination } =
  patientDestinationSlice.actions;

/**
 * Selectors
 */
export const selectPatientDestination = (state: AppRootStateType) =>
  state.overviewApp.patientDestination;

export const selectPatientDestinationData = (state: AppRootStateType) =>
  state.overviewApp.patientDestination.data;

export const selectPatientDestinationLoading = (state: AppRootStateType) =>
  state.overviewApp.patientDestination.loading;

export default patientDestinationSlice.reducer;
