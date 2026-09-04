import { lazy, Suspense, useEffect } from 'react';
import Avatar from '@fuse/ui/Avatar';
import { useLocation } from 'react-router-dom';
import { PiUserCircleDuotone } from 'react-icons/pi';
/* Components */
import useResponsive from '@fuse/hooks/useResponsive';
/* Views */
import ProfileMenu from './components/ProfileMenu';
import ProfileMobileMenu from './components/ProfileMobileMenu';
/* Store */
import { useAppDispatch, useAppSelector } from 'app/store';
import { getProfile, selectLoadingProfile, selectProfileData } from './store/profileSlice';
import { displayRole } from 'app/utils';

const ProfileView = lazy(() => import('./views/ProfileView'));
const SecurityView = lazy(() => import('./views/SecurityView'));
// const AccessView = lazy(() => import('./views/AccessView'));

function ProfileApp() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const lastPath = pathname.split('/').filter(Boolean).pop();
  const user = useAppSelector(selectProfileData);
  const loading = useAppSelector(selectLoadingProfile);

  const { smaller, larger } = useResponsive();

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  const accountStatus = user?.actived ? 'Conta ativa' : 'Conta sem status';
  const roleLabel = user?.role ? displayRole(user.role) : 'Perfil';

  return (
    <div className="flex flex-col gap-4 px-4 py-5 md:gap-6 md:px-8 md:py-8 xl:px-10">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              <PiUserCircleDuotone className="text-sm" />
              Minha conta
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
              {accountStatus}
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
              {roleLabel}
            </span>
            {smaller.lg && (
              <div className="ml-auto">
                <ProfileMobileMenu />
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 md:gap-4">
            <Avatar
              size={48}
              className="mt-0.5 shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
              icon={<PiUserCircleDuotone className="text-xl" />}
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
                {loading ? 'Carregando perfil...' : user?.name || 'Perfil do usuário'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {loading
                  ? 'Sincronizando detalhes da conta.'
                  : 'Gerencie dados pessoais e segurança da conta sem sair da área administrativa.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-5">
        {larger.lg && (
          <aside className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Detalhes e configurações
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Navegue entre dados pessoais e segurança da conta.
              </p>
            </div>
            <ProfileMenu />
          </aside>
        )}

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-6 dark:border-slate-800 dark:bg-slate-900">
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-[24px] bg-slate-100 dark:bg-slate-800" />
            }
          >
            {lastPath === 'profile' && <ProfileView />}
            {lastPath === 'security' && <SecurityView />}
            {/* {lastPath === 'access' && <AccessView />} */}
          </Suspense>
        </section>
      </div>
    </div>
  );
}

export default ProfileApp;
