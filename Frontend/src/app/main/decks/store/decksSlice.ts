// src/app/main/apps/decks/store/decksSlice.ts
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import { notifyError } from 'app/services/notificationService';
import type { AppRootStateType } from 'app/store/types';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import type { DeckType, DeckApiResponse } from '../types/DeckTypes';

export const getDecks = createAppAsyncThunk<
  DeckType[],
  void,
  { state: AppRootStateType; rejectValue: { msg?: string } }
>('decksApp/decks/getDecks', async (_, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<DeckApiResponse>('/decks', { signal });
    return response.data.data;
  } catch (error: unknown) {
    if (signal?.aborted || (error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ msg: 'Requisição cancelada' });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar decks');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

const decksAdapter = createEntityAdapter<DeckType>();
const initialState = decksAdapter.getInitialState<{
  status: Status;
  error?: string | null;
}>({
  status: 'idle',
  error: null,
});

export const decksSlice = createSlice({
  name: 'decksApp/decks',
  initialState,
  reducers: {
    clearDecks(state) {
      state.status = 'idle';
      state.error = null;
      decksAdapter.removeAll(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDecks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getDecks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        decksAdapter.setAll(state, action.payload);
      })
      .addCase(getDecks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.msg ?? 'Erro desconhecido';
      });
  },
});

export const { clearDecks } = decksSlice.actions;

type WithDecksApp = { decksApp?: { decks?: ReturnType<typeof decksSlice.reducer> } };

export const {
  selectAll: selectAllDecks,
  selectById: selectDeckById,
  selectIds: selectDeckIds,
} = decksAdapter.getSelectors(
  (state: AppRootStateType) => (state as unknown as WithDecksApp).decksApp?.decks
);

export const selectDecksStatus = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.decks?.status as Status;

export const selectGeneralDecks = (state: AppRootStateType) =>
  selectAllDecks(state).filter((d) => d.type === 'general');

export const selectPrivateDecks = (state: AppRootStateType) =>
  selectAllDecks(state).filter((d) => d.type === 'private');

export default decksSlice.reducer;
