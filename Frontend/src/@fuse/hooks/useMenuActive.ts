import { useMemo } from 'react';
import type { NavigationTree } from '@fuse/@types/common';

interface NavInfo extends NavigationTree {
  parentId?: string;
}

const getRouteInfo = (navTree: NavInfo | NavInfo[], id: string): NavInfo | undefined => {
  if (Array.isArray(navTree)) {
    for (const nav of navTree) {
      if (nav.id === id) {
        return nav;
      }
      if (nav.subMenu && nav.subMenu.length > 0) {
        const result = getRouteInfo(nav.subMenu, id);
        if (result) return result;
      }
    }
    return undefined;
  } else {
    if (navTree.id === id) {
      return navTree;
    }
    if (navTree.subMenu && navTree.subMenu.length > 0) {
      return getRouteInfo(navTree.subMenu, id);
    }
    return undefined;
  }
};

const findNestedRoute = (navTree: NavigationTree[], id: string): boolean => {
  const found = navTree.find((node) => {
    return node.id === id;
  });
  if (found) {
    return true;
  }
  return navTree.some((c) => findNestedRoute(c.subMenu, id));
};

const getTopRouteId = (navTree: NavigationTree[], id: string): NavigationTree => {
  let foundNav = {} as NavigationTree;
  navTree.forEach((nav) => {
    if (findNestedRoute([nav], id)) {
      foundNav = nav;
    }
  });
  return foundNav;
};

function useMenuActive(navTree: NavigationTree[], id: string) {
  const activedRoute = useMemo(() => {
    return getRouteInfo(navTree, id);
  }, [navTree, id]);

  const includedRouteTree = useMemo(() => {
    return getTopRouteId(navTree, id);
  }, [navTree, id]);

  return { activedRoute, includedRouteTree };
}

export default useMenuActive;
