import type { ReactNode } from 'react';
import { memo, useContext } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import AppContext from 'app/AppContext';
/* Fuse */
import useResponsive from '@fuse/hooks/useResponsive';
import FuseSuspense from '@fuse/core/FuseSuspense';
/* Components */
import ToolbarLayout from './components/ToolbarLayout';
import NavbarLayout from './components/NavbarLayout';
import FooterLayout from './components/FooterLayout';
/* Store */
import { useSelector } from 'react-redux';
import { selectUserRole } from 'app/store/user/userSlice';
import { selectFuseCurrentLayoutConfig } from 'app/store/fuse/settingsSlice';
import { selectFuseNavbar } from 'app/store/fuse/navbarSlice';
import { navBarStyle, navBarCollapseStyle } from 'app/layout/components/NavbarLayout';

type AppLayoutProps = {
  children?: ReactNode;
};

function AppLayout(props: AppLayoutProps) {
  const { children } = props;
  const { open } = useSelector(selectFuseNavbar);
  const userRole = useSelector(selectUserRole);
  const config = useSelector(selectFuseCurrentLayoutConfig);
  const appContext = useContext(AppContext);
  const { routes } = appContext;
  const location = useLocation();

  const { larger } = useResponsive();
  const hasToolbar = Boolean(userRole && config?.toolbar?.display);
  const isGuestAuthSurface =
    !userRole &&
    !config?.navbar?.display &&
    !config?.toolbar?.display &&
    !config?.footer?.display &&
    !config?.rightSidePanel?.display;
  const isGuest404 = !userRole && location.pathname === '/404';
  const isGuestFullscreen = isGuestAuthSurface || isGuest404;

  return (
    <div
      id="app-layout"
      className={`flex min-h-screen w-full flex-1 ${
        isGuestFullscreen
          ? 'bg-white dark:bg-gray-900'
          : 'bg-gray-950 lg:h-screen lg:min-h-0 lg:overflow-hidden'
      }`}
    >
      {userRole && config?.navbar?.display && larger.lg && (
        <div
          className="hidden overflow-hidden transition-all duration-200 ease-in-out lg:block lg:h-screen lg:shrink-0"
          style={open ? navBarStyle : navBarCollapseStyle}
        >
          <NavbarLayout frameless background={false} contentClass="h-full" className="h-full" />
        </div>
      )}

      <div
        className={`flex min-w-0 flex-auto ${
          isGuestFullscreen
            ? 'min-h-screen'
            : 'lg:h-screen lg:min-h-0 lg:overflow-hidden lg:p-5 xl:p-6'
        }`}
      >
        <div
          className={`flex min-h-screen min-w-0 flex-auto ${
            isGuestFullscreen
              ? ''
              : 'lg:h-[calc(100vh-2.5rem)] lg:min-h-0 lg:overflow-hidden xl:h-[calc(100vh-3rem)]'
          }`}
        >
          <div
            className={`relative flex min-w-0 flex-auto flex-col overflow-hidden bg-white dark:bg-gray-900 ${
              isGuestFullscreen
                ? ''
                : 'lg:rounded-[28px] lg:border lg:border-slate-200/80 lg:shadow-[0_24px_80px_rgba(15,23,42,0.24)] dark:lg:border-gray-800'
            }`}
          >
            {hasToolbar && (
              <ToolbarLayout
                fixed={false}
                className="relative z-10 bg-white backdrop-blur-none dark:bg-gray-900"
                wrapperClass="px-4 md:px-6 xl:px-8"
              />
            )}

            <main
              id="app-main"
              className="relative z-0 flex min-h-0 flex-auto flex-col overflow-y-auto"
            >
              <FuseSuspense>{useRoutes(routes)}</FuseSuspense>

              {children}
            </main>

            {userRole && config?.footer?.display && <FooterLayout pageContainerType="contained" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The type definition for the app layouts.
 */
export type AppLayoutsType = {
  [key: string]: React.ComponentType;
};

export default memo(AppLayout);
