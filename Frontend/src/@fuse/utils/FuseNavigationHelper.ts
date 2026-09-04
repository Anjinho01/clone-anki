import _ from '@lodash';
import type { PartialDeep } from 'type-fest';
import type UserType from 'app/store/user/UserType';
import type { NavigationType } from '@fuse/core/FuseNavigation/types/NavigationType';
import type { NavItemType } from '@fuse/core/FuseNavigation/types/NavItemType';
import NavItemModel from '@fuse/core/FuseNavigation/models/NavItemModel';

class FuseNavigationHelper {
  static selectById(nav: NavigationType, id: string): NavItemType | undefined {
    for (let i = 0; i < nav.length; i += 1) {
      const item = nav[i];
      if (item.id === id) return item;

      if (item.subMenu) {
        const subMenuItem = this.selectById(item.subMenu, id);
        if (subMenuItem) return subMenuItem;
      }
    }

    return undefined;
  }

  static appendNavItem(
    nav: NavigationType,
    item: NavItemType,
    parentId: string | null = null
  ): NavigationType {
    if (!parentId) {
      return [...nav, item];
    }
    return nav.map((node) => {
      if (node.id === parentId) {
        const newNode = { ...node };
        newNode.subMenu = [...(node.subMenu || []), item];
        return newNode;
      }
      if (node.subMenu) {
        return {
          ...node,
          subMenu: this.appendNavItem(node.subMenu, item, parentId),
        };
      }
      return { ...node };
    });
  }

  static prependNavItem(
    nav: NavigationType,
    item: NavItemType,
    parentId: string | null = null
  ): NavigationType {
    if (!parentId) {
      return [item, ...nav];
    }
    return nav.map((node) => {
      if (node.id === parentId) {
        const newNode = { ...node };
        newNode.subMenu = [item, ...(node.subMenu || [])];
        return newNode;
      }
      if (node.subMenu) {
        return {
          ...node,
          subMenu: this.prependNavItem(node.subMenu, item, parentId),
        };
      }
      return { ...node };
    });
  }

  static filterNavigationByPermission(
    nav: NavigationType,
    userRole: UserType['role']
  ): NavigationType {
    return nav.reduce((acc: NavigationType, item) => {
      // If item has subMenu, recursively filter them
      const subMenu = item.subMenu ? this.filterNavigationByPermission(item.subMenu, userRole) : [];

      if (this.hasPermission(item.authority, userRole) || subMenu.length) {
        const newItem = { ...item };
        newItem.subMenu = subMenu;
        acc.push(newItem);
      }

      return acc;
    }, []);
  }

  /**
   * The removeNavItem function removes a navigation item by its ID.
   */
  static removeNavItem(nav: NavigationType, id: string): NavigationType {
    return nav.reduce((acc, node) => {
      if (node.id !== id) {
        if (node.subMenu) {
          acc.push({
            ...node,
            subMenu: this.removeNavItem(node.subMenu, id),
          });
        } else {
          acc.push(node);
        }
      }
      return acc;
    }, [] as NavigationType);
  }

  /**
   * The updateNavItem function updates a navigation item by its ID with new data.
   */
  static updateNavItem(
    nav: NavigationType,
    id: string,
    item: PartialDeep<NavItemType>
  ): NavigationType {
    return nav.map((node) => {
      if (node.id === id) {
        return _.merge({}, node, item); // merge original node data with updated item data
      }
      if (node.subMenu) {
        return {
          ...node,
          subMenu: this.updateNavItem(node.subMenu, id, item),
        };
      }
      return node;
    });
  }

  /**
   *  Convert to flat navigation
   */
  static getFlatNavigation(navigationItems: NavigationType = [], flatNavigation = []) {
    for (let i = 0; i < navigationItems.length; i += 1) {
      const navItem = navigationItems[i];

      if (navItem.type === 'item') {
        const _navtItem = NavItemModel(navItem);
        flatNavigation.push(_navtItem);
      }

      if (navItem.type === 'collapse') {
        if (navItem.subMenu) {
          this.getFlatNavigation(navItem.subMenu, flatNavigation);
        }
      }
    }
    return flatNavigation as NavigationType | [];
  }

  static hasPermission(
    authArr: string[] | string | undefined,
    userRole: UserType['role']
  ): boolean {
    /**
     * If auth array is not defined
     * Pass and allow
     */
    if (authArr === null || authArr === undefined) {
      // console.info("auth is null || undefined:", authArr);
      return true;
    }

    if (authArr.length === 0) {
      /**
       * if auth array is empty means,
       * allow only user role is guest (null or empty[])
       */
      // console.info("auth is empty[]:", authArr);
      return !userRole || userRole.length === 0;
    }

    /**
     * Check if user has grants
     */
    // console.info("auth arr:", authArr);
    /*
      Check if user role is array,
      */
    if (userRole && Array.isArray(authArr) && Array.isArray(userRole)) {
      return authArr.some((r: string) => userRole.indexOf(r) >= 0);
    }

    /*
      Check if user role is string,
      */
    return authArr.includes(userRole as string);
  }
}

export default FuseNavigationHelper;
