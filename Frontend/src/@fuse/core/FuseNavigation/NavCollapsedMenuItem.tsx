/* Fuse */
import Menu from '@fuse/ui/Menu';
import Dropdown from '@fuse/ui/Dropdown';
import NavMenuIcon from './NavMenuIcon';
import AuthorityCheck from '@fuse/shared/AuthorityCheck';
import type { CommonProps } from '@fuse/@types/common';
import type { NavigationTree } from '@fuse/@types/common';

interface DefaultItemProps extends CommonProps {
  nav: NavigationTree;
  onLinkClick?: (link: { key: string; title: string; path: string }) => void;
  indent?: boolean;
  dotIndent?: boolean;
  userRole: string;
}

interface CollapsedItemProps extends DefaultItemProps {
  renderAsIcon?: boolean;
  currentId?: string;
  parentIds?: string[];
}

interface NavCollapsedMenuItemProps extends CollapsedItemProps {
  sideCollapsed?: boolean;
}

const { MenuItem, MenuCollapse } = Menu;

const DefaultItem = ({ nav, indent, dotIndent, children, userRole }: DefaultItemProps) => {
  return (
    <AuthorityCheck role={userRole} authority={nav.authority}>
      <MenuCollapse
        key={nav.id}
        label={
          <div className="flex min-w-0 items-center gap-3">
            <NavMenuIcon icon={nav.icon || ''} />
            <span className="block min-w-0 flex-1 truncate">{nav.title}</span>
          </div>
        }
        eventKey={nav.id}
        expanded={false}
        dotIndent={dotIndent}
        indent={indent}
      >
        {children}
      </MenuCollapse>
    </AuthorityCheck>
  );
};

const CollapsedItem = ({
  nav,
  children,
  renderAsIcon,
  userRole,
  parentIds,
}: CollapsedItemProps) => {
  const menuItem = (
    <MenuItem
      key={nav.id}
      isActive={parentIds?.includes(nav.id)}
      eventKey={nav.id}
      className="mb-2 justify-center px-0"
    >
      <NavMenuIcon icon={nav.icon || ''} />
    </MenuItem>
  );

  const dropdownItem = <div key={nav.id}>{nav.title}</div>;

  return (
    <AuthorityCheck role={userRole} authority={nav.authority}>
      <Dropdown
        trigger="hover"
        renderTitle={renderAsIcon ? menuItem : dropdownItem}
        placement="left-start"
      >
        {children}
      </Dropdown>
    </AuthorityCheck>
  );
};

const NavCollapsedMenuItem = ({ sideCollapsed, ...rest }: NavCollapsedMenuItemProps) => {
  return sideCollapsed ? <CollapsedItem {...rest} /> : <DefaultItem {...rest} />;
};

export default NavCollapsedMenuItem;
