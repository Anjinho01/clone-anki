import {
  forwardRef,
  useContext,
  useCallback,
  isValidElement,
  cloneElement,
  type RefObject,
  type ElementType,
  type ReactElement,
} from 'react';
import isNil from 'lodash/isNil';
import useUncertainRef from '../hooks/useUncertainRef';
import useUniqueId from '../hooks/useUniqueId';
import classNames from '../utils/classNames';
import DropdownContext from './context/dropdownContext';
import MenuContext from './context/menuContext';
import MenuItem from '../MenuItem';
import { DROPDOWN_ITEM_TYPE } from '../utils/constants';
import { useFloatingTree } from '@floating-ui/react';
import type { CommonProps } from '../@types/common';
import type {
  SyntheticEvent,
  MouseEvent as ReactMouseEvent,
  FocusEvent as ReactFocusEvent,
} from 'react';

export interface DropdownItemProps extends CommonProps {
  asElement?: ElementType;
  active?: boolean;
  disabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submenu?: ReactElement<any>;
  eventKey?: string;

  /** Chamado quando o item é "ativado" (clique ou equivalente) */
  onSelect?: (eventKey: string, e: SyntheticEvent) => void;

  /** Foco no item (React focus event) */
  onFocus?: (e: ReactFocusEvent<HTMLElement>) => void;

  /** Clique no item (React synthetic event) */
  onClick?: (e: ReactMouseEvent<HTMLElement>) => void;

  variant?: 'default' | 'header' | 'divider' | 'custom';
}

const { DEFAULT, DIVIDER, HEADER, CUSTOM } = DROPDOWN_ITEM_TYPE;

const DropdownItem = forwardRef<HTMLElement, DropdownItemProps>((props, ref) => {
  const {
    asElement: Component = 'li',
    children,
    active: activeProp,
    disabled,
    className,
    style,
    eventKey,
    onSelect,
    onClick,
    onFocus,
    variant = DEFAULT,
    ...rest
  } = props;

  const dropdown = useContext(DropdownContext);
  const menu = useContext(MenuContext);

  // Converte a ref encaminhada (callback ou object) em RefObject para passar ao MenuItem/Component
  const menuitemRef = useUncertainRef<HTMLElement>(ref) as RefObject<HTMLElement | null>;
  const menuitemId = useUniqueId('menu-item-');

  const active = !!activeProp || (!isNil(dropdown?.activeKey) && dropdown?.activeKey === eventKey);

  const tree = useFloatingTree();

  const activate = useCallback(
    (e: SyntheticEvent) => {
      onSelect?.(eventKey || '', e);
      onClick?.(e as unknown as ReactMouseEvent<HTMLElement>);
    },
    [eventKey, onClick, onSelect]
  );

  const handleClick = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (disabled) return;
      activate(e);
      tree?.events.emit('click');
    },
    [disabled, activate, tree]
  );

  const menuitemEventHandlers = {
    ...menu.getItemProps({
      onClick: handleClick,
      onFocus: (event: ReactFocusEvent<HTMLElement>) => {
        onFocus?.(event);
        menu.setHasFocusInside(true);
      },
    }),
  };

  // Variantes especiais não usam <MenuItem> (exceto CUSTOM que pode precisar de handlers)
  if (variant === DIVIDER || variant === HEADER || variant === CUSTOM) {
    return (
      <Component
        ref={menuitemRef}
        id={menuitemId}
        style={style}
        className={classNames(`menu-item-${variant}`, className)}
        {...(variant === CUSTOM ? menuitemEventHandlers : {})}
        {...rest}
      >
        {(variant === HEADER || variant === CUSTOM) && children}
      </Component>
    );
  }

  function renderChildren() {
    if (!isValidElement(children)) return children;
    return cloneElement(children);
  }

  return (
    <MenuItem
      ref={menuitemRef}
      asElement={Component}
      style={style}
      isActive={active}
      disabled={disabled}
      eventKey={eventKey}
      className={className}
      {...menuitemEventHandlers}
      {...rest}
    >
      {renderChildren()}
    </MenuItem>
  );
});

DropdownItem.displayName = 'DropdownItem';
export default DropdownItem;
