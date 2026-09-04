import { memo } from 'react';
import classNames from '@fuse/ui/utils/classNames';
import useResponsive from '@fuse/hooks/useResponsive';
import type { CommonProps } from '@fuse/@types/common';
/* Components */
import MobileNavbar from './template/MobileNavbar';
import SideNavToggle from './template/SideNavToggle';
import Notification from './template/Notification';
import ThemeModeToogle from './shared/ThemeModeToogle';
/* Store */
import { useSelector } from 'react-redux';
import { selectFuseNavbar } from 'app/store/fuse/navbarSlice';
import { navBarStyle, navBarCollapseStyle } from 'app/layout/components/NavbarLayout';

interface ToolbarLayoutProps extends CommonProps {
  container?: boolean;
  wrapperClass?: string;
  fixed?: boolean;
}

const NAV_OPEN_WIDTH = navBarStyle.width; // sidebar width when open
const NAV_COLLAPSE_WIDTH = navBarCollapseStyle.width; // sidebar width when collapsed

/**
 * The toolbar layout.
 */
function ToolbarLayout(props: ToolbarLayoutProps) {
  const { className, container, wrapperClass, fixed = true } = props;

  const { larger, smaller } = useResponsive();
  const { open } = useSelector(selectFuseNavbar);

  // Só empurra no desktop (>= lg); no mobile fica full width
  const left = larger.lg ? (open ? NAV_OPEN_WIDTH : NAV_COLLAPSE_WIDTH) : 0;

  return (
    <header
      className={classNames(
        fixed
          ? 'header'
          : 'sticky top-0 z-20 flex w-full shrink-0 bg-white/88 backdrop-blur-xl dark:bg-slate-950/88',
        className
      )}
      style={fixed ? { left: `${left}px` } : undefined}
    >
      <div
        className={classNames('header-wrapper', container && 'container mx-auto', wrapperClass)}
        style={{ height: 64 }}
      >
        <div className="header-action header-action-start">
          {smaller.lg && <MobileNavbar />}
          {larger.lg && <SideNavToggle />}
        </div>

        <div className="header-action header-action-end gap-1.5">
          <ThemeModeToogle className="rounded-full border border-transparent p-2 text-xl text-slate-500 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900" />
          <Notification className="rounded-full border border-transparent p-2 text-xl text-slate-500 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900" />
        </div>
      </div>
    </header>
  );
}

export default memo(ToolbarLayout);
