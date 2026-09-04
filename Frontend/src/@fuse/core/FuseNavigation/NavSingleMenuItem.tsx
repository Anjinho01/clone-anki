import { Link } from 'react-router-dom';
/* Fuse */
import Tooltip from '@fuse/ui/Tooltip';
import Menu from '@fuse/ui/Menu';
import Dropdown from '@fuse/ui/Dropdown';
import AuthorityCheck from '@fuse/shared/AuthorityCheck';
import type { CommonProps } from '@fuse/@types/common';
import type { NavigationTree } from '@fuse/@types/common';
/* Components */
import NavMenuIcon from './NavMenuIcon';

const { MenuItem } = Menu;

interface CollapsedItemProps extends CommonProps {
  nav: NavigationTree;
  onLinkClick?: (link: { key: string; title: string; path: string }) => void;
  renderAsIcon?: boolean;
  userRole: string;
  currentId?: string;
  parentKeys?: string[];
}

interface DefaultItemProps {
  nav: NavigationTree;
  onLinkClick?: (link: { key: string; title: string; path: string }) => void;
  sideCollapsed?: boolean;
  indent?: boolean;
  userRole: string;
  showIcon?: boolean;
  showTitle?: boolean;
}

interface NavMenuItemProps extends CollapsedItemProps, DefaultItemProps {}

const CollapsedItem = ({
  nav,
  children,
  renderAsIcon,
  onLinkClick,
  userRole,
  currentId,
}: CollapsedItemProps) => {
  return (
    <AuthorityCheck role={userRole} authority={nav.authority}>
      {renderAsIcon ? (
        <Tooltip title={nav.title} placement="left">
          {children}
        </Tooltip>
      ) : (
        <Dropdown.Item active={currentId === nav.id}>
          {nav.path ? (
            <Link
              className="flex h-full w-full items-center outline-hidden"
              to={nav.path}
              target={nav.isExternalLink ? '_blank' : ''}
              onClick={() =>
                onLinkClick?.({
                  key: nav.id,
                  title: nav.title || '',
                  path: nav.path,
                })
              }
            >
              <span>{nav.title}</span>
            </Link>
          ) : (
            <span>{nav.title}</span>
          )}
        </Dropdown.Item>
      )}
    </AuthorityCheck>
  );
};

const DefaultItem = (props: DefaultItemProps) => {
  const { nav, onLinkClick, showTitle, indent, showIcon = true, userRole } = props;

  return (
    <AuthorityCheck role={userRole} authority={nav.authority}>
      <MenuItem key={nav.id} eventKey={nav.id} dotIndent={indent}>
        <Link
          to={nav.path}
          className="flex h-full w-full min-w-0 items-center gap-3 px-3"
          target={nav.isExternalLink ? '_blank' : ''}
          onClick={() =>
            onLinkClick?.({
              key: nav.id,
              title: nav.title || '',
              path: nav.path,
            })
          }
        >
          {showIcon && <NavMenuIcon icon={nav.icon || ''} />}
          {showTitle && <span className="block min-w-0 flex-1 truncate">{nav.title}</span>}
        </Link>
      </MenuItem>
    </AuthorityCheck>
  );
};

const NavSingleMenuItem = ({
  nav,
  onLinkClick,
  sideCollapsed,
  indent,
  renderAsIcon,
  userRole,
  showIcon,
  showTitle,
  currentId,
  parentKeys,
}: Omit<NavMenuItemProps, 'title' | 'translateKey'>) => {
  return (
    <>
      {sideCollapsed ? (
        <CollapsedItem
          currentId={currentId}
          parentKeys={parentKeys}
          nav={nav}
          renderAsIcon={renderAsIcon}
          userRole={userRole}
          onLinkClick={onLinkClick}
        >
          <DefaultItem
            nav={nav}
            sideCollapsed={sideCollapsed}
            userRole={userRole}
            showIcon={showIcon}
            showTitle={showTitle}
            onLinkClick={onLinkClick}
          />
        </CollapsedItem>
      ) : (
        <DefaultItem
          nav={nav}
          sideCollapsed={sideCollapsed}
          userRole={userRole}
          showIcon={showIcon}
          showTitle={showTitle}
          indent={indent}
          onLinkClick={onLinkClick}
        />
      )}
    </>
  );
};

export default NavSingleMenuItem;
