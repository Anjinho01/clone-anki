import _ from '@lodash';
import type { RouteObject } from 'react-router-dom';
import type UserType from 'app/store/user/UserType';
import EventEmitter from './EventEmitter';

export type FuseSettingsConfigType = {
  layout: {
    style?: string;
    config?: string;
  };
  defaultAuth?: string[];
  loginRedirectUrl: string;
};

type TreeNode = {
  id: string;
  children?: TreeNode[];
};
/**
 * The FuseRouteItemType type is a custom type that extends the RouteObject type from react-router-dom.
 * It adds an optional auth property and an optional settings property.
 */
export type FuseRouteItemType = RouteObject & {
  auth?: string[] | [];
  settings?: unknown;
};

/**
 * The FuseRoutesType type is a custom type that is an array of FuseRouteItemType objects.
 */
export type FuseRoutesType = FuseRouteItemType[];

/**
 * The FuseRouteConfigType type is a custom type that defines the configuration for a set of routes.
 * It includes an optional routes property, an optional settings property, and an optional auth property.
 */
export type FuseRouteConfigType = {
  routes: FuseRoutesType;
  settings?: unknown;
  auth?: string[] | [];
};

/**
 * The FuseRouteConfigsType type is a custom type that is an array of FuseRouteConfigType objects.
 */
export type FuseRouteConfigsType = FuseRouteConfigType[] | [];

/**
 * The FuseUtils class provides utility functions for the Fuse project.
 */

