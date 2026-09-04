import classNames from 'classnames';
import { MenuContextProvider } from './context/menuContext';
import type { CommonProps } from '../@types/common';
import type { Ref } from 'react';

export interface MenuProps extends CommonProps {
  defaultActiveIds?: Array<string>;
  defaultExpandedIds?: Array<string>;
  defaultCollapseActiveIds?: Array<string>;
  menuItemHeight?: number;
  onSelect?: (eventKey: string, e: MouseEvent) => void;
  ref?: Ref<HTMLDivElement>;
  sideCollapsed?: boolean;
}

const Menu = (props: MenuProps) => {
  const {
    children,
    className,
    defaultActiveIds = [],
    defaultExpandedIds = [],
    defaultCollapseActiveIds = [],
    menuItemHeight = 48,
    onSelect,
    ref,
    sideCollapsed = false,
    ...rest
  } = props;

  const menuDefaultClass = 'menu';

  const menuClass = classNames(menuDefaultClass, className);

  return (
    <nav ref={ref} className={menuClass} {...rest}>
      <MenuContextProvider
        value={{
          onSelect,
          menuItemHeight,
          sideCollapsed,
          defaultExpandedIds,
          defaultActiveIds,
          defaultCollapseActiveIds,
        }}
      >
        {children}
      </MenuContextProvider>
    </nav>
  );
};

export default Menu;
