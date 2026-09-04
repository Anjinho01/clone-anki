import type { PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import { notifyError, notifySuccess } from 'app/services/notificationService';
import type { AppRootStateType } from 'app/store/types';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import type { FlashcardType } from '../types/DeckTypes';
import type {
  LibraryCardsApiResponse,
  LibraryCardsLimits,
  LibraryCardsPagination,
} from '../../libraryCards/types/LibraryCardTypes';

type CrudRejectValue = { aborted?: boolean; msg?: string };

export interface LibraryCardFormData {
  type?: 'general' | 'private';
  front: string;
  back: string;
  cardType?: 'basic' | 'reversed' | 'cloze' | 'mcq';
  mcqOptions?: string[] | null;
  mcqCorrect?: string | null;
}

export const getLibraryCards = createAppAsyncThunk<
  FlashcardType[],
  { page: number; limit: number; search?: string },
  { rejectValue: { aborted?: boolean; msg?: string } }
>(
  'decksApp/libraryCards/getAll',
  async ({ page, limit, search }, { dispatch, rejectWithValue, signal }) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search?.trim()) {
        params.append('search', search.trim());
      }

      const response = await api.get<LibraryCardsApiResponse>(`/library-cards?${params}`, {
        signal,
      });

      dispatch(
        setLibraryCardsPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          totalPages: response.data.pagination.totalPages,
          totalRecords: response.data.pagination.totalRecords,
        })
      );
      dispatch(setLibraryCardsLimits(response.data.limits));

      return response.data.data;
    } catch (error: unknown) {
      if (signal?.aborted || (error as { name?: string })?.name === 'CanceledError') {
        return rejectWithValue({ aborted: true });
      }

      throw error;
    }
  }
);

export const getLibraryCardById = createAppAsyncThunk(
  'decksApp/libraryCards/getById',
  async (key: string | number) => {
    const response = await api.get<{ success: boolean; data: FlashcardType }>(
      `/library-cards/${key}`
    );
    return response.data.data;
  }
);

export const createLibraryCard = createAppAsyncThunk<
  FlashcardType,
  LibraryCardFormData,
  { state: AppRootStateType; rejectValue: CrudRejectValue }