/** Remove acentos/diacríticos para buscas insensíveis a acento (ex.: "Jose" acha "José"). */
function normalizeText(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

class FuseUtils {
  /**
   * The filterArrayByString function filters an array of objects by a search string.
   * It takes in an array of objects and a search string as parameters and returns a filtered array of objects.
   *
   */
  static filterArrayByString<T>(mainArr: T[], searchText: string): T[] {
    if (searchText === '') {
      return mainArr;
    }

    searchText = searchText.toLowerCase();

    return mainArr.filter((itemObj: unknown) => this.searchInObj(itemObj, searchText));
  }

  /**
   * The searchInObj function searches an object for a given search string.
   * It takes in an object and a search string as parameters and returns a boolean indicating whether the search string was found in the object.
   *
   */
  static searchInObj(itemObj: unknown, searchText: string) {
    if (!isRecord(itemObj)) {
      return false;
    }

    const propArray = Object.keys(itemObj);

    function isRecord(value: unknown): value is Record<string, unknown> {
      return Boolean(
        value && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'function'
      );
    }

    for (let i = 0; i < propArray.length; i += 1) {
      const prop = propArray[i] as string;

      const value = itemObj[prop];

      if (typeof value === 'string') {
        if (this.searchInString(value, searchText)) {
          return true;
        }
      } else if (Array.isArray(value)) {
        if (this.searchInArray(value, searchText)) {
          return true;
        }
      }

      if (typeof value === 'object') {
        if (this.searchInObj(value, searchText)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * The searchInArray function searches an array for a given search string.
   * It takes in an array and a search string as parameters and returns a boolean indicating whether the search string was found in the array.
   *
   */
  static searchInArray(arr: unknown[], searchText: string) {
    arr.forEach((value) => {
      if (typeof value === 'string') {
        if (this.searchInString(value, searchText)) {
          return true;
        }
      }

      if (value && typeof value === 'object') {
        if (this.searchInObj(value, searchText)) {
          return true;
        }
      }
      return false;
    });
    return false;
  }

  /**
   * The searchInString function searches a string for a given search string.
   * It takes in a string and a search string as parameters and returns a boolean indicating whether the search string was found in the string.
   *
   */
  static searchInString(value: string, searchText: string) {
    return normalizeText(value.toLowerCase()).includes(normalizeText(searchText));
  }

  /**
   * The generateGUID function generates a globally unique identifier.
   * It returns a string representing the GUID.
   *
   */
  static generateGUID(): string {
    function S4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return S4() + S4();
  }

  /**
   * The toggleInArray function toggles an item in an array.
   */
  static toggleInArray(item: unknown, array: unknown[]) {
    if (array.indexOf(item) === -1) {
      array.push(item);
    } else {
      array.splice(array.indexOf(item), 1);
    }
  }

  /**
   * The handleize function converts a string to a handle.
   */
  static handleize(text: string) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/\W+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  }

  /**
   * The setRoutes function sets the routes for the Fuse project.
   */
  static setRoutes(
    config: FuseRouteConfigType,
    defaultAuth: FuseSettingsConfigType['defaultAuth'] = undefined
  ): FuseRouteItemType[] {
    let routes = [...config.routes];

    routes = routes.map((route) => {
      let auth = config.auth || config.auth === null ? config.auth : defaultAuth || null;

      auth = route.auth || route.auth === null ? route.auth : auth;

      const settings = _.merge({}, config.settings, route.settings);

      return {
        ...route,
        settings,
        auth,
      };
    }) as FuseRouteItemType[];

    return [...routes];
  }

  /**
   * The generateRoutesFromConfigs function generates routes from a set of route configurations.
   * It takes in an array of route configurations as a parameter and returns an array of routes.
   *
   */
  static generateRoutesFromConfigs(
    configs: FuseRouteConfigsType,
    defaultAuth: FuseSettingsConfigType['defaultAuth']
  ) {
    let allRoutes: FuseRouteItemType[] = [];
    configs.forEach((config: FuseRouteConfigType) => {
      allRoutes = [...allRoutes, ...this.setRoutes(config, defaultAuth)];
    });
    return allRoutes;
  }

  /**
   * The findById function finds an object by its id.
   */
  static findById(tree: TreeNode[], idToFind: string): TreeNode | undefined {
    // Try to find the node at the current level
    const node = _.find(tree, { id: idToFind });

    if (node) {
      return node;
    }

    let foundNode: TreeNode | undefined;

    // If not found, search in the children using lodash's some for iteration
    _.some(tree, (item) => {
      if (item.children) {
        foundNode = this.findById(item.children, idToFind);
        return foundNode; // If foundNode is truthy, _.some will stop iterating
      }
      return false; // Continue iterating
    });

    return foundNode;
  }

  /**
   * The findNavItemById function finds a navigation item by its id.
   */
  static difference(
    object: Record<string, unknown>,
    base: Record<string, unknown>
  ): Record<string, unknown> {
    function changes(
      _object: Record<string, unknown>,
      _base: Record<string, unknown>
    ): Record<string, unknown> {
      return _.transform(
        _object,
        (result: Record<string, unknown>, value: unknown, key: string) => {
          if (!_.isEqual(value, _base[key])) {
            result[key] =
              _.isObject(value) && _.isObject(_base[key])
                ? changes(value as Record<string, unknown>, _base[key] as Record<string, unknown>)
                : value;
          }
        },
        {}
      );
    }

    return changes(object, base);
  }

  /**
   * The EventEmitter class is a custom implementation of an event emitter.
   * It provides methods for registering and emitting events.
   */
  static EventEmitter = EventEmitter;

  /**
   * The hasPermission function checks if a user has permission to access a resource.
   */
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

  /**
   * The filterArrayByString function filters an array of objects by a search string.
   */
  static filterRecursive(data: [] | null, predicate: (arg0: unknown) => boolean) {
    // if no data is sent in, return null, otherwise transform the data
    return !data
      ? null
      : data.reduce((list: unknown[], entry: { children?: [] }) => {
          let clone: unknown = null;
          if (predicate(entry)) {
            // if the object matches the filter, clone it as it is
            clone = { ...entry };
          }
          if (entry.children != null) {
            // if the object has childrens, filter the list of children
            const children = this.filterRecursive(entry.children, predicate);
            if (children && children?.length > 0) {
              // if any of the children matches, clone the parent object, overwrite
              // the children list with the filtered list
              clone = { ...entry, children };
            }
          }

          // if there's a cloned object, push it to the output list
          if (clone) {
            list.push(clone);
          }
          return list;
        }, []);
  }

  /**
   * Gera um UUID v4 padrão (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).
   */
  static uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Remove objetos duplicados de um array usando serialização JSON.
   */
  static removeDuplicates<T>(array: T[]): T[] {
    const seen = Object.create(null) as Record<string, boolean>;
    return array.filter((item) => {
      const key = JSON.stringify(item);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
}

export default FuseUtils;
