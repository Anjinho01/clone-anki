import React, { useCallback, useEffect, useState, useRef } from 'react';
import { TbX } from 'react-icons/tb';
import { PiUsersThreeDuotone } from 'react-icons/pi';
/* Components */
import Spinner from '@fuse/ui/Spinner';
import Button from '@fuse/ui/Button';
import CardUser from './components/CardUser';
import EditUserDialog from './dialogs/EditUserDialog';
/* Store */
import { useAppDispatch, useAppSelector } from 'app/store';
import { selectRoles } from './store/rolesSlice';
import {
  getUsers,
  selectSearchText,
  selectFilters,
  setSearchFilter,
  selectUsers,
  selectLoadingUsers,
  setLoadingUsers,
  selectPagination,
} from './store/usersSlice';

const STATUS_LABEL: Record<string, string> = {
  all: 'Todos',
  actived: 'Ativados',
  inactived: 'Desativados',
};

const UsersList: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoadingUsers);
  const searchText = useAppSelector(selectSearchText);
  const filters = useAppSelector(selectFilters);
  const roles = useAppSelector(selectRoles);
  const users = useAppSelector(selectUsers);

  const { page, limit, totalPages } = useAppSelector(selectPagination);

  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Label de role a partir do roleId
  const roleLabelById = (id: string) =>
    roles.find((r) => String(r.roleId) === String(id))?.role ?? id;

  // Função para buscar a página especificada
  const fetchPage = useCallback(
    (pageToFetch: number) => {
      loadingRef.current = true;
      dispatch(setLoadingUsers(true));
      dispatch(getUsers({ page: pageToFetch, limit })).finally(() => {
        dispatch(setLoadingUsers(false));

        loadingRef.current = false;
      });
    },
    [dispatch, limit, searchText, filters]
  );

  // Carrega a página inicial
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Função pra buscar a próxima página
  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    if (page >= totalPages) return;
    fetchPage(page + 1);
  }, [page, totalPages, fetchPage]);

  // IntersectionObserver para o sentinel
  useEffect(() => {
    if (!sentinelEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0 }
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl, loadMore]);

  // limpa 1 filtro e recarrega
  const handleClearStatus = () => {
    const next = { ...filters, usersStatus: 'all' as const };
    dispatch(setSearchFilter(next));
    fetchPage(1);
  };

  const handleClearRole = (roleId: string) => {
    const nextRoles = (filters.usersRoles || []).filter((id: string) => id !== roleId);
    const next = { ...filters, usersRoles: nextRoles };
    dispatch(setSearchFilter(next));
    fetchPage(1);
  };

  const handleClearAll = () => {
    dispatch(setSearchFilter({ usersStatus: 'all', usersRoles: [] }));
    fetchPage(1);
  };

  // === chips ativos ===
  const hasStatus = filters.usersStatus && filters.usersStatus !== 'all';
  const hasRoles = Array.isArray(filters.usersRoles) && filters.usersRoles.length > 0;

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-6 dark:border-slate-800 dark:bg-slate-900">
      {/* CHIPS DOS FILTROS ATIVOS */}
      {(hasStatus || hasRoles) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {hasStatus && (
            <Button
              type="button"
              size="sm"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
              icon={<TbX />}
              iconAlignment="end"
              onClick={handleClearStatus}
              aria-label="Limpar filtro status"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <strong className="font-semibold">
                  {STATUS_LABEL[filters.usersStatus] ?? filters.usersStatus}
                </strong>
              </div>
            </Button>
          )}

          {hasRoles &&
            filters.usersRoles.map((rid: string) => (
              <Button
                key={rid}
                type="button"
                size="sm"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
                icon={<TbX />}
                iconAlignment="end"
                onClick={() => handleClearRole(rid)}
                aria-label={`Remover função ${roleLabelById(rid)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Função:</span>
                  <strong className="font-semibold">{roleLabelById(rid)}</strong>
                </div>
              </Button>
            ))}

          <Button type="button" size="sm" onClick={handleClearAll}>
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Spinner inicial ou lista de usuários */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`users-loading-${index}`}
              className="h-32 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center md:px-6 md:py-14 dark:border-slate-700 dark:bg-slate-950/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
            <PiUsersThreeDuotone className="text-3xl" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
            Nenhum usuário encontrado
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Ajuste os filtros ativos ou crie um novo usuário para começar a montar a operação desta
            instância.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {users.map((user, idx) => (
            <CardUser
              key={`Card-list-${idx}.${user.id}`}
              userId={user.userId}
              name={user.name}
              role={user.role}
            />
          ))}

          <EditUserDialog />
        </div>
      )}

      {/* Sentinel sempre montado */}
      <div ref={setSentinelEl} style={{ height: 20 }} />

      {/* Spinner de carregamento de próximas páginas */}
      {loading && page > 1 && (
        <div className="flex items-center justify-center py-4">
          <Spinner size={24} />
        </div>
      )}

      {/* Mensagem ao finalizar */}
      {!loading && page > 1 && page >= totalPages && (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Não há mais usuários.
        </p>
      )}
    </section>
  );
};

export default UsersList;
