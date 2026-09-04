import { forwardRef, useContext, type RefObject, type ElementType } from 'react';
import isNil from 'lodash/isNil';
import useUncertainRef from '../hooks/useUncertainRef';
import useUniqueId from '../hooks/useUniqueId';
import { useConfig } from '../ConfigProvider';
import classNames from '../utils/classNames';
import DropdownContext from './context/dropdownContext';
import MenuItem from '../MenuItem';
import { TbChevronRight, TbChevronLeft } from 'react-icons/tb';
import type { CommonProps } from '../@types/common';

export interface DropdownSubItemSharedProps {
  /** Clique no container <ul> (use se precisar capturar clique externo) */
  onClick?: React.MouseEventHandler<HTMLUListElement>;
  /** Seleção lógica do item do menu (alinhado ao MenuItem) */
  onSelect?: (eventKey: string, e: MouseEvent) => void; // DOM MouseEvent
  disabled?: boolean;
  eventKey?: string;
}

export interface DropdownSubItemProps extends CommonProps, DropdownSubItemSharedProps {
  /** Elemento do item (li, a, button, etc) renderizado por MenuItem */
  asElement?: ElementType;
  active?: boolean;
}

const DropdownSubMenu = forwardRef<HTMLElement, DropdownSubItemProps>((props, ref) => {
  const {
    asElement: Component = 'li',
    children,
    active: activeProp,
    disabled,
    className,
    style,
    eventKey,
    onSelect, // (eventKey: string, e: MouseEvent [DOM])
    onClick, // handler do <ul>
    ...rest
  } = props;

  const { direction } = useConfig();
  const dropdown = useContext(DropdownContext);

  // Converte a ref encaminhada em RefObject para passar ao MenuItem
  const menuitemRef = useUncertainRef<HTMLElement>(ref) as RefObject<HTMLElement | null>;
  const menuitemId = useUniqueId('menu-item-');

  const active = !!activeProp || (!isNil(dropdown?.activeKey) && dropdown?.activeKey === eventKey);

  return (
    <ul style={style} className="relative" onClick={onClick} {...rest}>
      <MenuItem
        ref={menuitemRef}
        disabled={!!disabled}
        asElement={Component}
        id={menuitemId}
        isActive={active}
        eventKey={eventKey}
        className={classNames('dropdown-submenu-item', className)}
        onSelect={onSelect} // compatível com MenuItem (DOM MouseEvent)
      >
        <span>{children}</span>
        {direction === 'rtl' ? <TbChevronLeft /> : <TbChevronRight />}
      </MenuItem>
    </ul>
  );
});

DropdownSubMenu.displayName = 'DropdownSubMenu';
export default DropdownSubMenu;
