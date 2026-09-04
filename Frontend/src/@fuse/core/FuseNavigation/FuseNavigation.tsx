import { useState, useEffect, Fragment } from 'react';
/* Fuse */
import Menu from '@fuse/ui/Menu';
import AuthorityCheck from '@fuse/shared/AuthorityCheck';
import type { NavigationTree } from '@fuse/@types/common';
/* Components */
import NavSingleMenuItem from './NavSingleMenuItem';
import NavCollapsedMenuItem from './NavCollapsedMenuItem';

import useMenuActive from '@fuse/hooks/useMenuActive';

const NAV_ITEM_TYPE_TITLE = 'title';
const NAV_ITEM_TYPE_COLLAPSE = 'collapse';
const NAV_ITEM_TYPE_ITEM = 'item';

export interface FuseNavigationProps {
  collapsed?: boolean;
  routeId: string;
  navigationTree?: NavigationTree[];
  onMenuItemClick?: () => void;
  userRole: string;
}

const { MenuGroup } = Menu;

const MAX_CASCADE_LEVEL = 2;

const FuseNavigation = (props: FuseNavigationProps) => {
  const { collapsed, routeId, navigationTree = [], onMenuItemClick, userRole } = props;

  const [defaulExpandId, setDefaulExpandId] = useState<string[]>([]);

  const { activedRoute } = useMenuActive(navigationTree, routeId);

  useEffect(() => {
    if (activedRoute?.parentId) {
      setDefaulExpandId([activedRoute?.parentId]);
    }
  }, [activedRoute?.parentId]);

  const handleLinkClick = () => {
    onMenuItemClick?.();
  };

  const renderNavigation = (navTree: NavigationTree[], cascade: number = 0, indent?: boolean) => {
    const nextCascade = cascade + 1;

    return (
      <>
        {navTree.map((nav) => (
          <Fragment key={`${nav.id}`}>
            {nav.type === NAV_ITEM_TYPE_ITEM && (
              <NavSingleMenuItem
                key={nav.id}
                currentId={activedRoute?.id}
                parentKeys={defaulExpandId}
                nav={nav}
                sideCollapsed={collapsed}
                indent={indent}
                renderAsIcon={cascade <= 0}
                showIcon={cascade <= 0}
                userRole={userRole}
                showTitle={collapsed ? cascade >= 1 : cascade <= MAX_CASCADE_LEVEL}
                onLinkClick={handleLinkClick}
              />
            )}
            {nav.type === NAV_ITEM_TYPE_COLLAPSE && (
              <NavCollapsedMenuItem
                key={nav.id}
                currentId={activedRoute?.id}
                parentIds={defaulExpandId}
                nav={nav}
                sideCollapsed={collapsed}
                indent={nextCascade >= MAX_CASCADE_LEVEL}
                dotIndent={nextCascade >= MAX_CASCADE_LEVEL}
                renderAsIcon={nextCascade <= 1}
                userRole={userRole}
                onLinkClick={onMenuItemClick}
              >
                {nav.subMenu &&
                  nav.subMenu.length > 0 &&
                  renderNavigation(nav.subMenu, nextCascade, true)}
              </NavCollapsedMenuItem>
            )}
            {nav.type === NAV_ITEM_TYPE_TITLE && (
              <AuthorityCheck role={userRole} authority={nav.authority}>
                <MenuGroup key={nav.id} label={nav.title}>
                  {nav.subMenu &&
                    nav.subMenu.length > 0 &&
                    renderNavigation(nav.subMenu, cascade, false)}
                </MenuGroup>
              </AuthorityCheck>
            )}
          </Fragment>
        ))}
      </>
    );
  };

  return (
    <Menu
      className="px-4 pb-4"
      sideCollapsed={collapsed}
      defaultActiveIds={activedRoute?.id ? [activedRoute.id] : []}
      defaultExpandedIds={defaulExpandId}
      defaultCollapseActiveIds={activedRoute?.parentId ? [activedRoute.parentId] : []}
    >
      {renderNavigation(navigationTree, 0)}
    </Menu>
  );
};

export default FuseNavigation;
