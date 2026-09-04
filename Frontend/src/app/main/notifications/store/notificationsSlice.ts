// src/app/main/apps/notifications/store/notificationsSlice.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
import type { AppRootStateType } from 'app/store/types';
import { notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

/* ========================= Tipos locais ========================= */
export type Notification = {
  id: number;
  title: string;
  message?: string;
  linkUrl?: string;
  linkParams?: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string; // ISO ou similar
  expiresAt?: string | null;
};

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type ListResponse = {
  items: Notification[];
  total?: number;
};

/* ========================= Utils locais ========================= */
const parseMaybeJson = (val: any) => {
  if (!val) return undefined;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return undefined;
  }
};

const mapDTO = (n: any): Notification => ({
  id: n?.notificationId ?? n?.notification_id ?? n?.id,
  title: n?.title,
  message: n?.message,
  linkUrl: n?.linkUrl ?? n?.link_url ?? undefined,
  linkParams: parseMaybeJson(n?.linkParams ?? n?.link_params),
  isRead: Boolean(n?.isRead ?? n?.is_read),
  readAt: n?.readAt ?? n?.read_at ?? null,
  createdAt: n?.createdAt ?? n?.created_at,
  expiresAt: n?.expiresAt ?? n?.expires_at ?? null,
});

/* ========================= Adapter/estado ========================= */
const adapter = createEntityAdapter<Notification>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

const initialState = adapter.getInitialState({
  status: 'idle' as Status,
  error: null as string | null,
  // paginação por limit/offset
  limit: 15,
  offset: 0,
  hasMore: true,
  // filtro
  onlyUnread: false,
  // estados auxiliares
  loadingMore: false,
  unreadCount: 0,
  openedOnce: false,
});

/* ========================= API (interna ao slice) ========================= */
async function apiFetchNotifications(
  opts: {
    onlyUnread?: boolean;
    limit?: number;
    offset?: number;
  },
  config?: { signal?: AbortSignal }
): Promise<ListResponse> {
  const { onlyUnread = false, limit = 15, offset = 0 } = opts;
  const { data } = await api.get('/notifications', {
    params: { onlyUnread: onlyUnread ? 1 : 0, limit, offset },
    signal: config?.signal,
  });
  return {
    items: (data?.items ?? []).map(mapDTO),
    total: data?.total,
  };
}

async function apiFetchUnreadCount(config?: { signal?: AbortSignal }): Promise<number> {
  const { data } = await api.get('/notifications/unread-count', {
    signal: config?.signal,
  });
  return Number(data?.count ?? 0);
}

async function apiMarkAsRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

async function apiMarkAllAsRead(): Promise<void> {
  await api.post(`/notifications/read-all`);
}

/* ========================= Thunks ========================= */
export const getUnreadCount = createAppAsyncThunk<number, void, { state: AppRootStateType }>(
  'notificationsApp/getUnreadCount',
  async (_, { rejectWithValue, signal }) => {
    try {
      return await apiFetchUnreadCount({ signal });
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro inesperado');
      notifyError(msg, 'top-end');
      return rejectWithValue({ msg });
    }
  }
);

export const getFirstPage = createAppAsyncThunk<ListResponse, void, { state: AppRootStateType }>(
  'notificationsApp/getFirstPage',
  async (_, { getState, rejectWithValue, signal }) => {
    try {
      const s = (getState() as AppRootStateType).notificationsApp.notifications;
      const res = await apiFetchNotifications(
        { onlyUnread: s.onlyUnread, limit: s.limit, offset: 0 },
        { signal }
      );
      return res;
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao carregar');
      notifyError(msg, 'top-end');
      return rejectWithValue({ msg });
    }
  }
);

export const getNextPage = createAppAsyncThunk<
  { items: Notification[]; nextOffset: number },
  void,
  { state: AppRootStateType }
>('notificationsApp/getNextPage', async (_, { getState, rejectWithValue, signal }) => {
  try {
    const s = (getState() as AppRootStateType).notificationsApp.notifications;
    const nextOffset = s.offset + s.limit;
    const res = await apiFetchNotifications(
      { onlyUnread: s.onlyUnread, limit: s.limit, offset: nextOffset },
      { signal }
    );
    return { items: res.items, nextOffset };
  } catch (error: unknown) {
    if (isRequestCanceledError(error, signal)) {
      return rejectWithValue({ aborted: true });
    }
    const msg = extractApiErrorMessage(error, 'Erro ao carregar mais');
    notifyError(msg, 'top-end');
    return rejectWithValue({ msg });
  }
});

