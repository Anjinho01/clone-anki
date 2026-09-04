import type { PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import api from 'api';
import createAppAsyncThunk from 'app/store/createAppAsyncThunk';
/* Store */
import { createUser, updateUser } from './userSlice';
/* Types */
import type { AppRootStateType } from 'app/store/types';
import type { UsersApiResponse, Pagination } from '../types/UserApiType';
import type { UserType } from '../types/UserType';
import type { FormSchema } from '../components/FilterSidebar';

import { notifyError } from 'app/services/notificationService';
import extractApiErrorMessage, { isRequestCanceledError } from 'app/utils/extractApiErrorMessage';

/**
 * Gets the users.
 */
export const getUsers = createAppAsyncThunk<
  UserType[], // tipo do payload retornado
  { page: number; limit: number }, // tipo do payload
  { state: AppRootStateType }
>(
  'usersApp/users/getUsers',
  async ({ page, limit }, { dispatch, getState, rejectWithValue, signal }) => {
    try {
      const { searchText, filters } = getState().usersApp.users;
      const { usersStatus, usersRoles } = filters;

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (usersStatus && usersStatus !== 'all') params.append('status', usersStatus);
      if (usersRoles?.length) {
        const rolesParam = usersRoles.join(',');
        params.append('roles', rolesParam);
      }
      // if (searchText) params.append('search', searchText);
      if (searchText?.trim().length) {
        params.append('search', searchText.trim());
      }

      const response = await api.get<UsersApiResponse>(`/users?${params}`, {
        signal,
      });
      const { data, pagination } = response.data;

      const usersData: UserType[] = data.map((u) => ({
        ...u,
        id: u.userId,
      }));

      // Atualiza o state.pagination antes do fulfilled
      dispatch(setPagination(pagination));

      return usersData ?? [];
    } catch (error: unknown) {
      if (isRequestCanceledError(error, signal)) {
        return rejectWithValue({ aborted: true });
      }
      const msg = extractApiErrorMessage(error, 'Erro ao carregar usuários');

      notifyError(msg, 'top-end');

      return rejectWithValue({ msg });
    }
  }
);

const usersAdapter = createEntityAdapter<UserType>({});

const initialState = usersAdapter.getInitialState({
  loading: true,
  searchText: '',
  filters: {
    usersStatus: 'all',
    usersRoles: [],
  } as FormSchema,
  pagination: {
    limit: 30,
    page: 1,
    totalPages: 1,
    totalRecords: 5,
  } as Pagination,
});

export const {
  selectAll: selectUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state: AppRootStateType) => state.usersApp.users);

/**
 * The users slice.
 */
export const usersSlice = createSlice({
  name: 'usersApp/users',
  initialState,
  reducers: {
    setLoadingUsers(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },
    setSearchFilter(state, action: PayloadAction<FormSchema>) {
      state.filters = action.payload;
      state.pagination.page = 1;
    },
    setPagination(state, action: PayloadAction<Pagination>) {
      state.pagination = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        const edited = action.payload; // EditUser
        const entity: UserType = {
          ...edited,
          id: edited.userId,
          userId: edited.userId,
        };
        // upsertOne vai criar ou atualizar, sem você precisar de objeto `{changes, id}`
        usersAdapter.upsertOne(state, entity);
      })
      .addCase(createUser.fulfilled, (state, action) => {
        // Monta a entidade do UserType (com o `id` coerente)
        const created = action.payload as UserType;
        const entity: UserType = {
          ...created,
          id: created.id ?? created.userId ?? 0,
          userId: created.id ?? created.userId ?? 0,
          // caso tenha outros campos em UserType, inclua-os aqui
        };

        // Só atualiza se já existir na store; se não, não faz nada
        usersAdapter.addOne(state, entity);
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        // pega a página atual já atualizada por setPagination
        const currentPage = state.pagination.page;

        if (currentPage === 1) {
          // primeira página: substitui tudo
          usersAdapter.setAll(state, action.payload);
        } else {
          // páginas seguintes: só acrescenta quem ainda não existe
          usersAdapter.addMany(state, action.payload);
        }
      });
  },
});

export const { setLoadingUsers, setSearchText, setSearchFilter, setPagination } =
  usersSlice.actions;

export const selectLoadingUsers = (state: AppRootStateType) => state.usersApp.users.loading;

export const selectSearchText = (state: AppRootStateType) => state.usersApp.users.searchText;

export const selectFilters = (state: AppRootStateType) => state.usersApp.users.filters;

export const selectPagination = (state: AppRootStateType) => state.usersApp.users.pagination;

export default usersSlice.reducer;
