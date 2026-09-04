// src/app/main/apps/decks/store/cardSlice.ts
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import { notifySuccess, notifyError } from 'app/services/notificationService';
import type { AppRootStateType } from 'app/store/types';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import { getDeckCards } from './deckDetailSlice';

type CardMutationResult = {
  progressId: number;
  deckCardId: number;
};

type CardMutationResponse = {
  success: boolean;
  message: string;
  data: CardMutationResult;
};

/* ─── Async thunks ───────────────────────────────────────────── */

export const suspendCard = createAppAsyncThunk<
  CardMutationResult,
  number,
  { state: AppRootStateType }
>('decksApp/card/suspendCard', async (cardId, { rejectWithValue, signal }) => {
  try {
    const response = await api.patch<CardMutationResponse>(
      `/cards/${cardId}/suspend`,
      {},
      { signal }
    );
    notifySuccess('Card suspenso!', 'top-end');
    return response.data.data;
  } catch (error: unknown) {
    const msg = extractApiErrorMessage(error, 'Erro ao suspender card');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const unsuspendCard = createAppAsyncThunk<
  CardMutationResult,
  number,
  { state: AppRootStateType }
>('decksApp/card/unsuspendCard', async (cardId, { rejectWithValue, signal }) => {
  try {
    const response = await api.patch<CardMutationResponse>(
      `/cards/${cardId}/unsuspend`,
      {},
      { signal }
    );
    notifySuccess('Suspensão removida!', 'top-end');
    return response.data.data;
  } catch (error: unknown) {
    const msg = extractApiErrorMessage(error, 'Erro ao remover suspensão');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const buryCard = createAppAsyncThunk<
  CardMutationResult,
  number,
  { state: AppRootStateType }
>('decksApp/card/buryCard', async (cardId, { rejectWithValue, signal }) => {
  try {
    const response = await api.patch<CardMutationResponse>(`/cards/${cardId}/bury`, {}, { signal });
    notifySuccess('Card enterrado até amanhã!', 'top-end');
    return response.data.data;
  } catch (error: unknown) {
    const msg = extractApiErrorMessage(error, 'Erro ao enterrar card');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const unburyExpired = createAppAsyncThunk<
  void,
  { deckId: number },
  { state: AppRootStateType }
>('decksApp/card/unburyExpired', async ({ deckId }, { dispatch, rejectWithValue, signal }) => {
  try {
    await api.post(`/cards/deck/${deckId}/unbury-expired`, {}, { signal });
    dispatch(getDeckCards({ deckId }));
  } catch (error: unknown) {
    const msg = extractApiErrorMessage(error, 'Erro ao desenterrar cards');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

/* ─── State ─────────────────────────────────────────────────── */

interface DialogState<T = Record<string, unknown>> {
  props: { isOpen: boolean };
  data: T;
}

interface CardSliceState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  // Picker dialog for adding a flashcard from the library to a deck
  newCardDialog: DialogState<{ deckId?: number }>;
  // Confirmation dialog for removing a flashcard from a deck
  removeFromDeck: { flashcardId: number; deckId: number } | null;
}

const initialState: CardSliceState = {
  status: 'idle',
  newCardDialog: { props: { isOpen: false }, data: {} },
  removeFromDeck: null,
};

/* ─── Slice ──────────────────────────────────────────────────── */

export const cardSlice = createSlice({
  name: 'decksApp/card',
  initialState,
  reducers: {
    openNewCardDialog: (state, action: PayloadAction<{ deckId: number }>) => {
      state.newCardDialog = { props: { isOpen: true }, data: action.payload };
    },
    closeNewCardDialog: (state) => {
      state.newCardDialog = { props: { isOpen: false }, data: {} };
    },
    openRemoveFromDeck: (state, action: PayloadAction<{ flashcardId: number; deckId: number }>) => {
      state.removeFromDeck = action.payload;
    },
    closeRemoveFromDeck: (state) => {
      state.removeFromDeck = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(suspendCard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(suspendCard.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(suspendCard.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(unsuspendCard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(unsuspendCard.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(unsuspendCard.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(buryCard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(buryCard.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(buryCard.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { openNewCardDialog, closeNewCardDialog, openRemoveFromDeck, closeRemoveFromDeck } =
  cardSlice.actions;

type WithDecksApp = { decksApp?: { card?: CardSliceState } };
export const selectNewCardDialog = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.card?.newCardDialog;
export const selectRemoveFromDeck = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.card?.removeFromDeck;
export const selectCardActionStatus = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.card?.status;

export default cardSlice.reducer;
