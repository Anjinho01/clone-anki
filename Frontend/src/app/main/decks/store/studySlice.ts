import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import { notifyError } from 'app/services/notificationService';
import type { AppRootStateType } from 'app/store/types';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import type { CardApiResponse, CardType } from '../types/DeckTypes';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type SubmitReviewPayload = {
  cardId: number;
  deckId: number;
  rating: 1 | 2 | 3 | 4;
  durationMs?: number;
};

type SubmitReviewResponse = {
  success: boolean;
  data: {
    card: CardType;
    nextReview: string;
    scheduledDays: number;
  };
};

export const getStudySession = createAppAsyncThunk<
  CardType[],
  { deckId: number; limit?: number },
  { state: AppRootStateType; rejectValue: { msg?: string } }
>('decksApp/study/getSession', async ({ deckId, limit }, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<CardApiResponse>(`/reviews/study/${deckId}`, {
      signal,
      params: limit ? { limit } : undefined,
    });
    return response.data.data;
  } catch (error: unknown) {
    if (signal?.aborted || (error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ msg: 'Requisição cancelada' });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar sessão de estudo');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const submitStudyReview = createAppAsyncThunk<
  { cardId: number; nextReview: string; scheduledDays: number },
  SubmitReviewPayload,
  { state: AppRootStateType; rejectValue: { msg?: string } }
>('decksApp/study/submitReview', async (payload, { rejectWithValue, signal }) => {
  try {
    const response = await api.post<SubmitReviewResponse>('/reviews', payload, { signal });
    return {
      cardId: response.data.data.card.id,
      nextReview: response.data.data.nextReview,
      scheduledDays: response.data.data.scheduledDays,
    };
  } catch (error: unknown) {
    if (signal?.aborted || (error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ msg: 'Requisição cancelada' });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao registrar review');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

const studyAdapter = createEntityAdapter<CardType>();

interface StudyState {
  status: Status;
  submitStatus: Status;
  reviewedCount: number;
  lastReviewedCardId: number | null;
  error?: string | null;
}

const initialState = studyAdapter.getInitialState<StudyState>({
  status: 'idle',
  submitStatus: 'idle',
  reviewedCount: 0,
  lastReviewedCardId: null,
  error: null,
});

export const studySlice = createSlice({
  name: 'decksApp/study',
  initialState,
  reducers: {
    clearStudySession(state) {
      state.status = 'idle';
      state.submitStatus = 'idle';
      state.reviewedCount = 0;
      state.lastReviewedCardId = null;
      state.error = null;
      studyAdapter.removeAll(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStudySession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.reviewedCount = 0;
        state.lastReviewedCardId = null;
      })
      .addCase(getStudySession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        studyAdapter.setAll(state, action.payload);
      })
      .addCase(getStudySession.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.msg ?? 'Erro desconhecido';
      })
      .addCase(submitStudyReview.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(submitStudyReview.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.reviewedCount += 1;
        state.lastReviewedCardId = action.payload.cardId;
        studyAdapter.removeOne(state, action.payload.cardId);
      })
      .addCase(submitStudyReview.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.error = action.payload?.msg ?? 'Erro desconhecido';
      });
  },
});

export const { clearStudySession } = studySlice.actions;

type WithDeckStudyApp = { decksApp?: { study?: ReturnType<typeof studySlice.reducer> } };

export const { selectAll: selectStudyCards } = studyAdapter.getSelectors(
  (state: AppRootStateType) =>
    (state as unknown as WithDeckStudyApp).decksApp?.study ?? initialState
);

export const selectStudyStatus = (state: AppRootStateType) =>
  (state as unknown as WithDeckStudyApp).decksApp?.study?.status as Status;

export const selectStudySubmitStatus = (state: AppRootStateType) =>
  (state as unknown as WithDeckStudyApp).decksApp?.study?.submitStatus as Status;

export const selectStudyReviewedCount = (state: AppRootStateType) =>
  ((state as unknown as WithDeckStudyApp).decksApp?.study?.reviewedCount ?? 0) as number;

export const selectStudyError = (state: AppRootStateType) =>
  ((state as unknown as WithDeckStudyApp).decksApp?.study?.error ?? null) as string | null;

export default studySlice.reducer;