>('decksApp/libraryCards/create', async (data, { rejectWithValue, signal }) => {
  try {
    const payload = {
      ...data,
      cardType: data.cardType === 'reversed' ? 'reverse' : data.cardType,
    };
    const response = await api.post<{ success: boolean; data: FlashcardType }>(
      '/library-cards',
      payload,
      { signal }
    );
    notifySuccess('Card reutilizável criado com sucesso!', 'top-end');
    return response.data.data;
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao criar card reutilizável');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const updateLibraryCard = createAppAsyncThunk<
  FlashcardType,
  { id: number; data: Partial<LibraryCardFormData> },
  { state: AppRootStateType; rejectValue: CrudRejectValue }
>('decksApp/libraryCards/update', async ({ id, data }, { rejectWithValue, signal }) => {
  try {
    const payload = {
      ...data,
      cardType: data.cardType === 'reversed' ? 'reverse' : data.cardType,
    };
    const response = await api.put<{ success: boolean; data: FlashcardType }>(
      `/library-cards/${id}`,
      payload,
      { signal }
    );
    notifySuccess('Card reutilizável atualizado com sucesso!', 'top-end');
    return response.data.data;
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao atualizar card reutilizável');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const deleteLibraryCard = createAppAsyncThunk(
  'decksApp/libraryCards/delete',
  async (id: number, { rejectWithValue, signal }) => {
    try {
      await api.delete(`/library-cards/${id}`, { signal });
      notifySuccess('Card reutilizável excluído com sucesso!', 'top-end');
      return id;
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === 'CanceledError') {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao excluir card reutilizável');
      notifyError(msg, 'top-end');
      return rejectWithValue({ msg });
    }
  }
);

export const addLibraryCardToDeck = createAppAsyncThunk<
  { cardId: number; deckId: number },
  { cardId: number; deckId: number },
  { state: AppRootStateType; rejectValue: CrudRejectValue }
>('decksApp/libraryCards/addToDeck', async ({ cardId, deckId }, { rejectWithValue, signal }) => {
  try {
    await api.post(`/library-cards/${cardId}/decks/${deckId}`, undefined, { signal });
    notifySuccess('Card adicionado ao deck com sucesso!', 'top-end');
    return { cardId, deckId };
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'CanceledError') {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao adicionar card ao deck');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

const libraryCardsAdapter = createEntityAdapter<FlashcardType>();

const initialState = libraryCardsAdapter.getInitialState<{
  status: Status;
  actionStatus: Status;
  loading: boolean;
  searchText: string;
  pagination: LibraryCardsPagination;
  limits: LibraryCardsLimits;
}>({
  status: 'idle',
  actionStatus: 'idle',
  loading: false,
  searchText: '',
  pagination: {
    page: 1,
    limit: 30,
    totalPages: 1,
    totalRecords: 0,
  },
  limits: {
    privateOwnedCards: {
      current: 0,
      max: 2000,
    },
  },
});

const libraryCardSlice = createSlice({
  name: 'decksApp/libraryCards',
  initialState,
  reducers: {
    setLoadingLibraryCards(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setLibraryCardsSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
      state.pagination.page = 1;
    },
    setLibraryCardsPagination(state, action: PayloadAction<LibraryCardsPagination>) {
      state.pagination = action.payload;
    },
    setLibraryCardsLimits(state, action: PayloadAction<LibraryCardsLimits>) {
      state.limits = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLibraryCards.pending, (state, action) => {
        if (action.meta.arg.page === 1 || state.ids.length === 0) {
          state.status = 'loading';
        }
      })
      .addCase(getLibraryCards.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.meta.arg.page === 1) {
          libraryCardsAdapter.setAll(state, action.payload);
        } else {
          libraryCardsAdapter.addMany(state, action.payload);
        }
      })
      .addCase(getLibraryCards.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = 'failed';
      })
      .addCase(createLibraryCard.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(createLibraryCard.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        libraryCardsAdapter.addOne(state, action.payload);
      })
      .addCase(createLibraryCard.rejected, (state) => {
        state.actionStatus = 'failed';
      })
      .addCase(updateLibraryCard.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(updateLibraryCard.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        libraryCardsAdapter.upsertOne(state, action.payload);
      })
      .addCase(updateLibraryCard.rejected, (state) => {
        state.actionStatus = 'failed';
      })
      .addCase(deleteLibraryCard.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(deleteLibraryCard.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        libraryCardsAdapter.removeOne(state, action.payload);
      })
      .addCase(deleteLibraryCard.rejected, (state) => {
        state.actionStatus = 'failed';
      })
      .addCase(getLibraryCardById.fulfilled, (state, action) => {
        libraryCardsAdapter.upsertOne(state, action.payload);
      })
      .addCase(addLibraryCardToDeck.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(addLibraryCardToDeck.fulfilled, (state) => {
        state.actionStatus = 'succeeded';
      })
      .addCase(addLibraryCardToDeck.rejected, (state) => {
        state.actionStatus = 'failed';
      });
  },
});

export const {
  setLoadingLibraryCards,
  setLibraryCardsSearchText,
  setLibraryCardsPagination,
  setLibraryCardsLimits,
} = libraryCardSlice.actions;

const { selectAll: selectAllLibraryCards, selectById: selectLibraryCardById } =
  libraryCardsAdapter.getSelectors(
    (state: { decksApp: { libraryCards: typeof initialState } }) => state.decksApp.libraryCards
  );

export { selectAllLibraryCards, selectLibraryCardById };

export const selectLibraryCardsStatus = (state: {
  decksApp: { libraryCards: typeof initialState };
}) => state.decksApp.libraryCards.status;

export const selectLoadingLibraryCards = (state: {
  decksApp: { libraryCards: typeof initialState };
}) => state.decksApp.libraryCards.loading;

export const selectLibraryCardsSearchText = (state: {
  decksApp: { libraryCards: typeof initialState };
}) => state.decksApp.libraryCards.searchText;

export const selectLibraryCardsPagination = (state: {
  decksApp: { libraryCards: typeof initialState };
}) => state.decksApp.libraryCards.pagination;

export const selectLibraryCardsLimits = (state: {
  decksApp: { libraryCards: typeof initialState };
}) => state.decksApp.libraryCards.limits;

export const selectLibraryCardActionStatus = (state: {
  decksApp: { libraryCards: typeof initialState };
}) => state.decksApp.libraryCards.actionStatus;

export default libraryCardSlice.reducer;
