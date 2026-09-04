import { useEffect } from 'react';
import {
  PiFadersHorizontalDuotone,
  PiUserCirclePlusDuotone,
  PiUsersThreeDuotone,
} from 'react-icons/pi';
/* Components */
import UsersTools from './UsersTools';
import UsersList from './UsersList';
import NewUserDialog from './dialogs/NewUserDialog';
import FloatButtonUser from './components/FloatButtonUser';
/* Store */
import Button from '@fuse/ui/Button';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getRoles, setLoadingRoles } from './store/rolesSlice';
import { openNewUserDialog } from './store/userSlice';
import { selectFilters } from './store/usersSlice';

function UsersApp() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const activeFilterCount =
    (filters.usersStatus && filters.usersStatus !== 'all' ? 1 : 0) +
    (Array.isArray(filters.usersRoles) ? filters.usersRoles.length : 0);

  useEffect(() => {
    dispatch(getRoles()).then(() => dispatch(setLoadingRoles(false)));
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-4 px-4 py-5 md:gap-6 md:px-8 md:py-8 xl:px-10">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                  <PiUsersThreeDuotone className="text-sm" />
                  Usuários
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  <PiFadersHorizontalDuotone className="text-sm" />
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} ativo${activeFilterCount > 1 ? 's' : ''}`
                    : 'Sem filtros ativos'}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-[2rem] dark:text-white">
                Gestão de Usuários
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Pesquisa rápida e filtros no topo. O foco principal fica na grade de usuários e na
                edição pelos cards.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-xs font-medium tracking-[0.24em] text-slate-400 uppercase xl:block">
                Scroll infinito ativo
              </div>
              <Button
                variant="solid"
                className="rounded-2xl px-5 py-3"
                icon={<PiUserCirclePlusDuotone className="text-lg" />}
                onClick={() => dispatch(openNewUserDialog({}))}
              >
                Novo usuário
              </Button>
            </div>
          </div>

          <UsersTools />
        </div>
      </section>

      <UsersList />
      <NewUserDialog />

      <FloatButtonUser />
    </div>
  );
}

export default UsersApp;
