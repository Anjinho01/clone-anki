import type { ReactNode, CSSProperties } from 'react';

export interface CommonProps {
  id?: string;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export type TableQueries = {
  total?: number;
  pageIndex?: number;
  pageSize?: number;
  query?: string;
  sort?: {
    order: 'asc' | 'desc' | '';
    key: string | number;
  };
};

export interface NavigationTree {
  id: string;
  path: string;
  isExternalLink?: boolean;
  title?: string;
  description?: string;
  icon?: string;
  type: 'title' | 'collapse' | 'item';
  authority: string[];
  hasPermission?: boolean;
  subMenu: NavigationTree[];
}
