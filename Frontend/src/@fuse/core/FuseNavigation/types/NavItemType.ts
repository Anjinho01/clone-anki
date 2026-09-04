/**
 * NavItemType
 * A type for Fuse navigation item and its properties.
 */
export type NavItemType = {
  id: string;
  path: string;
  isExternalLink?: boolean;
  title?: string;
  description?: string;
  icon?: string;
  type: 'title' | 'collapse' | 'item';
  authority: string[];
  hasPermission?: boolean;
  subMenu: NavItemType[];
};