export const markAsRead = createAppAsyncThunk<number, { id: number }>(
  'notificationsApp/markAsRead',
  async ({ id }, { rejectWithValue }) => {
    try {
      await apiMarkAsRead(id);
      return id;
    } catch (error: unknown) {
      const msg = extractApiErrorMessage(error, 'Erro ao marcar como lida');
      notifyError(msg, 'top-end');
      return rejectWithValue({ msg });
    }
  }
);

export const markAllAsRead = createAppAsyncThunk<void, void>(
  'notificationsApp/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await apiMarkAllAsRead();
    } catch (error: unknown) {
      const msg = extractApiErrorMessage(error, 'Erro ao marcar todas como lidas');
      notifyError(msg, 'top-end');
      return rejectWithValue({ msg });
    }
  }
);

/* ========================= Slice ========================= */
export const notificationsSlice = createSlice({
  name: 'notificationsApp',
  initialState,
  reducers: {
    setOnlyUnread(state, action: PayloadAction<boolean>) {
      state.onlyUnread = action.payload;
    },
    setOpenedOnce(state, action: PayloadAction<boolean>) {
      state.openedOnce = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload;
    },
    resetList(state) {
      adapter.removeAll(state);
      state.offset = 0;
      state.hasMore = true;
      state.status = 'idle';
      state.error = null;
    },
    // otimistas
    locallyMarkAsRead(state, action: PayloadAction<number>) {
      const n = state.entities[action.payload];
      if (n && !n.isRead) {
        n.isRead = true;
        if (state.unreadCount > 0) state.unreadCount -= 1;
      }
    },
    locallyMarkManyAsRead(state, action: PayloadAction<number[]>) {
      let dec = 0;
      for (const id of action.payload) {
        const n = state.entities[id];
        if (n && !n.isRead) {
          n.isRead = true;
          dec++;
        }
      }
      state.unreadCount = Math.max(0, state.unreadCount - dec);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload ?? 0;
      })

      .addCase(getFirstPage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getFirstPage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        adapter.setAll(state, action.payload.items);
        state.offset = 0;
        state.hasMore = (action.payload.items?.length ?? 0) >= state.limit;
      })
      .addCase(getFirstPage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(
          (action.payload as { msg?: string })?.msg || action.error?.message || 'Erro ao carregar'
        );
      })

      .addCase(getNextPage.pending, (state) => {
        state.loadingMore = true;
        state.error = null;
      })
      .addCase(getNextPage.fulfilled, (state, action) => {
        state.loadingMore = false;
        adapter.upsertMany(state, action.payload.items);
        state.offset = action.payload.nextOffset;
        state.hasMore = (action.payload.items?.length ?? 0) >= state.limit;
      })
      .addCase(getNextPage.rejected, (state) => {
        state.loadingMore = false;
      })

      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.entities[action.payload];
        if (n && !n.isRead) {
          n.isRead = true;
          if (state.unreadCount > 0) state.unreadCount -= 1;
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        for (const id of state.ids as number[]) {
          const n = state.entities[id];
          if (n) n.isRead = true;
        }
        state.unreadCount = 0;
      });
  },
});

/* ========================= Exports ========================= */
export default notificationsSlice.reducer;
export const {
  setOnlyUnread,
  setOpenedOnce,
  setLimit,
  resetList,
  locallyMarkAsRead,
  locallyMarkManyAsRead,
} = notificationsSlice.actions;

/* ========================= Selectors ========================= */
const adapterSelectors = adapter.getSelectors<AppRootStateType>(
  (state) => state.notificationsApp.notifications
);

export const selectNotificationsAll = adapterSelectors.selectAll;
export const selectNotificationsById = adapterSelectors.selectById;
export const selectNotificationsIds = adapterSelectors.selectIds;

export const selectNotificationsLoading = (state: AppRootStateType) =>
  state.notificationsApp.notifications.status === 'loading';
export const selectNotificationsLoadingMore = (state: AppRootStateType) =>
  state.notificationsApp.notifications.loadingMore;
export const selectNotificationsHasMore = (state: AppRootStateType) =>
  state.notificationsApp.notifications.hasMore;
export const selectOnlyUnread = (state: AppRootStateType) =>
  state.notificationsApp.notifications.onlyUnread;
export const selectUnreadDot = (state: AppRootStateType) =>
  state.notificationsApp.notifications.unreadCount > 0;
