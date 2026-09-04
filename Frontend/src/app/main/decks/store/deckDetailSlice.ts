// src/app/main/apps/decks/store/deckDetailSlice.ts
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import { notifyError } from 'app/services/notificationService';
import type { AppRootStateType } from 'app/store/types';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import type { CardType, CardApiResponse, DeckType, DeckByIdApiResponse } from '../types/DeckTypes';

export const getDeck = createAppAsyncThunk<
  DeckType,
  { key: string },
  { state: AppRootStateType; rejectValue: { msg?: string } }
>('decksApp/detail/getDeck', async ({ key }, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<DeckByIdApiResponse>(`/decks/${key}`, { signal });
    return response.data.data;
  } catch (error: unknown) {
    if (signal?.aborted || (error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ msg: 'Requisição cancelada' });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar deck');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const getDeckCards = createAppAsyncThunk<
  CardType[],
  { deckId: number },
  { state: AppRootStateType; rejectValue: { msg?: string } }
>('decksApp/detail/getDeckCards', async ({ deckId }, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<CardApiResponse>(`/cards/deck/${deckId}`, { signal });
    return response.data.data;
  } catch (error: unknown) {
    if (signal?.aborted || (error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ msg: 'Requisição cancelada' });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar cards');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

const cardsAdapter = createEntityAdapter<CardType>();

interface DeckDetailState {
  deck: DeckType | null;
  deckStatus: Status;
  cardsStatus: Status;
  error?: string | null;
}

const initialState = cardsAdapter.getInitialState<DeckDetailState>({
  deck: null,
  deckStatus: 'idle',
  cardsStatus: 'idle',
  error: null,
});

export const deckDetailSlice = createSlice({
  name: 'decksApp/detail',
  initialState,
  reducers: {
    clearDeckDetail(state) {
      state.deck = null;
      state.deckStatus = 'idle';
      state.cardsStatus = 'idle';
      state.error = null;
      cardsAdapter.removeAll(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDeck.pending, (state) => {
        state.deckStatus = 'loading';
        state.error = null;
      })
      .addCase(getDeck.fulfilled, (state, action) => {
        state.deckStatus = 'succeeded';
        state.deck = action.payload;
      })
      .addCase(getDeck.rejected, (state, action) => {
        state.deckStatus = 'failed';
        state.error = action.payload?.msg ?? 'Erro desconhecido';
      })
      .addCase(getDeckCards.pending, (state) => {
        state.cardsStatus = 'loading';
      })
      .addCase(getDeckCards.fulfilled, (state, action) => {
        state.cardsStatus = 'succeeded';
        cardsAdapter.setAll(state, action.payload);
      })
      .addCase(getDeckCards.rejected, (state, action) => {
        state.cardsStatus = 'failed';
        state.error = action.payload?.msg ?? 'Erro desconhecido';
      })
      // React to card state mutations dispatched from cardSlice (avoids circular import)
      .addMatcher(
        (action): action is { type: string; payload: { progressId: number; deckCardId: number } } =>
          action.type === 'decksApp/card/suspendCard/fulfilled' ||
          action.type === 'decksApp/card/unsuspendCard/fulfilled' ||
          action.type === 'decksApp/card/buryCard/fulfilled',
        (state, action) => {
          const isSuspendOn = action.type === 'decksApp/card/suspendCard/fulfilled';
          const isSuspendOff = action.type === 'decksApp/card/unsuspendCard/fulfilled';
          const changes = isSuspendOn
            ? { isSuspended: true }
            : isSuspendOff
              ? { isSuspended: false }
              : { isBuried: true };
          cardsAdapter.updateOne(state, { id: action.payload.deckCardId, changes });
        }
      );
  },
});

export const { clearDeckDetail } = deckDetailSlice.actions;

type WithDeckDetailApp = { decksApp?: { detail?: ReturnType<typeof deckDetailSlice.reducer> } };

export const { selectAll: selectAllCards, selectTotal: selectCardTotal } =
  cardsAdapter.getSelectors(
    (state: AppRootStateType) =>
      (state as unknown as WithDeckDetailApp).decksApp?.detail ?? initialState
  );

export const selectCurrentDeck = (state: AppRootStateType) =>
  (state as unknown as WithDeckDetailApp).decksApp?.detail?.deck as DeckType | null;

export const selectDeckStatus = (state: AppRootStateType) =>
  (state as unknown as WithDeckDetailApp).decksApp?.detail?.deckStatus as Status;

export const selectCardsStatus = (state: AppRootStateType) =>
  (state as unknown as WithDeckDetailApp).decksApp?.detail?.cardsStatus as Status;

export default deckDetailSlice.reducer;
