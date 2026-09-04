import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import Drawer from '@fuse/ui/Drawer';
import NavToggle from '../shared/NavToggle';
/* Components */
import Logo from '../shared/Logo';
import { UserProfileDropdownBase } from '../shared/UserProfileDropdown';
/* Store */
import { useDispatch, useSelector } from 'react-redux';
import { selectUserRole } from 'app/store/user/userSlice';
import { selectNavigation } from 'app/store/fuse/navigationSlice';
import { navbarOpenMobile, navbarCloseMobile, selectFuseNavbar } from 'app/store/fuse/navbarSlice';
import { selectFuseRouteId } from 'app/store/fuse/settingsSlice';

const FuseNavigation = lazy(() => import('@fuse/core/FuseNavigation/FuseNavigation'));

const MobileNav = () => {
  const dispatch = useDispatch();
  const navigation = useSelector(selectNavigation);
  const userRole = useSelector(selectUserRole);
  const routeId = useSelector(selectFuseRouteId);
  const stateNavbar = useSelector(selectFuseNavbar);
  const { mobileOpen } = stateNavbar;

  const handleOpenDrawer = () => {
    dispatch(navbarOpenMobile());
  };

  const handleDrawerClose = () => {
    dispatch(navbarCloseMobile());
  };

  return (
    <>
      <button
        type="button"
        aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
        className="header-action-item header-action-item-hoverable text-2xl"
        onClick={mobileOpen ? handleDrawerClose : handleOpenDrawer}
      >
        <NavToggle toggled={mobileOpen} />
      </button>
      <Drawer
        title={
          <Link to="/" className="flex items-center gap-3" onClick={handleDrawerClose}>
            <Logo type="streamline" mode="light" imgClass="max-h-8" />
            <span className="min-w-0">
              <span className="block truncate text-[1.02rem] font-semibold tracking-tight text-slate-950 dark:text-white">
                Flashcards
              </span>
              <span className="block truncate text-xs font-medium tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                Navegacao
              </span>
            </span>
          </Link>
        }
        isOpen={mobileOpen}
        className="bg-transparent"
        headerClass="border-b border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] px-5 py-4 dark:border-slate-800 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.96))]"
        bodyClass="p-0 bg-transparent"
        width="min(88vw, 360px)"
        placement="left"
        onClose={handleDrawerClose}
        onRequestClose={handleDrawerClose}
      >
        <Suspense fallback={<></>}>
          <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#ffffff,_#f8fafc)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_24%),linear-gradient(180deg,_#020617,_#0f172a)]">
            {/* Área rolável com o menu */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
              <FuseNavigation
                collapsed={false}
                navigationTree={navigation}
                routeId={routeId}
                userRole={userRole || ''}
                onMenuItemClick={handleDrawerClose}
              />
            </div>

            {/* Rodapé fixo com acesso à conta */}
            <div className="mt-auto border-t border-slate-200/80 bg-white/92 px-4 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/92">
              <div className="flex items-center justify-start">
                <UserProfileDropdownBase className="w-full" placement="top-start" showIdentity />
              </div>
            </div>
          </div>
        </Suspense>
      </Drawer>
    </>
  );
};

export default MobileNav;
