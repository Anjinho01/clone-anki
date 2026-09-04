import { useState, useEffect, useContext } from 'react';
import { useConfig } from '../ConfigProvider';
import { CollapseContextProvider } from './context/collapseContext';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import MenuContext from './context/menuContext';
import { TbChevronDown } from 'react-icons/tb';
import { PiDotOutlineFill } from 'react-icons/pi';
import type { CommonProps } from '../@types/common';
import type { ReactNode, MouseEvent } from 'react';

export interface MenuCollapseProps extends CommonProps {
  active?: boolean;
  eventKey?: string;
  expanded?: boolean;
  dotIndent?: boolean;
  indent?: boolean;
  label?: string | ReactNode;
  onToggle?: (expanded: boolean, e: MouseEvent<HTMLDivElement>) => void;
}

const MenuCollapse = (props: MenuCollapseProps) => {
  const {
    active,
    children,
    className,
    eventKey,
    expanded = false,
    indent = true,
    label = null,
    dotIndent,
    onToggle,
  } = props;

  const [isExpanded, setIsExpanded] = useState(expanded);

  const { sideCollapsed, defaultExpandedIds, defaultCollapseActiveIds } = useContext(MenuContext);

  const { direction } = useConfig();

  useEffect(() => {
    if ((defaultExpandedIds as string[]).includes(eventKey as string)) {
      setIsExpanded(true);
    }
    if (expanded !== isExpanded) {
      setIsExpanded(true);
    }
  }, [expanded, eventKey, defaultExpandedIds]);

  const toggleCollapse = (e: MouseEvent<HTMLDivElement>) => {
    if (typeof onToggle === 'function') {
      onToggle(!isExpanded, e);
    }
    setIsExpanded(!isExpanded);
  };

  const menuCollapseItemClass = classNames(
    'menu-collapse-item',
    ((defaultCollapseActiveIds && defaultCollapseActiveIds.includes(eventKey as string)) ||
      active) &&
      'menu-collapse-item-active',
    className
  );

  return (
    <div className="menu-collapse">
      <div className={menuCollapseItemClass} role="presentation" onClick={toggleCollapse}>
        <span className="flex items-center gap-2">
          {dotIndent && (
            <PiDotOutlineFill
              className={classNames('w-[24px] text-3xl', !active && 'opacity-25')}
            />
          )}
          {label}
        </span>
        <motion.span
          className="mt-1 text-lg"
          initial={{ transform: 'rotate(0deg)' }}
          animate={{
            transform: isExpanded ? 'rotate(-180deg)' : 'rotate(0deg)',
          }}
          transition={{ duration: 0.15 }}
        >
          {sideCollapsed ? null : <TbChevronDown />}
        </motion.span>
      </div>
      <CollapseContextProvider value={isExpanded}>
        <motion.ul
          className={indent ? (direction === 'rtl' ? 'mr-8' : 'ml-8') : ''}
          initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
          animate={{
            opacity: isExpanded ? 1 : 0,
            height: isExpanded ? 'auto' : 0,
          }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.ul>
      </CollapseContextProvider>
    </div>
  );
};

MenuCollapse.displayName = 'MenuCollapse';

export default MenuCollapse;
