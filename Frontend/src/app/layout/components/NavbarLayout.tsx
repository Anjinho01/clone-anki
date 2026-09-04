import { memo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FuseNavigation from '@fuse/core/FuseNavigation';
import { convertNavigationToSearchQuery } from '@fuse/hooks';
import classNames from '@fuse/ui/utils/classNames';
import ScrollBar from '@fuse/ui/ScrollBar';
/* Components */
import Logo from './shared/Logo';
import { UserProfileDropdownBase } from './shared/UserProfileDropdown';
/* Store */
import { useDispatch, useSelector } from 'react-redux';
import { selectUserRole } from 'app/store/user/userSlice';
import { selectFuseNavbar } from 'app/store/fuse/navbarSlice';
import { selectNavigation } from 'app/store/fuse/navigationSlice';
import { selectFuseRouteId, setRouteId } from 'app/store/fuse/settingsSlice';

type NavbarLayoutProps = {
  background?: boolean;
  className?: string;
  contentClass?: string;
  frameless?: boolean;
};

export const navBarStyle = {
  width: 282,
  minWidth: 282,
};

export const navBarCollapseStyle = {
  width: 96,
  minWidth: 96,
};

/**
 * The navabar layout.
 */
function NavbarLayout({
  background = true,
  className,
  contentClass,
  frameless = false,
}: NavbarLayoutProps) {
  const dispatch = useDispatch();
  const navigation = useSelector(selectNavigation);
  const searchQueryPoolData = convertNavigationToSearchQuery(navigation);
  const userRole = useSelector(selectUserRole);

  const stateNavbar = useSelector(selectFuseNavbar);
  const { open } = stateNavbar;

  const routeId = useSelector(selectFuseRouteId);

  const location = useLocation();

  useEffect(() => {
    if (searchQueryPoolData.length > 0) {
      searchQueryPoolData.forEach((nav) => {
        if (nav.path === location.pathname) dispatch(setRouteId(nav.id));
      });
    }
  }, [searchQueryPoolData, location]);

  const containerClassName = frameless
    ? classNames(
        'ecme-sidebar grid h-full max-h-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-gray-950 text-slate-100 transition-all duration-200 ease-in-out',
        className
      )
    : classNames(
        'side-nav',
        background && 'side-nav-bg',
        open && 'side-nav-expand',
        className,
        'flex flex-col'
      );

  const headerClassName = frameless
    ? classNames(
        'flex h-16 shrink-0 flex-col justify-center transition-all duration-200 ease-in-out',
        open ? 'px-7 pt-8' : 'px-2 pt-8'
      )
    : 'side-nav-header flex flex-col justify-center';

  const contentWrapperClassName = frameless
    ? classNames('min-h-0 overflow-hidden transition-all duration-200 ease-in-out', contentClass)
    : classNames('side-nav-content', contentClass);
  const footerClassName = frameless
    ? classNames(
        'shrink-0 border-t border-white/10 px-4 py-4 transition-all duration-200 ease-in-out',
        open ? 'mx-5 mb-5 rounded-3xl bg-white/[0.03]' : 'mx-2 mb-4 px-2'
      )
    : null;

  return (
    <div
      style={{
        ...(open ? navBarStyle : navBarCollapseStyle),
      }}
      className={containerClassName}
    >
      {/* HEADER da sidebar (logo) */}
      <Link to="/" className={headerClassName}>
        {frameless ? (
          <div className={classNames('flex items-center gap-3', !open && 'justify-center')}>
            <Logo type="streamline" mode="light" imgClass="max-h-8" />
            <div
              className={classNames(
                'min-w-0 overflow-hidden transition-all duration-200 ease-in-out',
                open
                  ? 'max-w-[160px] translate-x-0 opacity-100'
                  : 'max-w-0 -translate-x-2 opacity-0'
              )}
            >
              <p className="truncate text-[1.05rem] font-semibold tracking-tight whitespace-nowrap text-white">
                Flashcards
              </p>
            </div>
          </div>
        ) : (
          <div className={classNames('flex items-center', open ? 'px-6' : 'justify-center px-2')}>
            <Logo type="streamline" mode="light" imgClass="max-h-8" />
          </div>
        )}
      </Link>

      {/* CONTEÚDO com scroll (ocupa o espaço restante) */}
      <div className={contentWrapperClassName}>
        <ScrollBar
          style={{ height: '100%' }}
          direction="ltr"
          scrollableNodeProps={{ className: 'overflow-x-hidden' }}
        >
          <div
            className={classNames(
              frameless && 'ecme-sidebar-nav',
              frameless && 'pt-4',
              frameless && !open && 'ecme-sidebar-nav-collapsed'
            )}
          >
            <FuseNavigation
              collapsed={!open}
              navigationTree={navigation}
              routeId={routeId}
              userRole={userRole || ''}
            />
          </div>
        </ScrollBar>
      </div>

      {/* FOOTER fixo na parte de baixo da navbar */}
      {frameless && footerClassName && (
        <div className={footerClassName}>
          <div
            className={classNames(
              'flex w-full items-center',
              open ? 'justify-start' : 'justify-center'
            )}
          >
            <UserProfileDropdownBase
              className="w-full"
              placement={open ? 'top-start' : 'top-end'}
              showIdentity={open}
              inverse
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(NavbarLayout);
