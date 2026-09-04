// src/app/main/apps/decks/store/deckSlice.ts
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import { notifySuccess, notifyError } from 'app/services/notificationService';
import type { AppRootStateType } from 'app/store/types';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import type { DeckType, DeckByIdApiResponse } from '../types/DeckTypes';
import { getDecks } from './decksSlice';
import { getDeck } from './deckDetailSlice';

/* ─── Payload types ──────────────────────────────────────────── */
export interface DeckFormData {
  name: string;
  description?: string;
  type?: 'general' | 'private';
  packageId?: number | null;
  newCardsPerDay?: number;
  reviewCardsPerDay?: number;
  desiredRetention?: number;
}

/* ─── Async thunks ───────────────────────────────────────────── */
export const createDeck = createAppAsyncThunk<DeckType, DeckFormData, { state: AppRootStateType }>(
  'decksApp/deck/createDeck',
  async (data, { dispatch, rejectWithValue, signal }) => {
    try {
      const response = await api.post<DeckByIdApiResponse>('/decks', data, { signal });
      notifySuccess('Deck criado com sucesso!', 'top-end');
      dispatch(getDecks());
      return response.data.data;
    } catch (error: unknown) {
      const msg = extractApiErrorMessage(error, 'Erro ao criar deck');
      notifyError(msg, 'top-end');
      return rejectWithValue({ msg });
    }
  }
);

export const updateDeck = createAppAsyncThunk<
  DeckType,
  { id: number; data: DeckFormData; silent?: boolean; refresh?: boolean },
  { state: AppRootStateType }
>(
  'decksApp/deck/updateDeck',
  async ({ id, data, silent = false, refresh = true }, { dispatch, rejectWithValue, signal }) => {
    try {
      const response = await api.put<DeckByIdApiResponse>(`/decks/${id}`, data, { signal });
      if (!silent) {
        notifySuccess('Deck atualizado com sucesso!', 'top-end');
      }
      if (refresh) {
        dispatch(getDecks());
        dispatch(getDeck({ id }));
      }
      return response.data.data;
    } catch (error: unknown) {
      const msg = extractApiErrorMessage(error, 'Erro ao atualizar deck');
      if (!silent) {
        notifyError(msg, 'top-end');
      }
      return rejectWithValue({ msg });
    }
  }
);

export const deleteDeck = createAppAsyncThunk<number, number, { state: AppRootStateType }>(
  'decksApp/deck/deleteDeck',
  async (id, { dispatch, rejectWithValue, signal }) => {
    try {
      await api.delete(`/decks/${id}`, { signal });
      notifySuccess('Deck excluído com sucesso!', 'top-end');
      dispatch(getDecks());
      return id;
    } catch (error: unknown) {
      const msg = extractApiErrorMessage(error, 'Erro ao excluir deck');
      notifyError(msg, 'top-end');
      return rejectWithValue({ msg });
    }
  }
);

/* ─── Dialog state types ─────────────────────────────────────── */
interface DialogState<T = Record<string, unknown>> {
  props: { isOpen: boolean };
  data: T;
}

interface DeckSliceState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  newDeckDialog: DialogState;
  editDeckDialog: DialogState<Partial<DeckType>>;
  deleteDeckId: number | null;
}

const initialState: DeckSliceState = {
  status: 'idle',
  newDeckDialog: { props: { isOpen: false }, data: {} },
  editDeckDialog: { props: { isOpen: false }, data: {} },
  deleteDeckId: null,
};

/* ─── Slice ──────────────────────────────────────────────────── */
export const deckSlice = createSlice({
  name: 'decksApp/deck',
  initialState,
  reducers: {
    openNewDeckDialog: (state) => {
      state.newDeckDialog = { props: { isOpen: true }, data: {} };
    },
    closeNewDeckDialog: (state) => {
      state.newDeckDialog = { props: { isOpen: false }, data: {} };
    },
    openEditDeckDialog: (state, action: PayloadAction<DeckType>) => {
      state.editDeckDialog = { props: { isOpen: true }, data: action.payload };
    },
    closeEditDeckDialog: (state) => {
      state.editDeckDialog = { props: { isOpen: false }, data: {} };
    },
    openDeleteDeck: (state, action: PayloadAction<number>) => {
      state.deleteDeckId = action.payload;
    },
    closeDeleteDeck: (state) => {
      state.deleteDeckId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDeck.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createDeck.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(createDeck.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(updateDeck.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateDeck.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updateDeck.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(deleteDeck.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteDeck.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(deleteDeck.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const {
  openNewDeckDialog,
  closeNewDeckDialog,
  openEditDeckDialog,
  closeEditDeckDialog,
  openDeleteDeck,
  closeDeleteDeck,
} = deckSlice.actions;

type WithDecksApp = { decksApp?: { deck?: DeckSliceState } };
export const selectNewDeckDialog = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.deck?.newDeckDialog;
export const selectEditDeckDialog = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.deck?.editDeckDialog;
export const selectDeleteDeckId = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.deck?.deleteDeckId;
export const selectDeckActionStatus = (state: AppRootStateType) =>
  (state as unknown as WithDecksApp).decksApp?.deck?.status;

export default deckSlice.reducer;
