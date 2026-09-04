import axios from 'axios';
import { createSlice } from '@reduxjs/toolkit';
import api from 'app/services/api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import type { AppRootStateType } from 'app/store/types';

export type StudyReviewsByDay = {
  date: string;
  count: number;
};

export type StudyStatistics = {
  totalReviews: number;
  averageDurationMs: number;
  retentionRate: number;
  reviewsByDay: StudyReviewsByDay[];
};

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type StatisticsState = {
  days: 7 | 30 | 90;
  status: Status;
  error: string | null;
  data: StudyStatistics | null;
};

const initialState: StatisticsState = {
  days: 30,
  status: 'idle',
  error: null,
  data: null,
};

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseError = error.response?.data?.error;

    if (typeof responseError === 'string') {
      return responseError;
    }

    if (
      responseError &&
      typeof responseError === 'object' &&
      'message' in responseError &&
      typeof responseError.message === 'string'
    ) {
      return responseError.message;
    }

    if (typeof error.response?.data?.message === 'string') {
      return error.response.data.message;
    }

    if (typeof error.message === 'string') {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Nao foi possivel carregar as estatisticas';
}

export const getStatistics = createAppAsyncThunk<
  StudyStatistics,
  { days: 7 | 30 | 90 },
  { state: AppRootStateType }
>('statisticsApp/getStatistics', async ({ days }, { rejectWithValue, signal }) => {
  try {
    const response = await api.get('/reviews/stats', {
      params: { days },
      signal,
    });

    return response.data?.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return rejectWithValue({ aborted: true });
    }

    return rejectWithValue({ message: extractErrorMessage(error) });
  }
});

const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    setStatisticsDays(state, action: { payload: 7 | 30 | 90 }) {
      state.days = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getStatistics.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getStatistics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.error = null;
      })
      .addCase(getStatistics.rejected, (state, action) => {
        if ((action.payload as { aborted?: boolean } | undefined)?.aborted) {
          return;
        }

        state.status = 'failed';
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          'Nao foi possivel carregar as estatisticas';
      });
  },
});

export const { setStatisticsDays } = statisticsSlice.actions;

const selectStatisticsRoot = (state: AppRootStateType): StatisticsState => {
  const statisticsState = (
    state as AppRootStateType & {
      statisticsApp?: {
        statistics?: StatisticsState;
      };
    }
  ).statisticsApp?.statistics;

  return statisticsState ?? initialState;
};

export const selectStatisticsDays = (state: AppRootStateType) => selectStatisticsRoot(state).days;
export const selectStatisticsStatus = (state: AppRootStateType) =>
  selectStatisticsRoot(state).status;
export const selectStatisticsError = (state: AppRootStateType) => selectStatisticsRoot(state).error;
export const selectStatisticsData = (state: AppRootStateType) => selectStatisticsRoot(state).data;

export default statisticsSlice.reducer;
