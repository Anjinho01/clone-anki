import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import type { AppRootStateType } from 'app/store/types';
import type { Notification } from './types';
import * as api from './api';

/** Adapter ordenando por createdAt desc */
const adapter = createEntityAdapter<Notification>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface NotificationsState {
  status: Status;
  error?: string | null;
  // paginação
  limit: number;
  offset: number;
  hasMore: boolean;
  // filtro
  onlyUnread: boolean;
  // contagem
  unreadCount: number;
  // dropdown abriu pelo menos uma vez?
  openedOnce: boolean;
}

const initialState = adapter.getInitialState<NotificationsState>({
  status: 'idle',
  limit: 8,
  offset: 0,
  hasMore: true,
  onlyUnread: false,
  unreadCount: 0,
  openedOnce: false,
});

/** Thunks */
export const getUnreadCount = createAsyncThunk('notifications/getUnreadCount', async () => {
  const count = await api.fetchUnreadCount();
  return count;
});

export const getFirstPage = createAsyncThunk(
  'notifications/getFirstPage',
  async (_, { getState }) => {
    const s = getState() as AppRootStateType;
    const { limit, onlyUnread } = s.notifications;
    const res = await api.fetchNotifications({ onlyUnread, limit, offset: 0 });
    return res; // { items, total? }
  }
);

export const getNextPage = createAsyncThunk(
  'notifications/getNextPage',
  async (_, { getState }) => {
    const s = getState() as AppRootStateType;
    const { limit, offset, onlyUnread } = s.notifications;
    const nextOffset = offset + limit;
    const res = await api.fetchNotifications({
      onlyUnread,
      limit,
      offset: nextOffset,
    });
    return { ...res, nextOffset }; // { items, total?, nextOffset }
  }
);

export const doMarkAsRead = createAsyncThunk('notifications/markAsRead', async (id: number) => {
  await api.markAsRead(id);
  return id;
});

/** Slice */
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setOnlyUnread(state, action: PayloadAction<boolean>) {
      state.onlyUnread = action.payload;
    },
    setOpenedOnce(state, action: PayloadAction<boolean>) {
      state.openedOnce = action.payload;
    },
    locallyMarkAsRead(state, action: PayloadAction<number>) {
      const id = action.payload;
      const n = state.entities[id];
      if (n && !n.isRead) {
        n.isRead = true;
        if (state.unreadCount > 0) state.unreadCount -= 1;
      }
    },
    // marcar várias (apenas as carregadas) localmente
    locallyMarkManyAsRead(state, action: PayloadAction<number[]>) {
      let dec = 0;
      for (const id of action.payload) {
        const n = state.entities[id];
        if (n && !n.isRead) {
          n.isRead = true;
          dec += 1;
        }
      }
      state.unreadCount = Math.max(0, state.unreadCount - dec);
    },
    // reset de lista (usa na tela quando troca filtros etc.)
    resetList(state) {
      adapter.removeAll(state);
      state.offset = 0;
      state.hasMore = true;
      state.status = 'idle';
    },
    /** <<< NOVO: reset geral para logout (zera tudo) >>> */
    resetAll() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(getFirstPage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getFirstPage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        adapter.setAll(state, action.payload.items);
        state.offset = 0;
        state.hasMore = action.payload.items.length >= state.limit;
      })
      .addCase(getFirstPage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.error.message || 'Erro ao carregar');
      })
      .addCase(getNextPage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getNextPage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        adapter.upsertMany(state, action.payload.items);
        state.offset = action.payload.nextOffset;
        state.hasMore = action.payload.items.length >= state.limit;
      })
      .addCase(getNextPage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.error.message || 'Erro ao carregar mais');
      })
      .addCase(doMarkAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const n = state.entities[id];
        if (n && !n.isRead) {
          n.isRead = true;
          if (state.unreadCount > 0) state.unreadCount -= 1;
        }
      });
  },
});

export const notificationsReducer = notificationsSlice.reducer;
export const {
  setOnlyUnread,
  setOpenedOnce,
  locallyMarkAsRead,
  locallyMarkManyAsRead,
  resetList,
  resetAll, // <<< exporta para usar no logout
} = notificationsSlice.actions;

/** Selectors */
const adapterSelectors = adapter.getSelectors<AppRootStateType>((state) => state.notifications);

export const selectNotificationsAll = adapterSelectors.selectAll;
export const selectNotificationsById = adapterSelectors.selectById;

export const selectNotificationsLoading = (state: AppRootStateType) =>
  state.notifications.status === 'loading';
export const selectNotificationsHasMore = (state: AppRootStateType) => state.notifications.hasMore;
export const selectNotificationsUnreadDot = (state: AppRootStateType) =>
  state.notifications.unreadCount > 0;

export default notificationsSlice.reducer;
