import { createContext } from 'react';

export interface MenuContextProps {
  defaultActiveIds?: Array<string>;
  defaultExpandedIds?: Array<string>;
  defaultCollapseActiveIds?: Array<string>;
  menuItemHeight?: number;
  onSelect?: (eventKey: string, e: MouseEvent) => void;
  sideCollapsed?: boolean;
}

const MenuContext = createContext<MenuContextProps>({});

export const MenuContextProvider = MenuContext.Provider;

export const MenuContextConsumer = MenuContext.Consumer;

export default MenuContext;
